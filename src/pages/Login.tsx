import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

type Mode = 'login' | 'forgot'

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const { session, signIn } = useAuth()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  // Redirect if already logged in
  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, navigate, from])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error('Sign in failed', { description: error.message })
    }
    // AuthProvider handles navigation via session change
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) { toast.error('Enter your email address first'); return }
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotLoading(false)
    if (error) {
      toast.error('Could not send reset email', { description: error.message })
    } else {
      toast.success('Reset link sent — check your inbox')
      setMode('login')
    }
  }

  return (
    <div className="min-h-screen bg-surface-subtle flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-accent-primary flex-col justify-between p-12">
        <img
          src="/logos/logo-side-white.svg"
          alt="Tisho Enterprises"
          className="h-10 w-auto"
        />

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your investments,<br />working harder<br />for you.
          </h2>
          <p className="text-accent-soft text-base leading-relaxed max-w-sm">
            Track your returns, monitor your portfolio progress, and manage your account — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Invested',    value: '£4.2M+' },
            { label: 'Avg. Annual Return', value: '25–42%' },
            { label: 'Investors',          value: '200+' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-4">
              <p className="text-accent-highlight font-bold text-xl">{s.value}</p>
              <p className="text-accent-soft text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <img src="/logos/logo-side-black.svg" alt="Tisho Enterprises" className="h-9 w-auto" />
          </div>

          <div className="bg-surface-base rounded-2xl border border-border-default shadow-sm p-8">
            {mode === 'login' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
                  <p className="text-text-muted mt-1 text-sm">Sign in to your investor account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="email">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="you@email.com"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <p id="email-error" role="alert" className="mt-1 text-xs text-status-danger">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-text-secondary" htmlFor="password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-accent-primary font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password')}
                        className="w-full pl-10 pr-11 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="Your password"
                        aria-describedby={errors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" role="alert" className="mt-1 text-xs text-status-danger">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Remember */}
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      {...register('remember')}
                      className="w-4 h-4 rounded accent-accent-primary"
                    />
                    <label htmlFor="remember" className="text-sm text-text-secondary">Keep me signed in</label>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in…' : 'Sign In to Dashboard'}
                  </Button>
                </form>
              </>
            ) : (
              /* Forgot password mode */
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
                  <p className="text-text-muted mt-1 text-sm">Enter your email and we'll send a reset link.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="forgot-email">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <Button size="lg" className="w-full" onClick={handleForgotPassword} disabled={forgotLoading}>
                    {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-border-default text-center">
              <p className="text-sm text-text-muted">
                Don't have an account?{' '}
                <Link to="/signup" className="text-accent-primary font-medium hover:underline">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
