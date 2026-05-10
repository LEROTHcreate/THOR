"use client";

import Link from "next/link";
import { useState } from "react";

/* ─── Données ────────────────────────────────────────────────────────────── */
const APPAREILS = [
  {
    side: "Oreille droite",
    code: "OD",
    color: "#ef4444",
    colorLight: "rgba(239,68,68,0.08)",
    model: "Phonak Audéo Lumity L90-R",
    type: "Contour d'oreille (BTE)",
    serial: "SN: 2024-DR-0472",
    since: "Novembre 2024",
    battery: "Rechargeable Li-Ion",
    batteryPct: 82,
    lastCheck: "18 novembre 2024",
    nextCheck: "18 mai 2025",
    nextCheckDays: 42,
    active: true,
    classe: "Classe 1 — 100% Santé",
    programme: "Automatique / Musique / Téléphone",
  },
  {
    side: "Oreille gauche",
    code: "OG",
    color: "#2D8CFF",
    colorLight: "rgba(45,140,255,0.08)",
    model: "Phonak Audéo Lumity L90-L",
    type: "Contour d'oreille (BTE)",
    serial: "SN: 2024-OG-0473",
    since: "Novembre 2024",
    battery: "Rechargeable Li-Ion",
    batteryPct: 67,
    lastCheck: "18 novembre 2024",
    nextCheck: "18 mai 2025",
    nextCheckDays: 42,
    active: true,
    classe: "Classe 1 — 100% Santé",
    programme: "Automatique / Musique / Téléphone",
  },
];

const CONSEILS = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Batterie",
    text: "Rechargez chaque nuit. 3h de charge = 24h d'autonomie complète.",
    color: "#F59E0B",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Stockage nocturne",
    text: "Rangez vos appareils dans la boîte dessicante chaque nuit pour éviter l'humidité.",
    color: "#06B6D4",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    title: "Programmes",
    text: "En environnement bruyant, activez le programme «Bruit» via l'application myPhonak.",
    color: "#8B5CF6",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Nettoyage",
    text: "Nettoyez avec le kit fourni chaque semaine. N'utilisez jamais d'eau directe.",
    color: "#00C98A",
  },
];

const SAV_TYPES = [
  "Son faible ou absent",
  "Sifflement persistant (Larsen)",
  "Batterie qui se décharge trop vite",
  "Problème de connectivité Bluetooth",
  "Appareil mouillé ou choc physique",
  "Douleur ou inconfort au port",
  "Autre",
];

/* ─── Jauge batterie ─────────────────────────────────────────────────────── */
function BatteryGauge({ pct, color }: { pct: number; color: string }) {
  const battColor = pct > 50 ? "#00C98A" : pct > 20 ? "#F59E0B" : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      {/* Icône batterie */}
      <div className="relative flex items-center gap-0.5">
        <div className="w-8 h-4 rounded-sm border-2 flex items-center px-0.5 overflow-hidden" style={{ borderColor: battColor }}>
          <div className="h-2.5 rounded-[2px] transition-all duration-700" style={{ width: `${pct}%`, background: battColor }} />
        </div>
        <div className="w-1 h-2 rounded-r-sm" style={{ background: battColor }} />
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: battColor }}>{pct}%</div>
        <div className="text-[10px] text-slate-400">Charge restante</div>
      </div>
      <div className="ml-auto">
        <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${battColor}, ${battColor}cc)` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── SAV Modal ──────────────────────────────────────────────────────────── */
function SAVModal({ appareil, onClose, onSent }: {
  appareil: typeof APPAREILS[0];
  onClose: () => void;
  onSent: () => void;
}) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  function submit() {
    if (!type) return;
    const ticket = {
      id: `SAV-${Date.now()}`,
      appareil: appareil.model,
      side: appareil.code,
      type,
      description,
      date: new Date().toLocaleDateString("fr-FR"),
      statut: "En cours",
    };
    try {
      const existing = JSON.parse(localStorage.getItem("thor_patient_audition_sav") ?? "[]");
      localStorage.setItem("thor_patient_audition_sav", JSON.stringify([ticket, ...existing]));
      const proExisting = JSON.parse(localStorage.getItem("thor_pro_audition_sav") ?? "[]");
      localStorage.setItem("thor_pro_audition_sav", JSON.stringify([ticket, ...proExisting]));
    } catch { /* noop */ }
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-base font-semibold text-slate-800">Signaler un problème</div>
            <div className="text-xs text-slate-500 mt-0.5">{appareil.model} · {appareil.side}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Type de problème *</div>
            <div className="grid gap-2">
              {SAV_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition-all"
                  style={type === t
                    ? { borderColor: "#00C98A", background: "rgba(0,201,138,0.06)", color: "#065f46" }
                    : { borderColor: "#e2e8f0", color: "#475569" }
                  }>
                  <span className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                    style={{ borderColor: type === t ? "#00C98A" : "#cbd5e1" }}>
                    {type === t && <span className="w-2 h-2 rounded-full bg-[#00C98A]" />}
                  </span>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">Description (optionnel)</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrivez le problème en détail…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none outline-none focus:border-[#00C98A] focus:ring-2 focus:ring-[rgba(0,201,138,0.15)] transition-all"
            />
          </div>

          <div className="rounded-xl bg-[rgba(0,201,138,0.06)] border border-[rgba(0,201,138,0.2)] px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#00C98A] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <p className="text-xs text-slate-600">Votre audioprothésiste sera notifié et vous contactera sous 24h ouvrées.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button onClick={submit} disabled={!type}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: type ? "#00C98A" : "#94a3b8" }}>
              Envoyer le signalement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AppareilsPage() {
  const [savAppareil, setSavAppareil] = useState<typeof APPAREILS[0] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-6 pb-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl bg-[#0B1220] px-5 py-3.5 shadow-2xl text-white text-sm font-semibold"
          style={{ animation: "slideUp 0.3s ease both" }}>
          <svg className="w-4 h-4 text-[#00C98A] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          {toast}
        </div>
      )}

      {/* SAV Modal */}
      {savAppareil && (
        <SAVModal
          appareil={savAppareil}
          onClose={() => setSavAppareil(null)}
          onSent={() => { setSavAppareil(null); showToast("Signalement envoyé — votre audioprothésiste est notifié."); }}
        />
      )}

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Mes appareils auditifs</h1>
          <p className="text-sm text-slate-500 mt-1">Suivi, état et maintenance de vos appareils</p>
        </div>
        <Link
          href="/clair-audition/espace-patient/rendez-vous"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-100"
          style={{ background: "#00C98A", boxShadow: "0 4px 16px rgba(0,201,138,0.3)" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8 6L4 10l4 4" /><path d="M16 6l4 4-4 4" /><path d="M14 4l-4 16" />
          </svg>
          Planifier un contrôle
        </Link>
      </div>

      {/* ── Cards appareils ───────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">
        {APPAREILS.map((a) => (
          <div key={a.code}
            className="rounded-3xl border bg-white overflow-hidden transition-all"
            style={{ borderColor: a.color + "25", boxShadow: `0 4px 24px ${a.color}10, 0 1px 4px rgba(0,0,0,0.04)` }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4" style={{ background: `linear-gradient(135deg, ${a.colorLight}, transparent)` }}>
              <div className="flex items-center gap-4">
                {/* Icône oreille */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
                  style={{ background: `linear-gradient(135deg, ${a.color}20, ${a.color}10)`, border: `1.5px solid ${a.color}30` }}>
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="1.6" strokeLinecap="round">
                    <path d="M12 2a8 8 0 0 1 8 8c0 5.25-4.5 8-4.5 11H8.5c0-3-4.5-5.75-4.5-11a8 8 0 0 1 8-8z" />
                    <path d="M10 17c0-2 2-3 2-5a2 2 0 1 0-4 0" />
                  </svg>
                  {/* Pulse actif */}
                  {a.active && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-[#00C98A]">
                      <span className="absolute inset-0 rounded-full bg-[#00C98A] animate-ping opacity-50" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: a.color }}>
                      {a.code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{a.side}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">{a.model}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.type}</div>
                </div>
              </div>

              {/* Badge actif */}
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-[rgba(0,201,138,0.1)] text-[#00A574] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C98A]" />
                Actif
              </span>
            </div>

            {/* Batterie */}
            <div className="px-6 pb-4 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">État de charge</div>
              <BatteryGauge pct={a.batteryPct} color={a.color} />
            </div>

            <div className="border-t border-slate-100 mx-4" />

            {/* Infos */}
            <div className="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Numéro de série", value: a.serial },
                { label: "Classe", value: a.classe },
                { label: "En service depuis", value: a.since },
                { label: "Batterie", value: a.battery },
                { label: "Dernier contrôle", value: a.lastCheck },
                { label: "Prochain contrôle", value: a.nextCheck },
              ].map((row) => (
                <div key={row.label}>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{row.label}</div>
                  <div className="text-xs font-semibold text-slate-700">{row.value}</div>
                </div>
              ))}
            </div>

            {/* Alerte contrôle */}
            {a.nextCheckDays <= 60 && (
              <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="text-xs text-amber-700">
                  <span className="font-semibold">Contrôle recommandé</span> dans {a.nextCheckDays} jours · {a.nextCheck}
                </div>
              </div>
            )}

            {/* Programmes */}
            <div className="px-6 pb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Programmes activés</div>
              <div className="flex gap-1.5 flex-wrap">
                {a.programme.split(" / ").map((p) => (
                  <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 bg-slate-50">{p}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 flex gap-2.5">
              <Link
                href="/clair-audition/espace-patient/rendez-vous"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)` }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Contrôle
              </Link>
              <button
                onClick={() => setSavAppareil(a)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border transition-all hover:bg-slate-50"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Problème
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Conseils d'entretien ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-4">Conseils d&apos;entretien</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONSEILS.map((c) => (
            <div key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.color + "15", color: c.color }}>
                {c.icon}
              </div>
              <div className="text-sm font-semibold text-slate-800 mb-1.5">{c.title}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Garantie & SAV ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[rgba(0,201,138,0.1)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00C98A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-slate-800">Garantie & SAV</div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Vos appareils Phonak Audéo Lumity L90 sont couverts par une garantie <strong className="text-slate-700">4 ans pièces et main d&apos;œuvre</strong> à compter de la date de livraison (novembre 2024).
              En cas de panne, votre audioprothésiste prend en charge le retour SAV en 24h.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-[11px] text-slate-400 font-medium">Garantie jusqu'au</div>
            <div className="text-lg font-bold text-slate-800">Novembre 2028</div>
            <div className="text-[11px] text-[#00C98A] font-semibold">● Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
