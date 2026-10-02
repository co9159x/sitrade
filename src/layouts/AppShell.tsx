import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogoLink } from '@/components/brand/Logo'
import { adminNav, userNav } from '@/components/navigation/nav'
import { MobileNav } from '@/components/navigation/MobileNav'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TopNavigation } from '@/components/navigation/TopNavigation'
import { DemoBanner, PreviewRibbon } from '@/components/ui/DemoBanner'
import { SkipLink } from '@/components/ui/SkipLink'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedMatcher } from '@/hooks/useSimulatedMatcher'
import { paths } from '@/routes/paths'

function Shell({ tone }: { tone: 'user' | 'admin' }) {
  const { configured, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const items =
    tone === 'admin'
      ? adminNav.filter((item) => item.to !== paths.adminSettings || !configured || profile?.role === 'super_admin')
      : userNav

  useEffect(() => {
    if (!open) return
    const node = drawerRef.current
    node?.querySelector<HTMLElement>('button')?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab' || !node) return
      const nodes = [...node.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <SkipLink />
      <DemoBanner />
      {!configured ? (
        <PreviewRibbon>
          {tone === 'admin'
            ? 'Operations preview. Role checks are inactive until Supabase is configured. Writes stay disabled.'
            : 'Preview mode. Supabase is not configured, so sign-in is not enforced yet. These screens are layout only and store nothing.'}
        </PreviewRibbon>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-panel lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-line px-4">
            <LogoLink />
          </div>
          <Sidebar items={items} label={tone === 'admin' ? 'Operations' : 'Trading'} tone={tone} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavigation tone={tone} onMenu={() => setOpen(true)} />
          <main id="main" tabIndex={-1} className={`min-h-0 flex-1 overflow-y-auto p-3 md:p-5 ${tone === 'user' ? 'pb-24 lg:pb-5' : 'pb-5'}`}>
            <Outlet />
          </main>
        </div>
      </div>
      {tone === 'user' ? <MobileNav /> : null}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div ref={drawerRef} className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-panel" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <LogoLink />
              <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <Sidebar
              items={items}
              label={tone === 'admin' ? 'Operations' : 'Trading'}
              tone={tone}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function UserLayout() {
  useSimulatedMatcher()
  return <Shell tone="user" />
}

export function AdminLayout() {
  return <Shell tone="admin" />
}
