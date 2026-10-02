import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'

export function AccessMessage({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="font-display text-sm tracking-[0.16em] text-warn">ACCESS DENIED</p>
      <h1 className="mt-3 max-w-lg font-display text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">{body}</p>
      <div className="mt-6 flex gap-3">
        <Link to={paths.home} className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm text-white">
          Back to site
        </Link>
        <Link to={paths.login} className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm">
          Sign in
        </Link>
      </div>
    </div>
  )
}
