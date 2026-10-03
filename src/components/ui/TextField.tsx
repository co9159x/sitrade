import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type FieldProps = {
  id: string
  label: string
  error?: string | null
  hint?: string
  trailing?: ReactNode
}

export function TextField({
  id,
  label,
  error,
  hint,
  trailing,
  className,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-text backdrop-blur-md focus:border-accent disabled:cursor-not-allowed disabled:opacity-50',
            trailing ? 'pr-11' : '',
            className,
          )}
          {...props}
        />
        {trailing ? <div className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</div> : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-down" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function SelectField({
  id,
  label,
  error,
  hint,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm backdrop-blur-md focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-down" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
