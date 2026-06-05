# LLMCenter

Small starter for selling prepaid API credits with Astro, Supabase, and Stripe Checkout.

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `PUBLIC_SUPABASE_FUNCTIONS_URL`.
3. Run the SQL in `supabase/migrations/0001_api_studio.sql` in your Supabase project.
4. Set Edge Function secrets. Use a rotated Stripe secret key, because live secret keys should not stay valid after being pasted into chat:

```bash
supabase secrets set --project-ref wtdbnhkilmsxrfoveezu STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_... SITE_URL=https://WangHaoZhengMing.github.io/LLMCenter
```

5. Deploy functions:

```bash
supabase functions deploy create-checkout-session --project-ref wtdbnhkilmsxrfoveezu
supabase functions deploy create-api-key --project-ref wtdbnhkilmsxrfoveezu
supabase functions deploy stripe-webhook --project-ref wtdbnhkilmsxrfoveezu --no-verify-jwt
```

6. In Stripe Dashboard, add a webhook endpoint:

```text
https://wtdbnhkilmsxrfoveezu.supabase.co/functions/v1/stripe-webhook
```

Listen for:

```text
checkout.session.completed
```

7. Start the site:

```bash
npm run dev
```

For local Stripe testing, temporarily set `SITE_URL=http://localhost:4321`.

## GitHub Pages

This repo is configured for:

```text
https://WangHaoZhengMing.github.io/LLMCenter/
```

In GitHub repo settings, set Pages source to GitHub Actions.

In Supabase Auth settings, add this redirect URL:

```text
https://WangHaoZhengMing.github.io/LLMCenter/dashboard
```

## Pages

- `/` home
- `/create-account` Supabase email/password signup
- `/login` existing user login
- `/charge` prepaid Stripe Checkout
- `/new-api` create an API key
- `/dashboard` balance and active key list
