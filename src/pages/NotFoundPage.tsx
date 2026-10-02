import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-xs font-semibold tracking-wide text-warn">DEMO / TRAINING ENVIRONMENT</p>
      <h1 className="mt-3 text-2xl font-semibold">This page is not part of Sitrade.</h1>
      <Link to={paths.home} className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm text-white">
        Back to home
      </Link>
    </main>
  )
}
