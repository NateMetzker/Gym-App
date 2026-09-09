import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode
  className?: string
  /** Featured-card treatment: a soft teal glow border/shadow in dark mode, for the one or two things per screen that deserve emphasis. */
  glow?: boolean
}) {
  return (
    <div
      className={`rounded-[20px] border border-neutral-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] dark:bg-neutral-900 ${
        glow
          ? 'dark:border-teal-500/25 dark:shadow-[0_0_50px_-14px_rgba(45,212,191,0.45)]'
          : 'dark:border-neutral-800/70 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-12px_rgba(0,0,0,0.4)]'
      } ${className}`}
    >
      {children}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 text-white shadow-sm shadow-teal-900/10 active:bg-teal-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none dark:shadow-[0_0_20px_-4px_rgba(45,212,191,0.55)] dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 dark:disabled:shadow-none',
  secondary:
    'bg-neutral-100 text-neutral-900 active:bg-neutral-200 disabled:text-neutral-400 dark:bg-neutral-800 dark:text-neutral-100 dark:active:bg-neutral-700',
  ghost: 'bg-transparent text-teal-700 active:bg-teal-50 dark:text-teal-400 dark:active:bg-neutral-800',
  danger: 'bg-red-50 text-red-600 active:bg-red-100 dark:bg-red-950/60 dark:text-red-400',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400 ${className}`} {...props} />
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 transition-shadow focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 ${className}`}
      {...props}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'estimated' | 'pr' }) {
  const tones = {
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    estimated: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    pr: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  }
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-neutral-300 p-7 text-center dark:border-neutral-700">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{title}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{hint}</p>}
    </div>
  )
}
