import { z } from 'zod'
import { askClaude } from './anthropic'
import { db, newId } from '../db/db'
import { dateFromKey } from './date'

const SplitTextSchema = z.object({
  days: z
    .array(
      z.object({
        name: z.string().describe('the day name, e.g. "Push Day" or "Upper Body"'),
        exercises: z.array(z.string()).describe('exercise names for this day, in the order given'),
      }),
    )
    .min(1),
})

export type ParsedSplit = z.infer<typeof SplitTextSchema>

export async function parseSplitText(text: string): Promise<ParsedSplit> {
  return askClaude(
    `Parse this workout split into structured days and exercises:\n\n${text}`,
    SplitTextSchema,
    'You are parsing a lifting split (like Push/Pull/Legs or Upper/Lower) pasted from notes, a spreadsheet, ' +
      'or a screenshot transcript. Extract each day and the exercises listed under it, preserving the order given. ' +
      'Clean up formatting artifacts but keep exercise names recognizable.',
  )
}

/** Creates any split days/exercises from a parsed split that don't already exist (matched case-insensitively by name). Existing days get new exercises appended, not duplicated. */
export async function applySplitImport(parsed: ParsedSplit): Promise<{ daysAdded: number; exercisesAdded: number }> {
  let daysAdded = 0
  let exercisesAdded = 0
  const existingDays = await db.splitDays.toArray()

  for (const parsedDay of parsed.days) {
    let day = existingDays.find((d) => d.name.toLowerCase().trim() === parsedDay.name.toLowerCase().trim())
    if (!day) {
      day = { id: newId(), name: parsedDay.name, order: existingDays.length, createdAt: Date.now() }
      await db.splitDays.add(day)
      existingDays.push(day)
      daysAdded++
    }
    const existingExercises = await db.exercises.where('splitDayId').equals(day.id).toArray()
    for (const exName of parsedDay.exercises) {
      const already = existingExercises.find((e) => e.name.toLowerCase().trim() === exName.toLowerCase().trim())
      if (already) continue
      const exercise = { id: newId(), splitDayId: day.id, name: exName, order: existingExercises.length, createdAt: Date.now() }
      await db.exercises.add(exercise)
      existingExercises.push(exercise)
      exercisesAdded++
    }
  }
  return { daysAdded, exercisesAdded }
}

const WorkoutHistorySchema = z.object({
  sessions: z
    .array(
      z.object({
        date: z.string().describe('the date this session happened, formatted YYYY-MM-DD'),
        splitDayName: z.string().describe('e.g. "Push Day" — invent a reasonable name if none is given'),
        exercises: z
          .array(
            z.object({
              name: z.string(),
              sets: z
                .array(z.object({ weight: z.number(), reps: z.number() }))
                .describe('each set as lifted, in order'),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

export type ParsedWorkoutHistory = z.infer<typeof WorkoutHistorySchema>

export async function parseWorkoutHistory(text: string, todayIso: string): Promise<ParsedWorkoutHistory> {
  return askClaude(
    `Parse this pasted workout history into structured sessions:\n\n${text}`,
    WorkoutHistorySchema,
    `You are parsing past gym workout notes (any format: dates, abbreviations, "135x8" style sets, etc.) into ` +
      `structured data. Today's date is ${todayIso} — resolve relative or partial dates (e.g. "Mon", "9/3", "last Tuesday") ` +
      `against it. If a session's split day name isn't stated, infer a short reasonable one from its exercises.`,
  )
}

/** Imports parsed workout history: creates any missing split days/exercises, upserts one session per (day, date), and appends the parsed sets. Safe to call once per paste — re-pasting the same text will append duplicate sets. */
export async function applyWorkoutHistoryImport(
  parsed: ParsedWorkoutHistory,
): Promise<{ sessionsImported: number; setsImported: number }> {
  let sessionsImported = 0
  let setsImported = 0
  const existingDays = await db.splitDays.toArray()

  for (const session of parsed.sessions) {
    let day = existingDays.find((d) => d.name.toLowerCase().trim() === session.splitDayName.toLowerCase().trim())
    if (!day) {
      day = { id: newId(), name: session.splitDayName, order: existingDays.length, createdAt: Date.now() }
      await db.splitDays.add(day)
      existingDays.push(day)
    }

    const existingExercises = await db.exercises.where('splitDayId').equals(day.id).toArray()
    const sessionId = `${day.id}:${session.date}`
    const timestamp = dateFromKey(session.date)
    await db.workoutSessions.put({ id: sessionId, splitDayId: day.id, splitDayName: day.name, timestamp })
    sessionsImported++

    for (const parsedExercise of session.exercises) {
      let exercise = existingExercises.find(
        (e) => e.name.toLowerCase().trim() === parsedExercise.name.toLowerCase().trim(),
      )
      if (!exercise) {
        exercise = {
          id: newId(),
          splitDayId: day.id,
          name: parsedExercise.name,
          order: existingExercises.length,
          createdAt: Date.now(),
        }
        await db.exercises.add(exercise)
        existingExercises.push(exercise)
      }

      const priorSetCount = await db.setEntries
        .where('sessionId')
        .equals(sessionId)
        .and((s) => s.exerciseId === exercise!.id)
        .count()

      for (const [i, set] of parsedExercise.sets.entries()) {
        await db.setEntries.add({
          id: newId(),
          sessionId,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          weight: set.weight,
          reps: set.reps,
          order: priorSetCount + i,
          createdAt: timestamp,
        })
        setsImported++
      }
    }
  }
  return { sessionsImported, setsImported }
}
