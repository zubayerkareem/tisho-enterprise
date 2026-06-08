import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Verify Stripe webhook signature using Deno native crypto (more reliable than npm:stripe in Deno)
async function verifyStripeSignature(body: string, header: string, secret: string): Promise<void> {
  const parts: Record<string, string> = {}
  for (const part of header.split(',')) {
    const [k, v] = part.split('=')
    parts[k.trim()] = v?.trim() ?? ''
  }

  const timestamp = parts['t']
  const sig       = parts['v1']
  if (!timestamp || !sig) throw new Error('Invalid Stripe-Signature header format')

  const encoder  = new TextEncoder()
  const key      = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed   = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expected !== sig) throw new Error('Stripe signature mismatch')

  // Reject replays older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (age > 300) throw new Error('Stripe webhook timestamp too old')
}

Deno.serve(async (req) => {
  const sigHeader = req.headers.get('stripe-signature')
  if (!sigHeader) {
    console.error('Missing stripe-signature header')
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await req.text()

  try {
    await verifyStripeSignature(body, sigHeader, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Signature verification failed:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 400 })
  }

  let event: { type: string; data: { object: any } }
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  console.log('Stripe webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const investmentId = session?.metadata?.investment_id

    console.log('Session metadata:', session?.metadata)

    if (!investmentId) {
      console.error('No investment_id in session metadata')
      // Return 200 so Stripe doesn't keep retrying for a bad event
      return new Response(JSON.stringify({ received: true, warning: 'no investment_id' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const today         = new Date()
    const endDt         = new Date(today)
    endDt.setMonth(endDt.getMonth() + 24)
    const nextPaymentDt = new Date(today)
    nextPaymentDt.setMonth(nextPaymentDt.getMonth() + 1)

    const { error } = await supabase
      .from('investments')
      .update({
        status:            'active',
        start_date:        today.toISOString().split('T')[0],
        end_date:          endDt.toISOString().split('T')[0],
        next_payment_date: nextPaymentDt.toISOString().split('T')[0],
        updated_at:        new Date().toISOString(),
      })
      .eq('id', investmentId)

    if (error) {
      console.error('DB update failed:', error.message)
      return new Response('Database update failed', { status: 500 })
    }

    console.log(`Investment ${investmentId} activated`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
