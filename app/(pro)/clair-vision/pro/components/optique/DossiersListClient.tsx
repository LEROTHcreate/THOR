"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/app/(pro)/clair-vision/pro/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type Tab = "Tous" | "Bilans" | "Renouvellements" | "Devis" | "Suivis";

export default function DossiersListClient({ dossiers }: { dossiers: any[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("Tous");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    // Pas de données => retourne vide, mais structure prête pour plus tard
    return (dossiers ?? []).filter(() => (query ? false : true)).filter(() => (tab ? true : true));
  }, [dossiers, q, tab]);

  const tabs: Tab[] = ["Tous", "Bilans", "Renouvellements", "Devis", "Suivis"];

  return (
    <div className="space-y-5">
      {/* Search + tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:max-w-lg">
          <span className="text-slate-500">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un patient…"
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun dossier optique"
          description="Créez un dossier pour commencer. Vos dossiers apparaîtront ici."
          actionLabel="+ Nouveau dossier"
          actionHref="/clair-vision/pro/optique/dossiers"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* (Plus tard) cards dossiers */}
        </div>
      )}
    </div>
  );
}
