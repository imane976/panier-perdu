import { redirect } from "next/navigation";
import { supabaseServeur } from "@/lib/supabase/server";

async function deconnexion() {
  "use server";
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

export default async function Compte() {
  const supabase = await supabaseServeur();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: abo } = await supabase.from("subscriptions").select("status").maybeSingle();
  const { data: recoveries } = await supabase.from("recoveries").select("amount_cents");
  const total = (recoveries ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const actif = abo && ["active", "trialing", "paid"].includes(abo.status);

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <p className="text-sm text-neutral-600">{user.email}</p>
      <h1 className="mt-1 font-serif text-3xl font-bold">Mon compte</h1>

      <section className="mt-8 rounded border border-trait bg-fond2 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Argent récupéré</p>
        <p className="mt-1 font-serif text-5xl font-bold text-accent">{euros(total)}</p>
        {total === 0 && (
          <p className="mt-3 text-neutral-700">
            Rien pour l’instant. Dès qu’une boutique est connectée, les paniers récupérés s’afficheront ici.
          </p>
        )}
      </section>

      <section className="mt-6 rounded border border-trait p-6">
        <h2 className="font-semibold">Abonnement</h2>
        <p className="mt-1 text-neutral-700">
          {actif ? "Ta place Fondateur est active. Merci !" : "Aucun abonnement trouvé pour cette adresse e-mail."}
        </p>
        {!actif && <a href="/#offre" className="mt-3 inline-block font-semibold text-accent underline">Voir l’offre</a>}
      </section>

      <form action={deconnexion} className="mt-8">
        <button className="text-sm underline">Me déconnecter</button>
      </form>
    </main>
  );
}
