import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TopTabs } from '../../components/TopTabs'
import { WorkoutLogPage } from './WorkoutLogPage'
import { SplitSetupPage } from './SplitSetupPage'
import { CalendarPage } from './CalendarPage'

const ProgressPage = lazy(() => import('./ProgressPage').then((m) => ({ default: m.ProgressPage })))

const tabs = [
  { to: '/lifting/log', label: 'Log' },
  { to: '/lifting/calendar', label: 'Calendar' },
  { to: '/lifting/setup', label: 'Setup' },
  { to: '/lifting/progress', label: 'Progress' },
]

export function LiftingSection() {
  return (
    <div>
      <TopTabs tabs={tabs} />
      <Routes>
        <Route index element={<Navigate to="log" replace />} />
        <Route path="log" element={<WorkoutLogPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="setup" element={<SplitSetupPage />} />
        <Route
          path="progress"
          element={
            <Suspense fallback={null}>
              <ProgressPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  )
}
