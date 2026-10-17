import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";

// Crée une session Stripe Checkout (paiement unique 29 €) et redirige vers Stripe.
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const base = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: 2900,
          product_data: { name: "Place Fondateur Panier Perdu" },
        },
      },
    ],
    success_url: `${base}/merci.html`,
    cancel_url: `${base}/#offre`,
    customer_creation: "always",
  });
  return NextResponse.redirect(session.url!, 303);
}
