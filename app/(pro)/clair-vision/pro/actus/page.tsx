"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const ACCENT = "#2D8CFF";
const ACCENT_BG = "rgba(45,140,255,0.09)";

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
  borderRadius: 18,
};

const REFRESH_MS = 60 * 60 * 1000; // 60 min

interface Article {
  title: string; link: string; date: string; summary: string;
  image?: string; source?: string;
}

/* ── Mock enrichi (fallback) ─────────────────────────────────────────── */
const MOCK: Article[] = [
  { title: "Nouvelles normes de prescription : ce qui change pour les opticiens en 2025", link: "https://www.acuite.fr", date: new Date(Date.now() - 1 * 864e5).toUTCString(), summary: "La réforme du décret de compétences élargit les possibilités d'adaptation d'ordonnance pour les opticiens, avec de nouvelles règles sur le délai et la tolérance de correction.", source: "Acuité", image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=420&fit=crop" },
  { title: "Verres progressifs : les innovations majeures présentées à l'SILMO", link: "https://www.acuite.fr", date: new Date(Date.now() - 3 * 864e5).toUTCString(), summary: "Les fabricants ont dévoilé des verres progressifs personnalisés intégrant l'intelligence artificielle pour adapter la conception au comportement visuel du porteur.", source: "Acuité", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&h=420&fit=crop" },
  { title: "Santé visuelle des enfants : l'importance du dépistage précoce remise en lumière", link: "https://www.acuite.fr", date: new Date(Date.now() - 8 * 864e5).toUTCString(), summary: "Une étude nationale révèle que 20 % des enfants scolarisés présentent un trouble visuel non corrigé. Les opticiens sont en première ligne pour sensibiliser les familles.", source: "Acuité", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=420&fit=crop" },
  { title: "Téléconsultation et optique : bilan d'un an d'expérimentation en magasin", link: "https://www.acuite.fr", date: new Date(Date.now() - 14 * 864e5).toUTCString(), summary: "Les cabines de téléconsultation déployées dans plusieurs enseignes permettent aux patients de consulter un ophtalmologue directement depuis leur opticien, réduisant les délais d'attente.", source: "Acuité", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=420&fit=crop" },
  { title: "Lentilles de contact colorées : encadrement réglementaire et risques pour la cornée", link: "https://www.acuite.fr", date: new Date(Date.now() - 18 * 864e5).toUTCString(), summary: "Le port de lentilles décoratives sans prescription médicale augmente les risques d'infections cornéennes graves. Les opticiens sont invités à renforcer leur rôle de conseil.", source: "Acuité", image: "https://images.unsplash.com/photo-1583394293214-0b3b32609a0a?w=800&h=420&fit=crop" },
  { title: "Remboursement des lunettes : impact des nouvelles grilles tarifaires sur les ventes", link: "https://www.acuite.fr", date: new Date(Date.now() - 22 * 864e5).toUTCString(), summary: "Deux ans après la réforme 100 % Santé, les données de la CNAM montrent une progression des équipements en classe I, mais un recul du panier moyen dans certaines enseignes.", source: "Acuité", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=420&fit=crop" },
  { title: "SNOF : appel à une meilleure coordination opticiens-ophtalmologistes", link: "https://www.snof.org", date: new Date(Date.now() - 28 * 864e5).toUTCString(), summary: "Le Syndicat National des Ophtalmologistes de France publie un livre blanc sur la complémentarité des professionnels de la vue, plaidant pour des protocoles de coopération renforcés.", source: "SNOF", image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=420&fit=crop" },
  { title: "Myopie chez l'enfant : les nouvelles recommandations de prise en charge optique", link: "https://www.snof.org", date: new Date(Date.now() - 35 * 864e5).toUTCString(), summary: "Face à l'augmentation mondiale de la myopie infantile, les sociétés savantes préconisent un suivi annuel systématique et l'équipement précoce en verres anti-progression.", source: "SNOF", image: "https://images.unsplash.com/photo-1588776814546-1ffedbe3b28b?w=800&h=420&fit=crop" },
  { title: "Désinformation et santé visuelle : les opticiens en première ligne face aux tendances TikTok", link: "https://www.acuite.fr", date: new Date(Date.now() - 40 * 864e5).toUTCString(), summary: "Les vidéos virales promouvant des exercices oculaires non prouvés ou des compléments alimentaires miracles se multiplient. Les professionnels alertent sur les risques.", source: "Acuité", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=420&fit=crop" },
  { title: "Retinal AI : la détection automatique des pathologies rétiniennes débarque en cabinet", link: "https://www.acuite.fr", date: new Date(Date.now() - 48 * 864e5).toUTCString(), summary: "De nouveaux dispositifs d'imagerie couplés à l'IA permettent aux opticiens et ophtalmologistes de détecter précocement la DMLA, le glaucome ou la rétinopathie diabétique.", source: "Acuité", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=420&fit=crop" },
  { title: "SILMO 2025 : les grandes tendances montures et design dévoilées", link: "https://www.acuite.fr", date: new Date(Date.now() - 55 * 864e5).toUTCString(), summary: "Le salon mondial de l'optique-lunetterie a exposé les collections phares des grands noms du secteur, avec un retour marqué des matières naturelles et des formes géométriques affirmées.", source: "Acuité", image: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&h=420&fit=crop" },
  { title: "Sécheresse oculaire : les nouvelles thérapies et l'impact des écrans en 2025", link: "https://www.snof.org", date: new Date(Date.now() - 62 * 864e5).toUTCString(), summary: "Les troubles de la surface oculaire liés à l'usage prolongé des écrans concernent désormais plus d'un tiers des consultations. Les nouvelles solutions de larmes artificielles montrent des résultats prometteurs.", source: "SNOF", image: "https://images.unsplash.com/photo-1516825295879-14f59e610561?w=800&h=420&fit=crop" },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmt(raw: string) {
  try { return new Date(raw).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch { return raw; }
}
function isNew(d: string) { try { return Date.now() - new Date(d).getTime() < 7 * 864e5; } catch { return false; } }
function relTime(iso: string | null) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)  return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff / 60);
  return h < 24 ? `il y a ${h}h` : `il y a ${Math.floor(h / 24)}j`;
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
function Skel({ h = 200 }: { h?: number }) {
  return (
    <div style={{ ...glass, overflow: "hidden" }}>
      <div style={{ height: h, background: "rgba(226,232,240,0.45)", animation: "tp 1.4s ease-in-out infinite" }} />
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[80, 95, 60].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 11 : 14, width: `${w}%`, background: "rgba(226,232,240,0.6)", borderRadius: 6, animation: "tp 1.4s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Hero card (premier article) ─────────────────────────────────────── */
function HeroCard({ article }: { article: Article }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "grid", gridTemplateColumns: article.image ? "1.2fr 1fr" : "1fr", ...glass, overflow: "hidden",
        transition: "transform 0.18s, box-shadow 0.18s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 16px 48px rgba(45,140,255,0.18)` : "0 8px 32px rgba(0,0,0,0.07)" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {article.image && (
        <div style={{ overflow: "hidden", minHeight: 220 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }} />
        </div>
      )}
      {!article.image && (
        <div style={{ height: 6, background: `linear-gradient(90deg, ${ACCENT}, #1A72E8)`, gridColumn: "1/-1" }} />
      )}
      <div style={{ padding: "28px 32px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(article.date)}</span>
          {isNew(article.date) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: ACCENT, borderRadius: 6, padding: "2px 8px" }}>Nouveau</span>}
          {article.source && <span style={{ fontSize: 10, fontWeight: 600, color: ACCENT, background: ACCENT_BG, borderRadius: 6, padding: "2px 8px" }}>{article.source}</span>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{article.title}</div>
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0 }}>{article.summary}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: ACCENT }}>
          Lire l&apos;article
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </div>
      </div>
    </a>
  );
}

/* ── Article card standard ───────────────────────────────────────────── */
function ArticleCard({ article }: { article: Article }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "flex", flexDirection: "column", ...glass, overflow: "hidden",
        transition: "transform 0.18s, box-shadow 0.18s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 14px 40px rgba(45,140,255,0.16)` : "0 8px 32px rgba(0,0,0,0.06)" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {article.image ? (
        <div style={{ height: 160, overflow: "hidden", flexShrink: 0, background: "#f1f5f9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
            onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }} />
        </div>
      ) : (
        <div style={{ height: 4, flexShrink: 0, background: `linear-gradient(90deg, ${ACCENT}60, ${ACCENT}20)` }} />
      )}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(article.date)}</span>
          {isNew(article.date) && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#fff", background: ACCENT, borderRadius: 5, padding: "2px 6px" }}>Nouveau</span>}
          {article.source && <span style={{ fontSize: 10, fontWeight: 600, color: ACCENT, background: ACCENT_BG, borderRadius: 5, padding: "2px 6px" }}>{article.source}</span>}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.title}
        </div>
        {article.summary && (
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {article.summary}
          </p>
        )}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: ACCENT }}>
          Lire l&apos;article
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </div>
      </div>
    </a>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function ActusVisionPage() {
  const [articles,   setArticles]   = useState<Article[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usedMock,   setUsedMock]   = useState(false);
  const [fetchedAt,  setFetchedAt]  = useState<string | null>(null);
  const [tick,       setTick]       = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await fetch("/api/actus?module=vision");
      const d = await r.json() as { articles: Article[]; fetchedAt?: string; error?: string };
      if (!d.articles?.length || d.error) { setArticles(MOCK); setUsedMock(true); } else { setArticles(d.articles); setUsedMock(false); }
      setFetchedAt(d.fetchedAt ?? new Date().toISOString());
    } catch { setArticles(MOCK); setUsedMock(true); setFetchedAt(new Date().toISOString()); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    void load();
    timerRef.current = setInterval(() => void load(true), REFRESH_MS);
    const tickId = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(timerRef.current!); clearInterval(tickId); };
  }, [load]);

  void tick; // used only to force re-render for relTime

  const [hero, ...rest] = articles;

  return (
    <div style={{ width: "100%" }}>
      <style>{`@keyframes tp{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: ACCENT_BG, display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, flexShrink: 0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4 4Z"/>
                <path d="M10 7h8M10 11h8M10 15h5"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>Actus Optique</h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Dernières actualités du secteur optique</p>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b", background: "rgba(226,232,240,0.55)", borderRadius: 8, padding: "4px 10px", border: "1px solid rgba(226,232,240,0.8)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Mise à jour automatique toutes les heures
            </span>
            {fetchedAt && <span style={{ fontSize: 11, color: "#94a3b8" }}>Actualisé {relTime(fetchedAt)}</span>}
            {usedMock && <span style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.08)", borderRadius: 8, padding: "4px 10px", border: "1px solid rgba(245,158,11,0.18)" }}>Flux indisponible — articles d&apos;exemple</span>}
          </div>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing || loading}
          style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: refreshing ? "#94a3b8" : ACCENT, background: refreshing ? "rgba(226,232,240,0.4)" : ACCENT_BG, border: `1px solid ${refreshing ? "rgba(226,232,240,0.8)" : `${ACCENT}30`}`, borderRadius: 10, padding: "8px 14px", cursor: refreshing ? "default" : "pointer", transition: "all 0.2s", flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={refreshing ? { animation: "spin 0.8s linear infinite" } : {}}>
            <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
          {refreshing ? "Actualisation…" : "Actualiser"}
        </button>
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Skel h={240} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skel key={i} />)}
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      {!loading && articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Article vedette */}
          {hero && <HeroCard article={hero} />}

          {/* Grille */}
          {rest.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
              {rest.map((a, i) => <ArticleCard key={i} article={a} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      {!loading && (
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(226,232,240,0.6)", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 11, color: "#94a3b8", flexWrap: "wrap" }}>
          {[{ label: "Acuité", href: "https://www.acuite.fr" }, { label: "SNOF", href: "https://www.snof.org" }].map(s => (
            <span key={s.label}>
              Source : {s.label} —{" "}
              <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 600, textDecoration: "none" }}>{new URL(s.href).host}</a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
