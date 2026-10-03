import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-xs font-semibold tracking-wide text-warn">DEMO / TRAINING ENVIRONMENT</p>
      <h1 className="mt-3 text-2xl font-semibold">This page is not part of Sitrade.</h1>
      <Link to={paths.home} className={buttonClass({ className: 'mt-6' })}>
        Back to home
      </Link>
    </main>
  )
}
