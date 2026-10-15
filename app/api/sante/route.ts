import { NextResponse } from "next/server";

// Page de contrôle : indique seulement si les clés sont présentes (jamais leur valeur).
export const dynamic = "force-dynamic";
export function GET() {
  const present = (n: string) => Boolean(process.env[n]);
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: present("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: present("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
    STRIPE_SECRET_KEY: present("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: present("STRIPE_WEBHOOK_SECRET"),
  });
}
