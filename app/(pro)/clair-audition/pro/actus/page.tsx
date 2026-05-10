"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const ACCENT = "#00C98A";
const ACCENT_BG = "rgba(0,201,138,0.09)";

const glass: CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
  borderRadius: 18,
};

const REFRESH_MS = 60 * 60 * 1000;

interface Article {
  title: string; link: string; date: string; summary: string;
  image?: string; source?: string;
}

/* ── Mock enrichi ────────────────────────────────────────────────────── */
const MOCK: Article[] = [
  { title: "Renouvellement des aides auditives : ce que change la loi en 2025 pour les audioprothésistes", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 1 * 864e5).toUTCString(), summary: "La réforme du 100 % Santé entre dans une nouvelle phase : délais de renouvellement raccourcis et prise en charge renforcée pour les aides auditives de classe II.", source: "Audio Infos", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Hearing_aid_variety.jpg/800px-Hearing_aid_variety.jpg" },
  { title: "Intelligence artificielle dans les audioprothèses : panorama des innovations 2024-2025", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 3 * 864e5).toUTCString(), summary: "Les principaux fabricants intègrent désormais des algorithmes d'apprentissage automatique permettant aux aides auditives de s'adapter en temps réel à l'environnement sonore.", source: "Audio Infos", image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=420&fit=crop" },
  { title: "Dépistage précoce : bilan des campagnes audiologiques menées en milieu scolaire", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 8 * 864e5).toUTCString(), summary: "Plus de 80 000 enfants ont bénéficié de bilans auditifs dans le cadre des nouvelles campagnes de dépistage, révélant un taux de prévalence plus élevé qu'estimé.", source: "Audio Infos", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=420&fit=crop" },
  { title: "Bilan auditif téléphonique : encadrement réglementaire et bonnes pratiques professionnelles", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 13 * 864e5).toUTCString(), summary: "Le CNOA publie un guide de recommandations sur la pratique du bilan auditif à distance, précisant les conditions d'utilisation pour garantir la qualité du suivi patient.", source: "Audio Infos", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=420&fit=crop" },
  { title: "Presbyacousie : de nouvelles études confirment le lien avec le déclin cognitif", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 18 * 864e5).toUTCString(), summary: "Plusieurs travaux publiés dans The Lancet confirment que le traitement précoce de la perte auditive réduit significativement le risque de démence à long terme.", source: "Audio Infos", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=420&fit=crop" },
  { title: "Audioprothèses connectées : les nouvelles fonctionnalités Bluetooth plébiscitées par les patients", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 24 * 864e5).toUTCString(), summary: "Les modèles avec streaming direct depuis smartphone et contrôle via application affichent des taux de satisfaction significativement plus élevés dans les enquêtes post-appareillage.", source: "Audio Infos", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bluetooth_audio_receiver.JPG/800px-Bluetooth_audio_receiver.JPG" },
  { title: "Unsono : publication des nouvelles recommandations de suivi post-appareillage", link: "https://www.unsono.fr", date: new Date(Date.now() - 30 * 864e5).toUTCString(), summary: "L'union nationale des audioprothésistes actualise son protocole de suivi, intégrant des bilans à 15 jours, 1 mois et 3 mois obligatoires pour tous les nouveaux appareillages.", source: "Unsono", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Saint_Kitts_and_Nevis_moves_toward_national_hearing_program_with_support_from_U_S_Air_Force_audiologists_%289541765%29.jpg/800px-Saint_Kitts_and_Nevis_moves_toward_national_hearing_program_with_support_from_U_S_Air_Force_audiologists_%289541765%29.jpg" },
  { title: "Acouphènes : perspectives thérapeutiques et rôle de l'audioprothésiste en 2025", link: "https://www.unsono.fr", date: new Date(Date.now() - 38 * 864e5).toUTCString(), summary: "Les thérapies combinant aide auditive et générateur de bruit blanc personnalisé montrent des résultats prometteurs dans plusieurs essais cliniques européens.", source: "Unsono", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Tinnitus.jpg/800px-Tinnitus.jpg" },
  { title: "100 % Santé audition : trois ans après, quel bilan pour les audioprothésistes ?", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 45 * 864e5).toUTCString(), summary: "L'analyse des données de la CNAM montre une hausse de 28 % des appareillages depuis 2021, mais souligne des inégalités territoriales persistantes dans l'accès aux soins auditifs.", source: "Audio Infos", image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=420&fit=crop" },
  { title: "Oticon, Phonak, Starkey : comparatif des plateformes d'IA embarquées en 2025", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 52 * 864e5).toUTCString(), summary: "Les trois géants de l'audioprothèse ont chacun déployé leur système de traitement automatique du signal. Analyse des performances cliniques et des retours des audioprothésistes.", source: "Audio Infos", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Oticon_hearing_aids_and_recharger.jpg/800px-Oticon_hearing_aids_and_recharger.jpg" },
  { title: "Bruit et santé au travail : les audioprothésistes de plus en plus sollicités par les entreprises", link: "https://www.unsono.fr", date: new Date(Date.now() - 60 * 864e5).toUTCString(), summary: "Face aux obligations légales de prévention des risques auditifs, les entreprises font de plus en plus appel aux audioprothésistes pour des bilans collectifs et des ateliers de sensibilisation.", source: "Unsono", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/NIOSH_%D0%BD%D0%B0%D1%83%D1%88%D0%BD%D0%B8%D0%BA%D0%B8_en.jpg/800px-NIOSH_%D0%BD%D0%B0%D1%83%D1%88%D0%BD%D0%B8%D0%BA%D0%B8_en.jpg" },
  { title: "Audioprothèses intra-auriculaires : nouvelles gammes invisibles et confort amélioré", link: "https://www.audio-infos.fr", date: new Date(Date.now() - 68 * 864e5).toUTCString(), summary: "Les modèles IIC (invisible-in-canal) de dernière génération combinent une miniaturisation poussée avec des performances acoustiques comparables aux appareils contour d'oreille.", source: "Audio Infos", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Intra_aural_hearing_aid_Wellcome_L0065955.jpg/800px-Intra_aural_hearing_aid_Wellcome_L0065955.jpg" },
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

/* ── Hero card ───────────────────────────────────────────────────────── */
function HeroCard({ article }: { article: Article }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "grid", gridTemplateColumns: article.image ? "1.2fr 1fr" : "1fr", ...glass, overflow: "hidden",
        transition: "transform 0.18s, box-shadow 0.18s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 16px 48px rgba(0,201,138,0.18)` : "0 8px 32px rgba(0,0,0,0.07)" }}
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
        <div style={{ height: 6, background: `linear-gradient(90deg, ${ACCENT}, #00A875)`, gridColumn: "1/-1" }} />
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
        boxShadow: hov ? `0 14px 40px rgba(0,201,138,0.16)` : "0 8px 32px rgba(0,0,0,0.06)" }}
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
export default function ActusAuditionPage() {
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
      const r = await fetch("/api/actus?module=audition");
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

  void tick;

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
              <h1 style={{ fontSize: 21, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>Actus Audition</h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Dernières actualités du secteur audioprothèse</p>
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
          {hero && <HeroCard article={hero} />}
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
          {[{ label: "Audio Infos", href: "https://www.audio-infos.fr" }, { label: "Unsono", href: "https://www.unsono.fr" }].map(s => (
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
