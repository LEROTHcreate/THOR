"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const glass = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
} as React.CSSProperties;

const glassSubtle = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
} as React.CSSProperties;

function SmallBadge({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
      green ? "text-emerald-700 border-emerald-100 bg-emerald-50" : "text-slate-500 border-slate-200 bg-slate-50"
    ].join(" ")}>
      {children}
    </span>
  );
}

export default function ProfilAuditionPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("06 12 34 56 78");
  const [address, setAddress] = useState("14 rue de la Paix, 75002 Paris");
  const [pref, setPref] = useState({ sms: true, email: true, reminders: true });

  const centres = [
    { id: "c1", name: "Clair Audition — Marseille Prado",   address: "210A Rue Paradis, 13006 Marseille",  practitioner: "M. Rami Benali",    default: true  },
    { id: "c2", name: "Clair Audition — Marseille Vieux-Port", address: "3 Quai du Port, 13002 Marseille", practitioner: "Mme. Leila Amara",  default: false },
  ];

  return (
    <div className="w-full space-y-6">

      {/* EN-TÊTE */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">Mon <span className="font-bold">profil</span></h1>
          <p className="mt-1 text-slate-400">Informations patient, préférences et centres</p>
        </div>
        <div className="flex items-center gap-2">
          <SmallBadge>Clair Audition</SmallBadge>
          <SmallBadge>Données sécurisées</SmallBadge>
        </div>
      </div>

      {/* GRILLE 2 colonnes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Identité */}
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="text-sm font-semibold text-slate-800">Identité</div>
            <SmallBadge green>Patient</SmallBadge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nom",              value: "Jean Dupont" },
              { label: "Date de naissance",value: "12 mars 1955" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl p-3" style={glassSubtle}>
                <div className="text-xs text-slate-400">{f.label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{f.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2.5">
            <div className="rounded-xl p-3" style={glassSubtle}>
              <div className="text-xs text-slate-400">Email</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">jean.dupont@email.com</div>
            </div>
            <div className="rounded-xl p-3" style={glassSubtle}>
              <div className="text-xs text-slate-400 mb-1">Téléphone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
            </div>
            <div className="rounded-xl p-3" style={glassSubtle}>
              <div className="text-xs text-slate-400 mb-1">Adresse</div>
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="text-sm font-semibold text-slate-800">Préférences</div>
            <SmallBadge>Notifications</SmallBadge>
          </div>

          <div className="space-y-2.5">
            {[
              { k: "sms",       label: "Recevoir des rappels par SMS",         sub: "Avant chaque rendez-vous" },
              { k: "email",     label: "Recevoir des emails (documents, suivi)", sub: "Récapitulatifs et confirmations" },
              { k: "reminders", label: "Activer les rappels de contrôles",      sub: "Rappel 48h avant votre RDV" },
            ].map((x) => (
              <div key={x.k} className="flex items-center justify-between rounded-xl p-3" style={glassSubtle}>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{x.label}</div>
                  <div className="text-xs text-slate-400">{x.sub}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPref((p) => ({ ...p, [x.k]: !p[x.k as keyof typeof p] }))}
                  className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ background: pref[x.k as keyof typeof pref] ? "#00C98A" : "#CBD5E1" }}
                  role="switch" aria-checked={pref[x.k as keyof typeof pref]}>
                  <span className={["absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                    pref[x.k as keyof typeof pref] ? "translate-x-5" : "translate-x-0.5"
                  ].join(" ")} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl p-3 text-xs text-slate-500" style={glassSubtle}>
            Vos données sont traitées conformément au RGPD. Aucune donnée n'est partagée sans votre accord.
          </div>
        </div>

        {/* Mes centres */}
        <div className="rounded-2xl p-5" style={glass}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="text-sm font-semibold text-slate-800">Mes centres</div>
            <SmallBadge>Accès rapide</SmallBadge>
          </div>

          <div className="space-y-3">
            {centres.map((c) => (
              <div key={c.id} className="rounded-xl p-3" style={glassSubtle}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.address}</div>
                    <div className="text-xs text-slate-400">{c.practitioner}</div>
                  </div>
                  {c.default ? <SmallBadge green>Par défaut</SmallBadge> : <SmallBadge>Centre</SmallBadge>}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                    Contacter
                  </button>
                  <button
                    onClick={() => router.push("/clair-audition/espace-patient/rendez-vous")}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "#00C98A" }}>
                    Prendre RDV
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/clair-audition/espace-patient/centres")}
            className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#00C98A" }}>
            Voir tous les centres
          </button>
        </div>

        {/* Santé auditive résumé */}
        <div className="rounded-2xl p-5" style={glass}>
          <div className="text-sm font-semibold text-slate-800 mb-4">Santé auditive (résumé)</div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Dernier bilan",    value: "18 nov. 2024" },
              { label: "Appareils actifs", value: "2 · OD + OG"  },
            ].map((f) => (
              <div key={f.label} className="rounded-xl p-3" style={glassSubtle}>
                <div className="text-xs text-slate-400">{f.label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{f.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl p-3" style={glassSubtle}>
            <div className="text-xs text-slate-400 mb-2">N° de sécurité sociale</div>
            <div className="text-sm font-semibold text-slate-800">1 55 03 75 XXX XXX</div>
          </div>

          <div className="mt-3 rounded-xl p-3" style={glassSubtle}>
            <div className="text-xs text-slate-400 mb-2">Audioprothésiste référent</div>
            <div className="text-sm font-semibold text-slate-800">M. Rami Benali</div>
            <div className="text-xs text-slate-400">Clair Audition — Marseille Prado</div>
          </div>
        </div>

      </div>
    </div>
  );
}
