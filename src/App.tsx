import { Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { NutritionSection } from './features/nutrition/NutritionSection'
import { LiftingSection } from './features/lifting/LiftingSection'
import { SettingsPage } from './features/SettingsPage'

function App() {
  return (
    <div className="mx-auto min-h-full max-w-md pb-20">
      <main className="px-4 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/nutrition" replace />} />
          <Route path="/nutrition/*" element={<NutritionSection />} />
          <Route path="/lifting/*" element={<LiftingSection />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/nutrition" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
