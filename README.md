# Sidlinjen

A bilingual (Swedish and English) supporter hub for Damallsvenskan. The frontend is Vite, React, TypeScript, Tailwind CSS, React Router, TanStack Query, and react-i18next. Supabase migrations and server-only Stripe Edge Functions are included.

## Run locally

```sh
npm install
npm run dev
```

The site runs in demo mode without backend credentials. Quiz content is clearly labelled as a local preview; cart contents are stored in the browser, but checkout is disabled. Authentication, profile editing, private order history, and admin role checks become active when Supabase is configured.

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to connect a Supabase project. Never add a service-role key, Stripe secret, or sports API key to a `VITE_*` variable or the browser environment.

## Supabase

Install the Supabase CLI, then run:

```sh
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/lib/database.types.ts
```

The migrations create the schema, enable RLS on every table, define owner/admin policies, create the signup profile trigger, expose quiz questions without `correct_index`, and add quiz and checkout RPCs. The seed file is intentionally empty until the current season's city list has been checked against a source approved for public display.

Configure the Auth site URL and redirect allowlist for local and production URLs. Enable email confirmation and password recovery. Add Google OAuth credentials in the Supabase dashboard. Grant the first admin role through a trusted SQL session after signup; profile owners cannot change their own role.

## Stripe test mode

The Edge Functions read all private values from Supabase secrets. Configure them before deploying:

```sh
npx supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_SHIPPING_RATE_ID=... ALLOWED_SHIPPING_COUNTRIES=SE,DK,NO,FI APP_URL=http://localhost:5173
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

Choose the permitted shipping countries, shipping rate, VAT/tax setup, and company details before enabling checkout. Insert verified products and variants with stock before testing. The checkout function accepts variant IDs and quantities only, reserves stock atomically, and reads all prices from Postgres. The webhook verifies Stripe signatures and uses event IDs plus a unique Checkout Session ID for idempotent order creation. Refund processing, confirmation email delivery, and expired-reservation cleanup still need operational setup.

## Sports data provider

No provider has been selected. Do not enable a sync job yet. Before implementation, confirm Damallsvenskan coverage, exact endpoint availability, rate limits, public-display attribution, and caching terms for the chosen season. Add credentials only as Supabase Edge Function secrets. The matches page currently explains that live data is not connected rather than inventing fixtures or standings.

## Project checks

```sh
npm test
npm run check:i18n
npm run build
```

`npm run build` checks translation-key parity, TypeScript, and the production Vite bundle. The Vitest suite covers currency formatting, quiz scoring, and Swedish/English fallback behavior.

## Before launch

- Confirm current clubs, city names, historic facts, player details, and quiz answers against reliable sources; keep unverified content unpublished.
- Select a sports data provider and review coverage, public display, attribution, and caching terms.
- Seed the verified season, clubs, products, variants, prices, and stock. Keep designs city-based and original; do not use official names, crests, or kit artwork on merchandise.
- Complete legal review of privacy, terms, shipping, returns, cookies, EU withdrawal rights, company details, and VAT configuration.
- Configure Supabase production Auth, OAuth, RLS, Storage policies, secrets, and admin roles.
- Run a complete Stripe test-mode order, expired checkout, stock contention test, and refund test before switching to live mode.
- Add Playwright coverage, production SEO prerendering/sitemap, transactional email, monitoring, and deployment configuration.
