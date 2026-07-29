"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { RealisationCard } from "@/components/realisations/realisation-card";
import type { Realisation } from "@/lib/realisations";

const ALL = "Tous";

export function RealisationsGrid({ items, sectors }: { items: Realisation[]; sectors: string[] }) {
  const [sector, setSector] = useState<string>(ALL);

  const filters = useMemo(() => [ALL, ...sectors], [sectors]);
  const visible = useMemo(
    () => (sector === ALL ? items : items.filter((r) => r.sector === sector)),
    [items, sector],
  );

  return (
    <>
      <Reveal>
        <div
          className="lg inline-flex flex-wrap gap-1 rounded-[var(--radius-pill)] p-1 mb-12"
          role="tablist"
          aria-label="Filtrer par secteur"
        >
          {filters.map((f) => {
            const active = f === sector;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSector(f)}
                className={[
                  "px-4 py-2 text-sm font-medium rounded-[var(--radius-pill)] transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40",
                  active
                    ? "bg-white text-slate-900 shadow-[var(--shadow-soft)]"
                    : "text-slate-500 hover:bg-white/60 hover:text-slate-900",
                ].join(" ")}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((item) => (
          <Reveal key={item.slug}>
            <RealisationCard item={item} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
