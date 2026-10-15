import { NextResponse, type NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  if (code) {
    const supabase = await supabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}/compte`);
  }
  return NextResponse.redirect(`${base}/connexion`);
}
