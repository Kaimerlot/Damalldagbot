import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing Stripe signature', { status: 400 })

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (error) {
    console.error('Stripe signature verification failed', error)
    return new Response('Invalid signature', { status: 400 })
  }

  const relevant = ['checkout.session.completed', 'checkout.session.expired', 'checkout.session.async_payment_failed', 'checkout.session.async_payment_succeeded']
  if (!relevant.includes(event.type)) return new Response('Ignored', { status: 200 })
  const session = event.data.object as Stripe.Checkout.Session
  const reservationId = session.metadata?.reservation_id
  if (!reservationId) return new Response('Missing reservation metadata', { status: 400 })

  const eventType = event.type === 'checkout.session.async_payment_succeeded' ? 'checkout.session.completed' : event.type
  const shipping = session.shipping_details?.address ?? {}
  const { error } = await supabase.rpc('process_stripe_checkout_event', {
    p_event_id: event.id,
    p_event_type: eventType,
    p_reservation_id: reservationId,
    p_session_id: session.id,
    p_user_id: session.metadata?.user_id || null,
    p_total_sek: session.amount_total ?? 0,
    p_shipping_address: shipping,
  })
  if (error) {
    console.error('Stripe event processing failed', { eventId: event.id, error })
    return new Response('Webhook processing failed', { status: 500 })
  }
  return new Response('Processed', { status: 200 })
})