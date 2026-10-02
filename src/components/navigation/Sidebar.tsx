import { NavLink } from 'react-router-dom'
import type { NavItem } from '@/components/navigation/nav'
import { cn } from '@/utils/cn'

export function Sidebar({
  items,
  label,
  tone,
  onNavigate,
}: {
  items: NavItem[]
  label: string
  tone: 'user' | 'admin'
  onNavigate?: () => void
}) {
  return (
    <nav aria-label={label} className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 border-l-2 px-3 py-2 text-sm transition-colors',
                isActive
                  ? tone === 'admin'
                    ? 'border-warn bg-panel-raised text-warn'
                    : 'border-accent bg-panel-raised text-text'
                  : 'border-transparent text-muted hover:border-line hover:bg-panel-raised hover:text-text',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
