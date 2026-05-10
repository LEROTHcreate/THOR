"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EyeIcon, EarIcon } from "@/components/ui/service-icons";
import { saveCurrentUserId } from "@/lib/users";

type Mode = "login" | "signup";
type Module = "vision" | "audition" | "both";
type Step = 1 | 2;

type Center = { id: string; name: string; city: string };
type ProvisionedPractitioner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  finess?: string;
  siret?: string;
  centerId?: string;
};

type RoleVision = "Gérant" | "Manager" | "Opticien" | "Optométriste" | "Assistant" | "Secrétaire";
type RoleAudio = "Gérant" | "Manager" | "Audioprothésiste" | "Assistant audioprothésiste" | "Secrétaire";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}
function clampDigits(s: string, max: number) {
  return digitsOnly(s).slice(0, max);
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

function ConnexionPraticienPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const basePath = "/connexion/praticien";
  const paramMode: Mode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(paramMode);
  useEffect(() => setMode(paramMode), [paramMode]);

  const setAndSyncMode = (next: Mode) => {
    setMode(next);
    router.replace(next === "signup" ? `${basePath}?mode=signup` : basePath, { scroll: false });
  };

  const centers: Center[] = useMemo(
    () => [
      { id: "marseille-prado", name: "THOR — Marseille Prado", city: "Marseille" },
      { id: "marseille-vieuxport", name: "THOR — Vieux-Port", city: "Marseille" },
      { id: "aix-centre", name: "THOR — Aix Centre", city: "Aix-en-Provence" },
    ],
    []
  );

  // Simulation : praticiens existants (UI only) pour le bandeau "compte déjà existant"
  const provisionedPros: ProvisionedPractitioner[] = useMemo(
    () => [
      {
        id: "pro_001",
        firstName: "Nicolas",
        lastName: "Martin",
        email: "nico@thor.fr",
        finess: "130012345",
        siret: "12345678900011",
        centerId: "marseille-prado",
      },
    ],
    []
  );

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // login state UI
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // module selection
  const [module, setModule] = useState<Module>("vision");

  const roleOptionsVision: RoleVision[] = ["Gérant", "Manager", "Opticien", "Optométriste", "Assistant", "Secrétaire"];
  const roleOptionsAudio: RoleAudio[] = ["Gérant", "Manager", "Audioprothésiste", "Assistant audioprothésiste", "Secrétaire"];

  const [roleVision, setRoleVision] = useState<RoleVision>("Opticien");
  const [roleAudio, setRoleAudio] = useState<RoleAudio>("Audioprothésiste");

  // signup steps
  const [step, setStep] = useState<Step>(1);

  // signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [org, setOrg] = useState("");
  const [centerId, setCenterId] = useState("");
  const [hasCustomCenter, setHasCustomCenter] = useState(false);
  const [customCenter, setCustomCenter] = useState("");

  const [finess, setFiness] = useState("");
  const [siret, setSiret] = useState("");
  const [rppsAdeli, setRppsAdeli] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Bandeau "compte existant"
  const [existingAccount, setExistingAccount] = useState<ProvisionedPractitioner | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const checkExistingEmail = (value: string) => {
    const em = value.trim().toLowerCase();
    if (!em) {
      setExistingAccount(null);
      return;
    }
    const found = provisionedPros.find((p) => p.email.toLowerCase() === em) ?? null;
    setExistingAccount(found);
    if (found?.centerId) setCenterId(found.centerId);
  };

  const [signupPassword, setSignupPassword] = useState("");
  const [signupPassword2, setSignupPassword2] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const routes = useMemo<Record<Exclude<Module, "both">, string>>(
    () => ({
      vision: "/clair-vision/pro/optique",
      audition: "/clair-audition/pro",
    }),
    []
  );

  // validations
  const finessDigits = digitsOnly(finess);
  const siretDigits = digitsOnly(siret);
  const rppsDigits = digitsOnly(rppsAdeli);

  const finessOk = finessDigits.length === 0 || finessDigits.length === 9;
  const siretOk = siretDigits.length === 0 || siretDigits.length === 14;
  const rppsOk = rppsDigits.length === 0 || (rppsDigits.length >= 9 && rppsDigits.length <= 11);

  const emailOk = signupEmail.trim().length === 0 ? false : isValidEmail(signupEmail);
  const phoneDigits = digitsOnly(phone);
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length === 10;

  const pwd = passwordChecks(signupPassword);
  const pwdMatch = signupPassword && signupPassword2 && signupPassword === signupPassword2;

  const moduleDisabled = module === "both";

  const canGoStep2 =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (hasCustomCenter ? customCenter.trim().length > 0 : true) &&
    finessOk &&
    siretOk &&
    rppsOk &&
    module !== "both";

  // on bloque la création si un compte existe déjà
  const canFinalize =
    emailOk &&
    phoneOk &&
    pwd.length &&
    pwdMatch &&
    !existingAccount &&
    module !== "both";

  // si module change, rôle cohérent
  useEffect(() => {
    if (module === "vision") setRoleVision((r) => (roleOptionsVision.includes(r) ? r : "Opticien"));
    if (module === "audition") setRoleAudio((r) => (roleOptionsAudio.includes(r) ? r : "Audioprothésiste"));
  }, [module]);

  // reset step si on repasse login
  useEffect(() => {
    if (mode === "login") setStep(1);
  }, [mode]);

  const StepPill = ({ n, title }: { n: Step; title: string }) => {
    const active = step === n;
    return (
      <button
        type="button"
        onClick={() => setStep(n)}
        className={[
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
          active
            ? "bg-slate-900 text-white border-transparent"
            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100",
        ].join(" ")}
      >
        {n}/2 — {title}
      </button>
    );
  };

  // SVG icon helpers
  const IconEmail = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  );
  const IconLock = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  const IconPerson = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
    </svg>
  );
  const IconDoc = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8"/>
    </svg>
  );
  const IconHome = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  const IconPhone = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.91a16 16 0 0 0 6.07 6.07l1.27-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
  const IconShield = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  const IconCheck = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  const inputBase =
    "w-full rounded-xl bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#2D8CFF] focus:ring-2 focus:ring-[#2D8CFF]/20";
  const inputNormal = `${inputBase} border border-slate-200`;
  const inputError = `${inputBase} border border-red-200 focus:border-red-400 focus:ring-red-100`;

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "inherit" } as React.CSSProperties}>

      {/* ── LEFT PANEL ── dark branding, hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between px-10 py-12 overflow-hidden relative"
        style={{
          width: "42%",
          minWidth: "42%",
          background: "linear-gradient(145deg, #0B1220 0%, #0F1E35 50%, #0B1220 100%)",
        } as React.CSSProperties}
      >
        {/* Gradient orbs */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,140,255,0.12) 0%, transparent 70%)" } as React.CSSProperties}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,201,138,0.08) 0%, transparent 70%)" } as React.CSSProperties}
        />

        {/* Top content */}
        <div className="relative z-10">
          {/* Brand pills */}
          <div className="flex items-center gap-3 mb-12">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(45,140,255,0.18)", color: "#7EC8FF", border: "1px solid rgba(45,140,255,0.30)" } as React.CSSProperties}
            >
              <EyeIcon className="w-3.5 h-3.5" />
              Clair Vision
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(0,201,138,0.16)", color: "#5DEBB8", border: "1px solid rgba(0,201,138,0.28)" } as React.CSSProperties}
            >
              <EarIcon className="w-3.5 h-3.5" />
              Clair Audition
            </span>
          </div>

          {/* Main title */}
          <h1 className="h-title text-4xl font-bold leading-tight text-white mb-4">
            Espace<br />Praticien
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" } as React.CSSProperties}>
            Gérez vos patients, votre agenda et vos dossiers depuis un seul espace sécurisé.
          </p>

          {/* Feature rows */}
          <div className="mt-10 space-y-4">
            {[
              "Dossiers patients centralisés",
              "Agenda et prise de RDV intégrés",
              "Ordonnances et bilans numériques",
              "Messagerie sécurisée praticien",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
                  style={{ background: "rgba(45,140,255,0.20)", color: "#7EC8FF" } as React.CSSProperties}
                >
                  <IconCheck />
                </span>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.82)" } as React.CSSProperties}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.40)" } as React.CSSProperties}>
          <IconShield />
          <span className="text-xs font-medium tracking-wide uppercase">THOR Pro · Accès sécurisé</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── form */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto"
        style={{ background: "#f8fafc" } as React.CSSProperties}
      >
        <div className="w-full max-w-xl">

          {/* Glass card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--glass-strong-bg)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-strong-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            } as React.CSSProperties}
          >
            {/* Header */}
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 mb-3">
                Portail Praticien THOR
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 h-title">
                {mode === "login" ? "Accès praticien" : "Créer un compte praticien"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "login"
                  ? "Connectez-vous à votre espace pro."
                  : "Inscription rapide + détection si l'email est déjà associé à un compte."}
              </p>
            </div>

            {/* Module pill selector */}
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Module</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModule("vision")}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition-all border"
                  style={{
                    background: module === "vision" ? "#2D8CFF" : "white",
                    color: module === "vision" ? "white" : "#475569",
                    borderColor: module === "vision" ? "#2D8CFF" : "#E2E8F0",
                  } as React.CSSProperties}
                >
                  Vision
                </button>
                <button
                  type="button"
                  onClick={() => setModule("audition")}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition-all border"
                  style={{
                    background: module === "audition" ? "#00C98A" : "white",
                    color: module === "audition" ? "white" : "#475569",
                    borderColor: module === "audition" ? "#00C98A" : "#E2E8F0",
                  } as React.CSSProperties}
                >
                  Audition
                </button>
                <button
                  type="button"
                  onClick={() => setModule("both")}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition-all border"
                  style={{
                    background: module === "both" ? "#0B1220" : "white",
                    color: module === "both" ? "white" : "#475569",
                    borderColor: module === "both" ? "#0B1220" : "#E2E8F0",
                  } as React.CSSProperties}
                >
                  Les deux
                </button>
              </div>
              {module === "both" ? (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Vision + Audition</span> arrive bientôt. Choisis un module pour créer ton compte.
                </p>
              ) : null}
            </div>

            {/* LOGIN form */}
            {mode === "login" ? (
              <>
                <form className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email pro</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconEmail />
                      </span>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="cabinet@email.com"
                        className={`${inputNormal} pl-10`}
                        style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Mot de passe</label>
                      <Link href="#" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <IconLock />
                      </span>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="••••••••"
                        className={`${inputNormal} pl-10`}
                        style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl font-semibold text-sm py-3 text-white transition-all duration-200 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                  >
                    Se connecter
                  </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setEmailTouched(false);
                      setExistingAccount(null);
                      setStep(1);
                      setAndSyncMode("signup");
                    }}
                    className="text-[#2D8CFF] font-semibold hover:underline"
                  >
                    Créer un compte
                  </button>
                </p>

                {/* Erreur inline */}
                {loginError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Accéder button */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (module === "both" || loginLoading) return;
                      setLoginError(null);
                      setLoginLoading(true);
                      try {
                        const res = await fetch("/api/auth/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ password }),
                          credentials: "same-origin",
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.userId) saveCurrentUserId(data.userId);
                          router.push(routes[module]);
                        } else {
                          const data = await res.json().catch(() => ({}));
                          setLoginError(data.error ?? "Erreur de connexion");
                          setLoginLoading(false);
                        }
                      } catch {
                        setLoginError("Impossible de contacter le serveur. Réessayez.");
                        setLoginLoading(false);
                      }
                    }}
                    disabled={module === "both" || loginLoading}
                    className="inline-flex items-center gap-2 rounded-xl font-semibold text-sm px-6 py-2.5 text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                  >
                    {loginLoading && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                    {module === "both" ? "Bientôt disponible" : loginLoading ? "Connexion…" : "Accéder à mon espace"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* SIGNUP stepper */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex gap-2">
                    <StepPill n={1} title="Informations" />
                    <StepPill n={2} title="Sécurité" />
                  </div>
                  <div className="text-xs text-slate-400">
                    Module :{" "}
                    <span className="font-semibold text-slate-700">
                      {module === "vision" ? "Optique" : module === "audition" ? "Audition" : "Bientôt"}
                    </span>
                  </div>
                </div>

                <form className="space-y-4">
                  {step === 1 ? (
                    <>
                      {/* Prénom / Nom */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Prénom</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <IconPerson />
                            </span>
                            <input
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              type="text"
                              placeholder="Nicolas"
                              className={`${inputNormal} pl-10`}
                              style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Nom</label>
                          <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            type="text"
                            placeholder="Martin"
                            className={inputNormal}
                            style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          />
                        </div>
                      </div>

                      {/* Fonction */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Fonction</label>
                        {module === "vision" ? (
                          <select
                            value={roleVision}
                            onChange={(e) => setRoleVision(e.target.value as RoleVision)}
                            className={inputNormal}
                            style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          >
                            {roleOptionsVision.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : module === "audition" ? (
                          <select
                            value={roleAudio}
                            onChange={(e) => setRoleAudio(e.target.value as RoleAudio)}
                            className={inputNormal}
                            style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          >
                            {roleOptionsAudio.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                            Vision + Audition : <span className="font-semibold">en cours de création</span>.
                          </div>
                        )}
                        <p className="text-xs text-slate-400">La liste s'adapte automatiquement au module sélectionné.</p>
                      </div>

                      {/* Centre / Société */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Centre / Société</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <IconHome />
                          </span>
                          <input
                            value={org}
                            onChange={(e) => setOrg(e.target.value)}
                            type="text"
                            placeholder="THOR — Centre Marseille"
                            className={`${inputNormal} pl-10`}
                            style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          />
                        </div>
                      </div>

                      {/* Centre de rattachement */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Centre de rattachement</label>
                        <select
                          value={centerId}
                          onChange={(e) => setCenterId(e.target.value)}
                          className={inputNormal}
                          style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          disabled={hasCustomCenter}
                        >
                          <option value="">Choisir un centre…</option>
                          {centers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            id="customCenterPro"
                            type="checkbox"
                            checked={hasCustomCenter}
                            onChange={(e) => setHasCustomCenter(e.target.checked)}
                            className="h-4 w-4 accent-[#2D8CFF]"
                          />
                          <label htmlFor="customCenterPro" className="text-sm text-slate-600">
                            Mon centre n'apparaît pas
                          </label>
                        </div>
                        {hasCustomCenter ? (
                          <input
                            value={customCenter}
                            onChange={(e) => setCustomCenter(e.target.value)}
                            type="text"
                            placeholder="Nom du centre"
                            className={inputNormal}
                            style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                          />
                        ) : null}
                      </div>

                      {/* FINESS / SIRET */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">FINESS (structure)</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <IconDoc />
                            </span>
                            <input
                              value={finess}
                              onChange={(e) => setFiness(clampDigits(e.target.value, 9))}
                              inputMode="numeric"
                              placeholder="130012345"
                              className={`${finessOk ? inputNormal : inputError} pl-10`}
                              style={{ borderColor: finessOk ? "#E2E8F0" : undefined } as React.CSSProperties}
                            />
                          </div>
                          {!finessOk ? <p className="text-xs text-red-500">FINESS invalide (9 chiffres).</p> : null}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">SIRET</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <IconDoc />
                            </span>
                            <input
                              value={siret}
                              onChange={(e) => setSiret(clampDigits(e.target.value, 14))}
                              inputMode="numeric"
                              placeholder="12345678900011"
                              className={`${siretOk ? inputNormal : inputError} pl-10`}
                              style={{ borderColor: siretOk ? "#E2E8F0" : undefined } as React.CSSProperties}
                            />
                          </div>
                          {!siretOk ? <p className="text-xs text-red-500">SIRET invalide (14 chiffres).</p> : null}
                        </div>
                      </div>

                      {/* RPPS / ADELI */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">RPPS / ADELI (optionnel)</label>
                        <input
                          value={rppsAdeli}
                          onChange={(e) => setRppsAdeli(clampDigits(e.target.value, 11))}
                          inputMode="numeric"
                          placeholder="Ex : 1 23456 78901 2"
                          className={rppsOk ? inputNormal : inputError}
                          style={{ borderColor: rppsOk ? "#E2E8F0" : undefined } as React.CSSProperties}
                        />
                        {!rppsOk ? <p className="text-xs text-red-500">Format RPPS/ADELI invalide.</p> : null}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!canGoStep2}
                          className="flex-1 rounded-xl font-semibold text-sm py-3 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                        >
                          Continuer
                        </button>
                      </div>

                      {module === "both" ? (
                        <p className="text-xs text-slate-500">
                          Vision + Audition arrive bientôt. Choisis un module pour créer ton compte.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-slate-900">Sécurité &amp; accès</div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          ← Retour
                        </button>
                      </div>

                      {/* Email / Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Email pro</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <IconEmail />
                            </span>
                            <input
                              value={signupEmail}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSignupEmail(v);
                                if (emailTouched) checkExistingEmail(v);
                              }}
                              onBlur={(e) => {
                                setEmailTouched(true);
                                checkExistingEmail(e.target.value);
                              }}
                              type="email"
                              placeholder="cabinet@email.com"
                              className={`${
                                signupEmail.trim().length === 0 || emailOk ? inputNormal : inputError
                              } pl-10`}
                              style={{
                                borderColor:
                                  signupEmail.trim().length === 0 || emailOk ? "#E2E8F0" : undefined,
                              } as React.CSSProperties}
                            />
                          </div>
                          {signupEmail.trim().length > 0 && !emailOk ? (
                            <p className="text-xs text-red-500">Email invalide.</p>
                          ) : null}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Téléphone (optionnel)</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <IconPhone />
                            </span>
                            <input
                              value={formatPhoneFR(phone)}
                              onChange={(e) => setPhone(e.target.value)}
                              type="tel"
                              placeholder="06 00 00 00 00"
                              className={`${phoneOk ? inputNormal : inputError} pl-10`}
                              style={{ borderColor: phoneOk ? "#E2E8F0" : undefined } as React.CSSProperties}
                            />
                          </div>
                          {!phoneOk ? <p className="text-xs text-red-500">Téléphone invalide (10 chiffres).</p> : null}
                        </div>
                      </div>

                      {/* Existing account banner */}
                      {emailTouched && existingAccount ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Compte déjà existant</div>
                              <div className="mt-1 text-xs text-slate-500">
                                Cet email est déjà associé à un accès praticien.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailTouched(false);
                                setExistingAccount(null);
                              }}
                              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              Réinitialiser
                            </button>
                          </div>
                          <div className="mt-3 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setAndSyncMode("login")}
                              className="flex-1 h-11 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                              style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                            >
                              Se connecter
                            </button>
                            <Link
                              href="#"
                              className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center"
                            >
                              Mot de passe oublié
                            </Link>
                          </div>
                        </div>
                      ) : null}

                      {/* Password helper card */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-slate-900">Mot de passe</div>
                          <div className="text-xs text-slate-500">
                            Force : <span className="font-semibold text-slate-800">{pwd.label}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Créer un mot de passe</label>
                            <div className="relative">
                              <input
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                type={showPwd ? "text" : "password"}
                                placeholder="8 caractères minimum"
                                className={`${inputNormal} pr-24`}
                                style={{ borderColor: "#E2E8F0" } as React.CSSProperties}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPwd((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                {showPwd ? "Masquer" : "Afficher"}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
                              <div className={pwd.length ? "text-slate-900 font-semibold" : ""}>• 8+ caractères</div>
                              <div className={pwd.upper ? "text-slate-900 font-semibold" : ""}>• 1 majuscule</div>
                              <div className={pwd.num ? "text-slate-900 font-semibold" : ""}>• 1 chiffre</div>
                              <div className={pwd.special ? "text-slate-900 font-semibold" : ""}>• 1 symbole</div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Confirmer</label>
                            <div className="relative">
                              <input
                                value={signupPassword2}
                                onChange={(e) => setSignupPassword2(e.target.value)}
                                type={showPwd2 ? "text" : "password"}
                                placeholder="••••••••"
                                className={`${
                                  signupPassword2.length === 0 || pwdMatch ? inputNormal : inputError
                                } pr-24`}
                                style={{
                                  borderColor:
                                    signupPassword2.length === 0 || pwdMatch ? "#E2E8F0" : undefined,
                                } as React.CSSProperties}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPwd2((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                              >
                                {showPwd2 ? "Masquer" : "Afficher"}
                              </button>
                            </div>
                            {signupPassword2.length > 0 && !pwdMatch ? (
                              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canFinalize || moduleDisabled}
                        className="w-full rounded-xl font-semibold text-sm py-3 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                      >
                        {moduleDisabled ? "Bientôt disponible" : "Créer mon compte"}
                      </button>
                    </>
                  )}
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setAndSyncMode("login")}
                    className="text-[#2D8CFF] font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </p>

                {/* Accéder button for signup flow */}
                <div className="mt-5 pt-5 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (module === "both" || loginLoading) return;
                      setLoginError(null);
                      setLoginLoading(true);
                      try {
                        const res = await fetch("/api/auth/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ password: "" }),
                          credentials: "same-origin",
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.userId) saveCurrentUserId(data.userId);
                          router.push(routes[module]);
                        } else {
                          setLoginError("Erreur de connexion");
                          setLoginLoading(false);
                        }
                      } catch {
                        setLoginError("Impossible de contacter le serveur.");
                        setLoginLoading(false);
                      }
                    }}
                    disabled={module === "both" || loginLoading}
                    className="rounded-xl font-semibold text-sm px-6 py-2.5 text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #0B1220, #1E2A3A)" } as React.CSSProperties}
                  >
                    {module === "both" ? "Bientôt disponible" : "Accéder à mon espace"}
                  </button>
                </div>
              </>
            )}

            <p className="mt-4 text-xs text-slate-400">UI uniquement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPraticienPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Chargement…</div>}>
      <ConnexionPraticienPageContent />
    </Suspense>
  );
}
