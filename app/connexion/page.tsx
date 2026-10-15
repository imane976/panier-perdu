import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

async function envoyerLien(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const supabase = await supabaseServeur();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${base}/auth/callback` },
  });
  if (error) redirect(`/connexion?erreur=${encodeURIComponent(error.message)}`);
  redirect("/connexion?envoye=1");
}

export default async function Connexion({ searchParams }: { searchParams: Promise<{ envoye?: string; erreur?: string }> }) {
  const { envoye, erreur } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-serif text-3xl font-bold">Connexion</h1>
      {erreur && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-red-800">
          Le mail n’a pas pu partir : {erreur}
        </p>
      )}
      {envoye ? (
        <p className="mt-6 rounded border border-trait bg-fond2 p-4">
          C’est parti ! Ouvre ta boîte mail : un lien de connexion vient de t’être envoyé. Pense à regarder dans les spams.
        </p>
      ) : (
        <form action={envoyerLien} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold" htmlFor="email">Ton adresse e-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="w-full rounded border border-trait bg-white px-4 py-3 text-base" />
          <button className="w-full rounded bg-accent px-4 py-3 font-semibold text-white active:bg-accentfonce">
            Recevoir mon lien de connexion
          </button>
          <p className="text-sm text-neutral-600">Pas de mot de passe : on t’envoie un lien par e-mail.</p>
        </form>
      )}
    </main>
  );
}
