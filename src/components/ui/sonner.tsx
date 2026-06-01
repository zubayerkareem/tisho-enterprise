import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-surface-base group-[.toaster]:text-text-primary group-[.toaster]:border-border-default group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
          description: 'group-[.toast]:text-text-muted',
          actionButton: 'group-[.toast]:bg-accent-primary group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-surface-subtle group-[.toast]:text-text-secondary',
        },
      }}
      {...props}
    />
  )
}
