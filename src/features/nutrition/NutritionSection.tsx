import { Navigate, Route, Routes } from 'react-router-dom'
import { TopTabs } from '../../components/TopTabs'
import { LogPage } from './LogPage'
import { PantryPage } from './PantryPage'
import { ComboPage } from './ComboPage'
import { HistoryPage } from './HistoryPage'

const tabs = [
  { to: '/nutrition/log', label: 'Log' },
  { to: '/nutrition/pantry', label: 'Pantry' },
  { to: '/nutrition/combos', label: 'Combos' },
  { to: '/nutrition/history', label: 'History' },
]

export function NutritionSection() {
  return (
    <div>
      <TopTabs tabs={tabs} />
      <Routes>
        <Route index element={<Navigate to="log" replace />} />
        <Route path="log" element={<LogPage />} />
        <Route path="pantry" element={<PantryPage />} />
        <Route path="combos" element={<ComboPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Routes>
    </div>
  )
}
