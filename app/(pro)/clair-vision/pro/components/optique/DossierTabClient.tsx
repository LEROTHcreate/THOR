"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/app/(pro)/clair-vision/pro/components/ui/Button";
import { Card, CardContent } from "@/app/(pro)/clair-vision/pro/components/ui/Card";
import Tabs from "@/app/(pro)/clair-vision/pro/components/ui/Tabs";

type Tab =
  | "Résumé"
  | "Réfraction"
  | "Mesures"
  | "Monture & Verres"
  | "Devis/Commande"
  | "Suivi"
  | "Documents";

export default function DossierTabClient({
  dossierId,
  dossier,
}: {
  dossierId: string;
  dossier: any | null;
}) {
  const [tab, setTab] = useState<Tab>("Résumé");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button href="/clair-vision/pro/optique/dossiers" variant="ghost">
            ←
          </Button>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Dossier optique
            </h1>
            <p className="mt-1 text-slate-500">
              Identifiant : <span className="font-semibold text-slate-700">{dossierId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary">Imprimer</Button>
          <Button variant="primary">Modifier</Button>
        </div>
      </div>

      {/* Empty (no backend) */}
      {!dossier ? (
        <Card>
          <CardContent>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-6">
              <div className="text-sm font-semibold text-slate-900">Aucune donnée chargée</div>
              <div className="mt-1 text-sm text-slate-600">
                Pour l’instant, l’app est en mode UI (sans backend). Une fois la base branchée,
                ce dossier affichera les informations patient, réfraction, monture, verres, devis,
                documents et suivi.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/clair-vision/pro/optique/dossiers" variant="primary">
                  Retour aux dossiers
                </Button>
                <Button href="/clair-vision/pro/optique" variant="secondary">
                  Tableau de bord
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary band (placeholder UI) */}
      <Card>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">CORRECTION OD</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">—</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">CORRECTION OG</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">—</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">TYPE ÉQUIPEMENT</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">—</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">MONTURE / VERRES</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">—</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          "Résumé",
          "Réfraction",
          "Mesures",
          "Monture & Verres",
          "Devis/Commande",
          "Suivi",
          "Documents",
        ]}
      />

      {/* Tab content (placeholders) */}
      {tab === "Résumé" && (
        <Card>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {["Dernière visite", "Prochain RDV", "Satisfaction", "Modalité"].map((x) => (
                <div key={x} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                  <div className="text-xs font-semibold text-slate-500">{x}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">—</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-900">Hypothèses probables</div>
                <div className="mt-1 text-sm text-slate-500">Aucune suggestion (données manquantes).</div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-900">Actions recommandées</div>
                <div className="mt-1 text-sm text-slate-500">Rien à afficher pour le moment.</div>
                <div className="mt-4">
                  <Button variant="secondary" className="w-full">
                    Appliquer les recommandations →
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Monture & Verres" && (
        <Card>
          <CardContent>
            <div className="text-sm font-semibold text-slate-900 mb-1">Monture & Verres</div>
            <div className="mt-1 text-sm text-slate-500 mb-4">
              UI prête — contenu affiché quand le backend sera branché.
            </div>
            {/* Raccourci calculateur lentilles */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2D8CFF] text-white flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3c0 2.5-1.5 4-1.5 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">Adapter ce patient en lentilles</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Lancer le calculateur avec l'ordonnance du dossier pré-remplie — calcul vertex, sélection lentille, compte-rendu.
                </div>
                <Link
                  href={`/clair-vision/pro/calculateur-lentilles?dossier=${dossierId}&od_sph=-2.25&od_cyl=-0.50&od_axe=170&og_sph=-1.75&og_cyl=-0.25&og_axe=10`}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#2D8CFF", boxShadow: "0 2px 8px rgba(45,140,255,.28)" }}
                >
                  Ouvrir le calculateur →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Réfraction" && (
        <Card>
          <CardContent>
            <div className="text-sm font-semibold text-slate-900 mb-4">Réfraction subjective</div>
            {/* Refraction table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Œil</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sph</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cyl</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Axe</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Add</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AV sc</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AV ac</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { eye: "OD", sph: "−2.25", cyl: "−0.50", axe: "170°", add: "—", avsc: "3/10", avac: "10/10", color: "#2D8CFF" },
                    { eye: "OG", sph: "−1.75", cyl: "−0.25", axe: "10°",  add: "—", avsc: "4/10", avac: "10/10", color: "#8B5CF6" },
                  ].map(row => (
                    <tr key={row.eye} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${row.color}18`, color: row.color }}>
                          {row.eye}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-sm font-semibold text-slate-900">{row.sph}</td>
                      <td className="py-3 px-3 text-center font-mono text-sm text-slate-700">{row.cyl}</td>
                      <td className="py-3 px-3 text-center font-mono text-sm text-slate-700">{row.axe}</td>
                      <td className="py-3 px-3 text-center text-sm text-slate-400">{row.add}</td>
                      <td className="py-3 px-3 text-center text-sm text-slate-500">{row.avsc}</td>
                      <td className="py-3 px-3 text-center text-sm font-semibold text-[#00C98A]">{row.avac}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Vertex section */}
            <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(219,234,255,0.35)", border: "1px solid rgba(45,140,255,0.12)" }}>
              <div className="text-xs font-semibold text-slate-700 mb-2">Équivalent lentilles (vertex 12mm)</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[#2D8CFF] font-bold mr-2">OD</span><span className="font-mono text-slate-800">—2.25 D (inchangé)</span></div>
                <div><span className="text-[#8B5CF6] font-bold mr-2">OG</span><span className="font-mono text-slate-800">—1.75 D (inchangé)</span></div>
              </div>
              <div className="text-xs text-slate-500 mt-1">Correction &lt; 4.00 D → pas de correction vertex requise</div>
            </div>
            {/* Notes */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-700 mb-1">Notes cliniques</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 italic">
                Aucune note — à compléter lors de la prochaine consultation.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "Mesures" && (
        <Card>
          <CardContent>
            <div className="text-sm font-semibold text-slate-900 mb-4">Mesures de montage</div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* DP */}
              <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distance pupillaire</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "DP VL", value: "—", sub: "Vision loin" },
                    { label: "DP VP", value: "—", sub: "Vision près" },
                    { label: "DP mono", value: "—", sub: "Monoculaire" },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="text-lg font-light text-[#2D8CFF] my-0.5">{m.value}</div>
                      <div className="text-[10px] text-slate-400">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Hauteur montage */}
              <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hauteur de montage</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Hauteur OD", value: "—" },
                    { label: "Hauteur OG", value: "—" },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="text-lg font-light text-[#8B5CF6] my-0.5">{m.value}</div>
                      <div className="text-[10px] text-slate-400">mm</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pantoscopique */}
              <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Angles</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pantoscopique", value: "—", unit: "°" },
                    { label: "Galbe monture",  value: "—", unit: "°" },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="text-lg font-light text-[#00C98A] my-0.5">{m.value}</div>
                      <div className="text-[10px] text-slate-400">{m.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Vertex */}
              <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distance vertex</div>
                <div className="text-center">
                  <div className="text-lg font-light text-[#F59E0B] my-0.5">12 mm</div>
                  <div className="text-[10px] text-slate-400">Standard — à mesurer en adapta. lentilles</div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 italic">
              Mesures à saisir lors de la prochaine commande de monture.
            </div>
          </CardContent>
        </Card>
      )}

      {tab !== "Résumé" && tab !== "Monture & Verres" && tab !== "Réfraction" && tab !== "Mesures" && (
        <Card>
          <CardContent>
            <div className="text-sm font-semibold text-slate-900">{tab}</div>
            <div className="mt-1 text-sm text-slate-500">
              UI prête — contenu affiché quand le backend sera branché.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
