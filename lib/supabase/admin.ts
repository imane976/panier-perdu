import { createClient } from "@supabase/supabase-js";

// Clé "service role" : uniquement côté serveur, jamais envoyée au navigateur.
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
