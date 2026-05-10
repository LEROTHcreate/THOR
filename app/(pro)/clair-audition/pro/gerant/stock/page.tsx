"use client";

import { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";

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
const inputStyle: CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "var(--glass-strong-bg)",
  fontSize: 13,
  color: "#1e293b",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const ACCENT = "#00C98A";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════ */
interface StockItem {
  id: string;
  marque: string;
  modele: string;
  reference: string;
  categorie: "Appareil" | "Accessoire" | "Pile" | "Consommable";
  stock: number;
  stockMin: number;
  prixAchat: number;
  prixVente: number;
  fournisseur?: string;
  fournisseurEmail?: string;
}

type MotifMouvement = "Réception commande" | "Vente" | "Perte/casse" | "Inventaire";

interface StockMouvement {
  id: string;
  itemId: string;
  itemLabel: string;
  date: string;
  motif: MotifMouvement;
  quantite: number;
  utilisateur: string;
}

type CommandeStatut = "en_attente" | "confirmee" | "livree" | "annulee";

interface Commande {
  id: string;
  date: string;
  itemId: string;
  itemLabel: string;
  marque: string;
  fournisseur: string;
  quantite: number;
  prixAchatUnit: number;
  statut: CommandeStatut;
  dateLivraison?: string;
  notes?: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS & DEFAULT DATA
═══════════════════════════════════════════════════════════════════════ */
const LS_STOCK      = "thor_pro_audition_stock";
const LS_MOUVEMENTS = "thor_pro_audition_stock_mouvements";
const LS_COMMANDES  = "thor_pro_audition_stock_commandes";

const DEFAULT_STOCK: StockItem[] = [
  { id: "s1", marque: "Phonak",  modele: "Lumity 90",       reference: "LUMITY90-R",    categorie: "Appareil",    stock: 4,  stockMin: 2,  prixAchat: 1800, prixVente: 3180, fournisseur: "Sonova France",             fournisseurEmail: "commandes@sonova.fr" },
  { id: "s2", marque: "Oticon",  modele: "Intent 1",        reference: "INTENT1-R",     categorie: "Appareil",    stock: 2,  stockMin: 2,  prixAchat: 1600, prixVente: 2890, fournisseur: "Demant A/S",                fournisseurEmail: "orders@oticon.fr" },
  { id: "s3", marque: "Starkey", modele: "Evolv AI 2400",   reference: "EVOLVAI-R",     categorie: "Appareil",    stock: 3,  stockMin: 1,  prixAchat: 1400, prixVente: 2420, fournisseur: "Starkey France",             fournisseurEmail: "commandes@starkey.fr" },
  { id: "s4", marque: "Widex",   modele: "Moment Sheer",    reference: "MOMENT-R",      categorie: "Appareil",    stock: 1,  stockMin: 2,  prixAchat: 800,  prixVente: 1400, fournisseur: "WS Audiology France",       fournisseurEmail: "commandes@wsaudiology.fr" },
  { id: "s5", marque: "Phonak",  modele: "Câble chargeur",  reference: "PHONAK-CHG",    categorie: "Accessoire",  stock: 12, stockMin: 5,  prixAchat: 12,   prixVente: 28,   fournisseur: "Sonova France",             fournisseurEmail: "commandes@sonova.fr" },
  { id: "s6", marque: "Signia",  modele: "Piles 312 x6",    reference: "PILE312-6",     categorie: "Pile",        stock: 48, stockMin: 20, prixAchat: 2,    prixVente: 6,    fournisseur: "Sivantos France",           fournisseurEmail: "supplies@signia.net" },
  { id: "s7", marque: "Oticon",  modele: "Dômes tulipe S",  reference: "DOME-TULIPE-S", categorie: "Consommable", stock: 30, stockMin: 10, prixAchat: 1,    prixVente: 3,    fournisseur: "Demant A/S",                fournisseurEmail: "orders@oticon.fr" },
];

type PageTab = "stock" | "commandes" | "mouvements";
type Categorie = "Tous" | "Appareil" | "Accessoire" | "Pile" | "Consommable";
const CATEGORIES: Categorie[] = ["Tous", "Appareil", "Accessoire", "Pile", "Consommable"];
const MOTIFS: MotifMouvement[] = ["Réception commande", "Vente", "Perte/casse", "Inventaire"];

const COMMANDE_STATUT_CFG: Record<CommandeStatut, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente",  color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  confirmee:  { label: "Confirmée",   color: "#2D8CFF", bg: "rgba(45,140,255,0.10)" },
  livree:     { label: "Livrée",      color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  annulee:    { label: "Annulée",     color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
type StockStatus = "ok" | "bas" | "rupture";
function getStockStatus(stock: number, stockMin: number): StockStatus {
  if (stock === 0) return "rupture";
  if (stock <= stockMin) return "bas";
  return "ok";
}
const STOCK_STATUS_CFG: Record<StockStatus, { color: string; label: string; bg: string }> = {
  ok:      { color: "#10b981", label: "OK",        bg: "rgba(16,185,129,0.10)" },
  bas:     { color: "#f59e0b", label: "Stock bas",  bg: "rgba(245,158,11,0.10)" },
  rupture: { color: "#ef4444", label: "Rupture",    bg: "rgba(239,68,68,0.10)" },
};

/* ═══════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════ */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: ACCENT,
      color: "#fff", borderRadius: 14, padding: "12px 20px",
      fontSize: 14, fontWeight: 600, boxShadow: `0 8px 32px ${ACCENT}40`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span>✓</span><span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL AJUSTEMENT STOCK
═══════════════════════════════════════════════════════════════════════ */
function AjustementModal({
  item, onSave, onClose,
}: {
  item: StockItem;
  onSave: (quantite: number, motif: MotifMouvement) => void;
  onClose: () => void;
}) {
  const [quantite, setQuantite] = useState(0);
  const [motif, setMotif] = useState<MotifMouvement>("Réception commande");
  const newStock = item.stock + quantite;
  const fieldLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 420 }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>Ajuster le stock</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{item.marque} {item.modele}</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...glassSubtle, borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Stock actuel</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{item.stock}</div>
            </div>
            <div style={{ fontSize: 22, color: "#94a3b8" }}>→</div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Nouveau stock</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: newStock < 0 ? "#ef4444" : newStock <= item.stockMin ? "#f59e0b" : "#10b981" }}>{newStock}</div>
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Ajustement (+ entrée / - sortie)</label>
            <input style={inputStyle} type="number" value={quantite} onChange={e => setQuantite(Number(e.target.value))} placeholder="+5 ou -2" />
          </div>
          <div>
            <label style={fieldLabel}>Motif</label>
            <select style={inputStyle} value={motif} onChange={e => setMotif(e.target.value as MotifMouvement)}>
              {MOTIFS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Annuler</button>
          <button onClick={() => { if (quantite !== 0) onSave(quantite, motif); }} disabled={quantite === 0 || newStock < 0}
            style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: quantite === 0 || newStock < 0 ? "rgba(148,163,184,0.3)" : ACCENT, fontSize: 13, fontWeight: 700, color: quantite === 0 || newStock < 0 ? "#94a3b8" : "#fff", cursor: quantite === 0 || newStock < 0 ? "not-allowed" : "pointer" }}>
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL PASSER COMMANDE
═══════════════════════════════════════════════════════════════════════ */
function CommandeModal({
  item, onSave, onClose,
}: {
  item: StockItem;
  onSave: (commande: Commande) => void;
  onClose: () => void;
}) {
  const suggestedQty = Math.max(item.stockMin * 2 - item.stock, item.stockMin);
  const [quantite, setQuantite] = useState(suggestedQty);
  const [fournisseur, setFournisseur] = useState(item.fournisseur ?? "");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const total = quantite * item.prixAchat;

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      const commande: Commande = {
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        itemId: item.id,
        itemLabel: `${item.marque} ${item.modele}`,
        marque: item.marque,
        fournisseur: fournisseur || "—",
        quantite,
        prixAchatUnit: item.prixAchat,
        statut: "en_attente",
        notes: notes || undefined,
      };
      onSave(commande);
      setSending(false);
      setSent(true);
      setTimeout(onClose, 1200);
    }, 1400);
  }

  const fieldLabel: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glass, borderRadius: 20, width: "100%", maxWidth: 460 }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>Passer une commande</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{item.marque} {item.modele} — {item.reference}</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stock info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Stock actuel", val: item.stock, color: item.stock <= item.stockMin ? "#ef4444" : "#10b981" },
              { label: "Seuil mini", val: item.stockMin, color: "#64748b" },
              { label: "Prix achat HT", val: formatEuro(item.prixAchat), color: "#2D8CFF" },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...glassSubtle, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.val}</div>
              </div>
            ))}
          </div>
          <div>
            <label style={fieldLabel}>Quantité à commander</label>
            <input style={inputStyle} type="number" min={1} value={quantite} onChange={e => setQuantite(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <label style={fieldLabel}>Fournisseur</label>
            <input style={inputStyle} value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder="Nom du fournisseur" />
            {item.fournisseurEmail && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{item.fournisseurEmail}</div>
            )}
          </div>
          <div>
            <label style={fieldLabel}>Notes (optionnel)</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions spécifiques, urgence…" />
          </div>
          {/* Total */}
          <div style={{ ...glassSubtle, borderRadius: 12, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Montant estimé HT</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{formatEuro(total)}</span>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSend} disabled={sending || sent || quantite < 1}
            style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: sent ? "rgba(16,185,129,0.85)" : ACCENT, fontSize: 13, fontWeight: 700, color: "#fff", cursor: sending || sent ? "default" : "pointer", minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {sent ? "✓ Envoyée !" : sending ? "Envoi en cours…" : "Envoyer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function StockAuditionPage() {
  const [tab, setTab]             = useState<PageTab>("stock");
  const [items, setItems]         = useState<StockItem[]>([]);
  const [mouvements, setMouvements] = useState<StockMouvement[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [search, setSearch]       = useState("");
  const [cat, setCat]             = useState<Categorie>("Tous");
  const [ajustItem, setAjustItem] = useState<StockItem | null>(null);
  const [commandeItem, setCommandeItem] = useState<StockItem | null>(null);
  const [toast, setToast]         = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(true);

  useEffect(() => {
    try { const r = localStorage.getItem(LS_STOCK); setItems(r ? JSON.parse(r) : DEFAULT_STOCK); } catch { setItems(DEFAULT_STOCK); }
    try { const r = localStorage.getItem(LS_MOUVEMENTS); setMouvements(r ? JSON.parse(r) : []); } catch { setMouvements([]); }
    try { const r = localStorage.getItem(LS_COMMANDES); setCommandes(r ? JSON.parse(r) : []); } catch { setCommandes([]); }
  }, []);

  const saveItems = useCallback((data: StockItem[]) => {
    setItems(data);
    localStorage.setItem(LS_STOCK, JSON.stringify(data));
  }, []);

  const saveMouvements = useCallback((data: StockMouvement[]) => {
    setMouvements(data);
    localStorage.setItem(LS_MOUVEMENTS, JSON.stringify(data));
  }, []);

  const saveCommandes = useCallback((data: Commande[]) => {
    setCommandes(data);
    localStorage.setItem(LS_COMMANDES, JSON.stringify(data));
  }, []);

  function handleAjustement(quantite: number, motif: MotifMouvement) {
    if (!ajustItem) return;
    const updated = items.map(x => x.id === ajustItem.id ? { ...x, stock: x.stock + quantite } : x);
    saveItems(updated);
    const mouv: StockMouvement = { id: genId(), itemId: ajustItem.id, itemLabel: `${ajustItem.marque} ${ajustItem.modele}`, date: new Date().toISOString(), motif, quantite, utilisateur: "Gérant" };
    saveMouvements([mouv, ...mouvements]);
    setAjustItem(null);
    setToast(`Stock ajusté : ${quantite > 0 ? "+" : ""}${quantite} — ${motif}`);
  }

  function handleCommande(commande: Commande) {
    const updated = [commande, ...commandes];
    saveCommandes(updated);
    setCommandeItem(null);
    setToast(`Commande envoyée : ${commande.quantite}× ${commande.itemLabel}`);
  }

  function updateCommandeStatut(id: string, statut: CommandeStatut) {
    const updated = commandes.map(c => c.id === id ? { ...c, statut, dateLivraison: statut === "livree" ? new Date().toISOString() : c.dateLivraison } : c);
    saveCommandes(updated);
    if (statut === "livree") {
      const cmd = commandes.find(c => c.id === id);
      if (cmd) {
        const updatedItems = items.map(x => x.id === cmd.itemId ? { ...x, stock: x.stock + cmd.quantite } : x);
        saveItems(updatedItems);
        const mouv: StockMouvement = { id: genId(), itemId: cmd.itemId, itemLabel: cmd.itemLabel, date: new Date().toISOString(), motif: "Réception commande", quantite: cmd.quantite, utilisateur: "Gérant" };
        saveMouvements([mouv, ...mouvements]);
        setToast(`Livraison confirmée : +${cmd.quantite} ${cmd.itemLabel}`);
      }
    }
  }

  const filtered = items.filter(s => {
    const q = search.toLowerCase();
    const matchQ = `${s.marque} ${s.modele} ${s.reference}`.toLowerCase().includes(q);
    const matchC = cat === "Tous" || s.categorie === cat;
    return matchQ && matchC;
  });

  const alertItems = items.filter(s => s.stock <= s.stockMin);
  const ruptureItems = items.filter(s => s.stock === 0);

  /* ── KPIs ── */
  const kpi = {
    totalRefs: items.length,
    valeurStock: items.reduce((s, i) => s + i.stock * i.prixAchat, 0),
    alertes: alertItems.length,
    commandesEnCours: commandes.filter(c => c.statut === "en_attente" || c.statut === "confirmee").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>Gestion du stock</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Inventaire appareils, accessoires et consommables</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ruptureItems.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
              {ruptureItems.length} rupture{ruptureItems.length > 1 ? "s" : ""}
            </div>
          )}
          {alertItems.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, background: "rgba(245,158,11,0.08)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)" }}>
              {alertItems.length} stock{alertItems.length > 1 ? "s" : ""} bas
            </div>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Références",       val: kpi.totalRefs,                                   color: "#2D8CFF",  icon: "" },
          { label: "Valeur stock HT",  val: formatEuro(kpi.valeurStock),                     color: ACCENT,     icon: "" },
          { label: "Alertes stock",    val: kpi.alertes,                                     color: "#f59e0b",  icon: "" },
          { label: "Commandes en cours", val: kpi.commandesEnCours,                          color: "#8B5CF6",  icon: "" },
        ].map(k => (
          <div key={k.label} style={{ ...glass, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alertes panel ── */}
      {alertItems.length > 0 && (
        <div style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
          <button
            onClick={() => setAlertOpen(o => !o)}
            style={{ width: "100%", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(245,158,11,0.06)", border: "none", borderBottom: alertOpen ? "1px solid rgba(245,158,11,0.15)" : "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                {alertItems.length} article{alertItems.length > 1 ? "s" : ""} nécessitant un réapprovisionnement
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>{alertOpen ? "▲ Masquer" : "▼ Voir"}</span>
          </button>
          {alertOpen && (
            <div style={{ padding: "4px 0" }}>
              {alertItems.map(item => {
                const isRupture = item.stock === 0;
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRupture ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{item.marque} {item.modele}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.reference} — {item.categorie}</div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 90 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isRupture ? "#ef4444" : "#f59e0b" }}>
                        {item.stock} / {item.stockMin}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>actuel / mini</div>
                    </div>
                    {item.fournisseur && (
                      <div style={{ fontSize: 11, color: "#64748b", maxWidth: 140, textAlign: "right", lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 600 }}>{item.fournisseur}</div>
                        {item.fournisseurEmail && <div style={{ color: "#94a3b8" }}>{item.fournisseurEmail}</div>}
                      </div>
                    )}
                    <button
                      onClick={() => { setCommandeItem(item); }}
                      style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Commander
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, ...glassSubtle, borderRadius: 14, padding: 5, width: "fit-content" }}>
        {([
          { key: "stock",      label: "Stock" },
          { key: "commandes",  label: `Commandes${kpi.commandesEnCours > 0 ? ` (${kpi.commandesEnCours})` : ""}` },
          { key: "mouvements", label: "Mouvements" },
        ] as { key: PageTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 20px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            background: tab === key ? ACCENT : "transparent",
            color: tab === key ? "#fff" : "#64748b",
            boxShadow: tab === key ? `0 2px 8px ${ACCENT}40` : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ONGLET STOCK
      ══════════════════════════════════════════════════════════ */}
      {tab === "stock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 280 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    background: cat === c ? ACCENT : "rgba(255,255,255,0.45)",
                    color: cat === c ? "#fff" : "#64748b",
                    boxShadow: cat === c ? `0 2px 8px ${ACCENT}30` : "0 1px 3px rgba(0,0,0,0.05)",
                  }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 100px 100px 90px 80px 110px 100px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
              <span>Produit</span><span>Référence</span><span>Cat.</span><span>Stock</span><span>Statut</span><span>Achat HT</span><span>Marge</span><span>Fournisseur</span><span>Actions</span>
            </div>
            <div>
              {filtered.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun article trouvé.</div>
              ) : filtered.map(s => {
                const marge = s.prixVente > 0 ? Math.round(((s.prixVente - s.prixAchat) / s.prixVente) * 100) : 0;
                const status = getStockStatus(s.stock, s.stockMin);
                const statusCfg = STOCK_STATUS_CFG[status];
                return (
                  <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 100px 100px 90px 80px 110px 100px", gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{s.marque} {s.modele}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{s.reference}</div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(16,185,129,0.08)", color: "#047857" }}>{s.categorie}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: statusCfg.color }}>{s.stock}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}> / {s.stockMin}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{formatEuro(s.prixAchat)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: marge >= 40 ? "#10b981" : "#f59e0b" }}>{marge}%</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.fournisseur ?? "—"}</div>
                      {s.fournisseurEmail && <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.fournisseurEmail}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <button onClick={() => setAjustItem(s)}
                        style={{ padding: "4px 9px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Ajuster
                      </button>
                      <button onClick={() => setCommandeItem(s)}
                        style={{ padding: "4px 9px", borderRadius: 8, border: `1px solid ${ACCENT}40`, background: `rgba(0,201,138,0.08)`, color: "#047857", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Commander
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET COMMANDES
      ══════════════════════════════════════════════════════════ */}
      {tab === "commandes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {commandes.length === 0 ? (
            <div style={{ ...glass, borderRadius: 18, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Aucune commande</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Utilisez le bouton «&nbsp;Commander&nbsp;» depuis l'onglet Stock ou le panneau d'alertes.</div>
            </div>
          ) : (
            <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Historique des commandes fournisseurs</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{commandes.length} commande{commandes.length > 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 130px 70px 80px 110px 120px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                <span>Date</span><span>Article</span><span>Fournisseur</span><span>Qté</span><span>Montant</span><span>Statut</span><span>Actions</span>
              </div>
              {commandes.map(cmd => {
                const cfg = COMMANDE_STATUT_CFG[cmd.statut];
                const isActive = cmd.statut === "en_attente" || cmd.statut === "confirmee";
                return (
                  <div key={cmd.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 130px 70px 80px 110px 120px", gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(cmd.date)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cmd.itemLabel}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{cmd.marque}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{cmd.fournisseur}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{cmd.quantite}</div>
                    <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{formatEuro(cmd.quantite * cmd.prixAchatUnit)}</div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      {cmd.dateLivraison && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Livré le {fmtDate(cmd.dateLivraison)}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {isActive && (
                        <>
                          <button onClick={() => updateCommandeStatut(cmd.id, "livree")}
                            style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#047857", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                            ✓ Reçue
                          </button>
                          {cmd.statut === "en_attente" && (
                            <button onClick={() => updateCommandeStatut(cmd.id, "confirmee")}
                              style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(45,140,255,0.3)", background: "rgba(45,140,255,0.08)", color: "#1D6FCC", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                              Confirmer
                            </button>
                          )}
                          <button onClick={() => updateCommandeStatut(cmd.id, "annulee")}
                            style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#94a3b8", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                            Annuler
                          </button>
                        </>
                      )}
                      {!isActive && <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET MOUVEMENTS
      ══════════════════════════════════════════════════════════ */}
      {tab === "mouvements" && (
        <div>
          <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Historique des mouvements</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{mouvements.length} mouvement{mouvements.length > 1 ? "s" : ""}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "170px 1fr 140px 80px 120px", gap: 0, padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
              <span>Date</span><span>Référence</span><span>Motif</span><span>Qté</span><span>Utilisateur</span>
            </div>
            {mouvements.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucun mouvement. Ajustez un article pour commencer.</div>
            ) : mouvements.slice(0, 50).map(m => (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: "170px 1fr 140px 80px 120px", gap: 0, padding: "11px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDateTime(m.date)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{m.itemLabel}</div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "rgba(148,163,184,0.10)", color: "#64748b" }}>{m.motif}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: m.quantite > 0 ? "#10b981" : "#ef4444" }}>
                  {m.quantite > 0 ? "+" : ""}{m.quantite}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.utilisateur}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {ajustItem && <AjustementModal item={ajustItem} onSave={handleAjustement} onClose={() => setAjustItem(null)} />}
      {commandeItem && <CommandeModal item={commandeItem} onSave={handleCommande} onClose={() => setCommandeItem(null)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
