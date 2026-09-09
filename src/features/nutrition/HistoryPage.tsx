import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown } from 'lucide-react'
import { db } from '../../db/db'
import type { LogEntry } from '../../db/db'
import { sumMacros } from '../../lib/calc'
import { dayKey, formatDay, formatTime } from '../../lib/date'
import { Card, EmptyState } from '../../components/ui'

interface DayGroup {
  key: string
  timestamp: number
  entries: LogEntry[]
}

export function HistoryPage() {
  const allEntries = useLiveQuery(() => db.logEntries.orderBy('timestamp').reverse().toArray(), [])
  const [expanded, setExpanded] = useState<string | null>(null)

  const days = useMemo<DayGroup[]>(() => {
    if (!allEntries) return []
    const map = new Map<string, DayGroup>()
    for (const entry of allEntries) {
      const key = dayKey(entry.timestamp)
      const group = map.get(key)
      if (group) group.entries.push(entry)
      else map.set(key, { key, timestamp: entry.timestamp, entries: [entry] })
    }
    return [...map.values()]
  }, [allEntries])

  if (!allEntries) return null

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">History</h1>

      {days.length === 0 && <EmptyState title="No logged days yet" />}

      <div className="space-y-2">
        {days.map((day) => {
          const totals = sumMacros(day.entries)
          const isOpen = expanded === day.key
          return (
            <Card key={day.key} className="!p-3">
              <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : day.key)}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatDay(day.timestamp)}</span>
                  <ChevronDown
                    size={16}
                    className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g P ·{' '}
                  {Math.round(totals.carbs)}g C · {Math.round(totals.fat)}g F
                </p>
              </button>
              {isOpen && (
                <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                  {day.entries.map((e) => (
                    <li key={e.id} className="flex justify-between text-xs text-neutral-500">
                      <span>
                        {formatTime(e.timestamp)} · {e.name}
                      </span>
                      <span>{e.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
