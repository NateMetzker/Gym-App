import { NavLink } from 'react-router-dom'

export function TopTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50/95 px-4 pb-0 pt-1 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              isActive
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-neutral-400'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
