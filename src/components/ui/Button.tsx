import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:   'bg-accent-primary text-white hover:bg-accent-primary-hover focus-visible:ring-accent-primary',
        secondary: 'bg-surface-base text-accent-primary border border-accent-primary hover:bg-surface-subtle',
        ghost:     'bg-transparent text-text-secondary hover:bg-surface-subtle',
        danger:    'bg-status-danger text-white hover:bg-status-danger-hover focus-visible:ring-status-danger',
        highlight: 'bg-accent-highlight text-text-primary hover:bg-accent-highlight-hover focus-visible:ring-accent-highlight',
      },
      size: {
        sm:   'px-3 py-1.5 text-sm',
        md:   'px-4 py-2 text-sm',
        lg:   'px-6 py-3 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { buttonVariants }
