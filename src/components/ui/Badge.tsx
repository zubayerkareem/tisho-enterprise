import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
  {
    variants: {
      variant: {
        active:    'bg-accent-highlight text-text-primary',
        completed: 'bg-accent-primary text-white',
        pending:   'bg-amber-100 text-amber-800',
        approved:  'bg-emerald-100 text-emerald-800',
        rejected:  'bg-red-100 text-red-800',
        open:      'bg-blue-100 text-blue-800',
        resolved:  'bg-gray-100 text-gray-600',
        default:   'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
