import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "no signature" }, { status: 400 });

  const body = await request.text(); // corps brut, indispensable pour vérifier la signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email?.toLowerCase();
    if (session.payment_status === "paid" && email) {
      const admin = supabaseAdmin();
      // Trouve (ou crée) le compte correspondant à l'e-mail qui a payé.
      let userId: string | undefined;
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        userId = data?.users.find((u) => u.email?.toLowerCase() === email)?.id;
        if (!data || data.users.length < 200) break;
      }
      if (!userId) {
        const { data } = await admin.auth.admin.createUser({ email, email_confirm: true });
        userId = data?.user?.id;
      }
      if (userId) {
        await admin.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          status: "paid",
          updated_at: new Date().toISOString(),
        });
      }
    }
  }
  return NextResponse.json({ received: true });
}
