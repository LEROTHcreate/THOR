"use client";

import { useState, useEffect, useMemo } from "react";

/* ── Accent ──────────────────────────────────────────────────────────────── */
const A = "#00C98A";

/* ── LS helpers ──────────────────────────────────────────────────────────── */
function safeLoad<T>(key: string, fb: T[] = []): T[] {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
  catch { return fb; }
}
function safeSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ── Date helpers ────────────────────────────────────────────────────────── */
function daysSince(iso: string) { return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); }
function fmtDate(iso: string)   { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function addDays(iso: string, n: number) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }

/* ── Interfaces ──────────────────────────────────────────────────────────── */
interface Dossier { id:string; patientNom?:string; patientPrenom?:string; status?:string; dateLivraison?:string; marque?:string; modele?:string; }
interface Patient { id:string; nom?:string; prenom?:string; telephone?:string; email?:string; createdAt?:string; }
interface Rdv     { id:string; date?:string; patientNom?:string; patientPrenom?:string; }

type Canal = "sms" | "email" | "appel" | "manuel";

interface RappelRecord {
  patientKey: string;
  contactedAt: string;
  note?: string;
  canal?: Canal;
  message?: string;
}

type RappelRaison = "renouvellement_eligible" | "renouvellement_proche" | "inactivite";
interface RappelItem {
  key: string;
  nom: string; prenom: string;
  telephone?: string; email?: string;
  raison: RappelRaison;
  detail: string;
  urgence: "haute" | "normale";
  days: number;
}

/* ── Thresholds audio ────────────────────────────────────────────────────── */
const RENEWAL      = 1460; // 4 ans SS audioprothèse
const RENEWAL_SOON = 1277; // 6 mois avant
const INACTIVE     = 180;  // 6 mois sans visite → rappel

/* ── SMS / Email templates ───────────────────────────────────────────────── */
function smsTemplate(item: RappelItem, centre: string): string {
  if (item.raison === "renouvellement_eligible")
    return `Bonjour ${item.prenom}, votre appareillage auditif est maintenant éligible au renouvellement pris en charge par la Sécurité Sociale. Contactez ${centre} pour prendre rendez-vous. À bientôt !`;
  if (item.raison === "renouvellement_proche")
    return `Bonjour ${item.prenom}, votre appareillage auditif sera bientôt éligible au renouvellement SS. Anticipez dès maintenant en prenant rendez-vous chez ${centre}.`;
  return `Bonjour ${item.prenom}, cela fait un moment que nous n'avons pas eu de vos nouvelles. N'hésitez pas à nous contacter chez ${centre} pour un contrôle ou une mise au point. À bientôt !`;
}

function emailSubject(item: RappelItem): string {
  if (item.raison === "renouvellement_eligible") return "Votre appareillage auditif est éligible au renouvellement";
  if (item.raison === "renouvellement_proche")   return "Anticipez le renouvellement de votre appareillage auditif";
  return "Contrôle de votre appareillage — Clair Audition";
}

function emailTemplate(item: RappelItem, centre: string): string {
  if (item.raison === "renouvellement_eligible")
    return `Bonjour ${item.prenom} ${item.nom},\n\nNous vous contactons car votre appareillage auditif est désormais éligible au renouvellement pris en charge par la Sécurité Sociale (tous les 4 ans).\n\nNous vous invitons à prendre rendez-vous avec notre équipe pour étudier ensemble les nouvelles solutions disponibles adaptées à votre situation.\n\nCordialement,\nL'équipe ${centre}`;
  if (item.raison === "renouvellement_proche")
    return `Bonjour ${item.prenom} ${item.nom},\n\nVotre appareillage auditif sera bientôt éligible au renouvellement pris en charge par la Sécurité Sociale.\n\nAnticipez dès maintenant en prenant rendez-vous afin de bénéficier des dernières innovations en matière d'appareillage auditif.\n\nCordialement,\nL'équipe ${centre}`;
  return `Bonjour ${item.prenom} ${item.nom},\n\nNous espérons que vous allez bien. Nous n'avons pas eu de vos nouvelles depuis quelque temps et souhaitons nous assurer que votre appareillage fonctionne correctement.\n\nN'hésitez pas à nous contacter pour un contrôle ou une simple mise au point.\n\nCordialement,\nL'équipe ${centre}`;
}

/* ── Demo data ───────────────────────────────────────────────────────────── */
const DEMO_D: Dossier[] = [
  { id:"d1", patientNom:"Bernard",  patientPrenom:"Alain",   status:"Livré", dateLivraison:"2021-01-15", marque:"Phonak",  modele:"Audéo M90" },
  { id:"d2", patientNom:"Lecomte",  patientPrenom:"Martine", status:"Livré", dateLivraison:"2021-07-03", marque:"Oticon",  modele:"More 1" },
  { id:"d3", patientNom:"Dupuis",   patientPrenom:"René",    status:"Livré", dateLivraison:"2022-09-20", marque:"Starkey", modele:"Evolv AI" },
];
const DEMO_P: Patient[] = [
  { id:"p1", nom:"Fontaine", prenom:"Claire",  telephone:"06 12 34 56 78", email:"claire.fontaine@email.fr", createdAt:"2023-01-10" },
  { id:"p2", nom:"Morel",    prenom:"Jacques", telephone:"07 23 45 67 89", email:"j.morel@email.fr",         createdAt:"2022-11-05" },
  { id:"p3", nom:"Girard",   prenom:"Sylvie",  telephone:"06 34 56 78 90", email:"s.girard@email.fr",        createdAt:"2023-03-14" },
];

/* ── Canal helpers ───────────────────────────────────────────────────────── */
const CANAL_ICON: Record<Canal, string>  = { sms: "", email: "", appel: "", manuel: "✓" };
const CANAL_LABEL: Record<Canal, string> = { sms: "SMS", email: "Email", appel: "Appel", manuel: "Manuel" };
const CANAL_COLOR: Record<Canal, string> = { sms: "#6366f1", email: A, appel: "#f59e0b", manuel: "#94a3b8" };

interface ToastState { msg: string; color: string; }

/* ══════════════════════════════════════════════════════════════════════════ */
export default function RappelsPage() {
  const [ok, setOk]               = useState(false);
  const [tab, setTab]             = useState<"aFaire" | "archives">("aFaire");
  const [filter, setFilter]       = useState<"tous" | RappelRaison>("tous");
  const [contacted, setContacted] = useState<RappelRecord[]>([]);
  const [modalItem, setModalItem] = useState<RappelItem | null>(null);
  const [noteVal, setNoteVal]     = useState("");
  const [smsText, setSmsText]     = useState("");
  const [emailText, setEmailText] = useState("");
  const [sending, setSending]     = useState<Canal | null>(null);
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    setOk(true);
    setContacted(safeLoad<RappelRecord>("thor_pro_audition_rappels_contacted"));
  }, []);

  useEffect(() => {
    if (modalItem) {
      setSmsText(smsTemplate(modalItem, "Clair Audition"));
      setEmailText(emailTemplate(modalItem, "Clair Audition"));
      setNoteVal("");
    }
  }, [modalItem]);

  const dossiers = useMemo(() => { const d = ok ? safeLoad<Dossier>("thor_pro_audition_dossiers") : []; return d.length ? d : DEMO_D; }, [ok]);
  const patients = useMemo(() => { const p = ok ? safeLoad<Patient>("thor_pro_audition_patients") : []; return p.length ? p : DEMO_P; }, [ok]);
  const rdvs     = useMemo(() => ok ? safeLoad<Rdv>("thor_pro_audition_rdv") : [], [ok]);

  function showToast(msg: string, color = "#10b981") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Build rappels ── */
  const allRappels = useMemo((): RappelItem[] => {
    const items: RappelItem[] = [];
    const seen = new Set<string>();

    dossiers.filter(d => d.status === "Livré" && d.dateLivraison).forEach(d => {
      const days = daysSince(d.dateLivraison!);
      const key  = `ren-${d.id}`;
      if (days >= RENEWAL) {
        seen.add(key);
        const p = patients.find(p => `${p.nom} ${p.prenom}`.toLowerCase() === `${d.patientNom} ${d.patientPrenom}`.toLowerCase());
        items.push({ key, nom: d.patientNom ?? "", prenom: d.patientPrenom ?? "",
          telephone: p?.telephone, email: p?.email,
          raison: "renouvellement_eligible",
          detail: `${d.marque} ${d.modele} — livré le ${fmtDate(d.dateLivraison!)} · ${Math.round((days - RENEWAL) / 30)}m de dépassement`,
          urgence: "haute", days });
      } else if (days >= RENEWAL_SOON) {
        seen.add(key);
        const p = patients.find(p => `${p.nom} ${p.prenom}`.toLowerCase() === `${d.patientNom} ${d.patientPrenom}`.toLowerCase());
        items.push({ key, nom: d.patientNom ?? "", prenom: d.patientPrenom ?? "",
          telephone: p?.telephone, email: p?.email,
          raison: "renouvellement_proche",
          detail: `${d.marque} ${d.modele} — éligible le ${fmtDate(addDays(d.dateLivraison!, RENEWAL))}`,
          urgence: "normale", days });
      }
    });

    patients.forEach(p => {
      const nm = `${p.nom ?? ""} ${p.prenom ?? ""}`.trim().toLowerCase();
      const last = rdvs.filter(r => `${r.patientNom ?? ""} ${r.patientPrenom ?? ""}`.trim().toLowerCase() === nm && r.date)
        .sort((a, b) => b.date!.localeCompare(a.date!))[0];
      const days = daysSince(last?.date ?? p.createdAt ?? "2099-01-01");
      if (days >= INACTIVE) {
        const key = `inact-${p.id}`;
        if (!seen.has(key)) {
          items.push({ key, nom: p.nom ?? "", prenom: p.prenom ?? "",
            telephone: p.telephone, email: p.email,
            raison: "inactivite",
            detail: `Dernière visite il y a ${Math.round(days / 30)} mois`,
            urgence: days > 365 ? "haute" : "normale", days });
        }
      }
    });

    return items.sort((a, b) => (a.urgence === "haute" ? 0 : 1) - (b.urgence === "haute" ? 0 : 1) || b.days - a.days);
  }, [dossiers, patients, rdvs]);

  const contactedKeys = useMemo(() => new Set(contacted.map(c => c.patientKey)), [contacted]);
  const aFaire   = useMemo(() => allRappels.filter(r => !contactedKeys.has(r.key)), [allRappels, contactedKeys]);
  const archives = useMemo(() => allRappels.filter(r =>  contactedKeys.has(r.key)), [allRappels, contactedKeys]);

  const filtered = (tab === "aFaire" ? aFaire : archives)
    .filter(r => filter === "tous" || r.raison === filter);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const sentThisMonth = contacted.filter(c => c.contactedAt.startsWith(thisMonth) && (c.canal === "sms" || c.canal === "email")).length;

  function markContacted(item: RappelItem, canal: Canal, message?: string, note?: string) {
    const updated = [...contacted.filter(c => c.patientKey !== item.key),
      { patientKey: item.key, contactedAt: new Date().toISOString(), note, canal, message }];
    setContacted(updated);
    safeSet("thor_pro_audition_rappels_contacted", updated);
    setModalItem(null);
    setSending(null);
    setSelected(prev => { const s = new Set(prev); s.delete(item.key); return s; });
  }

  function unarchive(key: string) {
    const updated = contacted.filter(c => c.patientKey !== key);
    setContacted(updated);
    safeSet("thor_pro_audition_rappels_contacted", updated);
  }

  async function simulateSend(item: RappelItem, canal: Canal, message: string) {
    setSending(canal);
    await new Promise(r => setTimeout(r, 1200));
    markContacted(item, canal, message, noteVal || undefined);
    const dest = canal === "sms" ? item.telephone : item.email;
    showToast(`${canal === "sms" ? "SMS" : "Email"} envoyé à ${item.prenom} ${item.nom}${dest ? ` (${dest})` : ""}`, canal === "sms" ? "#6366f1" : A);
  }

  async function simulateBulkSend(items: RappelItem[], canal: Canal) {
    setBulkSending(true);
    await new Promise(r => setTimeout(r, 1800));
    const now = new Date().toISOString();
    const updated = [...contacted];
    items.forEach(item => {
      const msg = canal === "sms" ? smsTemplate(item, "Clair Audition") : emailTemplate(item, "Clair Audition");
      updated.push({ patientKey: item.key, contactedAt: now, canal, message: msg });
    });
    setContacted(updated);
    safeSet("thor_pro_audition_rappels_contacted", updated);
    setSelected(new Set());
    setBulkSending(false);
    showToast(`${items.length} ${canal === "sms" ? "SMS" : "emails"} envoyés`, canal === "sms" ? "#6366f1" : A);
  }

  const RAISON_LABEL: Record<RappelRaison, string> = {
    renouvellement_eligible: "Renouvellement disponible",
    renouvellement_proche:   "Renouvellement proche",
    inactivite:              "Patient inactif",
  };
  const RAISON_COLOR: Record<RappelRaison, string> = {
    renouvellement_eligible: "#10b981",
    renouvellement_proche:   A,
    inactivite:              "#f59e0b",
  };

  const toggleSelect = (key: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  const selectedItems = filtered.filter(r => selected.has(r.key));
  const smsCount = smsText.length;
  const smsSegments = Math.ceil(smsCount / 160) || 1;

  return (
    <div style={{ padding: "28px 32px 52px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.color, color: "#fff", padding: "12px 22px", borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,.18)", display: "flex", alignItems: "center", gap: 10, animation: "slideIn .2s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-.02em", margin: "0 0 5px" }}>
            Rappels patients
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Envoi de SMS et emails automatiques — renouvellements éligibles et suivi audiologique
          </p>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
            <button onClick={() => simulateBulkSend(selectedItems, "sms")} disabled={bulkSending}
              style={{ padding: "9px 18px", background: bulkSending ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: bulkSending ? "wait" : "pointer" }}>
              {bulkSending ? "Envoi…" : `SMS (${selected.size})`}
            </button>
            <button onClick={() => simulateBulkSend(selectedItems, "email")} disabled={bulkSending}
              style={{ padding: "9px 18px", background: bulkSending ? "#94a3b8" : `linear-gradient(135deg,${A},#059669)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: bulkSending ? "wait" : "pointer" }}>
              {bulkSending ? "Envoi…" : `Email (${selected.size})`}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Renouvellements disponibles", count: aFaire.filter(r => r.raison === "renouvellement_eligible").length, color: "#10b981", bg: "rgba(16,185,129,.08)" },
          { label: "Bientôt éligibles",           count: aFaire.filter(r => r.raison === "renouvellement_proche").length,   color: A,        bg: `rgba(0,201,138,.08)` },
          { label: "Patients inactifs",           count: aFaire.filter(r => r.raison === "inactivite").length,              color: "#f59e0b", bg: "rgba(245,158,11,.08)" },
          { label: "Envoyés ce mois",             count: sentThisMonth,                                                     color: "#8b5cf6", bg: "rgba(139,92,246,.08)" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs + Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "var(--glass-strong-bg)", border: "1px solid rgba(0,0,0,.06)", borderRadius: 12, padding: 4, gap: 4 }}>
          {([["aFaire", `À contacter (${aFaire.length})`], ["archives", `Archivés (${archives.length})`]] as const).map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setSelected(new Set()); }} style={{
              padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
              background: tab === t ? A : "transparent", color: tab === t ? "#fff" : "#64748b", transition: "all .15s"
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["tous", "renouvellement_eligible", "renouvellement_proche", "inactivite"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${filter === f ? A : "rgba(0,0,0,.08)"}`,
              background: filter === f ? `${A}15` : "rgba(255,255,255,.8)",
              color: filter === f ? A : "#64748b",
            }}>
              {f === "tous" ? "Tous" : RAISON_LABEL[f]}
            </button>
          ))}
        </div>
        {tab === "aFaire" && filtered.length > 0 && (
          <button
            onClick={() => {
              if (selected.size === filtered.length) setSelected(new Set());
              else setSelected(new Set(filtered.map(r => r.key)));
            }}
            style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(0,0,0,.08)", background: "var(--glass-strong-bg)", color: "#64748b", marginLeft: "auto" }}
          >
            {selected.size === filtered.length ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", background: "var(--glass-strong-bg)", borderRadius: 20, border: "1px solid rgba(255,255,255,.9)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
            {tab === "aFaire" ? "Aucun rappel en attente" : "Aucun rappel archivé"}
          </p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>
            {tab === "aFaire" ? "Tous vos patients sont à jour." : "Les patients contactés apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(item => {
            const rc = contacted.find(c => c.patientKey === item.key);
            const raColor = RAISON_COLOR[item.raison];
            const initials = `${item.prenom[0] ?? ""}${item.nom[0] ?? ""}`;
            const isSelected = selected.has(item.key);

            return (
              <div key={item.key} style={{
                background: isSelected ? `${A}0c` : "rgba(255,255,255,.82)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${isSelected ? A : item.urgence === "haute" && tab === "aFaire" ? `${raColor}30` : "rgba(0,0,0,.06)"}`,
                borderRadius: 18, padding: "16px 20px",
                boxShadow: item.urgence === "haute" && tab === "aFaire" ? `0 4px 20px ${raColor}10` : "0 2px 8px rgba(0,0,0,.03)",
                display: "flex", alignItems: "center", gap: 14, transition: "all .15s",
              }}>
                {tab === "aFaire" && (
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.key)}
                    style={{ width: 17, height: 17, cursor: "pointer", accentColor: A, flexShrink: 0 }} />
                )}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${raColor}18`, border: `2px solid ${raColor}30`, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 800, color: raColor, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{item.prenom} {item.nom}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: raColor, background: `${raColor}15`, padding: "2px 10px", borderRadius: 20 }}>{RAISON_LABEL[item.raison]}</span>
                    {item.urgence === "haute" && tab === "aFaire" && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.1)", padding: "2px 10px", borderRadius: 20 }}>Urgent</span>
                    )}
                    {rc?.canal && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: CANAL_COLOR[rc.canal], background: `${CANAL_COLOR[rc.canal]}15`, padding: "2px 10px", borderRadius: 20 }}>
                        {CANAL_ICON[rc.canal]} {CANAL_LABEL[rc.canal]}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 3px" }}>{item.detail}</p>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {item.telephone && <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.telephone}</span>}
                    {item.email     && <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.email}</span>}
                    {rc && <span style={{ fontSize: 12, color: "#94a3b8" }}>Contacté le {fmtDateTime(rc.contactedAt)}{rc.note ? ` · ${rc.note}` : ""}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {tab === "aFaire" ? (
                    <>
                      {item.telephone && (
                        <button onClick={() => setModalItem(item)} style={{ padding: "8px 14px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          SMS
                        </button>
                      )}
                      {item.email && (
                        <button onClick={() => setModalItem(item)} style={{ padding: "8px 14px", background: `linear-gradient(135deg,${A},#059669)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Email
                        </button>
                      )}
                      <button onClick={() => markContacted(item, "manuel")} style={{ padding: "8px 12px", background: "rgba(16,185,129,.1)", color: "#10b981", border: "1px solid rgba(16,185,129,.2)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓</button>
                    </>
                  ) : (
                    <button onClick={() => unarchive(item.key)} style={{ padding: "8px 14px", background: "rgba(100,116,139,.1)", color: "#64748b", border: "1px solid rgba(100,116,139,.2)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Remettre
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal envoi */}
      {modalItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", zIndex: 1000, display: "grid", placeItems: "center", padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModalItem(null); }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 580, boxShadow: "0 24px 80px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Envoyer un message</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{modalItem.prenom} {modalItem.nom} · {RAISON_LABEL[modalItem.raison]}</p>
              </div>
              <button onClick={() => setModalItem(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* SMS */}
            {modalItem.telephone && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: ".06em" }}>SMS</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{modalItem.telephone}</span>
                  </div>
                  <span style={{ fontSize: 11, color: smsCount > 320 ? "#ef4444" : "#94a3b8" }}>{smsCount} car. · {smsSegments} SMS</span>
                </div>
                <textarea value={smsText} onChange={e => setSmsText(e.target.value)} rows={4}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,.25)", fontSize: 13, color: "#334155", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", background: "rgba(99,102,241,.04)" }} />
                <button onClick={() => simulateSend(modalItem, "sms", smsText)} disabled={!!sending}
                  style={{ marginTop: 8, width: "100%", padding: "11px", background: sending === "sms" ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: sending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {sending === "sms" ? "Envoi en cours…" : "Envoyer le SMS"}
                </button>
              </div>
            )}

            {modalItem.telephone && modalItem.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>OU</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>
            )}

            {/* Email */}
            {modalItem.email && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: ".06em" }}>Email</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{modalItem.email}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#475569", border: "1px solid rgba(0,0,0,.06)" }}>
                  <span style={{ fontWeight: 700 }}>Objet :</span> {emailSubject(modalItem)}
                </div>
                <textarea value={emailText} onChange={e => setEmailText(e.target.value)} rows={6}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${A}25`, fontSize: 13, color: "#334155", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", background: `rgba(0,201,138,.03)` }} />
                <button onClick={() => simulateSend(modalItem, "email", emailText)} disabled={!!sending}
                  style={{ marginTop: 8, width: "100%", padding: "11px", background: sending === "email" ? "#94a3b8" : `linear-gradient(135deg,${A},#059669)`, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: sending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {sending === "email" ? "Envoi en cours…" : "Envoyer l'email"}
                </button>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Note interne (optionnelle)</p>
              <input value={noteVal} onChange={e => setNoteVal(e.target.value)}
                placeholder="Ex : Laissé un message, rappeler jeudi…"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,.1)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <button onClick={() => markContacted(modalItem, "appel", undefined, noteVal || undefined)} style={{ padding: "10px 18px", background: "rgba(245,158,11,.1)", color: "#d97706", border: "1px solid rgba(245,158,11,.2)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Appel passé
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModalItem(null)} style={{ padding: "10px 18px", background: "rgba(0,0,0,.06)", color: "#64748b", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Annuler</button>
                <button onClick={() => markContacted(modalItem, "manuel", undefined, noteVal || undefined)} style={{ padding: "10px 18px", background: `rgba(0,201,138,.1)`, color: A, border: `1px solid rgba(0,201,138,.2)`, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Marquer contacté</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
