import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'up'
  size?: 'default' | 'small' | 'compact' | 'icon' | 'sm' | 'md'
}

const variants = {
  primary: 'bg-accent text-white shadow-[0_0_22px_rgba(124,108,255,0.32)] hover:bg-accent-strong hover:shadow-[0_0_28px_rgba(124,108,255,0.48)]',
  secondary: 'border border-white/10 bg-white/5 text-text backdrop-blur-md hover:border-white/30',
  ghost: 'text-muted hover:bg-white/5 hover:text-text',
  danger: 'bg-down text-white shadow-[0_0_18px_rgba(255,92,106,0.28)] hover:brightness-110',
  up: 'bg-up text-bg shadow-[0_0_18px_rgba(47,206,143,0.28)] hover:brightness-110',
}

const sizes = {
  default: 'h-9 w-fit px-3.5 text-sm',
  small: 'h-8 w-fit px-3 text-[13px]',
  compact: 'h-[30px] w-fit px-2.5 text-xs',
  icon: 'h-9 w-9 p-0',
  md: 'h-9 w-fit px-3.5 text-sm',
  sm: 'h-8 w-fit px-3 text-[13px]',
}

export function buttonClass({
  variant = 'primary',
  size = 'default',
  className,
}: {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
} = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
    variants[variant],
    sizes[size],
    className,
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'default', className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass({ variant, size, className })} {...props} />
})
