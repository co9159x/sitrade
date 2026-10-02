import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'up'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border border-line bg-panel-raised text-text hover:border-muted',
  ghost: 'text-muted hover:bg-panel-raised hover:text-text',
  danger: 'bg-down text-white hover:brightness-110',
  up: 'bg-up text-bg hover:brightness-110',
}

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
