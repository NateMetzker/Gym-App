import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../../db/db'
import type { Exercise, SplitDay } from '../../db/db'
import { checkAndUpdatePr, emptyPrState, setVolume } from '../../lib/calc'
import { formatDay, todayKey } from '../../lib/date'
import { Button, Card, EmptyState, Input, Pill } from '../../components/ui'

const LAST_DAY_KEY = 'lifting.lastSplitDayId'

function dateFromKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getTime()
}

export function WorkoutLogPage() {
  const [params, setParams] = useSearchParams()
  const days = useLiveQuery(() => db.splitDays.orderBy('order').toArray(), [])
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    () => localStorage.getItem(LAST_DAY_KEY),
  )
  const dateKey = params.get('date') || todayKey()
  const isToday = dateKey === todayKey()
  const selectedDate = dateFromKey(dateKey)

  useEffect(() => {
    if (!selectedDayId && days && days.length > 0) setSelectedDayId(days[0].id)
  }, [days, selectedDayId])

  const day = days?.find((d) => d.id === selectedDayId) ?? null

  function selectDay(id: string) {
    setSelectedDayId(id)
    localStorage.setItem(LAST_DAY_KEY, id)
  }

  function changeDate(newKey: string) {
    setParams(newKey === todayKey() ? {} : { date: newKey })
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{isToday ? 'Log workout' : formatDay(selectedDate)}</h1>
        <input
          type="date"
          value={dateKey}
          max={todayKey()}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

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

      {day && <DaySession day={day} dateKey={dateKey} sessionDate={selectedDate} />}
    </div>
  )
}

function DaySession({ day, dateKey, sessionDate }: { day: SplitDay; dateKey: string; sessionDate: number }) {
  const exercises = useLiveQuery(
    () => db.exercises.where('splitDayId').equals(day.id).sortBy('order'),
    [day.id],
  )
  // Deterministic per (day, date) id — avoids a check-then-create race where
  // rapid date switches could otherwise insert two sessions for the same day.
  const sessionId = `${day.id}:${dateKey}`

  useEffect(() => {
    db.workoutSessions.put({ id: sessionId, splitDayId: day.id, splitDayName: day.name, timestamp: sessionDate })
  }, [sessionId, day.id, day.name, sessionDate])

  if (!exercises) return null
  if (exercises.length === 0) {
    return <EmptyState title={`No exercises in ${day.name}`} hint="Add exercises for this day in Setup." />
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex) => (
        <ExerciseLogger key={ex.id} exercise={ex} sessionId={sessionId} sessionDate={sessionDate} />
      ))}
    </div>
  )
}

function ExerciseLogger({
  exercise,
  sessionId,
  sessionDate,
}: {
  exercise: Exercise
  sessionId: string
  sessionDate: number
}) {
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
      createdAt: sessionDate,
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
