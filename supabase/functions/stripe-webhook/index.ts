import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

Deno.serve(async (request) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2025-11-17.preview",
  });

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook.";
    return new Response(message, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const amountCents = Number(session.metadata?.amount_cents);

    if (userId && Number.isInteger(amountCents) && amountCents > 0 && session.id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: userId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        amount_cents: amountCents,
        status: "paid",
      });

      if (!paymentError) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("balance_cents")
          .eq("id", userId)
          .single();

        if (!profileError) {
          await supabase
            .from("profiles")
            .update({
              balance_cents: profile.balance_cents + amountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
