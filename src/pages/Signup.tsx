import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Phone, MessageCircle, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const signupSchema = z.object({
  name:            z.string().min(2, 'Full name is required'),
  email:           z.string().email('Enter a valid email address'),
  whatsapp:        z.string().min(7, 'Enter a valid WhatsApp number'),
  phone:           z.string().min(7, 'Enter a valid phone number'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export function Signup() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')?.toUpperCase().trim() ?? ''

  const [showPassword, setShowPassword]        = useState(false)
  const [showConfirm, setShowConfirm]           = useState(false)
  const [submitted, setSubmitted]               = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    const { error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options: {
        data: {
          full_name:       data.name,
          phone:           data.phone,
          whatsapp_number: data.whatsapp,
          ...(refCode && { referral_code: refCode }),
        },
      },
    })
    if (error) {
      toast.error('Registration failed', { description: error.message })
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-surface-subtle flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-accent-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-highlight rounded-xl flex items-center justify-center">
            <span className="text-accent-primary font-black text-base">T</span>
          </div>
          <div>
            <p className="text-white font-bold text-base">Tisho Enterprises</p>
            <p className="text-accent-soft text-xs">Investor Portal</p>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-highlight" />
            <span className="text-accent-soft text-sm">Join 200+ investors</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start growing<br />your wealth<br />today.
          </h2>
          <p className="text-accent-soft text-base leading-relaxed max-w-sm">
            Register your account and our team will review your application to get you started.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Invested',     value: '£4.2M+' },
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
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-accent-primary rounded-xl flex items-center justify-center">
              <span className="text-accent-highlight font-black text-base">T</span>
            </div>
            <span className="text-text-primary font-bold text-lg">Tisho Enterprises</span>
          </div>

          <div className="bg-surface-base rounded-2xl border border-border-default shadow-sm p-8">
            {submitted ? (
              /* Success state */
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-accent-highlight/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-accent-primary" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
                <p className="text-text-muted text-sm leading-relaxed mb-6">
                  We've sent a verification link to your email address. Click it to activate your account, then sign in.
                </p>
                <Link to="/login">
                  <Button variant="secondary" className="w-full">Back to Sign In</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
                  <p className="text-text-muted mt-1 text-sm">Register to access the investor portal</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="name">
                      Full name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register('name')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="Alexandra Pemberton"
                      />
                    </div>
                    {errors.name && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.name.message}</p>}
                  </div>

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
                      />
                    </div>
                    {errors.email && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.email.message}</p>}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="whatsapp">
                      WhatsApp number
                    </label>
                    <div className="relative">
                      <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="whatsapp"
                        type="tel"
                        autoComplete="tel"
                        {...register('whatsapp')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="+44 7700 900123"
                      />
                    </div>
                    {errors.whatsapp && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.whatsapp.message}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="phone">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="+44 20 7946 0000"
                      />
                    </div>
                    {errors.phone && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.phone.message}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('password')}
                        className="w-full pl-10 pr-11 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="Min. 8 characters"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.password.message}</p>}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="confirmPassword">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirmPassword')}
                        className="w-full pl-10 pr-11 py-2.5 rounded-full border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                        placeholder="Re-enter password"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p role="alert" className="mt-1 text-xs text-status-danger">{errors.confirmPassword.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full !mt-6" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account…' : 'Register'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border-default text-center">
                  <p className="text-sm text-text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
