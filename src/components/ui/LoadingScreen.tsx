export function LoadingScreen({ label = 'Loading Sitrade' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg text-sm text-muted" role="status">
      {label}
    </div>
  )
}
