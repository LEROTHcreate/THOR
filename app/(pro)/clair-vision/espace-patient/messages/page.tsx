"use client";

import { useMemo, useState } from "react";
import { roleLabel, type ProRole } from "@/lib/utils";

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

type ThreadType = "Centre" | "Praticien" | "Support";

type Thread = {
  id: string;
  title: string;
  subtitle: string;
  type: ThreadType;
  proRole?: ProRole;
  lastAtLabel: string;
  unread?: boolean;
};

type Msg = { id: string; side: "in" | "out"; text: string; time: string };

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "success" | "warn" | "info";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-100"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default function MessagesPage() {
  const [filter, setFilter] = useState<"Tous" | "Mes centres" | "Praticiens" | "Support">("Tous");
  const [activeId, setActiveId] = useState<string>("t1");
  const [draft, setDraft] = useState("");

  const threads: Thread[] = useMemo(
    () => [
      {
        id: "t1",
        title: "Clair Vision — Paris 8",
        subtitle: "Prise de RDV, documents, questions",
        type: "Centre",
        lastAtLabel: "Aujourd'hui",
        unread: true,
      },
      {
        id: "t2",
        title: "Sophie Martin",
        subtitle: "Suivi lentilles / confort",
        type: "Praticien",
        proRole: "optometriste",
        lastAtLabel: "Hier",
      },
      {
        id: "t3",
        title: "Support Clair Vision",
        subtitle: "Facturation / accès documents",
        type: "Support",
        lastAtLabel: "Il y a 3 jours",
      },
    ],
    []
  );

  const filtered = threads.filter((t) => {
    if (filter === "Tous") return true;
    if (filter === "Mes centres") return t.type === "Centre";
    if (filter === "Praticiens") return t.type === "Praticien";
    return t.type === "Support";
  });

  const active = threads.find((t) => t.id === activeId) || filtered[0];

  const messages: Msg[] = useMemo(() => {
    if (!active) return [];
    if (active.id === "t1") {
      return [
        { id: "m1", side: "in", text: "Bonjour Marie, comment pouvons-nous vous aider ?", time: "09:12" },
        { id: "m2", side: "out", text: "Bonjour, je voudrais un contrôle lentilles le mois prochain.", time: "09:14" },
        { id: "m3", side: "in", text: "Bien sûr. Préférez-vous matin ou après-midi ?", time: "09:15" },
      ];
    }
    if (active.id === "t2") {
      return [
        { id: "m1", side: "in", text: "Bonjour, comment se passe le port des lentilles cette semaine ?", time: "18:02" },
        { id: "m2", side: "out", text: "Plutôt bien, juste un peu sec en fin de journée écran.", time: "18:04" },
        { id: "m3", side: "in", text: "OK. Pensez aux pauses + larmes si besoin. On peut ajuster le temps de port.", time: "18:06" },
      ];
    }
    return [
      { id: "m1", side: "in", text: "Bonjour ! Besoin d'aide sur l'accès à vos documents ?", time: "11:10" },
      { id: "m2", side: "out", text: "Oui, certains documents sont verrouillés.", time: "11:11" },
      { id: "m3", side: "in", text: "C'est lié à un acte praticien. Vous pouvez déverrouiller via Achats (UI).", time: "11:12" },
    ];
  }, [active]);

  const typeBadge = (t: Thread) => {
    if (t.type === "Centre") return <Badge tone="info">Centre</Badge>;
    if (t.type === "Support") return <Badge>Support</Badge>;
    return <Badge tone="success">{roleLabel(t.proRole)}</Badge>;
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-light text-slate-900">
          <span className="font-bold">Messages</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Centre, praticien et support (UI uniquement)</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT */}
        <div className="lg:col-span-4 rounded-2xl p-4" style={glass}>
          <div className="text-sm font-semibold text-slate-900">Conversations</div>
          <div className="mt-1 text-xs text-slate-500">Sélectionnez une conversation</div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(["Tous", "Mes centres", "Praticiens", "Support"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition"
                style={filter === k
                  ? { background: "#2D8CFF", color: "#fff", border: "none" }
                  : glassSubtle}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className="w-full rounded-2xl p-3 text-left transition"
                style={activeId === t.id
                  ? { background: "rgba(45,140,255,0.08)", border: "1px solid rgba(45,140,255,0.20)" }
                  : glassSubtle}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-slate-900">{t.title}</div>
                      {typeBadge(t)}
                      {t.unread ? <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#2D8CFF" }} /> : null}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">{t.subtitle}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex-shrink-0">{t.lastAtLabel}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl p-3 text-xs text-slate-600" style={glassSubtle}>
            Le patient ne voit jamais "Dr." — on utilise <span className="font-semibold">Opticien</span> / <span className="font-semibold">Optométriste</span> / <span className="font-semibold">Praticien</span>.
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden flex flex-col" style={glass}>
          {/* chat header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--glass-sep)" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-slate-900">{active?.title ?? "—"}</div>
                {active ? typeBadge(active) : null}
              </div>
              <div className="mt-1 text-xs text-slate-500">{active?.subtitle ?? "Sélectionnez une conversation"}</div>
            </div>
            <button className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                    style={glassSubtle}>
              Nouvelle demande
            </button>
          </div>

          {/* messages */}
          <div className="h-[520px] overflow-auto p-4" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="flex">
                  {m.side === "out" ? (
                    <div className="ml-auto max-w-[72%] rounded-2xl px-4 py-3 text-sm text-white shadow-sm"
                         style={{ background: "#2D8CFF" }}>
                      <div>{m.text}</div>
                      <div className="mt-1 text-[11px] text-white/80">{m.time}</div>
                    </div>
                  ) : (
                    <div className="mr-auto max-w-[72%] rounded-2xl px-4 py-3 text-sm text-slate-800 shadow-sm"
                         style={glassSubtle}>
                      <div>{m.text}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{m.time}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* input */}
          <div className="p-3" style={{ borderTop: "1px solid var(--glass-sep)" }}>
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ecrire un message…"
                className="h-11 w-full rounded-2xl px-4 text-sm outline-none"
                style={glassSubtle}
              />
              <button
                onClick={() => setDraft("")}
                className="h-11 rounded-2xl px-5 text-sm font-semibold text-white hover:opacity-95 flex-shrink-0"
                style={{ background: "#2D8CFF" }}
              >
                Envoyer
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">UI uniquement : ces messages ne sont pas envoyés (pour l'instant).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
