import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature verification failed:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 400 })
  }

  console.log('Stripe webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const investmentId = session.metadata?.investment_id
    if (!investmentId) {
      console.error('No investment_id in session metadata')
      return new Response('Missing investment_id in metadata', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Set start today, end 24 months later
    const today  = new Date()
    const endDt  = new Date(today)
    endDt.setMonth(endDt.getMonth() + 24)

    const startDate = today.toISOString().split('T')[0]
    const endDate   = endDt.toISOString().split('T')[0]

    // next_payment_date = 1 month from today
    const nextPaymentDt = new Date(today)
    nextPaymentDt.setMonth(nextPaymentDt.getMonth() + 1)
    const nextPaymentDate = nextPaymentDt.toISOString().split('T')[0]

    const { error } = await supabase
      .from('investments')
      .update({
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        next_payment_date: nextPaymentDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investmentId)

    if (error) {
      console.error('Failed to activate investment:', error.message)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`Investment ${investmentId} activated via Stripe checkout session ${session.id}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
