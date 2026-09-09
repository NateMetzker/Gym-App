import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '../../db/db'
import { dayKey, todayKey } from '../../lib/date'
import { Card } from '../../components/ui'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarPage() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(() => db.workoutSessions.toArray(), [])
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const sessionDaysMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of sessions ?? []) {
      const key = dayKey(s.timestamp)
      const names = map.get(key) ?? []
      if (!names.includes(s.splitDayName)) names.push(s.splitDayName)
      map.set(key, names)
    }
    return map
  }, [sessions])

  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function keyFor(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function goToDay(day: number) {
    navigate(`/lifting/log?date=${keyFor(day)}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          className="rounded-lg p-2 text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold">
          {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h1>
        <button
          className="rounded-lg p-2 text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="py-1">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const key = keyFor(day)
            const names = sessionDaysMap.get(key)
            const isToday = key === todayKey()
            return (
              <button
                key={i}
                onClick={() => goToDay(day)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                  isToday ? 'ring-1 ring-teal-500' : ''
                } ${names ? 'bg-teal-50 font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-400' : 'text-neutral-600 dark:text-neutral-300'}`}
              >
                {day}
                {names && <span className="mt-0.5 h-1 w-1 rounded-full bg-teal-500" />}
              </button>
            )
          })}
        </div>
      </Card>

      <p className="text-center text-xs text-neutral-400">Tap a day to view or log that workout.</p>
    </div>
  )
}
