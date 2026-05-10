"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRole } from "@/lib/auth-client";
import { EyeIcon, LensIcon, EarIcon, HearingAidIcon } from "@/components/ui/service-icons";

type Role = "patient" | "praticien" | null;
type Service = "optique" | "audio";
type Prestation = "examen_vue" | "lentilles" | "test_auditif" | "appareillage";

type Centre = {
  id: string;
  service: Service;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

type Geo = { lat: number; lng: number; label: string; source: "address" | "device" };

type Draft = {
  step: number;
  service: Service | null;
  centreId: string | null;
  prestation: Prestation | null;
  dateISO: string | null;
  time: string | null;
  patientAddress?: string;
  geo?: Geo | null;
};

const DRAFT_KEY = "thor_rdv_draft_v1";

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
    headers: {
      Accept: "application/json",
      "Accept-Language": "fr",
    },
  });

  if (!res.ok) throw new Error("Erreur géocodage");
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data?.[0]) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
}

function clampStep(n: number) {
  return Math.min(5, Math.max(1, n));
}

function formatDayLabel(d: Date) {
  const w = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d);
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(d);
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
  return { w, day, month };
}

function StepPanel({ stepKey, children }: { stepKey: string | number; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div
      className={[
        "transition-all duration-300 ease-out will-change-transform",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkeletonPill() {
  return <span className="inline-block h-4 w-14 rounded-full bg-slate-200/70 animate-pulse" />;
}

// SVG clock icon for duration labels
function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}>
      <circle cx="8" cy="8" r="6.5" stroke="#94a3b8" strokeWidth="1.3" />
      <path d="M8 5v3.5l2 1.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// SVG map pin icon
function MapPinIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}>
      <path d="M10 2a5 5 0 0 1 5 5c0 4-5 11-5 11S5 11 5 7a5 5 0 0 1 5-5Z" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="10" cy="7" r="1.5" fill="#94a3b8" />
    </svg>
  );
}

// SVG location/crosshair icon
function LocateIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }}>
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Glassmorphism card style
const glassCard: React.CSSProperties = {
  background: "var(--glass-strong-bg)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--glass-strong-border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
  borderRadius: 24,
};

export default function RendezVousPage() {
  const [role, setRole] = useState<Role>(null);

  // Patient info (step 5)
  const [patientNom, setPatientNom] = useState("");
  const [patientPrenom, setPatientPrenom] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  // Draft / flow
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [service, setService] = useState<Service | null>("optique");
  const [centreId, setCentreId] = useState<string | null>(null);
  const [prestation, setPrestation] = useState<Prestation | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Localisation (étape 2)
  const [patientAddress, setPatientAddress] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // centres (exemples)
  const centres: Centre[] = useMemo(
    () => [
      {
        id: "cv-paris-14",
        service: "optique",
        name: "ClairVision Paris 14",
        address: "12 rue de la Santé",
        city: "75014 Paris",
        lat: 48.8337,
        lng: 2.3342,
      },
      {
        id: "cv-marseille-prado",
        service: "optique",
        name: "ClairVision Marseille Prado",
        address: "210A Rue Paradis",
        city: "13006 Marseille",
        lat: 43.2878,
        lng: 5.3816,
      },
      {
        id: "cv-lille",
        service: "optique",
        name: "ClairVision Lille Centre",
        address: "Place Rihour",
        city: "59800 Lille",
        lat: 50.6369,
        lng: 3.0633,
      },
      {
        id: "ca-lyon-2",
        service: "audio",
        name: "ClairAudition Lyon 2",
        address: "Place Bellecour",
        city: "69002 Lyon",
        lat: 45.7579,
        lng: 4.832,
      },
      {
        id: "ca-bordeaux",
        service: "audio",
        name: "ClairAudition Bordeaux Centre",
        address: "Cours de l'Intendance",
        city: "33000 Bordeaux",
        lat: 44.8423,
        lng: -0.5756,
      },
    ],
    []
  );

  type CentreWithDistance = Centre & { distanceKm: number | null };

  const centresForService: CentreWithDistance[] = useMemo(() => {
    const base = centres.filter((c) => c.service === service);

    if (!geo) return base.map((c) => ({ ...c, distanceKm: null }));

    return base
      .map((c) => ({
        ...c,
        distanceKm: haversineKm(geo.lat, geo.lng, c.lat, c.lng),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [centres, service, geo]);

  const recommendedId = useMemo(() => (geo ? centresForService[0]?.id ?? null : null), [geo, centresForService]);

  // calendrier simple
  const days = useMemo(() => {
    const out: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      out.push(d);
    }
    return out;
  }, []);

  const timeSlots = useMemo(
    () => ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    []
  );

  // lecture role + draft
  useEffect(() => {
    setRole(getRole());

    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;

      setStep(clampStep(d.step) as 1 | 2 | 3 | 4 | 5);
      setService(d.service ?? "optique");
      setCentreId(d.centreId ?? null);
      setPrestation(d.prestation ?? null);
      setDateISO(d.dateISO ?? null);
      setTime(d.time ?? null);
      setPatientAddress(d.patientAddress ?? "");
      setGeo(d.geo ?? null);
    } catch {
      // ignore
    }
  }, []);

  // persist draft
  useEffect(() => {
    const d: Draft = { step, service, centreId, prestation, dateISO, time, patientAddress, geo };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      // ignore
    }
  }, [step, service, centreId, prestation, dateISO, time, patientAddress, geo]);

  const selectedCentre = useMemo(() => centres.find((c) => c.id === centreId) ?? null, [centres, centreId]);

  const prestationLabel = useMemo(() => {
    if (!prestation) return "—";
    const map: Record<Prestation, string> = {
      examen_vue: "Examen de vue",
      lentilles: "Adaptation lentilles",
      test_auditif: "Test auditif",
      appareillage: "Appareillage auditif",
    };
    return map[prestation];
  }, [prestation]);

  const dateLabel = useMemo(() => {
    if (!dateISO) return "—";
    const d = new Date(dateISO);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  }, [dateISO]);

  const canContinue = useMemo(() => {
    if (step === 1) return !!service;
    // on garde centre obligatoire, et la localisation sert à proposer le + proche (auto-sélection)
    if (step === 2) return !!centreId;
    if (step === 3) return !!prestation;
    if (step === 4) return !!dateISO && !!time;
    return true;
  }, [step, service, centreId, prestation, dateISO, time]);

  const goNext = () => setStep((s) => (Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5));
  const goBack = () => setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5));

  const steps = [
    { n: 1, title: "Service", subtitle: "Optique ou Audio" },
    { n: 2, title: "Centre", subtitle: "Localisation" },
    { n: 3, title: "Prestation", subtitle: "Type de RDV" },
    { n: 4, title: "Date", subtitle: "Créneau" },
    { n: 5, title: "Confirmation", subtitle: "" },
  ] as const;

  const selectNearestFromGeo = (g: Geo, s: Service) => {
    const list = centres
      .filter((c) => c.service === s)
      .map((c) => ({ id: c.id, d: haversineKm(g.lat, g.lng, c.lat, c.lng) }))
      .sort((a, b) => a.d - b.d);

    if (list[0]?.id) setCentreId(list[0].id);
  };

  const findNearestByAddress = async () => {
    const addr = patientAddress.trim();
    if (!addr) return;

    setGeoLoading(true);
    setGeoError(null);
    setLocError(null);

    try {
      const g0 = await geocodeAddressOSM(addr);
      if (!g0) {
        setGeo(null);
        setGeoError("Adresse introuvable. Ajoute une ville + code postal.");
        return;
      }

      const g: Geo = { ...g0, source: "address" };
      setGeo(g);
      selectNearestFromGeo(g, service ?? "optique");
    } catch {
      setGeo(null);
      setGeoError("Impossible de localiser l'adresse pour le moment.");
    } finally {
      setGeoLoading(false);
    }
  };

  const locateMe = async () => {
    setLocError(null);
    setGeoError(null);
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
            selectNearestFromGeo(g, service ?? "optique");
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

  const handleConfirm = async () => {
    if (!patientNom.trim() || !patientPrenom.trim()) return;

    // Save patient profile
    const patient = {
      id: `patient-${Date.now()}`,
      nom: patientNom.trim(),
      prenom: patientPrenom.trim(),
      email: patientEmail.trim() || undefined,
    };
    try {
      window.localStorage.setItem("thor_patient_current", JSON.stringify(patient));
      window.localStorage.setItem("thor_role", "patient");
    } catch { /* noop */ }

    // Save RDV to the pro agenda localStorage key
    const lsKey = service === "optique" ? "thor_pro_rdv" : "thor_pro_audition_rdv";
    const typeMap: Record<string, string> = {
      examen_vue: "controle",
      lentilles: "adaptation",
      test_auditif: "bilan",
      appareillage: "adaptation",
    };
    const dureeMap: Record<string, number> = {
      examen_vue: 30, lentilles: 45, test_auditif: 30, appareillage: 45,
    };
    const rdv = {
      id: `rdv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: dateISO ? new Date(dateISO).toISOString().slice(0, 10) : "",
      heure: time ?? "09:00",
      duree: dureeMap[prestation ?? ""] ?? 30,
      type: typeMap[prestation ?? ""] ?? "autre",
      patientNom: patient.nom,
      patientPrenom: patient.prenom,
      telephone: "",
      notes: `RDV pris en ligne${selectedCentre ? ` — ${selectedCentre.name}` : ""}`,
      statut: "demande",
      fromPatient: true,
      seen: false,
    };
    try {
      const existing = JSON.parse(window.localStorage.getItem(lsKey) ?? "[]") as object[];
      window.localStorage.setItem(lsKey, JSON.stringify([...existing, rdv]));
    } catch { /* noop */ }

    // Auto-créer le patient dans la liste praticien s'il n'existe pas déjà
    try {
      const patientLsKey = service === "optique" ? "thor_pro_patients" : "thor_pro_audition_patients";
      const existingPatients = JSON.parse(window.localStorage.getItem(patientLsKey) ?? "[]") as Array<Record<string, string>>;
      const alreadyExists = existingPatients.some(
        p => p.nom?.toLowerCase() === patient.nom.toLowerCase() && p.prenom?.toLowerCase() === patient.prenom.toLowerCase()
      );
      if (!alreadyExists) {
        const newPatient = {
          id: `patient_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email ?? "",
          telephone: "",
          dateNaissance: "",
          status: "actif",
          lastRdv: new Date().toISOString().slice(0, 10),
          fromOnline: true,
        };
        window.localStorage.setItem(patientLsKey, JSON.stringify([...existingPatients, newPatient]));
      }
    } catch { /* noop */ }

    // Récupérer l'email du centre depuis le registre localStorage
    let centreEmail: string | undefined;
    try {
      const registry = JSON.parse(window.localStorage.getItem("thor_centres_registry") ?? "[]") as Array<{ nom?: string; email?: string; module?: string }>;
      const moduleKey = service === "optique" ? "vision" : "audition";
      const match = registry.find(c => c.module === moduleKey && selectedCentre && c.nom === selectedCentre.name);
      centreEmail = match?.email;

      // Fallback sur le storeConfig du bon module
      if (!centreEmail) {
        const cfgKey = service === "optique" ? "thor_pro_store_config" : "thor_pro_audition_store_config";
        const cfg = JSON.parse(window.localStorage.getItem(cfgKey) ?? "{}") as { email?: string; nom?: string };
        centreEmail = cfg.email;
      }
    } catch { /* noop */ }

    // Envoyer la notification email (fire-and-forget — ne bloque pas l'UX)
    {
      const prestationLabels: Record<string, string> = {
        examen_vue: "Examen de vue",
        lentilles: "Adaptation lentilles",
        test_auditif: "Test auditif",
        appareillage: "Appareillage auditif",
      };
      const moduleKey: "vision" | "audition" = service === "optique" ? "vision" : "audition";
      fetch("/api/notify-rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientNom: patient.nom,
          patientPrenom: patient.prenom,
          telephone: "",
          email: patient.email,
          date: dateLabel,
          heure: time ?? "—",
          type: prestationLabels[prestation ?? ""] ?? prestation ?? "—",
          notes: `RDV pris en ligne${selectedCentre ? ` — ${selectedCentre.name}` : ""}`,
          centreEmail: centreEmail ?? "",
          centreNom: selectedCentre?.name ?? "Centre THOR",
          module: moduleKey,
        }),
      }).catch(() => { /* noop — ne pas bloquer si l'email échoue */ });
    }

    setConfirmed(true);
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
  };

  return (
    <main
      className="w-full px-8 lg:px-16 pt-28 pb-16 relative overflow-hidden"
      style={{ minHeight: "calc(100vh - 5rem)" }}
    >
      {/* Background gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(145deg, #f8fafc 0%, #f0f5ff 40%, #f8fcfa 100%)",
          zIndex: 0,
        }}
      />

      {/* Animated orbs */}
      <div
        aria-hidden
        className="orbDrift"
        style={{
          position: "absolute",
          top: "-8rem",
          left: "-6rem",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,140,255,0.13) 0%, transparent 70%)",
          animation: "orbDrift 14s ease-in-out infinite",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-6rem",
          right: "-4rem",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,192,144,0.10) 0%, transparent 70%)",
          animation: "orbDrift 18s ease-in-out infinite reverse",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "40%",
          left: "55%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,140,255,0.07) 0%, transparent 70%)",
          animation: "orbDrift 22s ease-in-out infinite",
          animationDelay: "-6s",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: "#0f172a" }}>
            Prendre rendez-vous
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
            Réservez votre créneau en quelques étapes
          </p>

          <div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
            style={{
              ...glassCard,
              borderRadius: 999,
              color: "#475569",
              padding: "8px 18px",
            }}
          >
            Connexion demandée uniquement à la confirmation
            {role === "praticien" ? (
              <span
                className="ml-2 px-2 py-1 text-[11px]"
                style={{
                  borderRadius: 999,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(203,213,225,0.7)",
                  color: "#334155",
                }}
              >
                Connecté en praticien
              </span>
            ) : null}
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-10 flex items-center justify-center gap-4">
          {steps.map((s, idx) => {
            const isDone = s.n < step;
            const isActive = s.n === step;

            return (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                    style={
                      isDone
                        ? {
                            background: "#10b981",
                            color: "#fff",
                            boxShadow: "0 4px 16px rgba(16,185,129,0.30)",
                          }
                        : isActive
                        ? {
                            background: "#2D8CFF",
                            color: "#fff",
                            boxShadow: "0 6px 24px rgba(45,140,255,0.35)",
                          }
                        : {
                            background: "var(--glass-strong-bg)",
                            border: "1px solid rgba(203,213,225,0.7)",
                            color: "#94a3b8",
                          }
                    }
                  >
                    {isDone ? <CheckIcon /> : s.n}
                  </div>

                  <div className="mt-2 text-xs font-semibold" style={{ color: "#0f172a" }}>
                    {s.title}
                  </div>
                  {s.subtitle ? (
                    <div className="text-[11px]" style={{ color: "#94a3b8" }}>
                      {s.subtitle}
                    </div>
                  ) : (
                    <div className="h-[14px]" />
                  )}
                </div>

                {idx < steps.length - 1 ? (
                  <div
                    className="mx-3 h-[2px] w-10 rounded-full transition-colors duration-300"
                    style={{
                      background:
                        step > s.n
                          ? "#10b981"
                          : "rgba(203,213,225,0.5)",
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left card */}
          <div style={{ ...glassCard, padding: 32 }}>
            <StepPanel
              stepKey={`${step}-${service}-${centreId}-${prestation}-${dateISO}-${time}-${confirmed}-${geo?.label ?? ""}`}
            >
              {confirmed ? (
                /* Confirmed state */
                <div className="text-center py-10">
                  <div
                    className="mx-auto h-14 w-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                      border: "1px solid rgba(52,211,153,0.4)",
                      color: "#059669",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold" style={{ color: "#0f172a" }}>
                    Rendez-vous confirmé !
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
                    Bonjour {patientPrenom} {patientNom}, votre demande est bien enregistrée.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href={service === "optique" ? "/clair-vision/espace-patient/rendez-vous" : "/clair-audition/espace-patient/rendez-vous"}
                      className="rounded-2xl px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                      style={{
                        background: service === "optique"
                          ? "#2D8CFF"
                          : "#00C98A",
                        boxShadow: service === "optique"
                          ? "0 8px 24px rgba(45,140,255,0.30)"
                          : "0 8px 24px rgba(0,201,138,0.30)",
                      }}
                    >
                      Voir mon espace
                    </Link>
                    <Link
                      href="/"
                      className="rounded-2xl px-6 py-3 text-sm font-semibold transition hover:opacity-80"
                      style={{
                        background: "var(--glass-strong-bg)",
                        border: "1px solid var(--glass-strong-border)",
                        color: "#0f172a",
                      }}
                    >
                      Retour accueil
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 1 - Service selection */}
                  {step === 1 ? (
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                        Choisissez votre service
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                        Optique ou Audio
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Optique card */}
                        <button
                          type="button"
                          onClick={() => {
                            setService("optique");
                            setCentreId(null);
                            setPrestation(null);
                            if (geo) selectNearestFromGeo(geo, "optique");
                          }}
                          className="text-left transition-all duration-200 hover:-translate-y-1"
                          style={{
                            ...glassCard,
                            padding: 28,
                            outline: "none",
                            border:
                              service === "optique"
                                ? "2px solid #2D8CFF"
                                : "1px solid rgba(255,255,255,0.80)",
                            boxShadow:
                              service === "optique"
                                ? "0 8px 32px rgba(45,140,255,0.18)"
                                : "0 8px 32px rgba(0,0,0,0.07)",
                          }}
                        >
                          <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                              background:
                                service === "optique"
                                  ? "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
                                  : "rgba(241,245,249,0.8)",
                              color: service === "optique" ? "#2D8CFF" : "#64748b",
                            }}
                          >
                            <EyeIcon className="h-6 w-6" />
                          </div>
                          <div className="text-base font-semibold" style={{ color: "#0f172a" }}>
                            Optique
                          </div>
                          <div className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                            Examen de vue, lentilles de contact
                          </div>
                          {service === "optique" && (
                            <div
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(45,140,255,0.10)",
                                color: "#2D8CFF",
                              }}
                            >
                              <CheckIcon /> Sélectionné
                            </div>
                          )}
                        </button>

                        {/* Audio card */}
                        <button
                          type="button"
                          onClick={() => {
                            setService("audio");
                            setCentreId(null);
                            setPrestation(null);
                            if (geo) selectNearestFromGeo(geo, "audio");
                          }}
                          className="text-left transition-all duration-200 hover:-translate-y-1"
                          style={{
                            ...glassCard,
                            padding: 28,
                            outline: "none",
                            border:
                              service === "audio"
                                ? "2px solid #00C090"
                                : "1px solid rgba(255,255,255,0.80)",
                            boxShadow:
                              service === "audio"
                                ? "0 8px 32px rgba(0,192,144,0.18)"
                                : "0 8px 32px rgba(0,0,0,0.07)",
                          }}
                        >
                          <div
                            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                              background:
                                service === "audio"
                                  ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                                  : "rgba(241,245,249,0.8)",
                              color: service === "audio" ? "#00C090" : "#64748b",
                            }}
                          >
                            <EarIcon className="h-6 w-6" />
                          </div>
                          <div className="text-base font-semibold" style={{ color: "#0f172a" }}>
                            Audio
                          </div>
                          <div className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                            Test auditif, appareillage
                          </div>
                          {service === "audio" && (
                            <div
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(0,192,144,0.10)",
                                color: "#00C090",
                              }}
                            >
                              <CheckIcon /> Sélectionné
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* STEP 2 - Centre selection */}
                  {step === 2 ? (
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                        Sélectionnez un centre
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                        Pour vous proposer le centre le plus proche, indiquez l'adresse du patient (ou utilisez la géolocalisation).
                      </p>

                      {/* Localisation */}
                      <div
                        className="mt-6 p-5"
                        style={{
                          ...glassCard,
                          background: "rgba(248,250,252,0.72)",
                        }}
                      >
                        <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                          Localisation du patient
                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="flex gap-3">
                            <input
                              value={patientAddress}
                              onChange={(e) => setPatientAddress(e.target.value)}
                              placeholder="Adresse, ville ou code postal"
                              className="flex-1 px-4 py-3 text-sm outline-none"
                              style={{
                                background: "var(--glass-strong-bg)",
                                border: "1px solid rgba(203,213,225,0.6)",
                                borderRadius: 14,
                                color: "#0f172a",
                              }}
                            />
                            <button
                              type="button"
                              onClick={findNearestByAddress}
                              disabled={geoLoading || !patientAddress.trim()}
                              className="px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-2xl"
                              style={
                                geoLoading || !patientAddress.trim()
                                  ? {
                                      background: "rgba(241,245,249,0.8)",
                                      color: "#94a3b8",
                                      cursor: "not-allowed",
                                      border: "1px solid rgba(203,213,225,0.5)",
                                    }
                                  : {
                                      background: "#2D8CFF",
                                      color: "#fff",
                                      boxShadow: "0 6px 20px rgba(45,140,255,0.30)",
                                    }
                              }
                            >
                              {geoLoading ? "..." : "Plus proche"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={locateMe}
                              disabled={locLoading}
                              className="inline-flex items-center justify-center px-4 py-3 text-sm font-semibold transition rounded-2xl"
                              style={
                                locLoading
                                  ? {
                                      background: "rgba(255,255,255,0.50)",
                                      color: "#94a3b8",
                                      cursor: "not-allowed",
                                      border: "1px solid rgba(203,213,225,0.5)",
                                    }
                                  : {
                                      background: "var(--glass-strong-bg)",
                                      border: "1px solid rgba(203,213,225,0.6)",
                                      color: "#0f172a",
                                    }
                              }
                            >
                              <LocateIcon />
                              {locLoading ? "Localisation..." : "Me localiser"}
                            </button>

                            {geo ? (
                              <div className="text-xs text-right" style={{ color: "#64748b" }}>
                                Localisation :{" "}
                                <span className="font-semibold" style={{ color: "#0f172a" }}>
                                  {geo.label}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-right" style={{ color: "#94a3b8" }}>
                                Optionnel, mais recommandé
                              </div>
                            )}
                          </div>

                          {geoError ? (
                            <div className="text-xs" style={{ color: "#dc2626" }}>
                              {geoError}
                            </div>
                          ) : null}
                          {locError ? (
                            <div className="text-xs" style={{ color: "#dc2626" }}>
                              {locError}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Liste centres */}
                      <div className="mt-6 space-y-3">
                        {centresForService.length === 0 && (
                          <div
                            className="flex flex-col items-center justify-center py-10 rounded-2xl text-center"
                            style={{ background: "rgba(248,250,252,0.80)", border: "1px dashed rgba(203,213,225,0.70)" }}
                          >
                            <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                              Aucun centre disponible
                            </div>
                            <div className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                              Aucun centre {service === "optique" ? "Clair Vision" : "Clair Audition"} n&apos;est encore disponible dans votre région.
                            </div>
                            <button
                              type="button"
                              onClick={() => setService(service === "optique" ? "audio" : "optique")}
                              className="mt-4 text-xs font-semibold transition-colors"
                              style={{ color: "#2D8CFF" }}
                            >
                              Voir les centres {service === "optique" ? "Clair Audition" : "Clair Vision"} →
                            </button>
                          </div>
                        )}
                        {centresForService.map((c) => {
                          const active = c.id === centreId;
                          const isRecommended = !!geo && c.id === recommendedId;

                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCentreId(c.id)}
                              className="w-full text-left transition-all duration-200 hover:-translate-y-[1px]"
                              style={{
                                ...glassCard,
                                padding: "16px 20px",
                                border: active
                                  ? "2px solid #2D8CFF"
                                  : "1px solid rgba(255,255,255,0.80)",
                                boxShadow: active
                                  ? "0 8px 32px rgba(45,140,255,0.15)"
                                  : "0 8px 32px rgba(0,0,0,0.07)",
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                                      {c.name}
                                    </div>
                                    {isRecommended ? (
                                      <span
                                        className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full"
                                        style={{
                                          background: "#2D8CFF",
                                          color: "#fff",
                                        }}
                                      >
                                        Recommandé
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                                    <MapPinIcon />
                                    {c.address}, {c.city}
                                  </div>
                                </div>

                                {typeof c.distanceKm === "number" ? (
                                  <span
                                    className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{
                                      background: active
                                        ? "rgba(45,140,255,0.10)"
                                        : "rgba(241,245,249,0.8)",
                                      color: active ? "#2D8CFF" : "#475569",
                                    }}
                                  >
                                    {c.distanceKm.toFixed(1)} km
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* STEP 3 - Prestation selection */}
                  {step === 3 ? (
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                        Type de prestation
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                        Choisissez votre RDV
                      </p>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {service === "optique" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPrestation("examen_vue")}
                              className="text-left transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none"
                              style={{
                                ...glassCard,
                                padding: 20,
                                border:
                                  prestation === "examen_vue"
                                    ? "2px solid #2D8CFF"
                                    : "1px solid rgba(255,255,255,0.80)",
                                boxShadow:
                                  prestation === "examen_vue"
                                    ? "0 8px 32px rgba(45,140,255,0.18)"
                                    : "0 8px 32px rgba(0,0,0,0.07)",
                              }}
                            >
                              <div
                                className="flex items-center gap-2 font-semibold"
                                style={{ color: prestation === "examen_vue" ? "#2D8CFF" : "#0f172a" }}
                              >
                                <EyeIcon className="h-5 w-5" /> Examen de vue
                              </div>
                              <div className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                                <ClockIcon /> 30 min
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPrestation("lentilles")}
                              className="text-left transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none"
                              style={{
                                ...glassCard,
                                padding: 20,
                                border:
                                  prestation === "lentilles"
                                    ? "2px solid #2D8CFF"
                                    : "1px solid rgba(255,255,255,0.80)",
                                boxShadow:
                                  prestation === "lentilles"
                                    ? "0 8px 32px rgba(45,140,255,0.18)"
                                    : "0 8px 32px rgba(0,0,0,0.07)",
                              }}
                            >
                              <div
                                className="flex items-center gap-2 font-semibold"
                                style={{ color: prestation === "lentilles" ? "#2D8CFF" : "#0f172a" }}
                              >
                                <LensIcon className="h-5 w-5" /> Adaptation lentilles
                              </div>
                              <div className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                                <ClockIcon /> 45 min
                              </div>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setPrestation("test_auditif")}
                              className="text-left transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none"
                              style={{
                                ...glassCard,
                                padding: 20,
                                border:
                                  prestation === "test_auditif"
                                    ? "2px solid #00C090"
                                    : "1px solid rgba(255,255,255,0.80)",
                                boxShadow:
                                  prestation === "test_auditif"
                                    ? "0 8px 32px rgba(0,192,144,0.18)"
                                    : "0 8px 32px rgba(0,0,0,0.07)",
                              }}
                            >
                              <div
                                className="flex items-center gap-2 font-semibold"
                                style={{ color: prestation === "test_auditif" ? "#00C090" : "#0f172a" }}
                              >
                                <EarIcon className="h-5 w-5" /> Test auditif
                              </div>
                              <div className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                                <ClockIcon /> 30 min
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPrestation("appareillage")}
                              className="text-left transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none"
                              style={{
                                ...glassCard,
                                padding: 20,
                                border:
                                  prestation === "appareillage"
                                    ? "2px solid #00C090"
                                    : "1px solid rgba(255,255,255,0.80)",
                                boxShadow:
                                  prestation === "appareillage"
                                    ? "0 8px 32px rgba(0,192,144,0.18)"
                                    : "0 8px 32px rgba(0,0,0,0.07)",
                              }}
                            >
                              <div
                                className="flex items-center gap-2 font-semibold"
                                style={{ color: prestation === "appareillage" ? "#00C090" : "#0f172a" }}
                              >
                                <HearingAidIcon className="h-5 w-5" /> Appareillage auditif
                              </div>
                              <div className="mt-2 text-xs" style={{ color: "#94a3b8" }}>
                                <ClockIcon /> 45 min
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* STEP 4 - Date & time */}
                  {step === 4 ? (
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                        Choisissez une date et un horaire
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                        Sélectionnez votre créneau
                      </p>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="text-sm font-semibold mb-3" style={{ color: "#0f172a" }}>
                            Date
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {days.map((d) => {
                              const { w, day, month } = formatDayLabel(d);
                              const iso = d.toISOString();
                              const active = iso === dateISO;

                              return (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => setDateISO(iso)}
                                  className="text-center transition-all duration-200 hover:-translate-y-[1px]"
                                  style={{
                                    ...glassCard,
                                    padding: "12px 8px",
                                    border: active
                                      ? "2px solid #2D8CFF"
                                      : "1px solid rgba(255,255,255,0.80)",
                                    background: active
                                      ? "linear-gradient(135deg, rgba(45,140,255,0.12) 0%, rgba(37,99,235,0.08) 100%)"
                                      : "rgba(255,255,255,0.72)",
                                    boxShadow: active
                                      ? "0 8px 24px rgba(45,140,255,0.18)"
                                      : "0 8px 32px rgba(0,0,0,0.07)",
                                  }}
                                >
                                  <div className="text-xs" style={{ color: "#94a3b8" }}>
                                    {w}
                                  </div>
                                  <div
                                    className="text-lg font-semibold"
                                    style={{ color: active ? "#2D8CFF" : "#0f172a" }}
                                  >
                                    {day}
                                  </div>
                                  <div className="text-xs" style={{ color: "#94a3b8" }}>
                                    {month}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold mb-3" style={{ color: "#0f172a" }}>
                            Horaire
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {timeSlots.map((t) => {
                              const active = t === time;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTime(t)}
                                  className="text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px]"
                                  style={{
                                    ...glassCard,
                                    padding: "12px 8px",
                                    border: active
                                      ? "2px solid #2D8CFF"
                                      : "1px solid rgba(255,255,255,0.80)",
                                    background: active
                                      ? "linear-gradient(135deg, rgba(45,140,255,0.12) 0%, rgba(37,99,235,0.08) 100%)"
                                      : "rgba(255,255,255,0.72)",
                                    color: active ? "#2D8CFF" : "#475569",
                                    boxShadow: active
                                      ? "0 8px 24px rgba(45,140,255,0.18)"
                                      : "0 8px 32px rgba(0,0,0,0.07)",
                                  }}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* STEP 5 - Confirmation */}
                  {step === 5 ? (
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                        Confirmation
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                        Vérifiez les informations avant de valider
                      </p>

                      {/* Summary glass card */}
                      <div
                        className="mt-6 p-5"
                        style={{
                          ...glassCard,
                          background: "rgba(248,250,252,0.80)",
                        }}
                      >
                        <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                          Résumé
                        </div>
                        <div className="mt-3 space-y-3 text-sm">
                          {[
                            {
                              label: "Service",
                              value: service === "optique" ? "Optique" : "Audio",
                            },
                            {
                              label: "Centre",
                              value: selectedCentre ? selectedCentre.name : "—",
                            },
                            {
                              label: "Prestation",
                              value: prestationLabel,
                            },
                            {
                              label: "Date",
                              value: dateLabel,
                            },
                            {
                              label: "Horaire",
                              value: time ?? "—",
                            },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="flex items-center justify-between gap-3 py-2"
                              style={{
                                borderBottom: "1px solid rgba(203,213,225,0.3)",
                              }}
                            >
                              <span style={{ color: "#64748b" }}>{label}</span>
                              <span className="font-semibold" style={{ color: "#0f172a" }}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Patient info form */}
                      <div className="mt-6 p-5" style={{ ...glassCard }}>
                        <div className="text-sm font-semibold mb-4" style={{ color: "#0f172a" }}>
                          Vos coordonnées
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Prénom *</label>
                            <input
                              value={patientPrenom}
                              onChange={e => setPatientPrenom(e.target.value)}
                              placeholder="Marie"
                              className="w-full px-4 py-3 text-sm outline-none"
                              style={{
                                background: "var(--glass-strong-bg)",
                                border: "1px solid rgba(203,213,225,0.6)",
                                borderRadius: 14,
                                color: "#0f172a",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Nom *</label>
                            <input
                              value={patientNom}
                              onChange={e => setPatientNom(e.target.value)}
                              placeholder="Dupont"
                              className="w-full px-4 py-3 text-sm outline-none"
                              style={{
                                background: "var(--glass-strong-bg)",
                                border: "1px solid rgba(203,213,225,0.6)",
                                borderRadius: 14,
                                color: "#0f172a",
                              }}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Email (optionnel)</label>
                            <input
                              type="email"
                              value={patientEmail}
                              onChange={e => setPatientEmail(e.target.value)}
                              placeholder="marie.dupont@email.fr"
                              className="w-full px-4 py-3 text-sm outline-none"
                              style={{
                                background: "var(--glass-strong-bg)",
                                border: "1px solid rgba(203,213,225,0.6)",
                                borderRadius: 14,
                                color: "#0f172a",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={!patientNom.trim() || !patientPrenom.trim()}
                          className="rounded-2xl px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition active:scale-[0.98]"
                          style={
                            !patientNom.trim() || !patientPrenom.trim()
                              ? { background: "rgba(203,213,225,0.6)", color: "#94a3b8", cursor: "not-allowed" }
                              : {
                                  background: "#2D8CFF",
                                  boxShadow: "0 8px 28px rgba(45,140,255,0.35)",
                                }
                          }
                        >
                          Confirmer le rendez-vous
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Footer nav */}
                  {!confirmed ? (
                    <div
                      className="mt-10 flex items-center justify-between pt-6"
                      style={{ borderTop: "1px solid rgba(203,213,225,0.4)" }}
                    >
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={step === 1}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition"
                        style={{
                          color: step === 1 ? "#cbd5e1" : "#0f172a",
                          cursor: step === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Retour
                      </button>

                      {step < 5 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={!canContinue}
                          className="inline-flex items-center gap-3 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
                          style={
                            !canContinue
                              ? {
                                  background: "rgba(241,245,249,0.8)",
                                  color: "#94a3b8",
                                  cursor: "not-allowed",
                                  border: "1px solid rgba(203,213,225,0.5)",
                                }
                              : {
                                  background: "#2D8CFF",
                                  color: "#fff",
                                  boxShadow: "0 8px 24px rgba(45,140,255,0.30)",
                                }
                          }
                        >
                          Continuer
                          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: "#94a3b8" }}>
                          Connexion demandée à la confirmation.
                        </span>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </StepPanel>
          </div>

          {/* Right recap card */}
          <div
            style={{
              ...glassCard,
              padding: 24,
              height: "fit-content",
            }}
            className="lg:sticky lg:top-28"
          >
            <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>
              Récapitulatif
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div style={{ color: "#64748b" }}>Service</div>
                <div
                  className="px-3 py-1 text-xs font-semibold rounded-full"
                  style={{
                    background:
                      service === "optique"
                        ? "rgba(45,140,255,0.10)"
                        : "rgba(0,192,144,0.10)",
                    color: service === "optique" ? "#2D8CFF" : "#00C090",
                  }}
                >
                  {service === "optique" ? "Optique" : "Audio"}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div style={{ color: "#64748b" }}>Centre</div>
                <div className="text-right font-semibold" style={{ color: "#0f172a" }}>
                  {selectedCentre ? selectedCentre.name : <SkeletonPill />}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div style={{ color: "#64748b" }}>Prestation</div>
                <div className="text-right font-semibold" style={{ color: "#0f172a" }}>
                  {prestation ? prestationLabel : <SkeletonPill />}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div style={{ color: "#64748b" }}>Date</div>
                <div className="text-right font-semibold" style={{ color: "#0f172a" }}>
                  {dateISO ? dateLabel : <SkeletonPill />}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div style={{ color: "#64748b" }}>Horaire</div>
                <div className="font-semibold" style={{ color: "#0f172a" }}>
                  {time ? time : <SkeletonPill />}
                </div>
              </div>
            </div>

            <div
              className="mt-6 p-4 text-xs rounded-2xl"
              style={{
                background: "rgba(241,245,249,0.72)",
                border: "1px solid rgba(203,213,225,0.4)",
                color: "#94a3b8",
              }}
            >
              Astuce : vous pouvez aller jusqu'à la fin sans compte. Connexion demandée uniquement à la confirmation.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
