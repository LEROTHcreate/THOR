"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ChatContext } from "@/app/api/chat/route";

/* ─── Config par contexte ────────────────────────────────────────────────── */
const CTX_CONFIG: Record<ChatContext, {
  label: string;
  accent: string;
  accentLight: string;
  gradient: string;
  disclaimer?: string;
}> = {
  "pro-vision": {
    label: "THOR",
    accent: "#2D8CFF",
    accentLight: "rgba(45,140,255,0.10)",
    gradient: "#2D8CFF",
  },
  "pro-audition": {
    label: "THOR",
    accent: "#00C98A",
    accentLight: "rgba(0,201,138,0.10)",
    gradient: "#00C98A",
  },
  "patient-vision": {
    label: "THOR",
    accent: "#2D8CFF",
    accentLight: "rgba(45,140,255,0.10)",
    gradient: "#2D8CFF",
    disclaimer: "Informations générales — consultez votre opticien pour toute décision.",
  },
  "patient-audition": {
    label: "THOR",
    accent: "#00C98A",
    accentLight: "rgba(0,201,138,0.10)",
    gradient: "#00C98A",
    disclaimer: "Informations générales — consultez votre audioprothésiste pour toute décision.",
  },
};

/* ─── Labels de pages lisibles ───────────────────────────────────────────── */
const PAGE_LABELS: Record<string, string> = {
  // Pro Vision
  "/clair-vision/pro/optique":              "Dashboard optique",
  "/clair-vision/pro/patients":             "Gestion des patients",
  "/clair-vision/pro/agenda":               "Agenda",
  "/clair-vision/pro/devis":                "Devis",
  "/clair-vision/pro/facturation":          "Facturation",
  "/clair-vision/pro/ordonnances":          "Ordonnances",
  "/clair-vision/pro/renouvellements":      "Renouvellements lentilles",
  "/clair-vision/pro/calculateur-lentilles":"Calculateur lentilles",
  "/clair-vision/pro/statistiques":         "Statistiques",
  "/clair-vision/pro/messagerie":           "Messagerie",
  "/clair-vision/pro/sav":                  "SAV & garanties",
  "/clair-vision/pro/gerant/stock":         "Stock",
  "/clair-vision/pro/gerant":              "Tableau de bord gérant",
  "/clair-vision/pro/parametres":           "Paramètres",
  // Pro Audition
  "/clair-audition/pro/bilans":             "Bilans auditifs",
  "/clair-audition/pro/dossiers":           "Dossiers patients",
  "/clair-audition/pro/patients":           "Gestion des patients",
  "/clair-audition/pro/agenda":             "Agenda",
  "/clair-audition/pro/appareillage":       "Calculateur appareillage",
  "/clair-audition/pro/devis":              "Devis",
  "/clair-audition/pro/statistiques":       "Statistiques",
  "/clair-audition/pro/messagerie":         "Messagerie",
  "/clair-audition/pro/sav":                "SAV & garanties",
  "/clair-audition/pro/gerant/stock":       "Stock",
  "/clair-audition/pro/gerant":            "Tableau de bord gérant",
  "/clair-audition/pro/calculateur":        "Calculateur",
  "/clair-audition/pro/parametres":         "Paramètres",
  // Patient Vision
  "/clair-vision/espace-patient":                       "Accueil espace patient",
  "/clair-vision/espace-patient/examens-de-vue":        "Examens de vue",
  "/clair-vision/espace-patient/lentilles":             "Lentilles",
  "/clair-vision/espace-patient/ordonnances":           "Mes ordonnances",
  "/clair-vision/espace-patient/documents":             "Mes documents",
  "/clair-vision/espace-patient/achats":                "Mes achats",
  "/clair-vision/espace-patient/messages":              "Messages",
  "/clair-vision/espace-patient/rendez-vous":           "Rendez-vous",
  "/clair-vision/espace-patient/mon-profil":            "Mon profil",
  "/clair-vision/espace-patient/centres":               "Mes centres",
  // Patient Audition
  "/clair-audition/espace-patient":                     "Accueil espace patient",
  "/clair-audition/espace-patient/bilans-auditifs":     "Bilans auditifs",
  "/clair-audition/espace-patient/appareils":           "Mes appareils",
  "/clair-audition/espace-patient/ordonnances":         "Mes ordonnances",
  "/clair-audition/espace-patient/documents":           "Mes documents",
  "/clair-audition/espace-patient/achats":              "Mes achats",
  "/clair-audition/espace-patient/messages":            "Messages",
  "/clair-audition/espace-patient/rendez-vous":         "Rendez-vous",
  "/clair-audition/espace-patient/mon-profil":          "Mon profil",
  "/clair-audition/espace-patient/centres":             "Mes centres",
};

function getPageLabel(pathname: string): string {
  // Correspondance exacte d'abord, puis préfixe le plus long
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  const match = Object.keys(PAGE_LABELS)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_LABELS[match] : "";
}

/* ─── Suggestions dynamiques par page ───────────────────────────────────── */
const PAGE_SUGGESTIONS: Record<string, string[]> = {
  // Pro Vision
  "/clair-vision/pro/optique": [
    "Comment interpréter les KPIs du dashboard ?",
    "Comment ajouter un nouveau patient ?",
    "Comment voir les RDV d'aujourd'hui ?",
  ],
  "/clair-vision/pro/devis": [
    "Comment calculer le tiers payant AMO/AMC ?",
    "Quels sont les plafonds LPPR classe 1 pour les verres ?",
    "Comment ajouter des lentilles dans un devis ?",
  ],
  "/clair-vision/pro/facturation": [
    "Comment convertir un devis en facture ?",
    "Comment enregistrer un paiement partiel ?",
    "Quelle TVA s'applique sur les montures ?",
  ],
  "/clair-vision/pro/ordonnances": [
    "Comment enregistrer une ordonnance ?",
    "Quelle est la durée de validité d'une ordonnance optique ?",
    "Calcule l'équivalent sphérique pour Sph -2.00 Cyl -0.75",
  ],
  "/clair-vision/pro/renouvellements": [
    "Comment configurer un rappel automatique ?",
    "Quelle est la fréquence standard de renouvellement lentilles ?",
    "Comment filtrer les patients à rappeler ce mois ?",
  ],
  "/clair-vision/pro/calculateur-lentilles": [
    "Comment filtrer par Dk/t ?",
    "Différence entre lentilles sphériques et toriques ?",
    "Quelle lentille pour un BC de 8.6 mm ?",
  ],
  "/clair-vision/pro/statistiques": [
    "Comment lire le taux de renouvellement ?",
    "Qu'est-ce que le NPS ?",
    "Comment comparer les périodes ?",
  ],
  "/clair-vision/pro/agenda": [
    "Comment créer un type de RDV personnalisé ?",
    "Comment bloquer un créneau ?",
    "Comment filtrer par praticien ?",
  ],
  "/clair-vision/pro/sav": [
    "Comment créer un ticket SAV ?",
    "Quelle est la garantie légale sur les montures ?",
    "Comment suivre un appareil chez le fournisseur ?",
  ],
  "/clair-vision/pro/gerant": [
    "Comment lire la marge brute ?",
    "Comment comparer les performances par praticien ?",
    "Qu'est-ce que le bénéfice net estimé ?",
  ],
  // Pro Audition
  "/clair-audition/pro/bilans": [
    "Comment créer un nouveau bilan auditif ?",
    "Calcule la perte moyenne : 500Hz:45 1kHz:55 2kHz:65 4kHz:75",
    "Comment interpréter un audiogramme tonal ?",
  ],
  "/clair-audition/pro/appareillage": [
    "Quel est le RAC classe 2 en 2024 ?",
    "Différence entre primo-appareillage et ré-appareillage ?",
    "Quels critères pour choisir classe 1 ou classe 2 ?",
  ],
  "/clair-audition/pro/devis": [
    "Comment calculer le RAC avec mutuelle ?",
    "Plafond SS par appareil en 2024 ?",
    "Comment ajouter des accessoires dans un devis ?",
  ],
  "/clair-audition/pro/statistiques": [
    "Qu'est-ce que le ratio classe 2 ?",
    "Comment lire le CA appareillage mensuel ?",
    "Différence entre primo et renouvellement dans les stats ?",
  ],
  "/clair-audition/pro/agenda": [
    "Comment planifier un bilan de suivi ?",
    "Quelle durée prévoir pour un premier bilan ?",
    "Comment filtrer par praticien ?",
  ],
  // Patient Vision
  "/clair-vision/espace-patient": [
    "Comment prendre rendez-vous ?",
    "Où trouver mes ordonnances ?",
    "Comment contacter mon opticien ?",
  ],
  "/clair-vision/espace-patient/examens-de-vue": [
    "À quelle fréquence faire un examen de vue ?",
    "Qu'est-ce qu'un examen de réfraction ?",
    "Comment lire mon compte-rendu d'examen ?",
  ],
  "/clair-vision/espace-patient/lentilles": [
    "Comment entretenir mes lentilles mensuelles ?",
    "Puis-je dormir avec mes lentilles ?",
    "C'est quoi le Dk/t d'une lentille ?",
  ],
  "/clair-vision/espace-patient/ordonnances": [
    "C'est quoi la sphère dans mon ordonnance ?",
    "Combien de temps est valable mon ordonnance ?",
    "C'est quoi l'addition (Add) ?",
  ],
  // Patient Audition
  "/clair-audition/espace-patient": [
    "Comment prendre rendez-vous ?",
    "Comment fonctionne le 100% Santé ?",
    "Comment contacter mon audioprothésiste ?",
  ],
  "/clair-audition/espace-patient/bilans-auditifs": [
    "Comment lire mon audiogramme ?",
    "C'est quoi les dB HL ?",
    "Qu'est-ce que l'intelligibilité vocale ?",
  ],
  "/clair-audition/espace-patient/appareils": [
    "Comment nettoyer mes appareils auditifs ?",
    "Comment changer les piles ?",
    "Ma période d'adaptation est normale ?",
  ],
};

// Suggestions de fallback par contexte
const FALLBACK_SUGGESTIONS: Record<ChatContext, string[]> = {
  "pro-vision": [
    "Comment créer un devis tiers payant ?",
    "Calcule l'équivalent sphérique pour Sph -1.50 Cyl -0.75",
    "Quels sont les plafonds LPPR classe 1 ?",
    "Comment naviguer dans THOR ?",
  ],
  "pro-audition": [
    "Calcule la perte moyenne : 500:45 1k:55 2k:65 4k:75 dB",
    "Quel est le RAC classe 2 en 2024 ?",
    "Comment créer un bilan auditif ?",
    "Différence entre RITE et contour BTE ?",
  ],
  "patient-vision": [
    "C'est quoi le cylindre dans mon ordonnance ?",
    "Pourquoi je vois flou de loin ?",
    "Comment prendre soin de mes lentilles ?",
    "Comment prendre rendez-vous ?",
  ],
  "patient-audition": [
    "Comment lire mon audiogramme ?",
    "C'est quoi la classe 1 100% Santé ?",
    "Comment entretenir mes appareils ?",
    "Comment prendre rendez-vous ?",
  ],
};

function getSuggestions(context: ChatContext, pathname: string): string[] {
  // Correspondance exacte
  if (PAGE_SUGGESTIONS[pathname]) return PAGE_SUGGESTIONS[pathname];
  // Préfixe le plus long
  const match = Object.keys(PAGE_SUGGESTIONS)
    .filter(k => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_SUGGESTIONS[match] : FALLBACK_SUGGESTIONS[context];
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const LS_KEY = (ctx: ChatContext) => `thor_chat_${ctx}`;
const MAX_STORED = 40;

/* ─── Composant ─────────────────────────────────────────────────────────── */
export default function ChatWidget({ context }: { context: ChatContext }) {
  const cfg = CTX_CONFIG[context];
  const pathname = usePathname();
  const router = useRouter();
  const pageLabel = getPageLabel(pathname);
  const suggestions = getSuggestions(context, pathname);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Charger l'historique ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(context));
      if (raw) {
        const stored = JSON.parse(raw) as Message[];
        setMessages(stored.map(m => ({ ...m, streaming: false })));
      }
    } catch { /* ignore */ }
  }, [context]);

  /* ── Sauvegarder l'historique ── */
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const toStore = messages
        .filter(m => !m.streaming)
        .slice(-MAX_STORED);
      localStorage.setItem(LS_KEY(context), JSON.stringify(toStore));
    } catch { /* ignore */ }
  }, [messages, context]);

  /* ── Raccourci Cmd/Ctrl+K ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  /* ── Focus input ── */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  /* ── send ── */
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setTyping(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          page: pageLabel || undefined,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      setTyping(false);

      if (!res.ok) {
        const err = await res.text();
        setMessages(prev => [...prev, { role: "assistant", content: `Erreur : ${err}` }]);
        return;
      }

      const assistantMsg: Message = { role: "assistant", content: "", streaming: true };
      setMessages(prev => [...prev, assistantMsg]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { role: "assistant", content: snap, streaming: true } : m
        ));
      }

      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, streaming: false } : m
      ));
    } catch (e: unknown) {
      setTyping(false);
      if ((e as Error)?.name === "AbortError") return;
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Erreur de connexion. Vérifiez votre clé API dans .env.local.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, context, pageLabel]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
  }

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
    setTyping(false);
    try { localStorage.removeItem(LS_KEY(context)); } catch { /* ignore */ }
  }

  /* ── Inline parser : gras + liens markdown ── */
  function parseInline(text: string) {
    const nodes: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) nodes.push(text.slice(last, m.index));
      if (m[1] !== undefined) {
        nodes.push(<strong key={m.index}>{m[1]}</strong>);
      } else {
        const href = m[3];
        const isInternal = href.startsWith("/");
        nodes.push(
          <button
            key={m.index}
            onClick={() => {
              if (isInternal) { router.push(href); setOpen(false); }
              else window.open(href, "_blank", "noopener");
            }}
            className="underline font-semibold hover:opacity-80 transition-opacity"
            style={{ color: cfg.accent }}
          >
            {m[2]}
          </button>
        );
      }
      last = regex.lastIndex;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  }

  /* ── Markdown : lignes + inline ── */
  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.trim() === "") return <div key={i} className="h-2" />;
      if (/^[-•*]\s/.test(line)) {
        return (
          <div key={i} className="flex gap-1.5 my-0.5">
            <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.accent }} />
            <span>{parseInline(line.replace(/^[-•*]\s/, ""))}</span>
          </div>
        );
      }
      return <div key={i}>{parseInline(line)}</div>;
    });
  }

  return (
    <>
      {/* ── Bouton flottant ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[var(--radius-pill)] px-4 py-3 text-white text-sm font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
          style={{ background: cfg.gradient }}
          aria-label="Ouvrir THOR"
          title="THOR (Ctrl+K)"
        >
          <SparkleIcon />
          THOR
        </button>
      )}

      {/* ── Panel ── */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: 380,
            height: 560,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--glass-strong-border)",
            boxShadow: "0 24px 64px rgba(11,18,32,0.18), 0 0 0 1px rgba(226,232,240,0.40)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{ background: cfg.gradient }}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <SparkleIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{cfg.label}</div>
              {pageLabel && (
                <div className="text-[11px] text-white/60 truncate">{pageLabel}</div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {messages.length > 0 && (
                <button onClick={clearChat}
                  className="grid h-7 w-7 place-items-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                  title="Nouvelle conversation">
                  <TrashIcon />
                </button>
              )}
              <button onClick={handleClose}
                className="grid h-7 w-7 place-items-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Fermer">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Disclaimer patient */}
          {cfg.disclaimer && (
            <div className="px-4 py-2 flex-shrink-0"
              style={{ background: cfg.accentLight, borderBottom: `1px solid ${cfg.accent}22` }}>
              <p className="text-[11px] text-slate-600 leading-snug">
                {cfg.disclaimer}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !typing ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 pb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow"
                  style={{ background: cfg.gradient }}>
                  <SparkleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Comment puis-je vous aider ?</p>
                  <p className="text-xs text-slate-400 mt-1">Posez une question ou choisissez ci-dessous</p>
                </div>
                <div className="w-full space-y-2">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full text-left rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-medium transition-all duration-150 hover:scale-[1.01]"
                      style={{
                        background: "var(--glass-strong-bg)",
                        border: `1px solid ${cfg.accent}28`,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={msg.role === "assistant"
                        ? { background: cfg.gradient }
                        : { background: "rgba(100,116,139,0.12)" }}>
                      {msg.role === "assistant"
                        ? <SparkleIcon className="w-3 h-3 text-white" />
                        : <UserIcon className="w-3 h-3 text-slate-500" />}
                    </div>
                    <div className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.6]"
                      style={msg.role === "user"
                        ? { background: cfg.gradient, color: "#fff", borderBottomRightRadius: 6 }
                        : { background: "rgba(241,245,249,0.90)", color: "#1e293b", borderBottomLeftRadius: 6 }}>
                      {msg.role === "assistant"
                        ? <div className="space-y-0.5">{renderContent(msg.content)}</div>
                        : msg.content}
                      {msg.streaming && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse"
                          style={{ background: cfg.accent, verticalAlign: "middle" }} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Indicateur typing (3 points) */}
                {typing && (
                  <div className="flex gap-2.5 flex-row">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: cfg.gradient }}>
                      <SparkleIcon className="w-3 h-3 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                      style={{ background: "rgba(241,245,249,0.90)", borderBottomLeftRadius: 6 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: cfg.accent,
                            opacity: 0.7,
                            animation: `thor-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(226,232,240,0.60)" }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(248,250,252,0.90)",
                border: `1.5px solid ${loading ? cfg.accent : "rgba(226,232,240,0.80)"}`,
                transition: "border-color 0.2s",
              }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Posez votre question… (Entrée pour envoyer)"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none leading-[1.5] max-h-28 overflow-y-auto disabled:opacity-60"
                style={{ fontFamily: "inherit" }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30"
                style={{ background: input.trim() && !loading ? cfg.gradient : "rgba(148,163,184,0.20)" }}
                aria-label="Envoyer">
                <SendIcon className={input.trim() && !loading ? "text-white" : "text-slate-400"} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation dots */}
      <style>{`
        @keyframes thor-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ─── Icônes ─────────────────────────────────────────────────────────────── */
function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2Z" opacity=".9" />
      <path d="M19 15l1.06 3.17L23 19l-2.94.83L19 23l-1.06-3.17L15 19l2.94-.83L19 15Z" opacity=".5" />
      <path d="M5 3l.71 2.12L8 6l-2.29.88L5 9l-.71-2.12L2 6l2.29-.88L5 3Z" opacity=".4" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}
function SendIcon({ className = "w-3.5 h-3.5 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
function UserIcon({ className = "w-3 h-3 text-slate-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  );
}
