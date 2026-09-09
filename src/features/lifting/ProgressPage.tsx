import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../../db/db'
import { checkAndUpdatePr, emptyPrState, setVolume } from '../../lib/calc'
import { formatDay } from '../../lib/date'
import { Card, EmptyState, Pill } from '../../components/ui'

export function ProgressPage() {
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const splitDays = useLiveQuery(() => db.splitDays.toArray(), [])
  const [exerciseId, setExerciseId] = useState<string | null>(null)

  const activeExercise = exercises?.find((e) => e.id === exerciseId) ?? exercises?.[0] ?? null
  const effectiveId = exerciseId ?? activeExercise?.id ?? null

  if (exercises && exercises.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">Progress</h1>
        <EmptyState title="No exercises yet" hint="Set up a split with exercises first." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Progress</h1>

      <select
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        value={effectiveId ?? ''}
        onChange={(e) => setExerciseId(e.target.value)}
      >
        {exercises?.map((ex) => {
          const dayName = splitDays?.find((d) => d.id === ex.splitDayId)?.name
          return (
            <option key={ex.id} value={ex.id}>
              {ex.name}
              {dayName ? ` (${dayName})` : ''}
            </option>
          )
        })}
      </select>

      {effectiveId && <ExerciseProgress exerciseId={effectiveId} />}
    </div>
  )
}

function ExerciseProgress({ exerciseId }: { exerciseId: string }) {
  const sets = useLiveQuery(
    () => db.setEntries.where('exerciseId').equals(exerciseId).sortBy('createdAt'),
    [exerciseId],
  )
  const sessions = useLiveQuery(() => db.workoutSessions.toArray(), [])

  const bySession = useMemo(() => {
    if (!sets) return []
    const map = new Map<string, typeof sets>()
    for (const s of sets) {
      const list = map.get(s.sessionId)
      if (list) list.push(s)
      else map.set(s.sessionId, [s])
    }
    return [...map.entries()]
      .map(([sessionId, setsInSession]) => {
        const session = sessions?.find((s) => s.id === sessionId)
        return {
          sessionId,
          timestamp: session?.timestamp ?? setsInSession[0].createdAt,
          sets: setsInSession,
          volume: setsInSession.reduce((sum, s) => sum + setVolume(s), 0),
          bestWeight: Math.max(...setsInSession.map((s) => s.weight)),
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [sets, sessions])

  const prFlags = useMemo(() => {
    const state = emptyPrState()
    const flags = new Map<string, boolean>()
    for (const session of bySession) {
      let sessionHasPr = false
      for (const s of session.sets) {
        const { isWeightPr, isRepPr } = checkAndUpdatePr(state, s)
        if (isWeightPr || isRepPr) sessionHasPr = true
      }
      flags.set(session.sessionId, sessionHasPr)
    }
    return flags
  }, [bySession])

  if (!sets) return null
  if (bySession.length === 0) {
    return <EmptyState title="No history for this exercise yet" hint="Log a set in the Log tab." />
  }

  const chartData = bySession.map((s) => ({
    date: formatDay(s.timestamp),
    weight: s.bestWeight,
    volume: s.volume,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-2 text-xs font-medium text-neutral-500">Best set weight over time</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-xs font-medium text-neutral-500">Volume over time</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#7e14ff" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">Session history</p>
        <div className="space-y-2">
          {[...bySession].reverse().map((session) => (
            <Card key={session.sessionId} className="!p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{formatDay(session.timestamp)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">{session.volume} vol</span>
                  {prFlags.get(session.sessionId) && <Pill tone="pr">PR</Pill>}
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {session.sets.map((s) => `${s.weight}×${s.reps}`).join(', ')}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
