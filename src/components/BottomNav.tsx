import { NavLink } from 'react-router-dom'
import { Apple, Dumbbell, Settings } from 'lucide-react'

const items = [
  { to: '/nutrition', label: 'Nutrition', Icon: Apple },
  { to: '/lifting', label: 'Lifting', Icon: Dumbbell },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200/80 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-neutral-800/80 dark:bg-neutral-950/90">
      <ul className="flex">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-400 dark:text-neutral-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-teal-50 dark:bg-teal-950/60' : ''
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
