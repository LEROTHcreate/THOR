"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "signup";
type Step = 1 | 2;
type Space = "vision" | "audition";
type MatchStrength = "none" | "weak" | "strong";
type VerifyChannel = "sms" | "email";

type SavedProfile = { id: string; name: string; detail: string; email?: string };
type Center = { id: string; name: string; city: string };
type ProvisionedPatient = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  email?: string;
  phone?: string;
  centerId?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function formatPhoneFR(input: string) {
  const d = digitsOnly(input).slice(0, 10);
  return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
function maskEmail(email: string) {
  const [u, d] = email.split("@");
  if (!d) return "•••";
  const head = u.slice(0, 2);
  return `${head}•••@${d}`;
}
function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  return `••••••${digits.slice(-2)}`;
}
function passwordChecks(p: string) {
  const v = p ?? "";
  const length = v.length >= 8;
  const upper = /[A-Z]/.test(v);
  const num = /\d/.test(v);
  const special = /[^A-Za-z0-9]/.test(v);
  const score = [length, upper, num, special].filter(Boolean).length;
  const label = score <= 1 ? "Faible" : score === 2 ? "Moyen" : score === 3 ? "Bon" : "Fort";
  return { length, upper, num, special, score, label };
}

// SVG icon components
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m2 7 10 7 10-7"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.91a16 16 0 0 0 6.07 6.07l1.27-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

function ConnexionPatientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const basePath = "/connexion/patient";
  const paramMode: Mode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(paramMode);
  useEffect(() => setMode(paramMode), [paramMode]);

  const setAndSyncMode = (next: Mode) => {
    setMode(next);
    const spaceParam = space === "audition" ? "&space=audition" : "";
    router.replace(next === "signup" ? `${basePath}?mode=signup${spaceParam}` : `${basePath}${space === "audition" ? "?space=audition" : ""}`, { scroll: false });
  };

  const paramSpace: Space = searchParams.get("space") === "audition" ? "audition" : "vision";
  const [space, setSpace] = useState<Space>(paramSpace);
  useEffect(() => setSpace(paramSpace), [paramSpace]);

  const patientSpacePath = space === "audition"
    ? "/clair-audition/espace-patient"
    : "/clair-vision/espace-patient";

  function enterPatientSpace() {
    // UI demo: "connexion" simulée
    document.cookie = "thor_patient=1; path=/; max-age=2592000; samesite=lax";
    window.open(patientSpacePath, "_blank", "noopener,noreferrer");
  }

  const centers: Center[] = useMemo(
    () => [
      { id: "marseille-prado", name: "THOR — Marseille Prado", city: "Marseille" },
      { id: "marseille-vieuxport", name: "THOR — Vieux-Port", city: "Marseille" },
      { id: "aix-centre", name: "THOR — Aix Centre", city: "Aix-en-Provence" },
    ],
    []
  );

  const provisionedPatients: ProvisionedPatient[] = useMemo(
    () => [
      {
        id: "p_001",
        firstName: "Jean",
        lastName: "Dupont",
        birthDate: "1991-04-12",
        email: "jean.dupont@email.com",
        phone: "0600000000",
        centerId: "marseille-prado",
      },
      {
        id: "p_002",
        firstName: "Lina",
        lastName: "Martin",
        birthDate: "1988-09-03",
        email: "lina.martin@email.com",
        centerId: "marseille-vieuxport",
      },
    ],
    []
  );

  // LOGIN (dossiers enregistrés OK)
  const savedProfiles: SavedProfile[] = useMemo(
    () => [
      { id: "me", name: "Jean Dupont", detail: "Vous", email: "jean.dupont@email.com" },
      { id: "dad", name: "Paul Dupont", detail: "Père", email: "paul.dupont@email.com" },
      { id: "grandpa", name: "André Dupont", detail: "Grand-père", email: "andre.dupont@email.com" },
    ],
    []
  );

  const [activeProfileId, setActiveProfileId] = useState<string | null>(savedProfiles[0]?.id ?? null);
  const [email, setEmail] = useState(savedProfiles[0]?.email ?? "");
  const [password, setPassword] = useState("");

  const onPickProfile = (p: SavedProfile) => {
    setActiveProfileId(p.id);
    if (p.email) setEmail(p.email);
  };

  // SIGNUP
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");

  const [centerId, setCenterId] = useState<string>("");
  const [customCenter, setCustomCenter] = useState("");
  const [hasCustomCenter, setHasCustomCenter] = useState(false);

  const [address, setAddress] = useState("");

  const [signupPassword, setSignupPassword] = useState("");
  const [signupPassword2, setSignupPassword2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [acceptTerms, setAcceptTerms] = useState(true);

  // matching dossier existant
  const [matchStrength, setMatchStrength] = useState<MatchStrength>("none");
  const [matched, setMatched] = useState<ProvisionedPatient | null>(null);

  const [verifyChannel, setVerifyChannel] = useState<VerifyChannel>("sms");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const resetMatch = () => {
    setMatchStrength("none");
    setMatched(null);
    setCodeSent(false);
    setCode("");
    setVerified(false);
  };

  const runMatchCheck = () => {
    setVerified(false);
    setCodeSent(false);
    setCode("");

    const fn = normalize(firstName);
    const ln = normalize(lastName);
    const bd = birthDate.trim();
    const em = normalize(signupEmail);
    const ph = digitsOnly(phone);

    const candidates = provisionedPatients.filter((p) => {
      return normalize(p.lastName) === ln && normalize(p.firstName) === fn && p.birthDate === bd;
    });

    if (candidates.length === 0) {
      setMatchStrength("none");
      setMatched(null);
      return;
    }

    const strong = candidates.find((p) => {
      const emailOk = p.email && em && normalize(p.email) === em;
      const phoneOk = p.phone && ph && digitsOnly(p.phone) === ph;
      return Boolean(emailOk || phoneOk);
    });

    if (strong) {
      setMatchStrength("strong");
      setMatched(strong);
      if (strong.centerId) setCenterId(strong.centerId);
      if (strong.phone) setVerifyChannel("sms");
      else setVerifyChannel("email");
      return;
    }

    setMatchStrength("weak");
    setMatched(candidates[0]);
    if (candidates[0].centerId) setCenterId(candidates[0].centerId);
    if (candidates[0].phone) setVerifyChannel("sms");
    else if (candidates[0].email) setVerifyChannel("email");
  };

  const canSendCode = () => {
    if (!matched) return false;
    if (verifyChannel === "sms") return Boolean(matched.phone);
    return Boolean(matched.email);
  };

  const sendCode = () => {
    if (!canSendCode()) return;
    setCodeSent(true);
  };

  const verifyCode = () => {
    // UI demo
    if (code.trim() === "123456") setVerified(true);
  };

  // validations
  const emailOk = signupEmail.trim().length === 0 ? false : isValidEmail(signupEmail);
  const phoneDigits = digitsOnly(phone);
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length === 10;

  const pwd = passwordChecks(signupPassword);
  const pwdMatch = signupPassword && signupPassword2 && signupPassword === signupPassword2;

  const canGoStep2 =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    birthDate.trim().length > 0 &&
    (signupEmail.trim().length > 0 || phoneDigits.length > 0) &&
    (hasCustomCenter ? customCenter.trim().length > 0 : true);

  const mustVerifyExisting = (matchStrength === "strong" || matchStrength === "weak") && matched && (matched.email || matched.phone);

  const canFinalize =
    acceptTerms &&
    pwd.length &&
    pwdMatch &&
    (signupEmail.trim().length === 0 ? phoneOk : emailOk) &&
    phoneOk &&
    (!mustVerifyExisting || verified);

  useEffect(() => {
    if (mode === "login") setStep(1);
  }, [mode]);

  // Derived accent colours and gradients from space
  const accentColor = space === "audition" ? "#00C98A" : "#2D8CFF";
  const accentColorDark = space === "audition" ? "#00A574" : "#1A72E8";
  const accentShadow = space === "audition"
    ? "0 4px 16px rgba(0,201,138,0.28)"
    : "0 4px 16px rgba(45,140,255,0.28)";
  const accentRing = space === "audition" ? "rgba(0,201,138,0.20)" : "rgba(45,140,255,0.20)";

  const leftGradient = space === "audition"
    ? "linear-gradient(145deg, #ECFDF5 0%, #D1FAE5 50%, #CCFBF1 100%)"
    : "linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 50%, #E0F2FE 100%)";

  const primaryBtnStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor}, ${accentColorDark})`,
    boxShadow: accentShadow,
    color: "#fff",
    border: "none",
  };

  const leftContent = space === "audition"
    ? {
        title: "Votre suivi auditif, simplifié",
        features: [
          "Bilans et audiogrammes consultables à tout moment",
          "Suivi de vos appareils et réglages",
          "Rendez-vous en ligne avec votre audioprothésiste",
        ],
        tagline: "Clair Audition — L'audiologie augmentée",
      }
    : {
        title: "Votre santé visuelle, à portée de main",
        features: [
          "Vos examens et ordonnances centralisés",
          "Prise de RDV en ligne, 24h/24",
          "Messagerie directe avec votre praticien",
        ],
        tagline: "Clair Vision — L'optique réinventée",
      };

  const inputClass = (hasError?: boolean) =>
    [
      "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition",
      hasError
        ? "border-red-200 focus:ring-2 focus:ring-red-100"
        : `border-slate-200`,
    ].join(" ");

  const inputStyle: React.CSSProperties = {};
  const inputFocusStyle = { "--tw-ring-color": accentRing } as React.CSSProperties;

  const StepPill = ({ n, title }: { n: Step; title: string }) => {
    const active = step === n;
    return (
      <button
        type="button"
        onClick={() => setStep(n)}
        style={active ? { background: accentColor, color: "#fff", border: "none" } as React.CSSProperties : {}}
        className={[
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
          active ? "" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
        ].join(" ")}
      >
        {n}/2 — {title}
      </button>
    );
  };

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex" } as React.CSSProperties}>

      {/* ─── LEFT PANEL — Branding (hidden on mobile) ─── */}
      <div
        className="hidden lg:flex"
        style={{
          width: "40%",
          flexShrink: 0,
          background: leftGradient,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "48px 40px",
        } as React.CSSProperties}
      >
        {/* Background orbs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.06,
            pointerEvents: "none",
          } as React.CSSProperties}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.08,
            pointerEvents: "none",
          } as React.CSSProperties}
        />

        {/* Brand mark */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "360px" } as React.CSSProperties}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "999px",
              border: `1px solid ${accentColor}40`,
              background: `${accentColor}14`,
              color: accentColorDark,
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 12px",
              marginBottom: "20px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            } as React.CSSProperties}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: accentColor,
                display: "inline-block",
              } as React.CSSProperties}
            />
            Espace patient
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
              marginBottom: "28px",
            } as React.CSSProperties}
          >
            {leftContent.title}
          </h2>

          {/* Feature bullets */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px 0", textAlign: "left" } as React.CSSProperties}>
            {leftContent.features.map((feature, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "14px",
                  fontSize: "14px",
                  color: "#334155",
                  lineHeight: 1.5,
                } as React.CSSProperties}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: `${accentColor}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accentColor,
                    marginTop: "1px",
                  } as React.CSSProperties}
                >
                  <IconCheck />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          {/* Tagline */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: accentColorDark,
              letterSpacing: "0.04em",
              opacity: 0.75,
            } as React.CSSProperties}
          >
            {leftContent.tagline}
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — Form ─── */}
      <div
        style={{
          flex: 1,
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          overflowY: "auto",
        } as React.CSSProperties}
      >
        <div style={{ width: "100%", maxWidth: "640px" } as React.CSSProperties}>

          {/* Glass card */}
          <div
            style={{
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-strong-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              borderRadius: "20px",
              padding: "32px",
            } as React.CSSProperties}
          >
            {/* Header */}
            <div style={{ marginBottom: "24px" } as React.CSSProperties}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0F172A", margin: 0 } as React.CSSProperties}>
                {mode === "login" ? "Bon retour !" : "Créer votre compte"}
              </h1>
              <p style={{ marginTop: "6px", fontSize: "13px", color: "#64748B" } as React.CSSProperties}>
                {mode === "login"
                  ? `Connectez-vous à votre espace ${space === "audition" ? "Clair Audition" : "Clair Vision"}.`
                  : "Si un dossier existe déjà au centre, on vous le proposera."}
              </p>
            </div>

            {/* Brand picker */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" } as React.CSSProperties}>
              {([
                { id: "vision",   label: "Clair Vision",   sub: "Optique & lentilles",    accent: "#2D8CFF", selBorder: "#2D8CFF", selBg: "rgba(239,246,255,0.80)" },
                { id: "audition", label: "Clair Audition",  sub: "Audiologie & appareils", accent: "#00C98A", selBorder: "#00C98A", selBg: "rgba(236,253,245,0.80)" },
              ] as { id: Space; label: string; sub: string; accent: string; selBorder: string; selBg: string }[]).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSpace(b.id)}
                  style={
                    space === b.id
                      ? { border: `2px solid ${b.selBorder}`, background: b.selBg, borderRadius: "12px", padding: "14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" } as React.CSSProperties
                      : { border: "1px solid #E2E8F0", background: "var(--glass-nav-bg)", borderRadius: "12px", padding: "14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" } as React.CSSProperties
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: b.accent, display: "inline-block", flexShrink: 0 } as React.CSSProperties} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>{b.label}</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748B" } as React.CSSProperties}>{b.sub}</p>
                </button>
              ))}
            </div>

            {/* ── LOGIN MODE ── */}
            {mode === "login" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dossiers enregistrés */}
                <div>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "12px" } as React.CSSProperties}>
                    Dossiers enregistrés
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8", marginLeft: "6px" } as React.CSSProperties}>(optionnel)</span>
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" } as React.CSSProperties}>
                    {savedProfiles.map((p) => {
                      const active = activeProfileId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onPickProfile(p)}
                          style={
                            active
                              ? { border: `1.5px solid ${accentColor}`, background: `${accentColor}0A`, borderRadius: "12px", padding: "12px 14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s", width: "100%" } as React.CSSProperties
                              : { border: "1px solid #E2E8F0", background: "var(--glass-nav-bg)", borderRadius: "12px", padding: "12px 14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s", width: "100%" } as React.CSSProperties
                          }
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" } as React.CSSProperties}>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>{p.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" } as React.CSSProperties}>{p.detail}</div>
                            </div>
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                border: active ? `2px solid ${accentColor}` : "2px solid #CBD5E1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              } as React.CSSProperties}
                            >
                              {active ? (
                                <span
                                  style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "50%",
                                    background: accentColor,
                                    display: "block",
                                  } as React.CSSProperties}
                                />
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p style={{ marginTop: "10px", fontSize: "11px", color: "#94A3B8" } as React.CSSProperties}>
                    UI uniquement (on branchera l'auth ensuite).
                  </p>
                </div>

                {/* Login form */}
                <div>
                  <form style={{ display: "flex", flexDirection: "column", gap: "18px" } as React.CSSProperties}>
                    {/* Email field */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "6px" } as React.CSSProperties}>
                        Email
                      </label>
                      <div style={{ position: "relative" } as React.CSSProperties}>
                        <span
                          style={{
                            pointerEvents: "none",
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94A3B8",
                            display: "flex",
                          } as React.CSSProperties}
                        >
                          <IconEmail />
                        </span>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="jean.dupont@email.com"
                          style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            background: "#fff",
                            paddingLeft: "38px",
                            paddingRight: "14px",
                            paddingTop: "11px",
                            paddingBottom: "11px",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" } as React.CSSProperties}>
                        <label style={{ fontSize: "13px", fontWeight: 500, color: "#475569" } as React.CSSProperties}>
                          Mot de passe
                        </label>
                        <Link href="#" style={{ fontSize: "12px", color: "#64748B", textDecoration: "none" } as React.CSSProperties}>
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <div style={{ position: "relative" } as React.CSSProperties}>
                        <span
                          style={{
                            pointerEvents: "none",
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94A3B8",
                            display: "flex",
                          } as React.CSSProperties}
                        >
                          <IconLock />
                        </span>
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          placeholder="••••••••"
                          style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            background: "#fff",
                            paddingLeft: "38px",
                            paddingRight: "14px",
                            paddingTop: "11px",
                            paddingBottom: "11px",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="button"
                      onClick={enterPatientSpace}
                      style={{
                        ...primaryBtnStyle,
                        width: "100%",
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: "14px",
                        padding: "12px",
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      } as React.CSSProperties}
                    >
                      Se connecter →
                    </button>
                  </form>

                  <p style={{ textAlign: "center", fontSize: "13px", color: "#64748B", marginTop: "20px" } as React.CSSProperties}>
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        resetMatch();
                        setStep(1);
                        setAndSyncMode("signup");
                      }}
                      style={{ color: accentColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 } as React.CSSProperties}
                    >
                      Créer un compte
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* ── SIGNUP MODE ── */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left col: dossier recovery */}
                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    padding: "18px",
                  } as React.CSSProperties}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" } as React.CSSProperties}>
                    <span style={{ color: accentColor, display: "flex" } as React.CSSProperties}><IconShield /></span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>Récupération de dossier</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#475569", margin: 0 } as React.CSSProperties}>
                    Si votre centre a déjà créé votre dossier, vous pourrez le récupérer via un code SMS/email.
                  </p>

                  {(matchStrength === "strong" || matchStrength === "weak") && matched ? (
                    <div
                      style={{
                        marginTop: "14px",
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        background: "#fff",
                        padding: "14px",
                      } as React.CSSProperties}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" } as React.CSSProperties}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>
                            {matchStrength === "strong" ? "Dossier trouvé" : "Dossier possible"}
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748B" } as React.CSSProperties}>
                            {matched.firstName} {matched.lastName} — né(e) le {matched.birthDate}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={resetMatch}
                          style={{ fontSize: "11px", color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 } as React.CSSProperties}
                        >
                          Réinitialiser
                        </button>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "12px", color: "#475569" } as React.CSSProperties}>
                        {matchStrength === "strong"
                          ? "Ces infos correspondent à un dossier existant. Voulez-vous le récupérer ?"
                          : "Dossier similaire détecté. Pour le récupérer, il faut vérifier un contact du dossier."}
                      </div>

                      <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" } as React.CSSProperties}>
                        <button
                          type="button"
                          onClick={() => setVerifyChannel("sms")}
                          disabled={!matched.phone}
                          style={
                            verifyChannel === "sms"
                              ? { border: `1.5px solid ${accentColor}`, background: `${accentColor}0A`, borderRadius: "8px", padding: "9px", fontSize: "12px", fontWeight: 500, cursor: "pointer" } as React.CSSProperties
                              : { border: "1px solid #E2E8F0", background: "#fff", borderRadius: "8px", padding: "9px", fontSize: "12px", fontWeight: 500, cursor: "pointer", opacity: !matched.phone ? 0.4 : 1 } as React.CSSProperties
                          }
                        >
                          SMS {matched.phone ? `(${maskPhone(matched.phone)})` : ""}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifyChannel("email")}
                          disabled={!matched.email}
                          style={
                            verifyChannel === "email"
                              ? { border: `1.5px solid ${accentColor}`, background: `${accentColor}0A`, borderRadius: "8px", padding: "9px", fontSize: "12px", fontWeight: 500, cursor: "pointer" } as React.CSSProperties
                              : { border: "1px solid #E2E8F0", background: "#fff", borderRadius: "8px", padding: "9px", fontSize: "12px", fontWeight: 500, cursor: "pointer", opacity: !matched.email ? 0.4 : 1 } as React.CSSProperties
                          }
                        >
                          Email {matched.email ? `(${maskEmail(matched.email)})` : ""}
                        </button>
                      </div>

                      <div style={{ marginTop: "10px" } as React.CSSProperties}>
                        <button
                          type="button"
                          onClick={sendCode}
                          disabled={!canSendCode()}
                          style={
                            canSendCode()
                              ? { ...primaryBtnStyle, width: "100%", borderRadius: "8px", fontSize: "13px", fontWeight: 600, padding: "10px", cursor: "pointer" } as React.CSSProperties
                              : { background: "#E2E8F0", color: "#94A3B8", width: "100%", borderRadius: "8px", fontSize: "13px", fontWeight: 600, padding: "10px", cursor: "not-allowed", border: "none" } as React.CSSProperties
                          }
                        >
                          {codeSent ? "Code envoyé" : "Envoyer un code"}
                          {codeSent ? (
                            <span style={{ marginLeft: "6px", display: "inline-flex", verticalAlign: "middle" } as React.CSSProperties}><IconCheck /></span>
                          ) : null}
                        </button>

                        {codeSent ? (
                          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" } as React.CSSProperties}>
                            <label style={{ fontSize: "12px", fontWeight: 500, color: "#475569" } as React.CSSProperties}>
                              Code (démo : 123456)
                            </label>
                            <input
                              value={code}
                              onChange={(e) => setCode(e.target.value)}
                              inputMode="numeric"
                              placeholder="123456"
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                padding: "10px 14px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                              } as React.CSSProperties}
                            />
                            <button
                              type="button"
                              onClick={verifyCode}
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                fontSize: "13px",
                                fontWeight: 600,
                                padding: "10px",
                                cursor: "pointer",
                              } as React.CSSProperties}
                            >
                              Vérifier
                            </button>
                            {verified ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>
                                <span style={{ color: accentColor, display: "flex" } as React.CSSProperties}><IconCheck /></span>
                                Vérification OK
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "12px", fontSize: "11px", color: "#94A3B8" } as React.CSSProperties}>
                      Remplis Nom + Prénom + Date de naissance, puis clique "Vérifier".
                    </div>
                  )}
                </div>

                {/* Right col: signup form */}
                <div>
                  {/* Step pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" } as React.CSSProperties}>
                    <StepPill n={1} title="Informations" />
                    <StepPill n={2} title="Sécurité" />
                  </div>

                  <form style={{ display: "flex", flexDirection: "column", gap: "14px" } as React.CSSProperties}>
                    {step === 1 ? (
                      <>
                        {/* Prénom / Nom */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } as React.CSSProperties}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>Prénom</label>
                            <div style={{ position: "relative" } as React.CSSProperties}>
                              <span style={{ pointerEvents: "none", position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" } as React.CSSProperties}>
                                <IconUser />
                              </span>
                              <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                type="text"
                                placeholder="Jean"
                                style={{
                                  width: "100%",
                                  borderRadius: "10px",
                                  border: "1px solid #E2E8F0",
                                  background: "#fff",
                                  paddingLeft: "32px",
                                  paddingRight: "10px",
                                  paddingTop: "10px",
                                  paddingBottom: "10px",
                                  fontSize: "13px",
                                  outline: "none",
                                  boxSizing: "border-box",
                                } as React.CSSProperties}
                              />
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>Nom</label>
                            <input
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              type="text"
                              placeholder="Dupont"
                              style={{
                                width: "100%",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                padding: "10px 12px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>

                        {/* Date de naissance */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>Date de naissance</label>
                          <div style={{ position: "relative" } as React.CSSProperties}>
                            <span style={{ pointerEvents: "none", position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" } as React.CSSProperties}>
                              <IconCalendar />
                            </span>
                            <input
                              value={birthDate}
                              onChange={(e) => setBirthDate(e.target.value)}
                              type="date"
                              style={{
                                width: "100%",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                paddingLeft: "32px",
                                paddingRight: "10px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>

                        {/* Email / Téléphone */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } as React.CSSProperties}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>Email</label>
                            <div style={{ position: "relative" } as React.CSSProperties}>
                              <span style={{ pointerEvents: "none", position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" } as React.CSSProperties}>
                                <IconEmail />
                              </span>
                              <input
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                type="email"
                                placeholder="jean@email.com"
                                style={{
                                  width: "100%",
                                  borderRadius: "10px",
                                  border: signupEmail.trim().length > 0 && !emailOk ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
                                  background: "#fff",
                                  paddingLeft: "32px",
                                  paddingRight: "10px",
                                  paddingTop: "10px",
                                  paddingBottom: "10px",
                                  fontSize: "13px",
                                  outline: "none",
                                  boxSizing: "border-box",
                                } as React.CSSProperties}
                              />
                            </div>
                            {signupEmail.trim().length > 0 && !emailOk ? (
                              <p style={{ marginTop: "4px", fontSize: "11px", color: "#EF4444" } as React.CSSProperties}>Email invalide.</p>
                            ) : null}
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>Téléphone</label>
                            <div style={{ position: "relative" } as React.CSSProperties}>
                              <span style={{ pointerEvents: "none", position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" } as React.CSSProperties}>
                                <IconPhone />
                              </span>
                              <input
                                value={formatPhoneFR(phone)}
                                onChange={(e) => setPhone(e.target.value)}
                                type="tel"
                                placeholder="06 00 00 00 00"
                                style={{
                                  width: "100%",
                                  borderRadius: "10px",
                                  border: !phoneOk ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
                                  background: "#fff",
                                  paddingLeft: "32px",
                                  paddingRight: "10px",
                                  paddingTop: "10px",
                                  paddingBottom: "10px",
                                  fontSize: "13px",
                                  outline: "none",
                                  boxSizing: "border-box",
                                } as React.CSSProperties}
                              />
                            </div>
                            {!phoneOk ? (
                              <p style={{ marginTop: "4px", fontSize: "11px", color: "#EF4444" } as React.CSSProperties}>Téléphone invalide (10 chiffres).</p>
                            ) : null}
                          </div>
                        </div>

                        {/* Vérifier dossier */}
                        <button
                          type="button"
                          onClick={runMatchCheck}
                          style={{
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            background: "#fff",
                            fontSize: "13px",
                            fontWeight: 600,
                            padding: "10px",
                            cursor: "pointer",
                            color: "#475569",
                            transition: "background 0.15s",
                          } as React.CSSProperties}
                        >
                          Vérifier si un dossier existe
                        </button>

                        {/* Centre */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>
                            Centre de rattachement
                          </label>
                          <div style={{ position: "relative" } as React.CSSProperties}>
                            <span style={{ pointerEvents: "none", position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" } as React.CSSProperties}>
                              <IconBuilding />
                            </span>
                            <select
                              value={centerId}
                              onChange={(e) => setCenterId(e.target.value)}
                              disabled={hasCustomCenter}
                              style={{
                                width: "100%",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                paddingLeft: "32px",
                                paddingRight: "10px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                                opacity: hasCustomCenter ? 0.5 : 1,
                              } as React.CSSProperties}
                            >
                              <option value="">Choisir un centre…</option>
                              {centers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" } as React.CSSProperties}>
                            <input
                              id="customCenter"
                              type="checkbox"
                              checked={hasCustomCenter}
                              onChange={(e) => setHasCustomCenter(e.target.checked)}
                              style={{ width: "14px", height: "14px", cursor: "pointer" } as React.CSSProperties}
                            />
                            <label htmlFor="customCenter" style={{ fontSize: "12px", color: "#475569", cursor: "pointer" } as React.CSSProperties}>
                              Mon centre n'apparaît pas
                            </label>
                          </div>

                          {hasCustomCenter ? (
                            <input
                              value={customCenter}
                              onChange={(e) => setCustomCenter(e.target.value)}
                              type="text"
                              placeholder="Nom du centre"
                              style={{
                                marginTop: "8px",
                                width: "100%",
                                borderRadius: "10px",
                                border: "1px solid #E2E8F0",
                                background: "#fff",
                                padding: "10px 12px",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                              } as React.CSSProperties}
                            />
                          ) : null}
                        </div>

                        {/* Adresse */}
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>
                            Adresse <span style={{ fontWeight: 400, color: "#94A3B8" } as React.CSSProperties}>(optionnel)</span>
                          </label>
                          <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            type="text"
                            placeholder="12 rue …, 13000 Marseille"
                            style={{
                              width: "100%",
                              borderRadius: "10px",
                              border: "1px solid #E2E8F0",
                              background: "#fff",
                              padding: "10px 12px",
                              fontSize: "13px",
                              outline: "none",
                              boxSizing: "border-box",
                            } as React.CSSProperties}
                          />
                        </div>

                        {/* Continuer */}
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!canGoStep2}
                          style={
                            canGoStep2
                              ? { ...primaryBtnStyle, width: "100%", borderRadius: "10px", fontWeight: 600, fontSize: "14px", padding: "12px", cursor: "pointer", transition: "opacity 0.15s" } as React.CSSProperties
                              : { background: "#E2E8F0", color: "#94A3B8", width: "100%", borderRadius: "10px", fontWeight: 600, fontSize: "14px", padding: "12px", cursor: "not-allowed", border: "none" } as React.CSSProperties
                          }
                        >
                          Continuer →
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Step 2 header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>
                            <span style={{ color: accentColor, display: "flex" } as React.CSSProperties}><IconShield /></span>
                            Sécurité
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            style={{ fontSize: "12px", color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 } as React.CSSProperties}
                          >
                            ← Retour
                          </button>
                        </div>

                        {/* Password card */}
                        <div
                          style={{
                            borderRadius: "12px",
                            border: "1px solid #E2E8F0",
                            background: "#fff",
                            padding: "16px",
                          } as React.CSSProperties}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" } as React.CSSProperties}>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" } as React.CSSProperties}>Mot de passe</span>
                            <span style={{ fontSize: "11px", color: "#64748B" } as React.CSSProperties}>
                              Force : <strong style={{ color: "#0F172A" } as React.CSSProperties}>{pwd.label}</strong>
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" } as React.CSSProperties}>
                            {/* Password input */}
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>
                                Créer un mot de passe
                              </label>
                              <div style={{ position: "relative" } as React.CSSProperties}>
                                <input
                                  value={signupPassword}
                                  onChange={(e) => setSignupPassword(e.target.value)}
                                  type={showPwd ? "text" : "password"}
                                  placeholder="8 caractères minimum"
                                  style={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                    background: "#fff",
                                    padding: "10px 70px 10px 12px",
                                    fontSize: "13px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                  } as React.CSSProperties}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPwd((v) => !v)}
                                  style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#475569",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  } as React.CSSProperties}
                                >
                                  {showPwd ? "Masquer" : "Afficher"}
                                </button>
                              </div>
                              <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" } as React.CSSProperties}>
                                {[
                                  { ok: pwd.length, label: "8+ caractères" },
                                  { ok: pwd.upper, label: "1 majuscule" },
                                  { ok: pwd.num, label: "1 chiffre" },
                                  { ok: pwd.special, label: "1 symbole" },
                                ].map(({ ok, label }) => (
                                  <div
                                    key={label}
                                    style={{
                                      fontSize: "11px",
                                      color: ok ? accentColor : "#94A3B8",
                                      fontWeight: ok ? 600 : 400,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    } as React.CSSProperties}
                                  >
                                    <span style={{ opacity: ok ? 1 : 0.4 } as React.CSSProperties}><IconCheck /></span>
                                    {label}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Confirm password */}
                            <div>
                              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#475569", marginBottom: "5px" } as React.CSSProperties}>
                                Confirmer
                              </label>
                              <div style={{ position: "relative" } as React.CSSProperties}>
                                <input
                                  value={signupPassword2}
                                  onChange={(e) => setSignupPassword2(e.target.value)}
                                  type={showPwd2 ? "text" : "password"}
                                  placeholder="••••••••"
                                  style={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    border: signupPassword2.length > 0 && !pwdMatch ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
                                    background: "#fff",
                                    padding: "10px 70px 10px 12px",
                                    fontSize: "13px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                  } as React.CSSProperties}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPwd2((v) => !v)}
                                  style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#475569",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  } as React.CSSProperties}
                                >
                                  {showPwd2 ? "Masquer" : "Afficher"}
                                </button>
                              </div>
                              {signupPassword2.length > 0 && !pwdMatch ? (
                                <p style={{ marginTop: "4px", fontSize: "11px", color: "#EF4444" } as React.CSSProperties}>
                                  Les mots de passe ne correspondent pas.
                                </p>
                              ) : null}
                            </div>

                            {/* Terms */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingTop: "4px" } as React.CSSProperties}>
                              <input
                                id="terms"
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                style={{ width: "14px", height: "14px", marginTop: "2px", cursor: "pointer", flexShrink: 0 } as React.CSSProperties}
                              />
                              <label htmlFor="terms" style={{ fontSize: "12px", color: "#475569", cursor: "pointer", lineHeight: 1.5 } as React.CSSProperties}>
                                J'accepte les conditions d'utilisation et la politique de confidentialité.
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Finalize */}
                        <button
                          type="button"
                          onClick={enterPatientSpace}
                          disabled={!canFinalize}
                          style={
                            canFinalize
                              ? { ...primaryBtnStyle, width: "100%", borderRadius: "10px", fontWeight: 600, fontSize: "14px", padding: "12px", cursor: "pointer", transition: "opacity 0.15s" } as React.CSSProperties
                              : { background: "#E2E8F0", color: "#94A3B8", width: "100%", borderRadius: "10px", fontWeight: 600, fontSize: "14px", padding: "12px", cursor: "not-allowed", border: "none" } as React.CSSProperties
                          }
                        >
                          Créer mon compte →
                        </button>

                        {mustVerifyExisting && !verified ? (
                          <p style={{ fontSize: "11px", color: "#64748B" } as React.CSSProperties}>
                            Pour récupérer un dossier existant, la vérification SMS/email est requise.
                          </p>
                        ) : null}
                      </>
                    )}
                  </form>

                  <p style={{ textAlign: "center", fontSize: "13px", color: "#64748B", marginTop: "18px" } as React.CSSProperties}>
                    Déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => setAndSyncMode("login")}
                      style={{ color: accentColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 } as React.CSSProperties}
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </div>
            )}

            <p style={{ marginTop: "16px", fontSize: "11px", color: "#94A3B8" } as React.CSSProperties}>
              UI uniquement : matching + SMS/email simulés (patient : 123456).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPatientPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Chargement…</div>}>
      <ConnexionPatientPageContent />
    </Suspense>
  );
}
