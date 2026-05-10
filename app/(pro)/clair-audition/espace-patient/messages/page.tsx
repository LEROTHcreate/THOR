"use client";

import { useState } from "react";

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

const conversations = [
  {
    id: 1,
    from: "Clair Audition – Marseille Prado",
    type: "centre",
    preview: "Votre prochain rendez-vous est confirmé pour le 15 janvier à 10h30.",
    time: "Hier",
    unread: 1,
  },
  {
    id: 2,
    from: "M. Rami Benali",
    role: "Audioprothésiste",
    type: "praticien",
    preview: "Bonjour Jean, n'hésitez pas si vous avez des questions sur le réglage.",
    time: "Il y a 3j",
    unread: 0,
  },
  {
    id: 3,
    from: "Support THOR",
    type: "support",
    preview: "Votre demande de remboursement est en cours de traitement.",
    time: "Il y a 1 sem.",
    unread: 0,
  },
];

const messages: Record<number, { author: string; content: string; time: string; mine: boolean }[]> = {
  1: [
    { author: "Centre", content: "Bonjour Jean, nous vous confirmons votre rendez-vous du 15 janvier 2025 à 10h30 avec M. Rami Benali.", time: "Hier, 14:22", mine: false },
    { author: "Centre", content: "Votre prochain rendez-vous est confirmé pour le 15 janvier à 10h30.", time: "Hier, 14:23", mine: false },
    { author: "Moi", content: "Merci pour la confirmation !", time: "Hier, 15:01", mine: true },
  ],
  2: [
    { author: "M. Benali", content: "Bonjour Jean, comment se passe l'adaptation avec vos nouveaux appareils ?", time: "Il y a 3j, 9:10", mine: false },
    { author: "Moi", content: "Très bien merci ! Quelques petits réglages à faire sur le programme 2.", time: "Il y a 3j, 10:30", mine: true },
    { author: "M. Benali", content: "Bonjour Jean, n'hésitez pas si vous avez des questions sur le réglage.", time: "Il y a 3j, 11:00", mine: false },
  ],
  3: [
    { author: "Support", content: "Bonjour, nous avons bien reçu votre demande de remboursement. Elle est en cours de traitement.", time: "Il y a 1 sem.", mine: false },
    { author: "Support", content: "Délai estimé : 5 à 10 jours ouvrés.", time: "Il y a 1 sem.", mine: false },
  ],
};

const filters = ["Tous", "Centres", "Praticiens", "Support"];
const typeLabel: Record<string, string> = { centre: "Centres", praticien: "Praticiens", support: "Support" };

export default function MessagesAuditionPage() {
  const [active, setActive]   = useState<number | null>(null);
  const [filter, setFilter]   = useState("Tous");
  const [draft,  setDraft]    = useState("");

  const filtered = conversations.filter(c =>
    filter === "Tous" || typeLabel[c.type] === filter
  );

  const activeConv = conversations.find(c => c.id === active);
  const activeMessages = active ? messages[active] ?? [] : [];

  return (
    <div className="w-full">
      <div className="mb-5">
        <h1 className="text-3xl font-light text-slate-900">
          <span className="font-bold">Messages</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Echangez avec votre centre et votre praticien</p>
      </div>

      <div className="flex gap-4 h-[600px]">
        {/* Liste */}
        <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden" style={glass}>
          <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.55)" }}>
            <div className="flex gap-1.5 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  style={filter === f
                    ? { background: "#00C98A", color: "#fff", border: "none" }
                    : { ...glassSubtle, color: "#64748b" }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className="w-full text-left px-4 py-3.5 transition-colors"
                style={active === c.id
                  ? { background: "rgba(0,201,138,0.08)", borderBottom: "1px solid rgba(255,255,255,0.55)" }
                  : { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.55)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">{c.from}</span>
                      {c.unread > 0 && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0"
                              style={{ background: "#00C98A" }}>
                          {c.unread}
                        </span>
                      )}
                    </div>
                    {"role" in c && <div className="text-xs text-slate-500">{c.role}</div>}
                    <div className="mt-0.5 text-xs text-slate-500 truncate">{c.preview}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">{c.time}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={glass}>
          {active ? (
            <>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.55)" }}>
                <div className="text-sm font-semibold text-slate-800">{activeConv?.from}</div>
                {"role" in (activeConv ?? {}) && <div className="text-xs text-slate-500">{(activeConv as typeof conversations[0] & {role?:string}).role}</div>}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    {m.mine ? (
                      <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm text-white"
                           style={{ background: "#00C98A" }}>
                        <p>{m.content}</p>
                        <p className="mt-1 text-[10px] text-white/60">{m.time}</p>
                      </div>
                    ) : (
                      <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm text-slate-800"
                           style={glassSubtle}>
                        <p>{m.content}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{m.time}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.55)" }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ecrire un message…"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={glassSubtle}
                />
                <button
                  onClick={() => setDraft("")}
                  className="rounded-xl text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors"
                  style={{ background: "#00C98A" }}
                >
                  Envoyer
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <svg className="w-12 h-12 text-slate-300 mb-3" viewBox="0 0 24 24" fill="none">
                <path d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5H10l-4.5 3v-3H5A2.5 2.5 0 0 1 2.5 15V8A2.5 2.5 0 0 1 5 5.5Z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="text-sm font-medium text-slate-800">Sélectionnez une conversation</p>
              <p className="mt-1 text-xs text-slate-500">Choisissez un fil dans la liste pour lire vos messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
