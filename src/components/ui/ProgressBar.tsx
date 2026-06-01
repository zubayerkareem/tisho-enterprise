import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number
  max?: number
}

export function ProgressBar({ value, max = 100, className, ...props }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <ProgressPrimitive.Root
      className={cn('relative w-full h-2 bg-border-default rounded-full overflow-hidden', className)}
      value={pct}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-accent-highlight rounded-full transition-all duration-500"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
