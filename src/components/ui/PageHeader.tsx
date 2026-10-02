export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </header>
  )
}
