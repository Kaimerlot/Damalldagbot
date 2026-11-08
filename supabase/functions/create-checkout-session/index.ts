import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const appUrl = Deno.env.get('APP_URL')!
const shippingRate = Deno.env.get('STRIPE_SHIPPING_RATE_ID')!
const shippingCountries = (Deno.env.get('ALLOWED_SHIPPING_COUNTRIES') ?? '').split(',').map((code) => code.trim().toUpperCase()).filter(Boolean)
const stripe = new Stripe(stripeKey)
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

const corsHeaders = {
  'Access-Control-Allow-Origin': appUrl,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
  if (!stripeKey || !supabaseUrl || !serviceRoleKey || !appUrl || !shippingRate || shippingCountries.length === 0) {
    return Response.json({ error: 'Checkout is not configured' }, { status: 503, headers: corsHeaders })
  }

  let reservationId: string | null = null
  try {
    const { items, language } = await request.json()
    if (!Array.isArray(items) || items.length === 0 || items.length > 50 || !['sv', 'en'].includes(language)) {
      return Response.json({ error: 'Invalid cart' }, { status: 400, headers: corsHeaders })
    }
    const cleanItems = items.map((item) => ({
      variant_id: String(item.variant_id),
      quantity: Number(item.quantity),
    }))
    if (cleanItems.some((item) => !/^[0-9a-f-]{36}$/i.test(item.variant_id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)) {
      return Response.json({ error: 'Invalid cart line' }, { status: 400, headers: corsHeaders })
    }

    let userId: string | null = null
    const authorization = request.headers.get('Authorization')
    if (authorization?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false },
      })
      const { data } = await userClient.auth.getUser()
      userId = data.user?.id ?? null
    }

    const { data: reservation, error: reserveError } = await admin.rpc('reserve_checkout_cart', {
      p_items: cleanItems,
      p_user_id: userId,
    })
    if (reserveError) throw reserveError
    reservationId = reservation.reservation_id

    const lineItems = reservation.items.map((item: { unit_amount: number; quantity: number; name_sv: string; name_en: string; size: string; colour: string }) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'sek',
        unit_amount: item.unit_amount,
        product_data: {
          name: `${language === 'sv' ? item.name_sv : item.name_en} · ${item.size}`,
          description: item.colour,
        },
      },
    }))
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${appUrl}/${language}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${language}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: shippingCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
      shipping_options: [{ shipping_rate: shippingRate }],
      automatic_tax: { enabled: true },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: { reservation_id: reservationId, user_id: userId ?? '' },
    })
    const { error: attachError } = await admin.rpc('attach_checkout_session', {
      p_reservation_id: reservationId,
      p_session_id: session.id,
    })
    if (attachError) throw attachError
    return Response.json({ url: session.url }, { headers: corsHeaders })
  } catch (error) {
    if (reservationId) await admin.rpc('release_checkout_reservation', { p_reservation_id: reservationId })
    console.error('Checkout session creation failed', error)
    return Response.json({ error: 'Could not create checkout session' }, { status: 400, headers: corsHeaders })
  }
})