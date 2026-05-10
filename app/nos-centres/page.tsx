"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadRegistry } from "@/lib/centresRegistry";

// ─── Types ───────────────────────────────────────────────────────────────────

type Module = "vision" | "audition";

type Center = {
  id: string;
  module: Module;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  fromRegistry?: boolean;
  statut?: "actif" | "preactif" | "inactif";
};

type Geo = { lat: number; lng: number; label: string; source: "address" | "device" };

// ─── Static centres ───────────────────────────────────────────────────────────

const STATIC_CENTRES: Center[] = [
  {
    id: "cv-paris-14",
    module: "vision",
    name: "ClairVision Paris 14",
    city: "Paris",
    address: "12 rue de la Santé, 75014 Paris",
    lat: 48.8337,
    lng: 2.3342,
  },
  {
    id: "cv-paris-5",
    module: "vision",
    name: "ClairVision Paris 5",
    city: "Paris",
    address: "45 boulevard Saint-Germain, 75005 Paris",
    lat: 48.8535,
    lng: 2.347,
  },
  {
    id: "cv-marseille-prado",
    module: "vision",
    name: "ClairVision Marseille Prado",
    city: "Marseille",
    address: "210A Rue Paradis, 13006 Marseille",
    lat: 43.2878,
    lng: 5.3816,
  },
  {
    id: "ca-lyon-2",
    module: "audition",
    name: "ClairAudition Lyon 2",
    city: "Lyon",
    address: "Place Bellecour, 69002 Lyon",
    lat: 45.7579,
    lng: 4.832,
  },
  {
    id: "ca-bordeaux-centre",
    module: "audition",
    name: "ClairAudition Bordeaux Centre",
    city: "Bordeaux",
    address: "Cours de l'Intendance, 33000 Bordeaux",
    lat: 44.8423,
    lng: -0.5756,
  },
  {
    id: "cv-lille-centre",
    module: "vision",
    name: "ClairVision Lille Centre",
    city: "Lille",
    address: "Place Rihour, 59800 Lille",
    lat: 50.6369,
    lng: 3.0633,
  },
  {
    id: "ca-paris-11",
    module: "audition",
    name: "ClairAudition Paris 11",
    city: "Paris",
    address: "42 rue Oberkampf, 75011 Paris",
    lat: 48.8638,
    lng: 2.3758,
  },
  {
    id: "cv-nantes",
    module: "vision",
    name: "ClairVision Nantes",
    city: "Nantes",
    address: "Place Graslin, 44000 Nantes",
    lat: 47.2136,
    lng: -1.5588,
  },
  {
    id: "ca-strasbourg",
    module: "audition",
    name: "ClairAudition Strasbourg",
    city: "Strasbourg",
    address: "Place Kléber, 67000 Strasbourg",
    lat: 48.5839,
    lng: 7.7455,
  },
  {
    id: "cv-toulouse",
    module: "vision",
    name: "ClairVision Toulouse",
    city: "Toulouse",
    address: "Place du Capitole, 31000 Toulouse",
    lat: 43.6047,
    lng: 1.4442,
  },
  {
    id: "ca-nice",
    module: "audition",
    name: "ClairAudition Nice",
    city: "Nice",
    address: "Avenue Jean Médecin, 06000 Nice",
    lat: 43.7102,
    lng: 7.262,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function geocodeAddressOSM(query: string) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  const res = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Language": "fr" },
  });

  if (!res.ok) throw new Error("Erreur géocodage");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (!data?.[0]) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPin() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconLocate() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NosCentresPage() {
  const [centres, setCentres] = useState<Center[]>(STATIC_CENTRES);

  // Load registry centres on mount and merge
  useEffect(() => {
    const registry = loadRegistry();
    const visible = registry.filter((r) => r.siteVisible);

    if (visible.length === 0) return;

    const staticNames = new Set(STATIC_CENTRES.map((c) => c.name.toLowerCase()));

    const registryCentres: Center[] = visible
      .filter((r) => !staticNames.has(r.nom.toLowerCase()))
      .map((r) => ({
        id: r.id,
        module: r.module,
        name: r.nom,
        city: r.ville,
        address: `${r.adresse}, ${r.codePostal} ${r.ville}`,
        lat: r.lat ?? 46.6,
        lng: r.lng ?? 2.3,
        fromRegistry: true,
        statut: r.statut,
      }));

    if (registryCentres.length > 0) {
      setCentres([...STATIC_CENTRES, ...registryCentres]);
    }
  }, []);

  // ─── State ────────────────────────────────────────────────────────────────

  const [filter, setFilter] = useState<"all" | Module>("all");
  const [searchCenter, setSearchCenter] = useState("");
  const [patientAddress, setPatientAddress] = useState("");

  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>(STATIC_CENTRES[0]?.id ?? "");

  // ─── Derived ──────────────────────────────────────────────────────────────

  const totalVision = useMemo(
    () => centres.filter((c) => c.module === "vision").length,
    [centres]
  );
  const totalAudition = useMemo(
    () => centres.filter((c) => c.module === "audition").length,
    [centres]
  );

  const filtered = useMemo(() => {
    const q = searchCenter.trim().toLowerCase();
    return centres.filter((c) => {
      const okModule = filter === "all" ? true : c.module === filter;
      const okSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);
      return okModule && okSearch;
    });
  }, [centres, filter, searchCenter]);

  const scored = useMemo(() => {
    if (!geo)
      return filtered.map((c) => ({ ...c, distanceKm: null as number | null }));
    return filtered
      .map((c) => ({
        ...c,
        distanceKm: haversineKm(geo.lat, geo.lng, c.lat, c.lng),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [filtered, geo]);

  const recommendedId = useMemo(() => {
    if (!geo) return null;
    return scored[0]?.id ?? null;
  }, [geo, scored]);

  const selected = useMemo(() => {
    const found = scored.find((c) => c.id === selectedId);
    return found ?? scored[0] ?? null;
  }, [scored, selectedId]);

  const mapSrc = useMemo(() => {
    const q = selected ? selected.address : "France";
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=13&output=embed`;
  }, [selected]);

  const directionsHref = useMemo(() => {
    if (!selected) return "#";
    const destination = selected.address;
    const addr = patientAddress.trim();
    const origin =
      addr.length > 0
        ? addr
        : geo?.source === "device"
          ? `${geo.lat},${geo.lng}`
          : "";

    const base = "https://www.google.com/maps/dir/?api=1";
    const params = new URLSearchParams({ destination, travelmode: "driving" });
    if (origin) params.set("origin", origin);

    return `${base}&${params.toString()}`;
  }, [selected, patientAddress, geo]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const selectNearestFromGeo = (g: Geo) => {
    const list = filtered
      .map((c) => ({ c, d: haversineKm(g.lat, g.lng, c.lat, c.lng) }))
      .sort((a, b) => a.d - b.d);
    if (list[0]?.c?.id) setSelectedId(list[0].c.id);
  };

  const findNearestByAddress = async () => {
    const addr = patientAddress.trim();
    if (!addr) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const g0 = await geocodeAddressOSM(addr);
      if (!g0) {
        setGeo(null);
        setGeoError("Adresse introuvable. Essayez une ville + code postal.");
        return;
      }
      const g: Geo = { ...g0, source: "address" };
      setGeo(g);
      selectNearestFromGeo(g);
    } catch {
      setGeo(null);
      setGeoError("Impossible de localiser l'adresse pour le moment.");
    } finally {
      setGeoLoading(false);
    }
  };

  const locateMe = async () => {
    setLocError(null);
    setLocLoading(true);
    try {
      if (!navigator.geolocation) {
        setLocError("La géolocalisation n'est pas disponible sur cet appareil.");
        return;
      }
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const g: Geo = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: "Position actuelle",
              source: "device",
            };
            setGeo(g);
            selectNearestFromGeo(g);
            resolve();
          },
          () => reject(new Error("denied")),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    } catch {
      setLocError("Géolocalisation refusée ou indisponible.");
    } finally {
      setLocLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-[calc(100vh-80px)] pt-28 pb-16"
      style={{
        background:
          "linear-gradient(160deg, #F0F7FF 0%, #F8FAFB 45%, #F0FDF8 100%)",
      }}
    >
      <div className="mx-auto max-w-[1600px] px-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-3xl">

            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background:
                  "linear-gradient(90deg, rgba(45,140,255,0.12) 0%, rgba(0,201,138,0.10) 100%)",
                border: "1px solid rgba(45,140,255,0.25)",
                color: "#1A5FB4",
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #2D8CFF 0%, #00C98A 100%)",
                }}
              />
              Réseau national &middot; {centres.length} centres
            </div>

            <h1
              className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight"
              style={{ color: "#0B1220" }}
            >
              Nos centres
            </h1>
            <p className="mt-3 text-base" style={{ color: "#64748B" }}>
              Trouvez un centre ClairVision ou ClairAudition et identifiez
              le plus proche de votre patient en quelques secondes.
            </p>

            {/* Stats bar */}
            <div className="mt-5 flex items-center gap-4 flex-wrap">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  background: "rgba(45,140,255,0.08)",
                  border: "1px solid rgba(45,140,255,0.2)",
                  color: "#2D8CFF",
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "#2D8CFF" }}
                />
                {totalVision} centres Vision
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  background: "rgba(0,201,138,0.08)",
                  border: "1px solid rgba(0,201,138,0.2)",
                  color: "#00A872",
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "#00C98A" }}
                />
                {totalAudition} centres Audition
              </div>
            </div>
          </div>

          {/* Back link — desktop */}
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              color: "#0B1220",
            }}
          >
            ← Retour
          </Link>
        </div>

        {/* ── 2-column layout ───────────────────────────────────────────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[460px_1fr]">

          {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
          <div
            className="p-6 flex flex-col gap-0"
            style={{
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
            }}
          >
            {/* Address input */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#64748B" }}
              >
                Adresse patient
              </p>
              <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>
                Entrez une adresse pour trier les centres par proximité.
              </p>

              <div className="mt-4 flex gap-2">
                {/* Input with icon */}
                <div className="relative flex-1">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#94A3B8" }}
                  >
                    <IconPin />
                  </span>
                  <input
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void findNearestByAddress();
                    }}
                    placeholder="Adresse, ville ou code postal"
                    className="w-full rounded-2xl py-3 pl-9 pr-4 text-sm outline-none transition-shadow"
                    style={{
                      background: "var(--glass-strong-bg)",
                      border: "1px solid #E2E8F0",
                      color: "#0B1220",
                    }}
                  />
                </div>

                {/* Find nearest button */}
                <button
                  type="button"
                  onClick={() => void findNearestByAddress()}
                  disabled={geoLoading || !patientAddress.trim()}
                  className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
                  style={
                    geoLoading || !patientAddress.trim()
                      ? {
                          background: "#F1F5F9",
                          border: "1px solid #E2E8F0",
                          color: "#94A3B8",
                          cursor: "not-allowed",
                        }
                      : {
                          background:
                            "#2D8CFF",
                          border: "none",
                          color: "#fff",
                          boxShadow: "0 8px 24px rgba(45,140,255,0.30)",
                        }
                  }
                >
                  {geoLoading ? "..." : "Trouver le plus proche"}
                </button>
              </div>

              {/* Locate me + directions row */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void locateMe()}
                  disabled={locLoading}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: "var(--glass-strong-bg)",
                    border: "1px solid #E2E8F0",
                    color: locLoading ? "#94A3B8" : "#0B1220",
                    cursor: locLoading ? "not-allowed" : "pointer",
                  }}
                >
                  <IconLocate />
                  {locLoading ? "Localisation..." : "Me localiser"}
                </button>

                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: "var(--glass-strong-bg)",
                    border: "1px solid #E2E8F0",
                    color: "#0B1220",
                  }}
                >
                  Itinéraire →
                </a>
              </div>

              {/* Geo feedback */}
              {geo ? (
                <div className="mt-2 text-xs" style={{ color: "#64748B" }}>
                  Localisation :{" "}
                  <span className="font-semibold" style={{ color: "#0B1220" }}>
                    {geo.label}
                  </span>{" "}
                  {geo.source === "address" ? "(adresse)" : "(appareil)"}
                </div>
              ) : null}
              {geoError ? (
                <div className="mt-2 text-xs text-red-500">{geoError}</div>
              ) : null}
              {locError ? (
                <div className="mt-2 text-xs text-red-500">{locError}</div>
              ) : null}
            </div>

            {/* ── Filter tabs ─────────────────────────────────────────────── */}
            <div
              className="mt-6 inline-flex items-center gap-1 rounded-full p-1 self-start"
              style={{
                background: "rgba(241,245,249,0.80)",
                border: "1px solid #E2E8F0",
              }}
            >
              {(
                [
                  { key: "all", label: "Tous" },
                  { key: "vision", label: "Clair Vision" },
                  { key: "audition", label: "Clair Audition" },
                ] as { key: "all" | Module; label: string }[]
              ).map(({ key, label }) => {
                const active = filter === key;
                let activeBg = "#fff";
                let activeColor = "#0B1220";
                if (active && key === "vision") {
                  activeBg =
                    "#2D8CFF";
                  activeColor = "#fff";
                } else if (active && key === "audition") {
                  activeBg =
                    "#00C98A";
                  activeColor = "#fff";
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                    style={
                      active
                        ? {
                            background: activeBg,
                            color: activeColor,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }
                        : { background: "transparent", color: "#64748B" }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── Centre list ──────────────────────────────────────────────── */}
            <div className="mt-6">
              <div
                className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#64748B" }}
              >
                <span>Centres</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: "rgba(45,140,255,0.08)",
                    color: "#2D8CFF",
                  }}
                >
                  {scored.length}
                </span>
              </div>

              <input
                value={searchCenter}
                onChange={(e) => setSearchCenter(e.target.value)}
                placeholder="Rechercher un centre (nom, ville...)"
                className="w-full rounded-2xl py-3 px-4 text-sm outline-none"
                style={{
                  background: "var(--glass-strong-bg)",
                  border: "1px solid #E2E8F0",
                  color: "#0B1220",
                }}
              />

              <div className="mt-3 space-y-2 max-h-[48vh] overflow-y-auto pr-0.5">
                {scored.map((c) => {
                  const active = c.id === (selected?.id ?? "");
                  const recommended = recommendedId === c.id;
                  const isVision = c.module === "vision";
                  const accentColor = isVision ? "#2D8CFF" : "#00C98A";
                  const accentBg = isVision
                    ? "rgba(45,140,255,0.07)"
                    : "rgba(0,201,138,0.07)";
                  const moduleBadgeBg = isVision
                    ? "rgba(45,140,255,0.10)"
                    : "rgba(0,201,138,0.10)";
                  const moduleBadgeColor = isVision ? "#1A5FB4" : "#00875E";

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="w-full text-left rounded-2xl transition-all overflow-hidden"
                      style={
                        active
                          ? {
                              background: "#fff",
                              border: `1px solid ${accentColor}40`,
                              boxShadow: `0 4px 20px ${accentColor}18`,
                            }
                          : {
                              background: "rgba(255,255,255,0.50)",
                              border: "1px solid #E2E8F0",
                            }
                      }
                    >
                      {/* Colored left border accent */}
                      <div className="flex">
                        <div
                          className="w-1 shrink-0 rounded-l-2xl"
                          style={{ background: accentColor }}
                        />
                        <div className="flex-1 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: name + address */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-sm font-semibold leading-tight"
                                  style={{ color: "#0B1220" }}
                                >
                                  {c.name}
                                </span>

                                {recommended ? (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #0B1220 0%, #1E293B 100%)",
                                      color: "#fff",
                                    }}
                                  >
                                    <IconStar />
                                    Recommandé
                                  </span>
                                ) : null}
                              </div>
                              <div
                                className="mt-0.5 text-xs leading-snug truncate max-w-[220px]"
                                style={{ color: "#94A3B8" }}
                              >
                                {c.address}
                              </div>
                            </div>

                            {/* Right: badges + distance */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {/* Module badge */}
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{
                                  background: moduleBadgeBg,
                                  color: moduleBadgeColor,
                                }}
                              >
                                {isVision ? "Optique" : "Audio"}
                              </span>

                              {/* Registry status badge */}
                              {c.fromRegistry && c.statut ? (
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                  style={
                                    c.statut === "actif"
                                      ? {
                                          background:
                                            "rgba(0,201,138,0.10)",
                                          color: "#00875E",
                                        }
                                      : {
                                          background:
                                            "rgba(245,158,11,0.10)",
                                          color: "#B45309",
                                        }
                                  }
                                >
                                  {c.statut === "actif" ? "Actif" : "En essai"}
                                </span>
                              ) : null}

                              {/* Distance */}
                              {typeof c.distanceKm === "number" ? (
                                <span
                                  className="text-xs font-medium tabular-nums"
                                  style={{ color: accentColor }}
                                >
                                  {c.distanceKm.toFixed(1)} km
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Active selection indicator */}
                          {active ? (
                            <div
                              className="mt-2 h-0.5 rounded-full"
                              style={{
                                background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
                                opacity: 0.4,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {scored.length === 0 ? (
                  <div
                    className="rounded-2xl px-4 py-8 text-center text-sm"
                    style={{
                      background: "rgba(241,245,249,0.60)",
                      border: "1px solid #E2E8F0",
                      color: "#94A3B8",
                    }}
                  >
                    Aucun centre trouvé.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* ── RIGHT MAP ──────────────────────────────────────────────────── */}
          <div
            className="overflow-hidden flex flex-col"
            style={{
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
            }}
          >
            {/* Map header */}
            <div
              className="px-6 py-4 flex items-center justify-between gap-4"
              style={{ borderBottom: "1px solid rgba(226,232,240,0.60)" }}
            >
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "#0B1220" }}
                >
                  {selected ? selected.name : "Carte interactive"}
                </div>
                <div className="text-sm truncate" style={{ color: "#94A3B8" }}>
                  {selected ? selected.address : "Sélectionnez un centre"}
                </div>
              </div>

              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: "rgba(241,245,249,0.80)",
                  border: "1px solid #E2E8F0",
                  color: "#0B1220",
                }}
              >
                Itinéraire →
              </a>
            </div>

            {/* Map iframe */}
            <div className="flex-1 w-full h-[72vh] lg:h-[calc(100vh-240px)]">
              <iframe
                title="Carte centres"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={mapSrc}
                style={{ border: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Back link — mobile */}
        <div className="mt-8 md:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: "var(--glass-strong-bg)",
              border: "1px solid rgba(255,255,255,0.8)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              color: "#0B1220",
            }}
          >
            ← Retour
          </Link>
        </div>
      </div>
    </main>
  );
}
