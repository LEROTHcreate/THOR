"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadUsers, loadCurrentUserId } from "@/lib/users";
import type { ProUser } from "@/lib/users";
import DraggableWindow from "@/components/ui/DraggableWindow";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  from: string;
  fromName: string;
  fromInitials: string;
  fromColor: string;
  to: string | "all";
  conversationId: string;
  content: string;
  timestamp: string;
  read: boolean;
  attachmentLabel?: string;
}

interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: Message;
  unreadCount: number;
}

interface PatientMsg {
  id: string;
  fromPatient: boolean;
  content: string;
  timestamp: string;
  read: boolean;
}

interface PatientConv {
  id: string;
  patientName: string;
  patientInitials: string;
  patientColor: string;
  messages: PatientMsg[];
  unreadCount: number;
}

/* ── Constants ──────────────────────────────────────────────────────────── */
const LS_KEY = "thor_pro_messages";
const LS_PATIENT_KEY = "thor_patient_messages";
const PRIMARY = "#2D8CFF";

const MSG_TEMPLATES = [
  { label: "Rappel RDV",           text: "Bonjour, nous vous rappelons votre rendez-vous chez Clair Vision. Merci de confirmer votre présence ou de nous contacter pour tout changement." },
  { label: "Équipement prêt",       text: "Bonjour, votre équipement est prêt. Vous pouvez venir le récupérer aux heures d'ouverture. N'hésitez pas si vous avez des questions !" },
  { label: "Devis disponible",     text: "Bonjour, votre devis est disponible et consultable sur votre espace patient. Pensez à le signer pour confirmer votre commande." },
  { label: "Renouvellement",       text: "Bonjour, c'est bientôt le moment de renouveler votre équipement optique. Prenez rendez-vous en ligne ou appelez-nous pour planifier une consultation." },
  { label: "Suivi adaptation",     text: "Comment se passe l'adaptation avec votre nouvel équipement ? N'hésitez pas à nous contacter si vous ressentez une gêne ou souhaitez un ajustement." },
  { label: "Ordonnance expirée",   text: "Bonjour, votre ordonnance arrive à expiration. Pensez à consulter votre médecin pour obtenir un renouvellement avant votre prochain passage." },
  { label: "Réponse personnalisée",text: "" },
];

const glass: CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
};
const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};

/* ── Mock team members ──────────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: "sophie-durand", name: "Sophie Durand",  initials: "SD", color: "#ec4899" },
  { id: "martin-petit",  name: "Martin Petit",   initials: "MP", color: "#8b5cf6" },
];

/* ── Mock partenaires ───────────────────────────────────────────────────── */
const MOCK_PARTENAIRES = [
  { id: "essilor-distrib",    name: "Essilor Distribution",  initials: "ES", color: "#0ea5e9", role: "Fournisseur"       },
  { id: "ophtalmic-lab",      name: "Ophtalmic Lab Paris",   initials: "OL", color: "#7c3aed", role: "Laboratoire"       },
  { id: "clair-vision-lyon",  name: "Clair Vision Lyon",     initials: "CV", color: "#2D8CFF", role: "Magasin partenaire"},
];

/* ── Time helper ────────────────────────────────────────────────────────── */
function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

/* ── Seed data — pro ────────────────────────────────────────────────────── */
function buildSeedMessages(): Message[] {
  return [
    { id: "msg-1", from: "sophie-durand", fromName: "Sophie Durand", fromInitials: "SD", fromColor: "#ec4899", to: "all",           conversationId: "group",                                  content: "Bon planning cette semaine !",                              timestamp: ago(180), read: true  },
    { id: "msg-2", from: "martin-petit",  fromName: "Martin Petit",  fromInitials: "MP", fromColor: "#8b5cf6", to: "all",           conversationId: "group",                                  content: "RDV Mme Leblanc confirmé pour vendredi",                    timestamp: ago(120), read: false },
    { id: "msg-3", from: "sophie-durand", fromName: "Sophie Durand", fromInitials: "SD", fromColor: "#ec4899", to: "all",           conversationId: "group",                                  content: "Merci !",                                                   timestamp: ago(90),  read: false },
    { id: "msg-4", from: "sophie-durand", fromName: "Sophie Durand", fromInitials: "SD", fromColor: "#ec4899", to: "sophie-martin", conversationId: "conv_sophie-durand_sophie-martin",       content: "La commande Essilor est arrivée, 12 verres Varilux",        timestamp: ago(60),  read: false },
    { id: "msg-5", from: "martin-petit",  fromName: "Martin Petit",  fromInitials: "MP", fromColor: "#8b5cf6", to: "sophie-martin", conversationId: "conv_martin-petit_sophie-martin",        content: "Patient Renaud rappelé, il vient à 14h",                    timestamp: ago(30),  read: false },
    { id: "msg-6", from: "essilor-distrib",   fromName: "Essilor Distribution", fromInitials: "ES", fromColor: "#0ea5e9", to: "sophie-martin", conversationId: "conv_essilor-distrib_sophie-martin",   content: "Commande #ESS-2024-1892 expédiée, livraison demain matin.", timestamp: ago(240), read: false },
    { id: "msg-7", from: "ophtalmic-lab",     fromName: "Ophtalmic Lab Paris",  fromInitials: "OL", fromColor: "#7c3aed", to: "sophie-martin", conversationId: "conv_ophtalmic-lab_sophie-martin",     content: "Les verres progressifs Dupont sont prêts à être récupérés.", timestamp: ago(360), read: true  },
  ];
}

/* ── Seed data — patients ───────────────────────────────────────────────── */
function buildSeedPatients(): PatientConv[] {
  return [
    {
      id: "patient_leblanc",
      patientName: "Mme Claire Leblanc",
      patientInitials: "CL",
      patientColor: "#f59e0b",
      unreadCount: 1,
      messages: [
        { id: "pm-1", fromPatient: true,  content: "Bonjour, est-ce que je peux porter mes lentilles de contact pendant le sport ?", timestamp: ago(45),  read: false },
      ],
    },
    {
      id: "patient_renaud",
      patientName: "M. Pierre Renaud",
      patientInitials: "PR",
      patientColor: "#10b981",
      unreadCount: 0,
      messages: [
        { id: "pm-2", fromPatient: true,  content: "Bonjour, je souhaiterais prendre rendez-vous pour un contrôle de vue.",          timestamp: ago(180), read: true },
        { id: "pm-3", fromPatient: false, content: "Bonjour M. Renaud ! Nous avons de la disponibilité vendredi à 14h. Convient-il ?", timestamp: ago(160), read: true },
        { id: "pm-4", fromPatient: true,  content: "Parfait, vendredi 14h c'est bon pour moi !",                                      timestamp: ago(140), read: true },
      ],
    },
    {
      id: "patient_dupont",
      patientName: "Mme Isabelle Dupont",
      patientInitials: "ID",
      patientColor: "#8b5cf6",
      unreadCount: 1,
      messages: [
        { id: "pm-5", fromPatient: true, content: "Bonjour, j'ai du mal à m'habituer à mes nouvelles lunettes progressives, c'est normal ?", timestamp: ago(320), read: false },
      ],
    },
    {
      id: "patient_martin",
      patientName: "M. Jules Martin",
      patientInitials: "JM",
      patientColor: "#ef4444",
      unreadCount: 0,
      messages: [
        { id: "pm-6", fromPatient: true,  content: "Bonjour, mes lentilles sont arrivées ? Je repassais ce soir.",       timestamp: ago(600), read: true },
        { id: "pm-7", fromPatient: false, content: "Bonjour M. Martin ! Oui tout est prêt. Nous sommes ouverts jusqu'à 19h.", timestamp: ago(580), read: true },
      ],
    },
  ];
}

/* ── LS helpers ─────────────────────────────────────────────────────────── */
function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveMessages(msgs: Message[]): void {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(msgs));
}
function loadPatients(): PatientConv[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(LS_PATIENT_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function savePatients(convs: PatientConv[]): void {
  if (typeof window !== "undefined") localStorage.setItem(LS_PATIENT_KEY, JSON.stringify(convs));
}
function loadDossierLabels(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("thor_pro_dossiers");
    if (!raw) return [];
    return (JSON.parse(raw) as Array<{ numero?: string }>)
      .filter(d => d.numero).map(d => d.numero as string).slice(-5).reverse();
  } catch { return []; }
}
function makeConvId(a: string, b: string): string {
  return "conv_" + [a, b].sort().join("_");
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function formatDateSep(iso: string): string {
  const d = new Date(iso), now = new Date(), yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function formatLastTime(iso: string): string {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className="flex-shrink-0 grid place-items-center rounded-full text-white font-semibold"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

/* ── SectionLabel ────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
      {children}
    </div>
  );
}

/* ── SendButton ──────────────────────────────────────────────────────────── */
function SendButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl text-white transition-opacity disabled:opacity-40"
      style={{ background: PRIMARY }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function MessageriePage() {
  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState<"pro" | "patients">("pro");

  /* ── Pro state ── */
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [currentUserId,  setCurrentUserId]  = useState<string>("sophie-martin");
  const [currentUser,    setCurrentUser]    = useState<ProUser | null>(null);
  const [allUsers,       setAllUsers]       = useState<ProUser[]>([]);
  const [activeConvId,   setActiveConvId]   = useState<string>("group");
  const [inputText,      setInputText]      = useState("");
  const [showNewMsg,     setShowNewMsg]     = useState(false);
  const [userSearch,     setUserSearch]     = useState("");
  const [showDossierPicker, setShowDossierPicker] = useState(false);
  const [showTemplates,     setShowTemplates]     = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const [dossierLabels,  setDossierLabels]  = useState<string[]>([]);

  /* ── Patients state ── */
  const [patientConvs,   setPatientConvs]   = useState<PatientConv[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [patientInput,   setPatientInput]   = useState("");

  const threadRef         = useRef<HTMLDivElement>(null);
  const textareaRef       = useRef<HTMLTextAreaElement>(null);
  const patientTextareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Init ── */
  useEffect(() => {
    const uid   = loadCurrentUserId();
    const users = loadUsers();
    setCurrentUserId(uid);
    setAllUsers(users);
    setCurrentUser(users.find(u => u.id === uid) ?? null);

    let msgs = loadMessages();
    if (msgs.length === 0) { msgs = buildSeedMessages(); saveMessages(msgs); }
    setMessages(msgs);

    let patients = loadPatients();
    if (patients.length === 0) { patients = buildSeedPatients(); savePatients(patients); }
    setPatientConvs(patients);
    if (patients.length > 0) setActivePatientId(patients[0].id);

    setDossierLabels(loadDossierLabels());
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, activeConvId, patientConvs, activePatientId]);

  /* ── Mark pro messages as read ── */
  useEffect(() => {
    if (!currentUserId) return;
    const updated = messages.map(m =>
      m.conversationId === activeConvId && m.from !== currentUserId && !m.read && (m.to === currentUserId || m.to === "all")
        ? { ...m, read: true } : m
    );
    if (updated.some((m, i) => m.read !== messages[i].read)) {
      setMessages(updated);
      saveMessages(updated);
    }
  }, [activeConvId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Mark patient messages as read ── */
  useEffect(() => {
    if (!activePatientId) return;
    setPatientConvs(prev => {
      const updated = prev.map(c =>
        c.id !== activePatientId ? c
          : { ...c, messages: c.messages.map(m => ({ ...m, read: true })), unreadCount: 0 }
      );
      savePatients(updated);
      return updated;
    });
  }, [activePatientId]);

  /* ── Keyboard ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setShowDossierPicker(false); setShowNewMsg(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ── Build pro conversations ── */
  function buildConversations(msgs: Message[], uid: string, users: ProUser[]): Conversation[] {
    const map = new Map<string, Conversation>();
    map.set("group", { id: "group", participantIds: ["all"], participantNames: ["Équipe"], unreadCount: 0 });

    const teamMembers = [...MOCK_USERS, ...users.filter(u => u.id !== uid)];
    const seen = new Set<string>();
    for (const u of teamMembers) {
      if (u.id === uid || seen.has(u.id)) continue;
      seen.add(u.id);
      const cid = makeConvId(uid, u.id);
      if (!map.has(cid)) map.set(cid, { id: cid, participantIds: [uid, u.id], participantNames: [u.name], unreadCount: 0 });
    }
    for (const p of MOCK_PARTENAIRES) {
      const cid = makeConvId(uid, p.id);
      if (!map.has(cid)) map.set(cid, { id: cid, participantIds: [uid, p.id], participantNames: [p.name], unreadCount: 0 });
    }
    for (const msg of msgs) {
      const conv = map.get(msg.conversationId);
      if (!conv) continue;
      if (!conv.lastMessage || msg.timestamp > conv.lastMessage.timestamp) conv.lastMessage = msg;
      if (!msg.read && msg.from !== uid && (msg.to === uid || msg.to === "all")) conv.unreadCount += 1;
    }
    return Array.from(map.values());
  }

  const conversations  = buildConversations(messages, currentUserId, allUsers);
  const teamConvs      = conversations.filter(c => {
    const oid = c.participantIds.find(id => id !== currentUserId);
    return c.id === "group" || MOCK_PARTENAIRES.every(p => p.id !== oid);
  });
  const partenaireConvs = conversations.filter(c => {
    const oid = c.participantIds.find(id => id !== currentUserId);
    return MOCK_PARTENAIRES.some(p => p.id === oid);
  });

  const totalProUnread     = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const totalPatientUnread = patientConvs.reduce((s, c) => s + c.unreadCount, 0);

  const activeConv     = conversations.find(c => c.id === activeConvId);
  const activeMessages = messages
    .filter(m => m.conversationId === activeConvId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const activePatientConv = patientConvs.find(c => c.id === activePatientId);

  /* ── Send (pro) ── */
  function sendMessage() {
    if (!inputText.trim() && !pendingAttachment) return;
    if (!currentUser) return;
    const conv  = conversations.find(c => c.id === activeConvId);
    const toId  = activeConvId === "group" ? "all" : (conv?.participantIds.find(id => id !== currentUserId) ?? "all");
    const newMsg: Message = {
      id: "msg-" + Date.now(),
      from: currentUserId,
      fromName: currentUser.name,
      fromInitials: currentUser.initials,
      fromColor: currentUser.color,
      to: toId,
      conversationId: activeConvId,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      attachmentLabel: pendingAttachment ?? undefined,
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    saveMessages(updated);
    setInputText("");
    setPendingAttachment(null);
  }

  /* ── Send (patient) ── */
  function sendPatientMessage() {
    if (!patientInput.trim() || !activePatientId) return;
    setPatientConvs(prev => {
      const updated = prev.map(c => {
        if (c.id !== activePatientId) return c;
        const msg: PatientMsg = { id: "pm-" + Date.now(), fromPatient: false, content: patientInput.trim(), timestamp: new Date().toISOString(), read: true };
        return { ...c, messages: [...c.messages, msg] };
      });
      savePatients(updated);
      return updated;
    });
    setPatientInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }
  function handlePatientKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPatientMessage(); }
  }

  function startConversation(user: ProUser | typeof MOCK_USERS[0]) {
    setActiveConvId(makeConvId(currentUserId, user.id));
    setShowNewMsg(false);
    setUserSearch("");
  }

  const filteredUsers = [
    ...MOCK_USERS,
    ...allUsers.filter(u => u.id !== currentUserId && !MOCK_USERS.find(m => m.id === u.id)),
  ].filter(u => u.id !== currentUserId && u.name.toLowerCase().includes(userSearch.toLowerCase()));

  /* ── Conv header info ── */
  function getConvHeader() {
    if (activeConvId === "group") return { name: "Équipe", initials: "EQ", color: "#6366f1", sub: "Canal général" };
    const oid        = activeConv?.participantIds.find(id => id !== currentUserId);
    const mockUser   = MOCK_USERS.find(u => u.id === oid);
    if (mockUser) return { name: mockUser.name, initials: mockUser.initials, color: mockUser.color, sub: "Collaborateur" };
    const partenaire = MOCK_PARTENAIRES.find(p => p.id === oid);
    if (partenaire) return { name: partenaire.name, initials: partenaire.initials, color: partenaire.color, sub: partenaire.role };
    const proUser    = allUsers.find(u => u.id === oid);
    if (proUser) return { name: proUser.name, initials: proUser.initials, color: proUser.color, sub: "Collaborateur" };
    return { name: "Inconnu", initials: "?", color: "#94a3b8", sub: "" };
  }

  const convHeader = getConvHeader();

  /* ── Conv list item (pro) ── */
  function ConvItem({ conv }: { conv: Conversation }) {
    const isGroup    = conv.id === "group";
    const oid        = conv.participantIds.find(id => id !== currentUserId);
    const mockUser   = !isGroup ? MOCK_USERS.find(u => u.id === oid) : null;
    const partenaire = !isGroup ? MOCK_PARTENAIRES.find(p => p.id === oid) : null;
    const proUser    = !isGroup ? allUsers.find(u => u.id === oid) : null;
    const avatar     = isGroup ? { name: "Équipe", initials: "EQ", color: "#6366f1" }
      : mockUser   ? { name: mockUser.name,   initials: mockUser.initials,   color: mockUser.color   }
      : partenaire ? { name: partenaire.name, initials: partenaire.initials, color: partenaire.color }
      : proUser    ? { name: proUser.name,    initials: proUser.initials,    color: proUser.color    }
      : { name: "Inconnu", initials: "?", color: "#94a3b8" };

    const isActive  = conv.id === activeConvId;
    const preview   = conv.lastMessage?.content ?? "";
    const truncated = preview.length > 38 ? preview.slice(0, 38) + "…" : preview;

    return (
      <button
        onClick={() => setActiveConvId(conv.id)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
        style={isActive
          ? { background: "rgba(45,140,255,0.10)", border: "1px solid rgba(45,140,255,0.20)" }
          : { border: "1px solid transparent" }}
      >
        <div className="relative flex-shrink-0">
          <Avatar initials={avatar.initials} color={avatar.color} size={36} />
          {isGroup && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium text-slate-800 truncate">{avatar.name}</span>
            {conv.lastMessage && <span className="text-[10px] text-slate-400 flex-shrink-0">{formatLastTime(conv.lastMessage.timestamp)}</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-xs text-slate-500 truncate flex-1">{truncated || "Aucun message"}</p>
            {conv.unreadCount > 0 && (
              <span className="text-[10px] font-bold text-white rounded-full w-4 h-4 grid place-items-center flex-shrink-0" style={{ background: PRIMARY }}>
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  /* ── Message bubble ── */
  function Bubble({ content, isOwn, timestamp, fromName, fromInitials, fromColor, attachmentLabel }: {
    content: string; isOwn: boolean; timestamp: string; fromName?: string;
    fromInitials?: string; fromColor?: string; attachmentLabel?: string;
  }) {
    return (
      <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} mb-2`}>
        {!isOwn && fromInitials && fromColor && <Avatar initials={fromInitials} color={fromColor} size={28} />}
        <div className={`flex flex-col max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && fromName && <span className="text-xs text-slate-500 mb-1 ml-1">{fromName}</span>}
          <div
            className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
            style={isOwn
              ? { background: PRIMARY, color: "white", borderBottomRightRadius: 4 }
              : { background: "#F1F5F9", color: "#0F172A", borderBottomLeftRadius: 4 }}
          >
            {content}
          </div>
          {attachmentLabel && (
            <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(45,140,255,0.10)", color: PRIMARY, border: "1px solid rgba(45,140,255,0.20)" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
              </svg>
              {attachmentLabel}
            </div>
          )}
          <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(timestamp)}</span>
        </div>
      </div>
    );
  }

  /* ── Thread with date separators ── */
  function Thread<T extends { id: string; timestamp: string }>({
    items, renderItem,
  }: { items: T[]; renderItem: (item: T) => React.ReactNode }) {
    return (
      <>
        {items.map((item, i) => {
          const prev         = items[i - 1];
          const showDateSep  = !prev || !isSameDay(item.timestamp, prev.timestamp);
          return (
            <div key={item.id}>
              {showDateSep && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200/60" />
                  <span className="text-xs text-slate-400 px-2">{formatDateSep(item.timestamp)}</span>
                  <div className="flex-1 h-px bg-slate-200/60" />
                </div>
              )}
              {renderItem(item)}
            </div>
          );
        })}
      </>
    );
  }

  /* ── Tab button ── */
  function TabBtn({ id, label, badge }: { id: "pro" | "patients"; label: string; badge: number }) {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={active ? { background: PRIMARY, color: "white" } : { color: "#64748b" }}
      >
        {label}
        {badge > 0 && (
          <span
            className="text-[10px] font-bold rounded-full px-1 min-w-[16px] text-center"
            style={active ? { background: "rgba(255,255,255,0.30)", color: "white" } : { background: PRIMARY, color: "white" }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }

  /* ────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full rounded-2xl overflow-hidden" style={glass}>

      {/* ── Left panel ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--glass-sep)" }}>

        {/* Tab switcher */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="flex rounded-xl p-0.5 gap-0.5" style={glassSubtle}>
            <TabBtn id="pro"      label="Équipe & Partenaires" badge={totalProUnread}     />
            <TabBtn id="patients" label="Patients"             badge={totalPatientUnread} />
          </div>
        </div>

        {/* ── Pro tab ── */}
        {activeTab === "pro" && (
          <>
            <div className="px-3 pb-1 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowNewMsg(true)}
                className="text-xs font-medium px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                style={{ background: PRIMARY }}
              >
                + Nouveau
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
              <SectionLabel>Équipe</SectionLabel>
              {teamConvs.map(c => <ConvItem key={c.id} conv={c} />)}
              {partenaireConvs.length > 0 && (
                <>
                  <SectionLabel>Partenaires</SectionLabel>
                  {partenaireConvs.map(c => <ConvItem key={c.id} conv={c} />)}
                </>
              )}
            </div>
          </>
        )}

        {/* ── Patients tab ── */}
        {activeTab === "patients" && (
          <div className="flex-1 overflow-y-auto px-2 pt-1 pb-2 space-y-0.5">
            <SectionLabel>Messages reçus</SectionLabel>
            {[...patientConvs]
              .sort((a, b) => {
                const aLast = a.messages.at(-1)?.timestamp ?? "";
                const bLast = b.messages.at(-1)?.timestamp ?? "";
                return bLast.localeCompare(aLast);
              })
              .map(pc => {
                const lastMsg   = pc.messages.at(-1);
                const isActive  = pc.id === activePatientId;
                const preview   = lastMsg?.content ?? "";
                const truncated = preview.length > 38 ? preview.slice(0, 38) + "…" : preview;
                return (
                  <button
                    key={pc.id}
                    onClick={() => setActivePatientId(pc.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={isActive
                      ? { background: "rgba(45,140,255,0.10)", border: "1px solid rgba(45,140,255,0.20)" }
                      : { border: "1px solid transparent" }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar initials={pc.patientInitials} color={pc.patientColor} size={36} />
                      {pc.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: PRIMARY }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${pc.unreadCount > 0 ? "font-semibold text-slate-800" : "font-medium text-slate-700"}`}>
                          {pc.patientName}
                        </span>
                        {lastMsg && <span className="text-[10px] text-slate-400 flex-shrink-0">{formatLastTime(lastMsg.timestamp)}</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className={`text-xs truncate flex-1 ${pc.unreadCount > 0 ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                          {!lastMsg?.fromPatient ? "Vous : " : ""}{truncated || "Aucun message"}
                        </p>
                        {pc.unreadCount > 0 && (
                          <span className="text-[10px] font-bold text-white rounded-full w-4 h-4 grid place-items-center flex-shrink-0" style={{ background: PRIMARY }}>
                            {pc.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ══ PRO thread ══ */}
        {activeTab === "pro" && (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: "var(--glass-sep)", ...glassSubtle }}>
              <Avatar initials={convHeader.initials} color={convHeader.color} size={36} />
              <div>
                <div className="text-sm font-semibold text-slate-800">{convHeader.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-500">{convHeader.sub ?? "En ligne"}</span>
                </div>
              </div>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {activeMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>Démarrez la conversation</p>
                </div>
              )}
              <Thread
                items={activeMessages}
                renderItem={(msg) => (
                  <Bubble
                    content={msg.content}
                    isOwn={msg.from === currentUserId}
                    timestamp={msg.timestamp}
                    fromName={msg.fromName}
                    fromInitials={msg.fromInitials}
                    fromColor={msg.fromColor}
                    attachmentLabel={msg.attachmentLabel}
                  />
                )}
              />
            </div>

            <div className="pl-4 pr-24 pb-4 pt-3 flex-shrink-0" style={{ borderTop: "1px solid var(--glass-sep)" }}>
              {pendingAttachment && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "rgba(45,140,255,0.10)", color: PRIMARY, border: "1px solid rgba(45,140,255,0.20)" }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" />
                    </svg>
                    {pendingAttachment}
                  </span>
                  <button onClick={() => setPendingAttachment(null)} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                {/* Templates button */}
                <div className="relative">
                  <button
                    onClick={() => { setShowTemplates(v => !v); setShowDossierPicker(false); }}
                    className="flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    style={glassSubtle}
                    title="Modèles de messages"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>
                    </svg>
                  </button>
                  {showTemplates && (
                    <div className="absolute bottom-11 left-0 z-20 rounded-xl shadow-xl min-w-[240px] overflow-hidden" style={glass}>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b" style={{ borderColor: "var(--glass-sep)" }}>
                        Modèles de messages
                      </div>
                      {MSG_TEMPLATES.map(tpl => (
                        <button key={tpl.label} onClick={() => {
                          setInputText(tpl.text);
                          setShowTemplates(false);
                          setTimeout(() => textareaRef.current?.focus(), 50);
                        }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Dossier picker button */}
                <div className="relative">
                  <button
                    onClick={() => { setShowDossierPicker(v => !v); setShowTemplates(false); }}
                    className="flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    style={glassSubtle}
                    title="Joindre un dossier"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  {showDossierPicker && (
                    <div className="absolute bottom-11 left-0 z-20 rounded-xl shadow-xl min-w-[180px] overflow-hidden" style={glass}>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b" style={{ borderColor: "var(--glass-sep)" }}>
                        Dossiers récents
                      </div>
                      {dossierLabels.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">Aucun dossier</div>
                      ) : (
                        dossierLabels.map(label => (
                          <button key={label} onClick={() => { setPendingAttachment(label); setShowDossierPicker(false); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            {label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Votre message… (Entrée pour envoyer)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ ...glassSubtle, minHeight: 40, maxHeight: 120 }}
                  onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                />
                <SendButton onClick={sendMessage} disabled={!inputText.trim() && !pendingAttachment} />
              </div>
            </div>
          </>
        )}

        {/* ══ PATIENTS thread ══ */}
        {activeTab === "patients" && (
          activePatientConv ? (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: "var(--glass-sep)", ...glassSubtle }}>
                <Avatar initials={activePatientConv.patientInitials} color={activePatientConv.patientColor} size={36} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{activePatientConv.patientName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Patient</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors hover:bg-blue-50"
                    style={{ color: PRIMARY, border: `1px solid rgba(45,140,255,0.25)` }}
                  >
                    Voir le dossier
                  </button>
                  <button
                    className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors hover:bg-blue-50"
                    style={{ color: PRIMARY, border: `1px solid rgba(45,140,255,0.25)` }}
                  >
                    Prendre RDV
                  </button>
                </div>
              </div>

              <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                <Thread
                  items={activePatientConv.messages}
                  renderItem={(msg) => (
                    <Bubble
                      content={msg.content}
                      isOwn={!msg.fromPatient}
                      timestamp={msg.timestamp}
                      fromName={activePatientConv.patientName}
                      fromInitials={activePatientConv.patientInitials}
                      fromColor={activePatientConv.patientColor}
                    />
                  )}
                />
              </div>

              <div className="pl-4 pr-24 pb-4 pt-3 flex-shrink-0" style={{ borderTop: "1px solid var(--glass-sep)" }}>
                <div className="flex items-end gap-2">
                  {/* Templates button — patients */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates(v => !v)}
                      className="flex-shrink-0 grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      style={glassSubtle}
                      title="Modèles de messages"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>
                      </svg>
                    </button>
                    {showTemplates && (
                      <div className="absolute bottom-11 left-0 z-20 rounded-xl shadow-xl min-w-[240px] overflow-hidden" style={glass}>
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b" style={{ borderColor: "var(--glass-sep)" }}>
                          Modèles de messages
                        </div>
                        {MSG_TEMPLATES.map(tpl => (
                          <button key={tpl.label} onClick={() => {
                            setPatientInput(tpl.text);
                            setShowTemplates(false);
                            setTimeout(() => patientTextareaRef.current?.focus(), 50);
                          }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    ref={patientTextareaRef}
                    value={patientInput}
                    onChange={e => setPatientInput(e.target.value)}
                    onKeyDown={handlePatientKeyDown}
                    placeholder="Répondre au patient… (Entrée pour envoyer)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
                    style={{ ...glassSubtle, minHeight: 40, maxHeight: 120 }}
                    onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                  />
                  <SendButton onClick={sendPatientMessage} disabled={!patientInput.trim()} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <svg className="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Sélectionnez une conversation</p>
            </div>
          )
        )}
      </div>

      {/* ── New message modal ── */}
      {showNewMsg && (
        <DraggableWindow
          title="Nouveau message"
          onClose={() => { setShowNewMsg(false); setUserSearch(""); }}
          defaultWidth={380}
          defaultHeight={420}
        >
          <div style={{ background: "var(--glass-card-bg)", padding: 24 }}>
            <div className="mb-3">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher un collaborateur ou partenaire…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
                style={glassSubtle}
              />
            </div>
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {filteredUsers.map(u => (
                <button key={u.id} onClick={() => startConversation(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
                  <Avatar initials={u.initials} color={u.color} size={34} />
                  <span className="text-sm font-medium text-slate-700">{u.name}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && <p className="text-sm text-slate-400 px-3 py-2">Aucun résultat</p>}
            </div>
          </div>
        </DraggableWindow>
      )}
    </div>
  );
}
