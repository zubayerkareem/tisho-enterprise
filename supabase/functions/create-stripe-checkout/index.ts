import Stripe from 'npm:stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set')

    // Verify the calling user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const { investmentId, amountPence, label, currency = 'gbp' } = body

    console.log('create-stripe-checkout received:', { investmentId, amountPence, label, currency })

    if (!investmentId) throw new Error('investmentId is required')
    if (!amountPence || amountPence <= 0) throw new Error(`amountPence invalid: ${amountPence}`)
    if (!label)        throw new Error('label is required')

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://dashboard.tishoenterprises.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: `Tisho Enterprises — ${label}` },
          unit_amount: amountPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email,
      success_url: `${siteUrl}/investments?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/investments?stripe_cancelled=1`,
      metadata: {
        investment_id: investmentId,
        user_id: user.id,
      },
    })

    // Persist the session ID on the investment record
    await supabase
      .from('investments')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', investmentId)
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-stripe-checkout error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
