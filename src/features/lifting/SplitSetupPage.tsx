import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../../db/db'
import type { SplitDay } from '../../db/db'
import { Button, Card, EmptyState, Input } from '../../components/ui'
import { PasteSplitImport } from './PasteSplitImport'

export function SplitSetupPage() {
  const days = useLiveQuery(() => db.splitDays.orderBy('order').toArray(), [])
  const [newDayName, setNewDayName] = useState('')

  async function addDay() {
    const name = newDayName.trim()
    if (!name) return
    const order = (days?.length ?? 0)
    await db.splitDays.add({ id: newId(), name, order, createdAt: Date.now() })
    setNewDayName('')
  }

  async function removeDay(day: SplitDay) {
    const exercises = await db.exercises.where('splitDayId').equals(day.id).toArray()
    await db.transaction('rw', db.splitDays, db.exercises, async () => {
      await db.exercises.bulkDelete(exercises.map((e) => e.id))
      await db.splitDays.delete(day.id)
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Split setup</h1>

      <Card>
        <p className="mb-2 text-xs font-medium text-neutral-500">Add a day</p>
        <div className="flex gap-2">
          <Input
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            placeholder="e.g. Push Day"
            onKeyDown={(e) => e.key === 'Enter' && addDay()}
          />
          <Button onClick={addDay} disabled={!newDayName.trim()}>
            Add
          </Button>
        </div>
      </Card>

      <PasteSplitImport />

      {days && days.length === 0 && (
        <EmptyState title="No split days yet" hint="Add a day like Push, Pull, or Legs to start." />
      )}

      <div className="space-y-3">
        {days?.map((day) => (
          <DayCard key={day.id} day={day} onRemoveDay={() => removeDay(day)} />
        ))}
      </div>
    </div>
  )
}

function DayCard({ day, onRemoveDay }: { day: SplitDay; onRemoveDay: () => void }) {
  const exercises = useLiveQuery(
    () => db.exercises.where('splitDayId').equals(day.id).sortBy('order'),
    [day.id],
  )
  const [newExerciseName, setNewExerciseName] = useState('')

  async function addExercise() {
    const name = newExerciseName.trim()
    if (!name) return
    const order = exercises?.length ?? 0
    await db.exercises.add({ id: newId(), splitDayId: day.id, name, order, createdAt: Date.now() })
    setNewExerciseName('')
  }

  async function removeExercise(id: string) {
    await db.exercises.delete(id)
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">{day.name}</h2>
        <button className="text-xs text-red-600 dark:text-red-400" onClick={onRemoveDay}>
          Delete day
        </button>
      </div>

      <ul className="mb-3 space-y-1">
        {exercises?.map((ex) => (
          <li key={ex.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-sm dark:bg-neutral-800">
            {ex.name}
            <button className="text-xs text-red-600 dark:text-red-400" onClick={() => removeExercise(ex.id)}>
              Remove
            </button>
          </li>
        ))}
        {exercises && exercises.length === 0 && (
          <li className="text-xs text-neutral-400">No exercises yet.</li>
        )}
      </ul>

      <div className="flex gap-2">
        <Input
          value={newExerciseName}
          onChange={(e) => setNewExerciseName(e.target.value)}
          placeholder="e.g. Bench Press"
          onKeyDown={(e) => e.key === 'Enter' && addExercise()}
        />
        <Button variant="secondary" onClick={addExercise} disabled={!newExerciseName.trim()}>
          Add
        </Button>
      </div>
    </Card>
  )
}
