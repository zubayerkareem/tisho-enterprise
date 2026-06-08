import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { investmentId, amountPence, label, currency = 'gbp' } = await req.json()
    if (!investmentId || !amountPence || !label) throw new Error('Missing required fields')

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://dashboard.tishoenterprises.com'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: label },
          unit_amount: amountPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/investments?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/investments?stripe_cancelled=1`,
      customer_email: user.email,
      metadata: {
        investment_id: investmentId,
        user_id: user.id,
      },
    })

    // Store the Stripe session ID on the investment record
    await supabase
      .from('investments')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', investmentId)
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
