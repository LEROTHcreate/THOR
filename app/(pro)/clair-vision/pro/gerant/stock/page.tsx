"use client";

import React, { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  STOCK,
  CATEGORIE_LABELS,
  CATEGORIE_COLORS,
  getAlertesStock,
  COEFFICIENTS_MARCHE,
  calcPvConseille,
  calcNouveauPru,
  type StockCategorie,
  type StockItem,
} from "@/lib/stock";
import {
  loadMouvements,
  saveMouvements,
  type MouvementStock,
  type TypeMouvement,
} from "@/lib/mouvementsStock";
import { loadUsers, loadCurrentUserId } from "@/lib/users";
import DraggableWindow from "@/components/ui/DraggableWindow";

/* ─── Style tokens ─────────────────────────────────────────────────── */
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

/* ─── Helpers ──────────────────────────────────────────────────────── */
function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function uid(): string {
  return `mv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ─── Types ──────────────────────────────────────────────────────── */
type MainTab = "stock" | "mouvements" | "tarifs" | "commandes";
type StockFilter = "tous" | "bas" | "rupture";
type MvtFilter = "tous" | "entree" | "sortie";
type DateFilter = "semaine" | "mois" | "tout";

type CommandeStatut = "en_attente" | "confirmee" | "livree" | "annulee";
interface Commande {
  id: string;
  date: string;
  itemId: string;
  itemLabel: string;
  categorie: string;
  fournisseur: string;
  quantite: number;
  prixAchatUnit: number;
  statut: CommandeStatut;
  dateLivraison?: string;
  notes?: string;
}
const COMMANDE_STATUT_CFG: Record<CommandeStatut, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  confirmee:  { label: "Confirmée",  color: "#2D8CFF", bg: "rgba(45,140,255,0.10)" },
  livree:     { label: "Livrée",     color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  annulee:    { label: "Annulée",    color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

/* ─── localStorage keys ──────────────────────────────────────────── */
const LS_ITEMS       = "thor_pro_stock_items";
const LS_COEFFS      = "thor_pro_stock_coeffs";
const LS_PRIX_VERRES = "thor_pro_stock_prix_verres";
const LS_COMMANDES   = "thor_pro_vision_commandes";

/* ─── Overrides types ────────────────────────────────────────────── */
interface ItemOverride { quantite?: number; pru?: number; prixVente?: number; }
type ItemOverrides = Record<string, ItemOverride>;
type CoeffsPerso = Partial<Record<StockCategorie, number>>;
type PrixVerres  = Record<string, number>;

function loadItemOverrides(): ItemOverrides {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_ITEMS) ?? "{}"); } catch { return {}; }
}
function saveItemOverrides(o: ItemOverrides): void {
  localStorage.setItem(LS_ITEMS, JSON.stringify(o));
}
function loadCoeffsPerso(): CoeffsPerso {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_COEFFS) ?? "{}"); } catch { return {}; }
}
function saveCoeffsPerso(c: CoeffsPerso): void {
  localStorage.setItem(LS_COEFFS, JSON.stringify(c));
}
function loadPrixVerres(): PrixVerres {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_PRIX_VERRES) ?? "{}"); } catch { return {}; }
}
function savePrixVerres(p: PrixVerres): void {
  localStorage.setItem(LS_PRIX_VERRES, JSON.stringify(p));
}

/* ── Custom items (nouveaux articles créés à la volée) ──────────── */
const LS_CUSTOM_ITEMS = "thor_pro_stock_custom_items";
type CustomItems = Record<string, StockItem>;

function loadCustomItems(): CustomItems {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_CUSTOM_ITEMS) ?? "{}"); } catch { return {}; }
}
function saveCustomItems(c: CustomItems): void {
  localStorage.setItem(LS_CUSTOM_ITEMS, JSON.stringify(c));
}

/* ── Rapid line type ─────────────────────────────────────────────── */
interface RapideLine {
  id: string;
  marque: string;
  reference: string;
  categorie: StockCategorie;
  quantite: number;
  paHT: number;
  pv: number;
  pruApres: number;
  matchedItemId?: string;
  stockActuel: number;
  pruActuel: number;
}

function newRapideLine(): RapideLine {
  return {
    id: `rl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    marque: "", reference: "",
    categorie: "montures-optiques",
    quantite: 1, paHT: 0, pv: 0, pruApres: 0,
    stockActuel: 0, pruActuel: 0,
  };
}

/* ─── Merge stock with overrides ────────────────────────────────── */
function mergeStock(overrides: ItemOverrides): StockItem[] {
  return STOCK.map(item => {
    const ov = overrides[item.id];
    if (!ov) return item;
    return {
      ...item,
      quantite:  ov.quantite  ?? item.quantite,
      pru:       ov.pru       ?? item.pru,
      prixVente: ov.prixVente ?? item.prixVente,
    };
  });
}

/* ─── Mock mouvements initiaux ───────────────────────────────────── */
const MOCK_MOUVEMENTS: MouvementStock[] = [
  {
    id: "mock-1",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "entree",
    itemId: "mo-rb-01",
    designation: "RB5154 Clubmaster",
    marque: "Ray-Ban",
    categorie: "montures-optiques",
    quantite: 5,
    prixAchatHT: 45,
    pruAvant: 45,
    pruApres: 45,
    stockAvant: 3,
    stockApres: 8,
    numeroBL: "BL-2026-0341",
    fournisseur: "Luxottica Group",
    operateur: "Gérant",
  },
  {
    id: "mock-2",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    type: "sortie_vente",
    itemId: "ms-rb-01",
    designation: "Aviator RB3025",
    marque: "Ray-Ban",
    categorie: "montures-solaires",
    quantite: 2,
    prixVenteTTC: 175,
    stockAvant: 17,
    stockApres: 15,
    devisRef: "DEV-2026-0087",
    operateur: "Opticien A",
  },
  {
    id: "mock-3",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    type: "sortie_casse",
    itemId: "mo-sil-01",
    designation: "Momentum Full Rim",
    marque: "Silhouette",
    categorie: "montures-optiques",
    quantite: 1,
    stockAvant: 5,
    stockApres: 4,
    operateur: "Gérant",
    notes: "Monture tombée du présentoir — charnière cassée",
  },
  {
    id: "mock-4",
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    type: "entree",
    itemId: "ls-jj-01",
    designation: "Acuvue Oasys 1-Day",
    marque: "Johnson & Johnson",
    categorie: "lentilles-souples",
    quantite: 10,
    prixAchatHT: 20,
    pruAvant: 20,
    pruApres: 20,
    stockAvant: 8,
    stockApres: 18,
    numeroBL: "BL-2026-0298",
    fournisseur: "Johnson & Johnson Vision",
    operateur: "Gérant",
  },
  {
    id: "mock-5",
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    type: "ajustement_negatif",
    itemId: "acc-01",
    designation: "Spray nettoyant 30ml",
    marque: "Novacel",
    categorie: "accessoires",
    quantite: 5,
    stockAvant: 85,
    stockApres: 80,
    operateur: "Gérant",
    notes: "Inventaire — écart constaté",
  },
  {
    id: "mock-6",
    date: new Date(Date.now() - 86400000 * 14).toISOString(),
    type: "sortie_retour_fournisseur",
    itemId: "mo-cha-01",
    designation: "CH3282",
    marque: "Chanel",
    categorie: "montures-optiques",
    quantite: 1,
    stockAvant: 4,
    stockApres: 3,
    fournisseur: "Chanel SAS",
    operateur: "Gérant",
    notes: "Défaut de fabrication — retour SAV",
  },
];

/* ─── Mouvement badge ─────────────────────────────────────────────── */
const MVT_LABELS: Record<TypeMouvement, string> = {
  entree:                  "Entrée",
  sortie_vente:            "Sortie vente",
  sortie_casse:            "Casse",
  sortie_retour_fournisseur: "Retour fournisseur",
  ajustement_positif:      "Ajust. +",
  ajustement_negatif:      "Ajust. -",
};
const MVT_COLORS: Record<TypeMouvement, string> = {
  entree:                  "#10b981",
  sortie_vente:            "#2D8CFF",
  sortie_casse:            "#EF4444",
  sortie_retour_fournisseur: "#F59E0B",
  ajustement_positif:      "#8B5CF6",
  ajustement_negatif:      "#8B5CF6",
};

/* ─── Catégories ─────────────────────────────────────────────────── */
const CATEGORIES_DEFAULT: StockCategorie[] = [
  "montures-optiques",
  "montures-solaires",
  "lentilles-souples",
  "lentilles-rigides",
  "accessoires",
];
const CATEGORIES_VERRES: StockCategorie[] = [
  "verres-progressifs",
  "verres-simples",
];
const ALL_CATEGORIES: StockCategorie[] = [...CATEGORIES_DEFAULT, ...CATEGORIES_VERRES];

function qtyColor(item: StockItem): string {
  if (item.quantite <= item.quantiteMin) return "#EF4444";
  if (item.quantite <= item.quantiteMin * 2) return "#F59E0B";
  return "#00C98A";
}

/* ─── BL Line type ───────────────────────────────────────────────── */
interface BLLine {
  id: string;
  itemId: string;
  designation: string;
  marque: string;
  categorie: StockCategorie;
  quantite: number;
  paHT: number;
  pvFinal: number;
  pruApres: number;
  stockActuel: number;
  pruActuel: number;
}

/* ══════════════════════════════════════════════════════════════════
   MODAL COMMANDE FOURNISSEUR (Vision)
   ══════════════════════════════════════════════════════════════════ */
function CommandeVisionModal({
  item, onSave, onClose,
}: {
  item: { id: string; label: string; fournisseur: string; prixAchat: number; categorie: string };
  onSave: (cmd: Commande) => void;
  onClose: () => void;
}) {
  const [quantite, setQuantite] = useState(5);
  const [fournisseur, setFournisseur] = useState(item.fournisseur);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const glass2: CSSProperties = {
    background: "var(--glass-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid var(--glass-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
  };
  const inp: CSSProperties = {
    padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.35)",
    background: "var(--glass-strong-bg)", fontSize: 13, color: "#1e293b", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      const cmd: Commande = {
        id: `cmd-vis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        itemId: item.id,
        itemLabel: item.label,
        categorie: item.categorie,
        fournisseur: fournisseur || "—",
        quantite,
        prixAchatUnit: item.prixAchat,
        statut: "en_attente",
        notes: notes || undefined,
      };
      onSave(cmd);
      setSending(false);
      setSent(true);
      setTimeout(onClose, 1200);
    }, 1400);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glass2, borderRadius: 20, width: "100%", maxWidth: 460 }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(148,163,184,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>Passer une commande</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{item.label}</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Quantité à commander</label>
            <input style={inp} type="number" min={1} value={quantite} onChange={e => setQuantite(Math.max(1, Number(e.target.value)))} />
          </div>
          <div>
            <label style={lbl}>Fournisseur</label>
            <input style={inp} value={fournisseur} onChange={e => setFournisseur(e.target.value)} placeholder="Nom du fournisseur" />
          </div>
          <div>
            <label style={lbl}>Notes (optionnel)</label>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions, urgence…" />
          </div>
          <div style={{ background: "var(--glass-subtle-bg)", border: "1px solid var(--glass-subtle-border)", borderRadius: 12, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Montant estimé HT</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{(quantite * item.prixAchat).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(148,163,184,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSend} disabled={sending || sent}
            style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: sent ? "rgba(16,185,129,0.85)" : "#2D8CFF", fontSize: 13, fontWeight: 700, color: "#fff", cursor: sending || sent ? "default" : "pointer", minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {sent ? "✓ Envoyée !" : sending ? "Envoi en cours…" : "Envoyer la commande"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ══════════════════════════════════════════════════════════════════ */
export default function StockPage() {
  const [mounted, setMounted]       = useState(false);
  const [activeTab, setActiveTab]   = useState<MainTab>("stock");
  const [toastMsg, setToastMsg]     = useState<string | null>(null);

  /* ── State stock data ───────────────────────────────────────── */
  const [overrides, setOverrides]       = useState<ItemOverrides>({});
  const [mouvements, setMouvements]     = useState<MouvementStock[]>([]);
  const [coeffsPerso, setCoeffsPerso]   = useState<CoeffsPerso>({});
  const [prixVerres, setPrixVerres]     = useState<PrixVerres>({});
  const [commandes, setCommandes]       = useState<Commande[]>([]);
  const [commandeItem, setCommandeItem] = useState<{ id: string; label: string; fournisseur: string; prixAchat: number; categorie: string } | null>(null);

  /* ── Onglet Stock filters ─────────────────────────────────── */
  const [showVerres, setShowVerres]       = useState(false);
  const [selectedCat, setSelectedCat]     = useState<StockCategorie | "tous">("tous");
  const [marqueSearch, setMarqueSearch]   = useState("");
  const [stockFilter, setStockFilter]     = useState<StockFilter>("tous");
  const [expandedIds, setExpandedIds]     = useState<Set<string>>(new Set());

  /* ── Onglet Mouvements filters ────────────────────────────── */
  const [mvtTypeFilter, setMvtTypeFilter]   = useState<MvtFilter>("tous");
  const [mvtCatFilter, setMvtCatFilter]     = useState<StockCategorie | "tous">("tous");
  const [mvtDateFilter, setMvtDateFilter]   = useState<DateFilter>("tout");

  /* ── Onglet Tarifs filters ────────────────────────────────── */
  const [tarifCatFilter, setTarifCatFilter]   = useState<StockCategorie | "tous">("tous");
  const [tarifMarqueFilter, setTarifMarqueFilter] = useState("");
  const [editingCoeff, setEditingCoeff]       = useState<StockCategorie | null>(null);
  const [editCoeffVal, setEditCoeffVal]       = useState("");
  const [editingPv, setEditingPv]             = useState<string | null>(null);
  const [editPvVal, setEditPvVal]             = useState("");

  /* ── Fenêtres modales ─────────────────────────────────────── */
  const [showBLWindow, setShowBLWindow]           = useState(false);
  const [showSortieWindow, setShowSortieWindow]   = useState(false);

  /* ── Saisie rapide state ─────────────────────────────────────── */
  const [blMode, setBlMode]         = useState<"search" | "rapide">("rapide");
  const [rapidLines, setRapidLines] = useState<RapideLine[]>([newRapideLine()]);
  const [customItems, setCustomItems] = useState<CustomItems>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [focusRefRowId, setFocusRefRowId] = useState<string | null>(null);
  const [rapidCategorie, setRapidCategorie] = useState<StockCategorie>("montures-optiques");
  const [marqueDropdownAnchor, setMarqueDropdownAnchor] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [fournisseurDropdownOpen, setFournisseurDropdownOpen] = useState(false);
  const [hasBLDraft, setHasBLDraft] = useState(false);
  const marqueRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const referenceRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ── Réception BL state ─────────────────────────────────── */
  const [blFournisseur, setBlFournisseur]   = useState("");
  const [blNumero, setBlNumero]             = useState("");
  const [blDate, setBlDate]                 = useState(() => new Date().toISOString().slice(0, 10));
  const [blOperateur, setBlOperateur]       = useState("");
  const [blLines, setBlLines]               = useState<BLLine[]>([]);
  const [blSearchQuery, setBlSearchQuery]   = useState("");
  const [blSearchResults, setBlSearchResults] = useState<StockItem[]>([]);
  const [showBlSearch, setShowBlSearch]     = useState(false);

  /* ── Sortie manuelle state ────────────────────────────────── */
  const [sortieSearch, setSortieSearch]       = useState("");
  const [sortieResults, setSortieResults]     = useState<StockItem[]>([]);
  const [showSortieSearch, setShowSortieSearch] = useState(false);
  const [sortieSelectedId, setSortieSelectedId] = useState("");
  const [sortieSelectedName, setSortieSelectedName] = useState("");
  const [sortieQte, setSortieQte]             = useState(1);
  const [sortieType, setSortieType]           = useState<"sortie_casse" | "sortie_retour_fournisseur" | "ajustement_negatif">("sortie_casse");
  const [sortieNotes, setSortieNotes]         = useState("");

  /* ── Mount ─────────────────────────────────────────────────── */
  useEffect(() => {
    const ov  = loadItemOverrides();
    setOverrides(ov);

    const rawMvt = loadMouvements();
    // Si pas encore de données, charger les mocks
    if (rawMvt.length === 0) {
      saveMouvements(MOCK_MOUVEMENTS);
      setMouvements(MOCK_MOUVEMENTS);
    } else {
      setMouvements(rawMvt);
    }

    setCoeffsPerso(loadCoeffsPerso());
    setPrixVerres(loadPrixVerres());
    setCustomItems(loadCustomItems());

    try { const r = localStorage.getItem(LS_COMMANDES); if (r) setCommandes(JSON.parse(r)); } catch {}

    const users     = loadUsers();
    const currentId = loadCurrentUserId();
    const current   = users.find(u => u.id === currentId);
    if (current) setBlOperateur(current.name);

    setMounted(true);
  }, []);

  useEffect(() => {
    if (focusRowId && marqueRefs.current[focusRowId]) {
      marqueRefs.current[focusRowId]!.focus();
      setFocusRowId(null);
    }
  }, [focusRowId, rapidLines]);

  useEffect(() => {
    if (focusRefRowId && referenceRefs.current[focusRefRowId]) {
      referenceRefs.current[focusRefRowId]!.focus();
      setFocusRefRowId(null);
    }
  }, [focusRefRowId, rapidLines]);

  useEffect(() => {
    setHasBLDraft(!!localStorage.getItem("thor_bl_draft"));
  }, []);

  if (!mounted) return null;

  /* ── Computed stock ─────────────────────────────────────────── */
  const stockData = [
    ...mergeStock(overrides),
    ...Object.values(customItems).map(ci => {
      const ov = overrides[ci.id];
      if (!ov) return ci;
      return { ...ci, quantite: ov.quantite ?? ci.quantite, pru: ov.pru ?? ci.pru, prixVente: ov.prixVente ?? ci.prixVente };
    }),
  ];
  const alertes   = getAlertesStock(); // utilise STOCK brut pour les alertes

  /* ── KPI ────────────────────────────────────────────────────── */
  const activeItems = stockData.filter(i => i.actif);
  const kpi = {
    totalRefs:       activeItems.length,
    valeurAchatHT:   activeItems.reduce((s, i) => s + i.quantite * i.pru, 0),
    valeurVenteTTC:  activeItems.reduce((s, i) => s + i.quantite * i.prixVente, 0),
    margePotentielle: activeItems.reduce((s, i) => s + i.quantite * (i.prixVente - i.pru), 0),
    alertesBas:      activeItems.filter(i => i.quantite <= i.quantiteMin).length,
  };

  /* ── Toast ──────────────────────────────────────────────────── */
  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }

  /* ── Commandes ──────────────────────────────────────────────── */
  function saveCommandesState(data: Commande[]) {
    setCommandes(data);
    localStorage.setItem(LS_COMMANDES, JSON.stringify(data));
  }
  function addCommande(cmd: Commande) {
    saveCommandesState([cmd, ...commandes]);
    showToast(`Commande envoyée : ${cmd.quantite}× ${cmd.itemLabel}`);
  }
  function updateCommandeStatut(id: string, statut: CommandeStatut) {
    const updated = commandes.map(c => c.id === id ? { ...c, statut, dateLivraison: statut === "livree" ? new Date().toISOString() : c.dateLivraison } : c);
    saveCommandesState(updated);
    if (statut === "livree") {
      const cmd = commandes.find(c => c.id === id);
      if (cmd) showToast(`Livraison confirmée : +${cmd.quantite} ${cmd.itemLabel}`);
    }
  }

  /* ── Toggle description ─────────────────────────────────────── */
  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  /* ── Filtered stock ─────────────────────────────────────────── */
  const CATS_VISIBLE: (StockCategorie | "tous")[] = [
    "tous",
    ...CATEGORIES_DEFAULT,
    ...(showVerres ? CATEGORIES_VERRES : []),
  ];

  const filteredStock = stockData.filter(item => {
    if (!item.actif) return false;
    if (!showVerres && CATEGORIES_VERRES.includes(item.categorie)) return false;
    if (selectedCat !== "tous" && item.categorie !== selectedCat) return false;
    if (marqueSearch.trim()) {
      const q = marqueSearch.toLowerCase();
      if (!item.marque.toLowerCase().includes(q) && !item.reference.toLowerCase().includes(q)) return false;
    }
    if (stockFilter === "bas" && item.quantite > item.quantiteMin) return false;
    if (stockFilter === "rupture" && item.quantite > 0) return false;
    return true;
  });

  /* ── Filtered mouvements ────────────────────────────────────── */
  const now = Date.now();
  const filteredMvt = mouvements.filter(m => {
    if (mvtTypeFilter === "entree" && m.type !== "entree") return false;
    if (mvtTypeFilter === "sortie" && !m.type.startsWith("sortie") && !m.type.startsWith("ajustement")) return false;
    if (mvtCatFilter !== "tous" && m.categorie !== mvtCatFilter) return false;
    if (mvtDateFilter === "semaine") {
      if (now - new Date(m.date).getTime() > 7 * 86400000) return false;
    } else if (mvtDateFilter === "mois") {
      if (now - new Date(m.date).getTime() > 30 * 86400000) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  /* ── Filtered tarifs ────────────────────────────────────────── */
  const filteredTarifs = stockData.filter(item => {
    if (!item.actif) return false;
    if (tarifCatFilter !== "tous" && item.categorie !== tarifCatFilter) return false;
    if (tarifMarqueFilter.trim()) {
      const q = tarifMarqueFilter.toLowerCase();
      if (!item.marque.toLowerCase().includes(q) && !item.reference.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Coeff effectif ─────────────────────────────────────────── */
  function getCoeffEffectif(cat: StockCategorie): number {
    return coeffsPerso[cat] ?? COEFFICIENTS_MARCHE[cat].moy;
  }

  /* ── Sauvegarder coeff perso ──────────────────────────────── */
  function saveCoeff(cat: StockCategorie, val: string) {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) return;
    const next = { ...coeffsPerso, [cat]: n };
    setCoeffsPerso(next);
    saveCoeffsPerso(next);
    setEditingCoeff(null);
  }

  /* ── Appliquer PV conseillé ───────────────────────────────── */
  function applyPvConseille(item: StockItem) {
    const coeff  = getCoeffEffectif(item.categorie);
    const pvNew  = calcPvConseille(item.prixAchat, coeff);
    const next   = { ...overrides, [item.id]: { ...(overrides[item.id] ?? {}), prixVente: pvNew } };
    setOverrides(next);
    saveItemOverrides(next);
    showToast(`PV de ${item.marque} ${item.reference} mis à jour : ${formatEur(pvNew)}`);
  }

  /* ── Modifier PV inline ───────────────────────────────────── */
  function startEditPv(item: StockItem) {
    setEditingPv(item.id);
    const cur = overrides[item.id]?.prixVente ?? item.prixVente;
    setEditPvVal(cur.toFixed(2));
  }

  function savePvInline(item: StockItem) {
    const n = parseFloat(editPvVal);
    if (!isNaN(n) && n > 0) {
      const next = { ...overrides, [item.id]: { ...(overrides[item.id] ?? {}), prixVente: n } };
      setOverrides(next);
      saveItemOverrides(next);
      showToast(`PV de ${item.marque} ${item.reference} mis à jour : ${formatEur(n)}`);
    }
    setEditingPv(null);
  }

  /* ── Définir prix devis verre ─────────────────────────────── */
  function setPrixDevis(itemId: string, prix: number) {
    const next = { ...prixVerres, [itemId]: prix };
    setPrixVerres(next);
    savePrixVerres(next);
    showToast("Prix devis enregistré pour ce verre.");
  }

  /* ── Suggestion même PA monture ──────────────────────────── */
  function getSuggestionMonture(item: StockItem): { ref: string; pvSuggere: number } | null {
    if (!["montures-optiques", "montures-solaires"].includes(item.categorie)) return null;
    const same = stockData.find(
      other => other.id !== item.id
        && other.marque === item.marque
        && other.prixAchat === item.prixAchat
        && (overrides[other.id]?.prixVente ?? other.prixVente) !== item.prixVente
    );
    if (!same) return null;
    return {
      ref: same.reference,
      pvSuggere: overrides[same.id]?.prixVente ?? same.prixVente,
    };
  }

  /* ══ BL WINDOW LOGIC ═══════════════════════════════════════ */
  function handleBlSearch(q: string) {
    setBlSearchQuery(q);
    if (q.trim().length < 2) { setBlSearchResults([]); return; }
    const lower = q.toLowerCase();
    setBlSearchResults(
      stockData.filter(i =>
        i.actif && (
          i.marque.toLowerCase().includes(lower) ||
          i.reference.toLowerCase().includes(lower)
        )
      ).slice(0, 8)
    );
  }

  function addBLLine(item: StockItem) {
    const curOv     = overrides[item.id];
    const pruActuel = curOv?.pru ?? item.pru;
    const qteAct    = curOv?.quantite ?? item.quantite;
    const qteEntree = 1;
    const paHT      = item.prixAchat;
    const pruApres  = calcNouveauPru(qteAct, pruActuel, qteEntree, paHT);
    const coeff     = getCoeffEffectif(item.categorie);
    const pvFinal   = calcPvConseille(paHT, coeff);

    const line: BLLine = {
      id:          uid(),
      itemId:      item.id,
      designation: item.reference,
      marque:      item.marque,
      categorie:   item.categorie,
      quantite:    qteEntree,
      paHT,
      pvFinal,
      pruApres,
      stockActuel: qteAct,
      pruActuel,
    };
    setBlLines(prev => [...prev, line]);
    setBlSearchQuery("");
    setBlSearchResults([]);
    setShowBlSearch(false);
  }

  function updateBLLine(lineId: string, field: "quantite" | "paHT" | "pvFinal", val: number) {
    setBlLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const updated = { ...l, [field]: val };
      if (field === "quantite" || field === "paHT") {
        updated.pruApres = calcNouveauPru(updated.stockActuel, updated.pruActuel, updated.quantite, updated.paHT);
      }
      return updated;
    }));
  }

  function removeBLLine(lineId: string) {
    setBlLines(prev => prev.filter(l => l.id !== lineId));
  }

  function validateBL() {
    if (blLines.length === 0) { showToast("Aucune ligne à valider."); return; }
    const newMvts: MouvementStock[] = [];
    const newOverrides = { ...overrides };

    blLines.forEach(line => {
      const curOv      = newOverrides[line.itemId] ?? {};
      const pruActuel  = curOv.pru ?? STOCK.find(i => i.id === line.itemId)!.pru;
      const qteActuel  = curOv.quantite ?? STOCK.find(i => i.id === line.itemId)!.quantite;
      const pruApres   = calcNouveauPru(qteActuel, pruActuel, line.quantite, line.paHT);
      const stockApres = qteActuel + line.quantite;

      newOverrides[line.itemId] = {
        ...curOv,
        quantite:  stockApres,
        pru:       pruApres,
        prixVente: line.pvFinal,
      };

      newMvts.push({
        id:          uid(),
        date:        new Date().toISOString(),
        type:        "entree",
        itemId:      line.itemId,
        designation: line.designation,
        marque:      line.marque,
        categorie:   line.categorie,
        quantite:    line.quantite,
        prixAchatHT: line.paHT,
        pruAvant:    pruActuel,
        pruApres,
        stockAvant:  qteActuel,
        stockApres,
        numeroBL:    blNumero || undefined,
        fournisseur: blFournisseur || undefined,
        operateur:   blOperateur || undefined,
      });
    });

    const allMvt = [...newMvts, ...mouvements];
    setOverrides(newOverrides);
    saveItemOverrides(newOverrides);
    setMouvements(allMvt);
    saveMouvements(allMvt);

    showToast(`${blLines.length} ligne${blLines.length > 1 ? "s" : ""} réceptionnée${blLines.length > 1 ? "s" : ""}. Stock mis à jour.`);
    setShowBLWindow(false);
    setBlLines([]);
    setBlFournisseur(""); setBlNumero(""); setBlOperateur("");
  }

  /* ══ SORTIE WINDOW LOGIC ═══════════════════════════════════ */
  function handleSortieSearch(q: string) {
    setSortieSearch(q);
    if (q.trim().length < 2) { setSortieResults([]); return; }
    const lower = q.toLowerCase();
    setSortieResults(
      stockData.filter(i =>
        i.actif && (
          i.marque.toLowerCase().includes(lower) ||
          i.reference.toLowerCase().includes(lower)
        )
      ).slice(0, 8)
    );
  }

  function validateSortie() {
    if (!sortieSelectedId) { showToast("Veuillez sélectionner un produit."); return; }
    const item     = stockData.find(i => i.id === sortieSelectedId);
    if (!item) return;
    const curOv    = overrides[sortieSelectedId] ?? {};
    const qteAct   = curOv.quantite ?? item.quantite;
    if (sortieQte > qteAct) { showToast("Quantité supérieure au stock disponible."); return; }

    const stockApres = qteAct - sortieQte;
    const newOv = { ...overrides, [sortieSelectedId]: { ...curOv, quantite: stockApres } };
    setOverrides(newOv);
    saveItemOverrides(newOv);

    const mvt: MouvementStock = {
      id:          uid(),
      date:        new Date().toISOString(),
      type:        sortieType,
      itemId:      sortieSelectedId,
      designation: item.reference,
      marque:      item.marque,
      categorie:   item.categorie,
      quantite:    sortieQte,
      stockAvant:  qteAct,
      stockApres,
      operateur:   blOperateur || undefined,
      notes:       sortieNotes || undefined,
    };

    const allMvt = [mvt, ...mouvements];
    setMouvements(allMvt);
    saveMouvements(allMvt);

    showToast(`Sortie enregistrée — ${item.marque} ${item.reference} (−${sortieQte})`);
    setShowSortieWindow(false);
    setSortieSelectedId(""); setSortieSelectedName("");
    setSortieSearch(""); setSortieQte(1); setSortieNotes("");
  }

  /* ── Ouvrir modale entrée pour un item spécifique ─────────── */
  function openEntreeRapide(item: StockItem) {
    setBlMode("search");
    setShowBLWindow(true);
    setBlLines([]);
    // On pré-ajoute la ligne immédiatement
    const curOv     = overrides[item.id];
    const pruActuel = curOv?.pru ?? item.pru;
    const qteAct    = curOv?.quantite ?? item.quantite;
    const paHT      = item.prixAchat;
    const coeff     = getCoeffEffectif(item.categorie);
    const pvFinal   = calcPvConseille(paHT, coeff);
    const line: BLLine = {
      id: uid(), itemId: item.id, designation: item.reference,
      marque: item.marque, categorie: item.categorie,
      quantite: 1, paHT, pvFinal,
      pruApres: calcNouveauPru(qteAct, pruActuel, 1, paHT),
      stockActuel: qteAct, pruActuel,
    };
    setBlLines([line]);
  }

  function openSortieRapide(item: StockItem) {
    setShowSortieWindow(true);
    setSortieSelectedId(item.id);
    setSortieSelectedName(`${item.marque} ${item.reference}`);
    setSortieSearch(`${item.marque} ${item.reference}`);
    setSortieQte(1);
    setSortieType("sortie_casse");
    setSortieNotes("");
  }

  /* ══ RAPIDE MODE LOGIC ════════════════════════════════════════ */
  function matchInCatalog(marque: string, reference: string): { itemId: string; stockActuel: number; pruActuel: number } | null {
    if (!marque.trim() || !reference.trim()) return null;
    const lm = marque.trim().toLowerCase();
    const lr = reference.trim().toLowerCase();
    const found = stockData.find(i =>
      i.marque.toLowerCase() === lm &&
      i.reference.toLowerCase() === lr
    );
    if (!found) return null;
    const ov = overrides[found.id];
    return { itemId: found.id, stockActuel: ov?.quantite ?? found.quantite, pruActuel: ov?.pru ?? found.pru };
  }

  function updateRapideField(lineId: string, field: keyof RapideLine, val: string | number) {
    setRapidLines(prev => prev.map(l => {
      if (l.id !== lineId) return l;
      const u: RapideLine = { ...l, [field]: val };

      if (field === "marque" || field === "reference") {
        const match = matchInCatalog(
          field === "marque" ? val as string : u.marque,
          field === "reference" ? val as string : u.reference,
        );
        if (match) {
          u.matchedItemId = match.itemId;
          u.stockActuel   = match.stockActuel;
          u.pruActuel     = match.pruActuel;
        } else {
          u.matchedItemId = undefined;
          u.stockActuel   = 0;
          u.pruActuel     = u.paHT;
        }
      }

      if (["quantite", "paHT", "marque", "reference"].includes(field as string)) {
        u.pruApres = calcNouveauPru(u.stockActuel, u.pruActuel, u.quantite, u.paHT);
      }
      // Recalculate PV whenever PA HT changes (always override with suggested price)
      if (field === "paHT" && u.paHT > 0) {
        u.pv = calcPvConseille(u.paHT, getCoeffEffectif(u.categorie));
      }

      return u;
    }));
  }

  function pauseBL() {
    localStorage.setItem("thor_bl_draft", JSON.stringify({
      blFournisseur, blNumero, blDate, blOperateur,
      rapidLines, blMode, rapidCategorie,
      savedAt: new Date().toISOString(),
    }));
    setShowBLWindow(false);
    setHasBLDraft(true);
  }

  function resumeBL() {
    const raw = localStorage.getItem("thor_bl_draft");
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.blFournisseur !== undefined) setBlFournisseur(d.blFournisseur);
      if (d.blNumero !== undefined) setBlNumero(d.blNumero);
      if (d.blDate !== undefined) setBlDate(d.blDate);
      if (d.blOperateur !== undefined) setBlOperateur(d.blOperateur);
      if (d.rapidLines?.length) setRapidLines(d.rapidLines);
      if (d.blMode) setBlMode(d.blMode);
      if (d.rapidCategorie) setRapidCategorie(d.rapidCategorie);
    } catch {}
    localStorage.removeItem("thor_bl_draft");
    setHasBLDraft(false);
    setShowBLWindow(true);
  }

  function addRapideLine() {
    const newLine = { ...newRapideLine(), categorie: rapidCategorie };
    setRapidLines(prev => [...prev, newLine]);
    setFocusRowId(newLine.id);
  }

  function addRapideLineWithMarque(marque: string) {
    const newLine = { ...newRapideLine(), categorie: rapidCategorie, marque };
    setRapidLines(prev => [...prev, newLine]);
    setFocusRefRowId(newLine.id);
  }

  function changeRapideCategorie(cat: StockCategorie) {
    setRapidCategorie(cat);
    setRapidLines(prev => prev.map(l => {
      const newPv = l.paHT > 0 ? calcPvConseille(l.paHT, getCoeffEffectif(cat)) : l.pv;
      return { ...l, categorie: cat, pv: newPv };
    }));
  }

  function removeRapideLine(lineId: string) {
    setRapidLines(prev => prev.length > 1 ? prev.filter(l => l.id !== lineId) : prev);
  }

  function validateRapide() {
    const validLines = rapidLines.filter(l => l.marque.trim() && l.reference.trim() && l.quantite > 0);
    if (validLines.length === 0) { showToast("Aucune ligne valide (marque + référence requis)."); return; }

    const newMvts: MouvementStock[] = [];
    const newOv   = { ...overrides };
    const newCust = { ...customItems };

    validLines.forEach(line => {
      // Final match attempt in case user typed after last update
      const match = matchInCatalog(line.marque, line.reference);
      let itemId = match?.itemId ?? line.matchedItemId;

      if (!itemId) {
        itemId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const pa120 = line.paHT * 1.2;
        const pvFinal = line.pv > 0 ? line.pv : calcPvConseille(line.paHT, getCoeffEffectif(line.categorie));
        newCust[itemId] = {
          id: itemId,
          categorie: line.categorie,
          marque: line.marque.trim(),
          reference: line.reference.trim(),
          description: "",
          quantite: 0,
          quantiteMin: 2,
          prixAchat: line.paHT,
          prixVente: pvFinal,
          pru: line.paHT,
          coeff: pa120 > 0 ? pvFinal / pa120 : 1,
          margeEuros: pvFinal - pa120,
          margePct: pvFinal > 0 ? ((pvFinal - pa120) / pvFinal * 100) : 0,
          fournisseur: blFournisseur || "",
          delaiReappro: 7,
          actif: true,
        };
      }

      const baseItem = STOCK.find(i => i.id === itemId) ?? newCust[itemId];
      const curOv    = newOv[itemId] ?? {};
      const qteAct   = curOv.quantite ?? (customItems[itemId]?.quantite ?? baseItem?.quantite ?? 0);
      const pruAct   = curOv.pru     ?? (customItems[itemId]?.pru     ?? baseItem?.pru     ?? line.paHT);
      const pvFinal  = line.pv > 0 ? line.pv : calcPvConseille(line.paHT, getCoeffEffectif(line.categorie));
      const pruApres = calcNouveauPru(qteAct, pruAct, line.quantite, line.paHT);
      const stockAp  = qteAct + line.quantite;

      newOv[itemId] = { ...curOv, quantite: stockAp, pru: pruApres, prixVente: pvFinal };

      newMvts.push({
        id:          uid(),
        date:        new Date().toISOString(),
        type:        "entree",
        itemId,
        designation: line.reference.trim(),
        marque:      line.marque.trim(),
        categorie:   line.categorie,
        quantite:    line.quantite,
        prixAchatHT: line.paHT,
        pruAvant:    pruAct,
        pruApres,
        stockAvant:  qteAct,
        stockApres:  stockAp,
        numeroBL:    blNumero    || undefined,
        fournisseur: blFournisseur || undefined,
        operateur:   blOperateur || undefined,
      });
    });

    setOverrides(newOv);
    saveItemOverrides(newOv);

    const allMvt = [...newMvts, ...mouvements];
    setMouvements(allMvt);
    saveMouvements(allMvt);

    const newCustomCount = Object.keys(newCust).length;
    const oldCustomCount = Object.keys(customItems).length;
    if (newCustomCount !== oldCustomCount) {
      setCustomItems(newCust);
      saveCustomItems(newCust);
    }

    const newCount = newMvts.filter(m => !Object.keys(customItems).length || true).length;
    showToast(`${newCount} ligne${newCount > 1 ? "s" : ""} réceptionnée${newCount > 1 ? "s" : ""}. Stock mis à jour.`);
    setShowBLWindow(false);
    setRapidLines([newRapideLine()]);
    setBlFournisseur(""); setBlNumero(""); setBlOperateur("");
  }

  /* ─── Styles ────────────────────────────────────────────────── */
  const pillBase: CSSProperties = {
    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
    cursor: "pointer", border: "1px solid transparent", transition: "all 0.15s",
  };
  const btnPrimary: CSSProperties = {
    background: "#2D8CFF",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "8px 18px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", boxShadow: "0 2px 8px rgba(45,140,255,0.30)",
  };
  const btnDanger: CSSProperties = {
    background: "linear-gradient(135deg, #EF4444, #DC2626)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "8px 18px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", boxShadow: "0 2px 8px rgba(239,68,68,0.30)",
  };
  const btnGhost: CSSProperties = {
    background: "rgba(0,0,0,0.04)", color: "#64748b",
    border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8,
    padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer",
  };
  const inputStyle: CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.10)", background: "var(--glass-strong-bg)",
    fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box",
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ── Toast ── */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, ...glass, borderRadius: 14, padding: "14px 24px",
          fontSize: 14, fontWeight: 500, color: "#0f172a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)", maxWidth: 520, textAlign: "center",
        }}>
          {toastMsg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#00C98A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,201,138,0.30)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Gestion du Stock
              </h1>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0, paddingLeft: 56 }}>
              Inventaire · Mouvements · Tarifs
            </p>
          </div>
          {alertes.length > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.30)",
              borderRadius: 12, padding: "8px 16px",
            }}>
              <span style={{ fontSize: 16 }}>&#9888;</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>
                {alertes.length} référence{alertes.length > 1 ? "s" : ""} en stock bas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Références", val: kpi.totalRefs.toString(), sub: "produits actifs", color: "#2D8CFF", bg: "rgba(45,140,255,0.12)" },
          { label: "Valeur achat HT", val: formatEur(kpi.valeurAchatHT), sub: "au PRU", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
          { label: "Valeur vente TTC", val: formatEur(kpi.valeurVenteTTC), sub: "PV TTC", color: "#047857", bg: "rgba(0,201,138,0.12)" },
          { label: "Marge potentielle", val: formatEur(kpi.margePotentielle), sub: "Vente − Achat", color: "#B45309", bg: "rgba(245,158,11,0.12)" },
          { label: "Alertes stock bas", val: kpi.alertesBas.toString(), sub: "en dessous du min", color: "#991B1B", bg: "rgba(239,68,68,0.12)" },
        ].map(({ label, val, sub, color, bg }) => (
          <div key={label} style={{ ...glass, borderRadius: 16, padding: "18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ fontSize: label === "Références" || label === "Alertes stock bas" ? 28 : 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {val}
            </div>
            <span style={{ display: "inline-flex", background: bg, color, borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>
              {sub}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, ...glassSubtle, borderRadius: 14, padding: 5, marginBottom: 20, width: "fit-content" }}>
        {([
          { key: "stock",      label: "Stock" },
          { key: "mouvements", label: "Mouvements" },
          { key: "tarifs",     label: "Tarifs" },
          { key: "commandes",  label: `Commandes${commandes.filter(c => c.statut === "en_attente" || c.statut === "confirmee").length > 0 ? ` (${commandes.filter(c => c.statut === "en_attente" || c.statut === "confirmee").length})` : ""}` },
        ] as { key: MainTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none",
              fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: activeTab === key ? "#2D8CFF" : "transparent",
              color: activeTab === key ? "#fff" : "#64748b",
              boxShadow: activeTab === key ? "0 2px 8px rgba(45,140,255,0.25)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ONGLET 1 — STOCK
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div>
          {/* Filtres */}
          <div style={{ ...glass, borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
            {/* Catégorie pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {CATS_VISIBLE.map(cat => {
                const isActive = selectedCat === cat;
                const color = cat === "tous" ? "#0f172a" : CATEGORIE_COLORS[cat];
                return (
                  <button key={cat} onClick={() => setSelectedCat(cat)} style={{
                    ...pillBase,
                    background: isActive ? (cat === "tous" ? "#0f172a" : color) : "rgba(255,255,255,0.55)",
                    color: isActive ? "#fff" : "#334155",
                    border: isActive ? "1px solid transparent" : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: isActive ? `0 2px 8px ${cat === "tous" ? "rgba(15,23,42,0.2)" : color + "44"}` : "none",
                  }}>
                    {cat === "tous" ? "Tous" : CATEGORIE_LABELS[cat]}
                  </button>
                );
              })}
            </div>

            {/* Toggle verres */}
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => { setShowVerres(v => !v); setSelectedCat("tous"); }} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 999,
                background: showVerres ? "rgba(45,140,255,0.12)" : "rgba(0,0,0,0.04)",
                border: showVerres ? "1px solid rgba(45,140,255,0.3)" : "1px solid rgba(0,0,0,0.08)",
                color: showVerres ? "#1D6FCC" : "#94a3b8",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {showVerres ? "Masquer les verres" : "Afficher les verres (référence catalogue)"}
              </button>
            </div>

            {/* Recherche + filtre statut */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Recherche marque ou référence…" value={marqueSearch}
                  onChange={e => setMarqueSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
              <div style={{ display: "flex", gap: 4, ...glassSubtle, borderRadius: 12, padding: 4 }}>
                {(["tous", "bas", "rupture"] as StockFilter[]).map(f => (
                  <button key={f} onClick={() => setStockFilter(f)} style={{
                    padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "none", transition: "all 0.15s",
                    background: stockFilter === f
                      ? f === "rupture" ? "linear-gradient(135deg,#0f172a,#334155)"
                        : f === "bas"   ? "linear-gradient(135deg,#EF4444,#DC2626)"
                        : "#2D8CFF"
                      : "transparent",
                    color: stockFilter === f ? "#fff" : "#64748b",
                    boxShadow: stockFilter === f ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}>
                    {f === "tous" ? "Tous" : f === "bas" ? "Stock bas" : "Rupture"}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                {filteredStock.length} référence{filteredStock.length > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Tableau stock */}
          <div style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {[
                      { label: "Réf produit",  align: "left"   },
                      { label: "Marque",        align: "left"   },
                      { label: "Qté / Min",     align: "right"  },
                      { label: "P.R.U",         align: "right"  },
                      { label: "PA HT",         align: "right"  },
                      { label: "PV TTC",        align: "right"  },
                      { label: "Coeff",         align: "right"  },
                      { label: "Actions",       align: "center" },
                    ].map((h, i) => (
                      <th key={i} style={{
                        textAlign: h.align as CSSProperties["textAlign"],
                        padding: "12px 14px", fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
                        whiteSpace: "nowrap", borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                        Aucun produit ne correspond aux filtres
                      </td>
                    </tr>
                  )}
                  {filteredStock.map((item, i) => {
                    const dotColor  = qtyColor(item);
                    const isLow     = item.quantite <= item.quantiteMin;
                    const isMedium  = !isLow && item.quantite <= item.quantiteMin * 2;
                    const catColor  = CATEGORIE_COLORS[item.categorie];
                    const coeffEff  = (item.prixVente / (item.prixAchat * 1.2));
                    const isExpanded = expandedIds.has(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        <tr style={{
                          borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.05)",
                          background: isLow ? "rgba(239,68,68,0.03)" : isMedium ? "rgba(245,158,11,0.02)" : "transparent",
                        }}>
                          {/* Réf produit */}
                          <td style={{ padding: "12px 14px", minWidth: 200 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                display: "inline-block",
                                background: catColor + "18", color: catColor,
                                borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 600,
                              }}>
                                {CATEGORIE_LABELS[item.categorie]}
                              </span>
                            </div>
                            <div style={{ fontWeight: 600, color: "#0f172a", marginTop: 4 }}>
                              {item.reference}
                            </div>
                          </td>

                          {/* Marque */}
                          <td style={{ padding: "12px 14px", color: "#334155", fontWeight: 500 }}>
                            {item.marque}
                          </td>

                          {/* Qté / Min */}
                          <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                              {isLow && (
                                <span style={{
                                  background: "#EF444418", color: "#EF4444",
                                  borderRadius: 6, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                                }}>BAS</span>
                              )}
                              {isMedium && (
                                <span style={{
                                  background: "#F59E0B18", color: "#F59E0B",
                                  borderRadius: 6, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                                }}>FAIBLE</span>
                              )}
                              <div style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: dotColor, boxShadow: `0 0 4px ${dotColor}80`,
                              }} />
                              <span style={{ fontWeight: 700, color: dotColor }}>{item.quantite}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>/ {item.quantiteMin}</span>
                            </div>
                          </td>

                          {/* PRU */}
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#8B5CF6", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {formatEur(item.pru)}
                          </td>

                          {/* PA HT */}
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748b", whiteSpace: "nowrap" }}>
                            {formatEur(item.prixAchat)}
                          </td>

                          {/* PV TTC */}
                          <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600, color: "#047857", whiteSpace: "nowrap" }}>
                            {formatEur(item.prixVente)}
                          </td>

                          {/* Coeff */}
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748b", whiteSpace: "nowrap" }}>
                            ×{coeffEff.toFixed(2)}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "12px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button onClick={() => openEntreeRapide(item)} style={{
                                background: "rgba(16,185,129,0.12)", color: "#059669",
                                border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8,
                                padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                                + Entrée
                              </button>
                              <button onClick={() => openSortieRapide(item)} style={{
                                background: "rgba(239,68,68,0.10)", color: "#EF4444",
                                border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8,
                                padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                                − Sortie
                              </button>
                              <button onClick={() => setCommandeItem({ id: item.id, label: `${item.marque} ${item.reference}`, fournisseur: item.fournisseur, prixAchat: item.prixAchat, categorie: item.categorie })} style={{
                                background: "rgba(45,140,255,0.10)", color: "#2D8CFF",
                                border: "1px solid rgba(45,140,255,0.3)", borderRadius: 8,
                                padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                              }}>
                                Commander
                              </button>
                              <button onClick={() => toggleExpanded(item.id)} style={{
                                background: isExpanded ? "rgba(45,140,255,0.12)" : "rgba(148,163,184,0.10)",
                                border: isExpanded ? "1px solid rgba(45,140,255,0.3)" : "1px solid rgba(148,163,184,0.2)",
                                borderRadius: 8, padding: "4px 8px", fontSize: 13,
                                cursor: "pointer", color: isExpanded ? "#1D6FCC" : "#94a3b8",
                              }}>
                                ℹ
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${item.id}-desc`} style={{ background: "rgba(45,140,255,0.03)" }}>
                            <td colSpan={8} style={{ padding: "0 16px 12px 32px" }}>
                              <div style={{
                                fontSize: 12, color: "#475569", fontStyle: "italic",
                                lineHeight: 1.6, paddingTop: 6,
                                borderLeft: "2px solid rgba(45,140,255,0.3)", paddingLeft: 12,
                              }}>
                                {item.description}
                                <span style={{ marginLeft: 16, fontStyle: "normal", color: "#94a3b8" }}>
                                  Fournisseur : {item.fournisseur} · Délai réappro : {item.delaiReappro}j
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer tableau */}
            {filteredStock.length > 0 && (
              <div style={{
                borderTop: "1px solid rgba(0,0,0,0.06)", padding: "12px 20px",
                display: "flex", alignItems: "center", gap: 24,
                background: "rgba(0,0,0,0.02)", flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  <b style={{ color: "#0f172a" }}>{filteredStock.length}</b> ligne{filteredStock.length > 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Valeur achat (PRU) :{" "}
                  <b style={{ color: "#8B5CF6" }}>
                    {formatEur(filteredStock.reduce((s, i) => s + i.quantite * i.pru, 0))}
                  </b>
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Valeur vente :{" "}
                  <b style={{ color: "#047857" }}>
                    {formatEur(filteredStock.reduce((s, i) => s + i.quantite * i.prixVente, 0))}
                  </b>
                </span>
                {filteredStock.filter(i => i.quantite <= i.quantiteMin).length > 0 && (
                  <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 600 }}>
                    &#9888; {filteredStock.filter(i => i.quantite <= i.quantiteMin).length} en stock bas
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET 2 — MOUVEMENTS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "mouvements" && (
        <div>
          {/* Header mouvements */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Journal des mouvements</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{mouvements.length} mouvement{mouvements.length > 1 ? "s" : ""} enregistré{mouvements.length > 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setBlFournisseur(""); setBlNumero(""); setBlLines([]); setRapidLines([newRapideLine()]); setBlMode("rapide"); setShowBLWindow(true); }} style={btnPrimary}>
                + Réception BL
              </button>
              {hasBLDraft && (
                <button onClick={resumeBL} style={{
                  padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: "rgba(245,158,11,0.12)", color: "#B45309",
                  border: "1px solid rgba(245,158,11,0.30)",
                }}>
                  ⏩ Reprendre BL
                </button>
              )}
              <button onClick={() => { setSortieSelectedId(""); setSortieSelectedName(""); setSortieSearch(""); setShowSortieWindow(true); }} style={btnDanger}>
                − Sortie manuelle
              </button>
            </div>
          </div>

          {/* Filtres mouvements */}
          <div style={{ ...glass, borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              {/* Type */}
              <div style={{ display: "flex", gap: 4, ...glassSubtle, borderRadius: 12, padding: 4 }}>
                {([
                  { key: "tous", label: "Tous" },
                  { key: "entree", label: "Entrées" },
                  { key: "sortie", label: "Sorties" },
                ] as { key: MvtFilter; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setMvtTypeFilter(key)} style={{
                    padding: "5px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "none",
                    background: mvtTypeFilter === key ? "#2D8CFF" : "transparent",
                    color: mvtTypeFilter === key ? "#fff" : "#64748b",
                  }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Catégorie */}
              <select value={mvtCatFilter} onChange={e => setMvtCatFilter(e.target.value as StockCategorie | "tous")}
                style={{ ...inputStyle, width: "auto", paddingRight: 24 }}>
                <option value="tous">Toutes catégories</option>
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
              </select>

              {/* Date */}
              <div style={{ display: "flex", gap: 4, ...glassSubtle, borderRadius: 12, padding: 4 }}>
                {([
                  { key: "tout",    label: "Tout" },
                  { key: "mois",    label: "Ce mois" },
                  { key: "semaine", label: "Cette semaine" },
                ] as { key: DateFilter; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setMvtDateFilter(key)} style={{
                    padding: "5px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "none",
                    background: mvtDateFilter === key ? "#2D8CFF" : "transparent",
                    color: mvtDateFilter === key ? "#fff" : "#64748b",
                  }}>
                    {label}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: 13, color: "#94a3b8" }}>{filteredMvt.length} ligne{filteredMvt.length > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Tableau mouvements */}
          <div style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {["Date", "Type", "Produit", "Marque", "Qté", "PA HT / PV TTC", "BL / Réf", "Opérateur", "Notes"].map((h, i) => (
                      <th key={i} style={{
                        textAlign: "left", padding: "12px 14px", fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
                        whiteSpace: "nowrap", borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMvt.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                        Aucun mouvement
                      </td>
                    </tr>
                  )}
                  {filteredMvt.map((m, i) => {
                    const col = MVT_COLORS[m.type];
                    return (
                      <tr key={m.id} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                          {fmtDate(m.date)}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            display: "inline-block",
                            background: col + "18", color: col,
                            borderRadius: 7, padding: "3px 9px", fontSize: 11, fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}>
                            {MVT_LABELS[m.type]}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>
                          {m.designation}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#475569" }}>
                          {m.marque}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: m.type === "entree" || m.type === "ajustement_positif" ? "#10b981" : "#EF4444" }}>
                          {m.type === "entree" || m.type === "ajustement_positif" ? "+" : "−"}{m.quantite}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                          {m.prixAchatHT != null ? formatEur(m.prixAchatHT) + " HT"
                           : m.prixVenteTTC != null ? formatEur(m.prixVenteTTC) + " TTC"
                           : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                          {m.numeroBL ?? m.devisRef ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                          {m.operateur ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12, maxWidth: 180 }}>
                          {m.notes ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET 3 — TARIFS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "tarifs" && (
        <div>
          {/* Section A — Coefficients par catégorie */}
          <div style={{ ...glass, borderRadius: 16, padding: "20px", marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>
              Coefficients par catégorie
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {["Catégorie", "Coeff min marché", "Coeff moy marché", "Coeff max marché", "Votre coeff"].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i === 0 ? "left" : "right",
                        padding: "10px 14px", fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_CATEGORIES.map((cat, i) => {
                    const ref      = COEFFICIENTS_MARCHE[cat];
                    const perso    = coeffsPerso[cat];
                    const eff      = perso ?? ref.moy;
                    const isEditing = editingCoeff === cat;
                    const catColor = CATEGORIE_COLORS[cat];
                    return (
                      <tr key={cat} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            display: "inline-block",
                            background: catColor + "18", color: catColor,
                            borderRadius: 7, padding: "3px 9px", fontSize: 12, fontWeight: 600,
                          }}>
                            {CATEGORIE_LABELS[cat]}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>×{ref.min}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>×{ref.moy}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>×{ref.max}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                              <input
                                type="number" step="0.1" value={editCoeffVal}
                                onChange={e => setEditCoeffVal(e.target.value)}
                                style={{ ...inputStyle, width: 80, textAlign: "right" }}
                                autoFocus
                              />
                              <button onClick={() => saveCoeff(cat, editCoeffVal)} style={btnPrimary}>OK</button>
                              <button onClick={() => setEditingCoeff(null)} style={btnGhost}>Annuler</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                              <span style={{
                                fontWeight: 700,
                                color: perso ? "#2D8CFF" : "#0f172a",
                              }}>
                                ×{eff}
                                {perso && <span style={{ fontSize: 10, marginLeft: 4, color: "#2D8CFF" }}>(perso)</span>}
                              </span>
                              <button
                                onClick={() => { setEditingCoeff(cat); setEditCoeffVal(eff.toString()); }}
                                style={btnGhost}
                              >
                                Modifier
                              </button>
                              {perso && (
                                <button
                                  onClick={() => {
                                    const next = { ...coeffsPerso };
                                    delete next[cat];
                                    setCoeffsPerso(next);
                                    saveCoeffsPerso(next);
                                  }}
                                  style={{ ...btnGhost, color: "#EF4444", borderColor: "rgba(239,68,68,0.3)" }}
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B — Grille tarifs produits */}
          <div style={{ ...glass, borderRadius: 16, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Tarifs produits
              </h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={tarifCatFilter} onChange={e => setTarifCatFilter(e.target.value as StockCategorie | "tous")}
                  style={{ ...inputStyle, width: "auto" }}>
                  <option value="tous">Toutes catégories</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
                </select>
                <div style={{ position: "relative" }}>
                  <input type="text" placeholder="Marque ou référence…"
                    value={tarifMarqueFilter} onChange={e => setTarifMarqueFilter(e.target.value)}
                    style={{ ...inputStyle, width: 200 }} />
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    {[
                      { label: "Produit",           align: "left"  },
                      { label: "PA HT",             align: "right" },
                      { label: "PRU",               align: "right" },
                      { label: "PV actuel",         align: "right" },
                      { label: "Coeff actuel",      align: "right" },
                      { label: "PV conseillé",      align: "right" },
                      { label: "Écart",             align: "right" },
                      { label: "Actions",           align: "center"},
                    ].map((h, i) => (
                      <th key={i} style={{
                        textAlign: h.align as CSSProperties["textAlign"],
                        padding: "10px 14px", fontSize: 11, fontWeight: 600,
                        color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap",
                      }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTarifs.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                        Aucun produit
                      </td>
                    </tr>
                  )}
                  {filteredTarifs.map((item, i) => {
                    const pvActuel   = overrides[item.id]?.prixVente ?? item.prixVente;
                    const coeffEff   = getCoeffEffectif(item.categorie);
                    const pvConseille = calcPvConseille(item.prixAchat, coeffEff);
                    const pvMin      = calcPvConseille(item.prixAchat, COEFFICIENTS_MARCHE[item.categorie].min);
                    const ecart      = pvActuel - pvConseille;
                    const coeffActuel = pvActuel / (item.prixAchat * 1.2);
                    const isOk       = pvActuel >= pvMin;
                    const suggestion = getSuggestionMonture(item);
                    const isVerre    = item.categorie === "verres-progressifs" || item.categorie === "verres-simples";
                    const isEditingThisPv = editingPv === item.id;
                    const prixDevisActuel = prixVerres[item.id];

                    return (
                      <tr key={item.id} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.05)" }}>
                        {/* Produit */}
                        <td style={{ padding: "10px 14px", minWidth: 200 }}>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.reference}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.marque}</div>
                          {suggestion && (
                            <div style={{
                              marginTop: 4, fontSize: 11,
                              background: "rgba(245,158,11,0.10)", color: "#B45309",
                              borderRadius: 6, padding: "2px 7px", display: "inline-block",
                            }}>
                              Même PA que {suggestion.ref} → PV suggéré {formatEur(suggestion.pvSuggere)}
                            </div>
                          )}
                          {isVerre && prixDevisActuel != null && (
                            <div style={{
                              marginTop: 4, fontSize: 11,
                              background: "rgba(45,140,255,0.10)", color: "#1D6FCC",
                              borderRadius: 6, padding: "2px 7px", display: "inline-block",
                            }}>
                              Prix devis : {formatEur(prixDevisActuel)}
                            </div>
                          )}
                        </td>

                        {/* PA HT */}
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", whiteSpace: "nowrap" }}>
                          {formatEur(item.prixAchat)}
                        </td>

                        {/* PRU */}
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#8B5CF6", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {formatEur(item.pru)}
                        </td>

                        {/* PV actuel */}
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {isEditingThisPv ? (
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              <input
                                type="number" step="0.5" value={editPvVal}
                                onChange={e => setEditPvVal(e.target.value)}
                                style={{ ...inputStyle, width: 80, textAlign: "right" }}
                                autoFocus
                                onKeyDown={e => { if (e.key === "Enter") savePvInline(item); if (e.key === "Escape") setEditingPv(null); }}
                              />
                              <button onClick={() => savePvInline(item)} style={btnPrimary}>OK</button>
                            </div>
                          ) : (
                            <span style={{ color: isOk ? "#047857" : "#F59E0B" }}>
                              {formatEur(pvActuel)}
                            </span>
                          )}
                        </td>

                        {/* Coeff actuel */}
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b", whiteSpace: "nowrap" }}>
                          ×{coeffActuel.toFixed(2)}
                        </td>

                        {/* PV conseillé */}
                        <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{
                            color: isOk ? "#10b981" : "#F59E0B",
                            fontWeight: 600,
                          }}>
                            {formatEur(pvConseille)}
                          </span>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>×{coeffEff}</div>
                        </td>

                        {/* Écart */}
                        <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{
                            fontWeight: 600,
                            color: ecart >= 0 ? "#10b981" : "#EF4444",
                          }}>
                            {ecart >= 0 ? "+" : ""}{formatEur(ecart)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                            <button onClick={() => applyPvConseille(item)} style={{
                              background: "rgba(16,185,129,0.12)", color: "#059669",
                              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 7,
                              padding: "4px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>
                              Appliquer conseillé
                            </button>
                            <button onClick={() => startEditPv(item)} style={btnGhost}>
                              Modifier
                            </button>
                            {isVerre && (
                              <button
                                onClick={() => setPrixDevis(item.id, pvActuel)}
                                style={{
                                  background: "rgba(45,140,255,0.10)", color: "#1D6FCC",
                                  border: "1px solid rgba(45,140,255,0.3)", borderRadius: 7,
                                  padding: "4px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                                }}
                              >
                                Prix devis
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ONGLET 4 — COMMANDES FOURNISSEURS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === "commandes" && (() => {
        const fmtDateShort = (iso: string) => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
        return (
          <div>
            {/* Bouton passer commande rapide */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {commandes.length === 0 ? "Aucune commande. Passez une commande depuis l'onglet Stock." : `${commandes.length} commande${commandes.length > 1 ? "s" : ""} enregistrée${commandes.length > 1 ? "s" : ""}`}
              </div>
            </div>
            {commandes.length === 0 ? (
              <div style={{ ...glass, borderRadius: 18, padding: "56px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Aucune commande fournisseur</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Allez dans l&apos;onglet <strong>Stock</strong>, puis cliquez sur <strong>Commander</strong> pour une référence en alerte.</div>
              </div>
            ) : (
              <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 130px 80px 80px 110px 140px", padding: "10px 20px", borderBottom: "1px solid rgba(148,163,184,0.12)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                  <span>Date</span><span>Article</span><span>Fournisseur</span><span>Qté</span><span>Montant</span><span>Statut</span><span>Actions</span>
                </div>
                {commandes.map(cmd => {
                  const cfg = COMMANDE_STATUT_CFG[cmd.statut];
                  const isActive = cmd.statut === "en_attente" || cmd.statut === "confirmee";
                  return (
                    <div key={cmd.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 130px 80px 80px 110px 140px", padding: "13px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDateShort(cmd.date)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cmd.itemLabel}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{cmd.categorie}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{cmd.fournisseur || "—"}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>{cmd.quantite}</div>
                      <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{(cmd.quantite * cmd.prixAchatUnit).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {cmd.dateLivraison && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Livré {fmtDateShort(cmd.dateLivraison)}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {isActive && (
                          <>
                            <button onClick={() => updateCommandeStatut(cmd.id, "livree")}
                              style={{ padding: "4px 9px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#047857", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                              ✓ Reçue
                            </button>
                            {cmd.statut === "en_attente" && (
                              <button onClick={() => updateCommandeStatut(cmd.id, "confirmee")}
                                style={{ padding: "4px 9px", borderRadius: 7, border: "1px solid rgba(45,140,255,0.3)", background: "rgba(45,140,255,0.08)", color: "#1D6FCC", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                Confirmer
                              </button>
                            )}
                            <button onClick={() => updateCommandeStatut(cmd.id, "annulee")}
                              style={{ padding: "4px 9px", borderRadius: 7, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#94a3b8", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
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
        );
      })()}

      {commandeItem && (
        <CommandeVisionModal
          item={commandeItem}
          onSave={(cmd) => { addCommande(cmd); setCommandeItem(null); }}
          onClose={() => setCommandeItem(null)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          RÉCEPTION BL — PLEIN ÉCRAN
          ══════════════════════════════════════════════════════════ */}
      {showBLWindow && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#f1f5f9",
          display: "flex", flexDirection: "column",
        }}>
          {/* ── Barre haute fixe ── */}
          <div style={{
            flexShrink: 0, background: "#fff",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            padding: "0 28px",
          }}>
            {/* Titre + actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                Réception de marchandise
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={pauseBL} style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: "rgba(245,158,11,0.10)", color: "#B45309",
                  border: "1px solid rgba(245,158,11,0.30)",
                }}>
                  ⏸ Mettre en pause
                </button>
                <button onClick={() => { setShowBLWindow(false); setRapidLines([newRapideLine()]); }} style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: "rgba(0,0,0,0.05)", color: "#64748b", border: "1px solid rgba(0,0,0,0.10)",
                }}>
                  ✕
                </button>
              </div>
            </div>

            {/* En-tête BL */}
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 160px 1fr", gap: 12, paddingBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>FOURNISSEUR</label>
                <input
                  value={blFournisseur}
                  onChange={e => { setBlFournisseur(e.target.value); setFournisseurDropdownOpen(true); }}
                  onFocus={() => setFournisseurDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setFournisseurDropdownOpen(false), 160)}
                  placeholder="Nom du fournisseur"
                  style={inputStyle}
                />
                {fournisseurDropdownOpen && (() => {
                  const q = blFournisseur.toLowerCase();
                  const fournisseurs = [...new Set(
                    stockData.filter(i => i.categorie === rapidCategorie).map(i => i.fournisseur)
                  )].sort().filter(f => !q || f.toLowerCase().includes(q));
                  return fournisseurs.length > 0 ? (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 500,
                      background: "#fff", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 8, marginTop: 2,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
                    }}>
                      {fournisseurs.map(f => {
                        const nbMarques = new Set(stockData.filter(i => i.categorie === rapidCategorie && i.fournisseur === f).map(i => i.marque)).size;
                        return (
                          <div key={f}
                            onMouseDown={() => { setBlFournisseur(f); setFournisseurDropdownOpen(false); }}
                            style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", borderBottom: "1px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,140,255,0.07)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontWeight: 500, color: "#0f172a" }}>{f}</span>
                            <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 8 }}>{nbMarques} marque{nbMarques > 1 ? "s" : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>N° BL</label>
                <input value={blNumero} onChange={e => setBlNumero(e.target.value)} placeholder="BL-2026-xxxx" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>DATE</label>
                <input type="date" value={blDate} onChange={e => setBlDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 4 }}>OPÉRATEUR</label>
                <input value={blOperateur} onChange={e => setBlOperateur(e.target.value)} placeholder="Votre nom" style={inputStyle} />
              </div>
            </div>

            {/* Mode + catégorie + coeff + fournisseur badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: 3, border: "1px solid rgba(0,0,0,0.07)" }}>
                <button onClick={() => setBlMode("rapide")} style={{
                  padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: blMode === "rapide" ? "#2D8CFF" : "transparent",
                  color: blMode === "rapide" ? "#fff" : "#64748b",
                  boxShadow: blMode === "rapide" ? "0 2px 6px rgba(45,140,255,0.25)" : "none",
                }}>Saisie rapide</button>
                <button onClick={() => setBlMode("search")} style={{
                  padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: blMode === "search" ? "#f1f5f9" : "transparent",
                  color: blMode === "search" ? "#334155" : "#64748b",
                }}>Recherche article</button>
              </div>
              <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.10)" }} />
              {CATEGORIES_DEFAULT.map(cat => {
                const isActive = rapidCategorie === cat;
                const color = CATEGORIE_COLORS[cat];
                return (
                  <button key={cat} onClick={() => changeRapideCategorie(cat)} style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: isActive ? "1px solid transparent" : "1px solid rgba(0,0,0,0.10)",
                    background: isActive ? color : "rgba(255,255,255,0.7)",
                    color: isActive ? "#fff" : "#475569",
                    boxShadow: isActive ? `0 2px 6px ${color}44` : "none",
                    transition: "all 0.15s",
                  }}>
                    {CATEGORIE_LABELS[rapidCategorie === cat ? cat : cat]}
                  </button>
                );
              })}
              <div style={{ width: 1, height: 20, background: "rgba(0,0,0,0.10)" }} />
              <span
                title="Coefficient marché appliqué au PA HT pour calculer le PV TTC conseillé"
                style={{
                  fontSize: 11, fontWeight: 600, color: "#8B5CF6",
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.20)",
                  borderRadius: 20, padding: "3px 10px",
                }}>
                ×{getCoeffEffectif(rapidCategorie).toFixed(1)} coeff. {CATEGORIE_LABELS[rapidCategorie]}
              </span>
              {blFournisseur.trim() && (() => {
                const nbMarques = new Set(stockData.filter(i => i.categorie === rapidCategorie && i.fournisseur === blFournisseur).map(i => i.marque)).size;
                return nbMarques > 0 ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(45,140,255,0.10)", color: "#1D6FCC",
                    border: "1px solid rgba(45,140,255,0.25)", borderRadius: 20,
                    padding: "3px 10px", fontSize: 11, fontWeight: 600,
                  }}>
                    {nbMarques} marque{nbMarques > 1 ? "s" : ""} — {blFournisseur}
                    <span onMouseDown={() => setBlFournisseur("")} style={{ cursor: "pointer", opacity: 0.6, marginLeft: 2, fontSize: 10 }}>✕</span>
                  </span>
                ) : null;
              })()}
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>
                Tab pour naviguer entre les champs · Entrée sur PV TTC pour ajouter une ligne
              </span>
            </div>
          </div>

          {/* ── Zone table scrollable ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 28px 0" }}>
            {blMode === "rapide" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f1f5f9" }}>
                  <tr>
                    {[
                      { label: "Marque",              align: "left",   w: 160 },
                      { label: "Référence / Modèle",  align: "left",   w: 220 },
                      { label: "Qté",                 align: "right",  w: 64  },
                      { label: "PA HT €",             align: "right",  w: 100 },
                      { label: "PV TTC €",            align: "right",  w: 100, info: `PV TTC = PA HT × ${getCoeffEffectif(rapidCategorie).toFixed(1)} (coeff. ${CATEGORIE_LABELS[rapidCategorie]})` },
                      { label: "CMP après",           align: "right",  w: 110, info: "Coût Moyen Pondéré : moyenne pondérée du PRU actuel et du PA HT saisi" },
                      { label: "",                    align: "center", w: 40  },
                    ].map((h, i) => (
                      <th key={i} title={h.info} style={{
                        textAlign: h.align as CSSProperties["textAlign"],
                        width: h.w, minWidth: h.w, padding: "8px 8px",
                        fontSize: 10, fontWeight: 700, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: "2px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap",
                        cursor: h.info ? "help" : "default",
                      }}>
                        {h.label}{h.info ? " ⓘ" : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rapidLines.map((line, idx) => {
                    const isMatched = !!line.matchedItemId;
                    const isNew     = !!(line.marque && line.reference && !line.matchedItemId);
                    const pvAuto    = line.paHT > 0 ? calcPvConseille(line.paHT, getCoeffEffectif(line.categorie)) : 0;
                    const rowBg     = idx % 2 === 0 ? "#fff" : "rgba(241,245,249,0.7)";
                    return (
                      <tr key={line.id} style={{ background: rowBg, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        {/* Marque */}
                        <td style={{ padding: "5px 5px" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              ref={el => { marqueRefs.current[line.id] = el; }}
                              value={line.marque}
                              onChange={e => {
                                updateRapideField(line.id, "marque", e.target.value);
                                const el = marqueRefs.current[line.id];
                                if (el) setMarqueDropdownAnchor({ id: line.id, rect: el.getBoundingClientRect() });
                              }}
                              onFocus={e => setMarqueDropdownAnchor({ id: line.id, rect: e.currentTarget.getBoundingClientRect() })}
                              onBlur={() => setTimeout(() => setMarqueDropdownAnchor(prev => prev?.id === line.id ? null : prev), 160)}
                              placeholder="Ray-Ban"
                              style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, width: "100%", boxSizing: "border-box",
                                borderColor: isMatched ? "rgba(16,185,129,0.5)" : undefined }}
                            />
                            {isMatched && marqueDropdownAnchor?.id !== line.id && (
                              <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "#10b981", fontWeight: 800 }}>✓</span>
                            )}
                            {isNew && marqueDropdownAnchor?.id !== line.id && (
                              <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "#F59E0B", fontWeight: 800 }}></span>
                            )}
                          </div>
                        </td>
                        {/* Référence */}
                        <td style={{ padding: "5px 5px" }}>
                          <input
                            ref={el => { referenceRefs.current[line.id] = el; }}
                            value={line.reference}
                            onChange={e => updateRapideField(line.id, "reference", e.target.value)}
                            placeholder="RB5154 Clubmaster"
                            style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                          />
                        </td>
                        {/* Qté */}
                        <td style={{ padding: "5px 5px" }}>
                          <input
                            type="number" min={1} value={line.quantite}
                            onChange={e => updateRapideField(line.id, "quantite", parseInt(e.target.value) || 1)}
                            style={{ ...inputStyle, width: "100%", textAlign: "right", padding: "5px 6px", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </td>
                        {/* PA HT */}
                        <td style={{ padding: "5px 5px" }}>
                          <input
                            type="number" min={0} step={0.01} value={line.paHT || ""}
                            onChange={e => updateRapideField(line.id, "paHT", parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            style={{ ...inputStyle, width: "100%", textAlign: "right", padding: "5px 6px", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </td>
                        {/* PV TTC */}
                        <td style={{ padding: "5px 5px" }}>
                          <input
                            type="number" min={0} step={0.5} value={line.pv || ""}
                            onChange={e => updateRapideField(line.id, "pv", parseFloat(e.target.value) || 0)}
                            placeholder={pvAuto > 0 ? pvAuto.toFixed(0) : "auto"}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRapideLine(); } }}
                            style={{ ...inputStyle, width: "100%", textAlign: "right", padding: "5px 6px", fontSize: 13, boxSizing: "border-box" }}
                          />
                        </td>
                        {/* CMP après */}
                        <td style={{ padding: "5px 8px", textAlign: "right", color: "#8B5CF6", fontWeight: 700, whiteSpace: "nowrap", fontSize: 13 }}>
                          {line.pruApres > 0 ? formatEur(line.pruApres) : pvAuto > 0 ? <span style={{ color: "#94a3b8" }}>{formatEur(line.paHT)}</span> : "—"}
                        </td>
                        {/* Suppr */}
                        <td style={{ padding: "5px 5px", textAlign: "center" }}>
                          <button onClick={() => removeRapideLine(line.id)} style={{
                            background: "rgba(239,68,68,0.10)", color: "#EF4444",
                            border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6,
                            padding: "3px 7px", fontSize: 11, cursor: "pointer", lineHeight: 1,
                          }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {blMode === "search" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Rechercher un produit (marque, référence)…"
                    value={blSearchQuery}
                    onChange={e => { handleBlSearch(e.target.value); setShowBlSearch(true); }}
                    onFocus={() => setShowBlSearch(true)}
                    style={{ ...inputStyle, fontSize: 14 }}
                  />
                  {showBlSearch && blSearchResults.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                      background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
                      border: "1px solid rgba(0,0,0,0.10)", borderRadius: 12, marginTop: 4,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 300, overflowY: "auto",
                    }}>
                      {blSearchResults.map(item => (
                        <div key={item.id}
                          onClick={() => addBLLine(item)}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,140,255,0.06)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.marque}</span>
                            <span style={{ color: "#64748b", marginLeft: 6 }}>{item.reference}</span>
                            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: CATEGORIE_COLORS[item.categorie] + "18", color: CATEGORIE_COLORS[item.categorie], borderRadius: 5, padding: "1px 6px" }}>
                              {CATEGORIE_LABELS[item.categorie]}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>PA : {formatEur(item.prixAchat)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {blLines.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                        {["Produit", "Qté", "PA HT", "PV final", "PRU après", ""].map((h, i) => (
                          <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {blLines.map(line => {
                        const blBaseItem = STOCK.find(i => i.id === line.itemId);
                        const suggestion = blBaseItem ? getSuggestionMonture(blBaseItem) : null;
                        return (
                          <tr key={line.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{line.marque} {line.designation}</div>
                              {suggestion && <div style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>Même PA que {suggestion.ref} → PV suggéré {formatEur(suggestion.pvSuggere)}</div>}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <input type="number" min={1} value={line.quantite} onChange={e => updateBLLine(line.id, "quantite", parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 60, textAlign: "right" }} />
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <input type="number" min={0} step={0.01} value={line.paHT} onChange={e => updateBLLine(line.id, "paHT", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 80, textAlign: "right" }} />
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <input type="number" min={0} step={0.5} value={line.pvFinal} onChange={e => updateBLLine(line.id, "pvFinal", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: 80, textAlign: "right" }} />
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", color: "#8B5CF6", fontWeight: 600 }}>{formatEur(line.pruApres)}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <button onClick={() => removeBLLine(line.id)} style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, padding: "3px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* ── Barre basse fixe ── */}
          <div style={{
            flexShrink: 0, background: "#fff",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            padding: "12px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {blMode === "rapide" && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    {rapidLines.filter(l => l.marque && l.reference).length} ligne{rapidLines.filter(l => l.marque && l.reference).length > 1 ? "s" : ""} · {rapidLines.reduce((s, l) => s + (l.marque && l.reference ? l.quantite : 0), 0)} pièce(s)
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Total PA HT : <b>{formatEur(rapidLines.reduce((s, l) => s + (l.marque && l.reference ? l.quantite * l.paHT : 0), 0))}</b>
                  </span>
                  {rapidLines.filter(l => l.matchedItemId).length > 0 && (
                    <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ {rapidLines.filter(l => l.matchedItemId).length} connu(s)</span>
                  )}
                  {rapidLines.filter(l => l.marque && l.reference && !l.matchedItemId).length > 0 && (
                    <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>{rapidLines.filter(l => l.marque && l.reference && !l.matchedItemId).length} nouveau(x)</span>
                  )}
                  <button onClick={addRapideLine} style={{ ...btnGhost, fontSize: 12, padding: "5px 14px" }}>
                    + Ajouter une ligne
                  </button>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowBLWindow(false); setRapidLines([newRapideLine()]); }} style={btnGhost}>
                Annuler
              </button>
              <button
                onClick={blMode === "rapide" ? validateRapide : validateBL}
                style={{
                  ...btnPrimary,
                  opacity: (blMode === "rapide"
                    ? rapidLines.filter(l => l.marque && l.reference).length === 0
                    : blLines.length === 0) ? 0.5 : 1,
                  fontSize: 14, padding: "8px 20px",
                }}
              >
                Valider la réception ({blMode === "rapide"
                  ? `${rapidLines.filter(l => l.marque && l.reference).length} ligne${rapidLines.filter(l => l.marque && l.reference).length > 1 ? "s" : ""}`
                  : `${blLines.length} ligne${blLines.length > 1 ? "s" : ""}`})
              </button>
            </div>
          </div>

          {/* ── Dropdown marque (fixed, hors overflow) ── */}
          {marqueDropdownAnchor && (() => {
            const { id, rect } = marqueDropdownAnchor;
            const line = rapidLines.find(l => l.id === id);
            if (!line) return null;
            const q = line.marque.toLowerCase();
            const brands = [...new Set(
              stockData
                .filter(i => i.categorie === rapidCategorie && (!blFournisseur.trim() || i.fournisseur === blFournisseur))
                .map(i => i.marque)
            )].sort().filter(m => !q || m.toLowerCase().includes(q));
            return brands.length > 0 ? (
              <div style={{
                position: "fixed",
                top: rect.bottom + 2,
                left: rect.left,
                width: Math.max(rect.width, 220),
                zIndex: 10000,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                maxHeight: 240, overflowY: "auto",
              }}>
                {brands.map(b => (
                  <div key={b}
                    onMouseDown={() => {
                      updateRapideField(id, "marque", b);
                      setMarqueDropdownAnchor(null);
                      setTimeout(() => referenceRefs.current[id]?.focus(), 50);
                    }}
                    style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,140,255,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {b}
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FENÊTRE SORTIE MANUELLE
          ══════════════════════════════════════════════════════════ */}
      {showSortieWindow && (
        <DraggableWindow
          title="Sortie manuelle de stock"
          defaultWidth={560}
          defaultHeight={480}
          onClose={() => { setShowSortieWindow(false); }}
        >
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16, height: "100%", boxSizing: "border-box", overflowY: "auto" }}>

            {/* Recherche produit */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>PRODUIT</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={sortieSearch}
                  onChange={e => { handleSortieSearch(e.target.value); setShowSortieSearch(true); setSortieSelectedId(""); }}
                  onFocus={() => setShowSortieSearch(true)}
                  style={{ ...inputStyle }}
                />
                {showSortieSearch && sortieResults.length > 0 && !sortieSelectedId && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                    ...glass, borderRadius: 12, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    maxHeight: 220, overflowY: "auto",
                  }}>
                    {sortieResults.map(item => {
                      const curOv = overrides[item.id];
                      const qte   = curOv?.quantite ?? item.quantite;
                      return (
                        <div key={item.id}
                          onClick={() => {
                            setSortieSelectedId(item.id);
                            setSortieSelectedName(`${item.marque} ${item.reference}`);
                            setSortieSearch(`${item.marque} ${item.reference}`);
                            setShowSortieSearch(false);
                          }}
                          style={{
                            padding: "10px 14px", cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                            display: "flex", justifyContent: "space-between",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,140,255,0.06)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.marque}</span>
                            <span style={{ color: "#64748b", marginLeft: 6 }}>{item.reference}</span>
                          </div>
                          <span style={{ fontSize: 12, color: qte <= item.quantiteMin ? "#EF4444" : "#64748b" }}>
                            Stock : {qte}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {sortieSelectedId && (
                <div style={{
                  marginTop: 8, padding: "8px 12px",
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 8, fontSize: 13, color: "#059669", fontWeight: 600,
                }}>
                  {sortieSelectedName} — Stock actuel : {
                    overrides[sortieSelectedId]?.quantite ??
                    STOCK.find(i => i.id === sortieSelectedId)?.quantite ?? 0
                  }
                </div>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>QUANTITÉ</label>
              <input type="number" min={1} value={sortieQte}
                onChange={e => setSortieQte(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ ...inputStyle, width: 120 }} />
            </div>

            {/* Type sortie */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>TYPE DE SORTIE</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {([
                  { key: "sortie_casse",             label: "Casse / Perte" },
                  { key: "sortie_retour_fournisseur", label: "Retour fournisseur" },
                  { key: "ajustement_negatif",        label: "Ajustement inventaire" },
                ] as { key: typeof sortieType; label: string }[]).map(({ key, label }) => (
                  <button key={key} onClick={() => setSortieType(key)} style={{
                    ...pillBase,
                    background: sortieType === key ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.55)",
                    color: sortieType === key ? "#DC2626" : "#475569",
                    border: sortieType === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(0,0,0,0.08)",
                    fontWeight: sortieType === key ? 700 : 500,
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>NOTES (optionnel)</label>
              <textarea
                value={sortieNotes}
                onChange={e => setSortieNotes(e.target.value)}
                placeholder="Raison de la sortie, détails…"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "auto" }}>
              <button onClick={() => { setShowSortieWindow(false); }} style={btnGhost}>
                Annuler
              </button>
              <button onClick={validateSortie} style={btnDanger}>
                Valider la sortie
              </button>
            </div>
          </div>
        </DraggableWindow>
      )}

    </div>
  );
}
