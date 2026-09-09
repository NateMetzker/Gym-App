import { useLiveQuery } from 'dexie-react-hooks'
import { Flame } from 'lucide-react'
import { db, newId } from '../../db/db'
import type { Combo, PantryItem } from '../../db/db'
import { comboMacros, scaleMacros, sumMacros } from '../../lib/calc'
import { formatTime, isSameDay } from '../../lib/date'
import { Card, EmptyState } from '../../components/ui'

export function LogPage() {
  const pantryItems = useLiveQuery(() => db.pantryItems.orderBy('name').toArray(), [])
  const combos = useLiveQuery(() => db.combos.orderBy('name').toArray(), [])
  const allEntries = useLiveQuery(() => db.logEntries.orderBy('timestamp').reverse().toArray(), [])

  const todayEntries = allEntries?.filter((e) => isSameDay(e.timestamp, Date.now())) ?? []
  const totals = sumMacros(todayEntries)

  async function logItem(item: PantryItem) {
    const macros = scaleMacros(item, 1)
    await db.logEntries.add({
      id: newId(),
      timestamp: Date.now(),
      sourceType: 'item',
      sourceId: item.id,
      name: item.name,
      quantity: 1,
      ...macros,
    })
  }

  async function logCombo(combo: Combo) {
    if (!pantryItems) return
    const macros = comboMacros(combo.lines, pantryItems)
    await db.logEntries.add({
      id: newId(),
      timestamp: Date.now(),
      sourceType: 'combo',
      sourceId: combo.id,
      name: combo.name,
      quantity: 1,
      ...macros,
    })
  }

  async function removeEntry(id: string) {
    await db.logEntries.delete(id)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Today</h1>

      <Card className="relative overflow-hidden !bg-teal-600 p-5 text-white dark:shadow-[0_0_60px_-12px_rgba(45,212,191,0.55)]">
        <Flame
          size={96}
          strokeWidth={1}
          className="pointer-events-none absolute -right-4 -top-4 text-white/10"
        />
        <p className="text-xs font-medium uppercase tracking-wide text-teal-50/80">Today</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {Math.round(totals.calories)} <span className="text-lg font-medium text-teal-50/90">kcal</span>
        </p>
        <p className="mt-1.5 text-sm text-teal-50">
          {Math.round(totals.protein)}g protein · {Math.round(totals.carbs)}g carbs · {Math.round(totals.fat)}g fat
        </p>
      </Card>

      {combos && combos.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">Combos — tap to log</p>
          <div className="flex flex-wrap gap-2">
            {combos.map((c) => (
              <button
                key={c.id}
                onClick={() => logCombo(c)}
                className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 active:bg-teal-100 dark:bg-teal-950 dark:text-teal-400"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {pantryItems && pantryItems.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">Pantry — tap to log</p>
          <div className="flex flex-wrap gap-2">
            {pantryItems.map((p) => (
              <button
                key={p.id}
                onClick={() => logItem(p)}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {pantryItems && pantryItems.length === 0 && (
        <EmptyState title="Your pantry is empty" hint="Add items in the Pantry tab to start logging." />
      )}

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">Logged today</p>
        {todayEntries.length === 0 ? (
          <EmptyState title="Nothing logged yet today" />
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <Card key={entry.id} className="!p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-neutral-400">
                      {formatTime(entry.timestamp)} · {entry.calories} kcal · {entry.protein}g P
                    </p>
                  </div>
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-red-600 dark:text-red-400"
                    onClick={() => removeEntry(entry.id)}
                  >
                    Remove
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
