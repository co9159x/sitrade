import { NavLink } from 'react-router-dom'
import { mobileNav } from '@/components/navigation/nav'
import { cn } from '@/utils/cn'

export function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {mobileNav.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 text-[10px]',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
