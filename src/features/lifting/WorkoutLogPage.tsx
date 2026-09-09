import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../../db/db'
import type { Exercise, SplitDay } from '../../db/db'
import { checkAndUpdatePr, emptyPrState, setVolume } from '../../lib/calc'
import { isSameDay } from '../../lib/date'
import { Button, Card, EmptyState, Input, Pill } from '../../components/ui'

const LAST_DAY_KEY = 'lifting.lastSplitDayId'

export function WorkoutLogPage() {
  const days = useLiveQuery(() => db.splitDays.orderBy('order').toArray(), [])
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    () => localStorage.getItem(LAST_DAY_KEY),
  )

  useEffect(() => {
    if (!selectedDayId && days && days.length > 0) setSelectedDayId(days[0].id)
  }, [days, selectedDayId])

  const day = days?.find((d) => d.id === selectedDayId) ?? null

  function selectDay(id: string) {
    setSelectedDayId(id)
    localStorage.setItem(LAST_DAY_KEY, id)
  }

  if (days && days.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">Log workout</h1>
        <EmptyState title="No split days set up" hint="Go to Setup to add a day like Push or Pull." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Log workout</h1>

      <div className="flex flex-wrap gap-2">
        {days?.map((d) => (
          <button
            key={d.id}
            onClick={() => selectDay(d.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              d.id === selectedDayId
                ? 'bg-teal-600 text-white'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {day && <DaySession day={day} />}
    </div>
  )
}

function DaySession({ day }: { day: SplitDay }) {
  const exercises = useLiveQuery(
    () => db.exercises.where('splitDayId').equals(day.id).sortBy('order'),
    [day.id],
  )
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSessionId(null)
    ;(async () => {
      const todaysSessions = await db.workoutSessions.where('splitDayId').equals(day.id).toArray()
      const todays = todaysSessions.find((s) => isSameDay(s.timestamp, Date.now()))
      if (todays) {
        if (!cancelled) setSessionId(todays.id)
        return
      }
      const id = newId()
      await db.workoutSessions.add({ id, splitDayId: day.id, splitDayName: day.name, timestamp: Date.now() })
      if (!cancelled) setSessionId(id)
    })()
    return () => {
      cancelled = true
    }
  }, [day.id, day.name])

  if (!exercises) return null
  if (exercises.length === 0) {
    return <EmptyState title={`No exercises in ${day.name}`} hint="Add exercises for this day in Setup." />
  }
  if (!sessionId) return null

  return (
    <div className="space-y-3">
      {exercises.map((ex) => (
        <ExerciseLogger key={ex.id} exercise={ex} sessionId={sessionId} />
      ))}
    </div>
  )
}

function ExerciseLogger({ exercise, sessionId }: { exercise: Exercise; sessionId: string }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')

  const sessionSets = useLiveQuery(
    () =>
      db.setEntries
        .where('sessionId')
        .equals(sessionId)
        .and((s) => s.exerciseId === exercise.id)
        .sortBy('order'),
    [sessionId, exercise.id],
  )

  const priorSets = useLiveQuery(
    () => db.setEntries.where('exerciseId').equals(exercise.id).toArray(),
    [exercise.id],
  )

  async function addSet() {
    const w = Number(weight)
    const r = Number(reps)
    if (!w || !r) return
    const order = sessionSets?.length ?? 0
    await db.setEntries.add({
      id: newId(),
      sessionId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: w,
      reps: r,
      order,
      createdAt: Date.now(),
    })
    setWeight('')
    setReps('')
  }

  async function removeSet(id: string) {
    await db.setEntries.delete(id)
  }

  const prState = emptyPrState()
  const priorChronological = (priorSets ?? [])
    .filter((s) => s.sessionId !== sessionId)
    .sort((a, b) => a.createdAt - b.createdAt)
  for (const s of priorChronological) checkAndUpdatePr(prState, s)

  const sessionVol = sessionSets ? sessionSets.reduce((sum, s) => sum + setVolume(s), 0) : 0

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{exercise.name}</h3>
        {sessionVol > 0 && <span className="text-xs text-neutral-400">{sessionVol} vol</span>}
      </div>

      <ul className="mb-2 space-y-1">
        {sessionSets?.map((s) => {
          const { isWeightPr, isRepPr } = checkAndUpdatePr(prState, s)
          return (
            <li key={s.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:bg-neutral-800">
              <span>
                {s.weight} × {s.reps}
              </span>
              <div className="flex items-center gap-2">
                {(isWeightPr || isRepPr) && <Pill tone="pr">PR</Pill>}
                <button className="text-xs text-red-600 dark:text-red-400" onClick={() => removeSet(s.id)}>
                  Remove
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-24"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-20"
        />
        <Button variant="secondary" onClick={addSet} disabled={!weight || !reps} className="flex-1">
          + Add set
        </Button>
      </div>
    </Card>
  )
}
