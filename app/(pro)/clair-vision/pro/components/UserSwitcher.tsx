"use client";

import { useState, useRef } from "react";
import type { CSSProperties } from "react";
import {
  type ProUser, type UserRole,
  ROLE_COLORS, generateId, getInitials, saveUsers, saveCurrentUserId,
} from "@/lib/users";
import type { StoreConfig } from "@/lib/storeConfig";

const glassSubtle: CSSProperties = {
  background: "var(--glass-subtle-bg)",
  border: "1px solid var(--glass-subtle-border)",
};

const ALL_ROLES: UserRole[] = ["Gérant", "Optométriste", "Opticien", "Visagiste", "Assistant(e)"];

const inputCls =
  "w-full rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none border border-slate-200 bg-white/80 focus:ring-2 focus:ring-[#2D8CFF]/30 transition placeholder:text-slate-400";

/* ── Icons ───────────────────────────────────────────────────────────────── */
function IconX({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function IconChevronRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;
}
function IconEye({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12C3 6 7 3 12 3s9 3 11 9c-2 6-6 9-11 9S3 18 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconEyeOff({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>;
}
function IconGear({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
}
function IconPlus({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function IconTrash({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
}
function IconCheck({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
}
function IconLock({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */
function Avatar({ user, size = 40 }: { user: ProUser; size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-full font-semibold flex-shrink-0"
      style={{
        width: size, height: size,
        fontSize: size < 36 ? 11 : 14,
        background: `${user.color}22`,
        color: user.color,
        boxShadow: `0 0 0 2px ${user.color}33`,
      }}
    >
      {user.initials}
    </div>
  );
}

/* ── Password input ────────────────────────────────────────────────────────── */
function PasswordInput({
  value, onChange, placeholder = "Mot de passe",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + " pr-10"}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ── Modal shell ────────────────────────────────────────────────────────────── */
function Modal({
  title, subtitle, onClose, children,
}: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px]" />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--glass-card-bg)", border: "1px solid var(--glass-strong-border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <IconX className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   UserSwitcher — main component exported and used in layout sidebar
   ══════════════════════════════════════════════════════════════════════════ */
export default function UserSwitcher({
  currentUser,
  users,
  onSwitch,
  onUsersChange,
  storeConfig,
  onStoreConfigChange,
}: {
  currentUser: ProUser;
  users: ProUser[];
  onSwitch: (user: ProUser) => void;
  onUsersChange: (users: ProUser[]) => void;
  storeConfig: StoreConfig;
  onStoreConfigChange: (c: StoreConfig) => void;
}) {
  /* Which modal is open */
  type View = "none" | "switch" | "password" | "manage" | "add" | "settings";
  const [view, setView] = useState<View>("none");

  /* Switch flow */
  const [targetUser, setTargetUser] = useState<ProUser | null>(null);
  const [pwd,        setPwd]        = useState("");
  const [pwdError,   setPwdError]   = useState("");

  /* Add user form */
  const [newName,  setNewName]  = useState("");
  const [newRole,  setNewRole]  = useState<UserRole>("Opticien");
  const [newEmail, setNewEmail] = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [newPwd2,  setNewPwd2]  = useState("");
  const [addError, setAddError] = useState("");

  /* Edit password in manage view */
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editPwd,    setEditPwd]    = useState("");
  const [editPwd2,   setEditPwd2]   = useState("");
  const [editError,  setEditError]  = useState("");

  /* Store settings form */
  const [settingsForm, setSettingsForm] = useState<StoreConfig>(storeConfig);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isGerant = currentUser.role === "Gérant";
  const close = () => {
    setView("none"); setPwd(""); setPwdError("");
    setTargetUser(null); setAddError(""); setEditingId(null);
    setSettingsSaved(false);
  };

  const openSettings = () => {
    setSettingsForm({ ...storeConfig });
    setSettingsSaved(false);
    setView("settings");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setSettingsForm(f => ({ ...f, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = () => {
    onStoreConfigChange(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  /* ── Switch: select user ── */
  const handleSelectUser = (u: ProUser) => {
    if (u.id === currentUser.id) return;
    setTargetUser(u); setPwd(""); setPwdError(""); setView("password");
  };

  /* ── Switch: validate password ── */
  const handleValidatePwd = () => {
    if (!targetUser) return;
    if (pwd !== targetUser.password) {
      setPwdError("Mot de passe incorrect"); return;
    }
    saveCurrentUserId(targetUser.id);
    onSwitch(targetUser);
    close();
  };

  /* ── Add user ── */
  const handleAddUser = () => {
    setAddError("");
    if (!newName.trim())        { setAddError("Le nom est requis");                return; }
    if (!newPwd.trim())         { setAddError("Le mot de passe est requis");       return; }
    if (newPwd !== newPwd2)     { setAddError("Les mots de passe ne correspondent pas"); return; }
    if (newPwd.length < 6)      { setAddError("Mot de passe trop court (min 6 car.)"); return; }

    const newUser: ProUser = {
      id:       generateId(newName),
      name:     newName.trim(),
      role:     newRole,
      initials: getInitials(newName),
      color:    ROLE_COLORS[newRole],
      password: newPwd,
      email:    newEmail.trim() || undefined,
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    onUsersChange(updated);
    setNewName(""); setNewRole("Opticien"); setNewEmail(""); setNewPwd(""); setNewPwd2("");
    setView("manage");
  };

  /* ── Edit password ── */
  const handleSaveEditPwd = (userId: string) => {
    setEditError("");
    if (!editPwd.trim())      { setEditError("Mot de passe requis");                  return; }
    if (editPwd !== editPwd2) { setEditError("Les mots de passe ne correspondent pas"); return; }
    if (editPwd.length < 6)   { setEditError("Minimum 6 caractères");                  return; }

    const updated = users.map(u => u.id === userId ? { ...u, password: editPwd } : u);
    saveUsers(updated);
    onUsersChange(updated);
    setEditingId(null); setEditPwd(""); setEditPwd2(""); setEditError("");
  };

  /* ── Delete user ── */
  const handleDelete = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    onUsersChange(updated);
  };

  return (
    <>
      {/* ── Sidebar user card (trigger) ── */}
      <button
        onClick={() => setView("switch")}
        className="mt-5 w-full rounded-[var(--radius-soft)] p-3 text-left group transition-all hover:shadow-md"
        style={{ background:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.65)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar user={currentUser} size={40} />
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{currentUser.name}</div>
            <div className="truncate text-xs" style={{ color: currentUser.color }}>{currentUser.role}</div>
          </div>
          <IconChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2D8CFF] transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* ════════════ MODAL: Choose user ════════════ */}
      {view === "switch" && (
        <Modal title="Changer d'utilisateur" subtitle="Sélectionnez un compte" onClose={close}>
          <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                disabled={u.id === currentUser.id}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  u.id === currentUser.id
                    ? "opacity-50 cursor-default"
                    : "hover:shadow-md hover:-translate-y-px"
                }`}
                style={u.id === currentUser.id
                  ? { background: `${u.color}12`, border: `1.5px solid ${u.color}40` }
                  : glassSubtle}
              >
                <Avatar user={u} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{u.name}</div>
                  <div className="text-xs font-medium truncate" style={{ color: u.color }}>{u.role}</div>
                </div>
                {u.id === currentUser.id ? (
                  <span className="text-[10px] font-semibold text-slate-400">Actif</span>
                ) : (
                  <IconLock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200/60 flex items-center justify-between">
            {isGerant ? (
              <button
                onClick={() => setView("manage")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2D8CFF] transition-colors"
              >
                <IconGear className="w-3.5 h-3.5" />
                Gérer les comptes
              </button>
            ) : (
              <span className="text-xs text-slate-400">Géré par le Gérant</span>
            )}
            <button onClick={close} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Fermer</button>
          </div>
        </Modal>
      )}

      {/* ════════════ MODAL: Password prompt ════════════ */}
      {view === "password" && targetUser && (
        <Modal
          title={`Connexion — ${targetUser.name}`}
          subtitle={targetUser.role}
          onClose={close}
        >
          <div className="px-6 py-5 space-y-4">
            <div className="flex justify-center py-2">
              <Avatar user={targetUser} size={56} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Mot de passe</label>
              <PasswordInput
                value={pwd}
                onChange={v => { setPwd(v); setPwdError(""); }}
                placeholder="Entrez votre mot de passe"
              />
              {pwdError && (
                <p className="text-xs text-[#EF4444] flex items-center gap-1 mt-1">
                  {pwdError}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setView("switch")}
                className="flex-1 rounded-[var(--radius-pill)] py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                style={glassSubtle}
              >
                Retour
              </button>
              <button
                onClick={handleValidatePwd}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background:"#2D8CFF", boxShadow:"0 2px 8px rgba(45,140,255,.28)" }}
              >
                <IconCheck className="w-4 h-4" />
                Connexion
              </button>
            </div>

            {/* Hint for demo */}
            <p className="text-[11px] text-slate-400 text-center">
              Démo — mot de passe : <span className="font-mono font-bold">{targetUser.password}</span>
            </p>
          </div>
        </Modal>
      )}

      {/* ════════════ MODAL: Manage accounts (Gérant only) ════════════ */}
      {view === "manage" && isGerant && (
        <Modal
          title="Gestion des comptes"
          subtitle="Seul le Gérant peut ajouter ou supprimer des utilisateurs"
          onClose={close}
        >
          <div className="px-5 py-4 space-y-2 max-h-[55vh] overflow-y-auto">
            {users.map(u => (
              <div key={u.id} className="rounded-xl overflow-hidden" style={glassSubtle}>
                {/* User row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar user={u} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{u.name}</div>
                    <div className="text-xs truncate" style={{ color: u.color }}>{u.role}</div>
                    {u.email && <div className="text-[10px] text-slate-400 truncate">{u.email}</div>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {u.isOwner && (
                      <span className="text-[10px] font-bold text-amber-600 rounded-full px-2 py-0.5" style={{ background:"rgba(245,158,11,0.12)" }}>
                        Enseigne
                      </span>
                    )}
                    <button
                      onClick={() => { setEditingId(editingId === u.id ? null : u.id); setEditPwd(""); setEditPwd2(""); setEditError(""); }}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-[#2D8CFF] hover:bg-blue-50 transition-colors"
                      title="Modifier le mot de passe"
                    >
                      <IconLock className="w-3.5 h-3.5" />
                    </button>
                    {!u.isOwner && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit password inline */}
                {editingId === u.id && (
                  <div className="px-4 pb-3 space-y-2 border-t border-slate-200/50">
                    <p className="text-[11px] text-slate-500 pt-2">Nouveau mot de passe pour <strong>{u.name}</strong></p>
                    <PasswordInput value={editPwd}  onChange={setEditPwd}  placeholder="Nouveau mot de passe" />
                    <PasswordInput value={editPwd2} onChange={setEditPwd2} placeholder="Confirmer" />
                    {editError && <p className="text-xs text-[#EF4444]">{editError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingId(null)} className="flex-1 rounded-xl py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors" style={glassSubtle}>
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSaveEditPwd(u.id)}
                        className="flex-1 rounded-xl py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background:"#2D8CFF" }}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("add")}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background:"#2D8CFF", boxShadow:"0 2px 8px rgba(45,140,255,.25)" }}
              >
                <IconPlus className="w-3.5 h-3.5" />
                Ajouter un compte
              </button>
              <button
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-2 text-xs font-semibold text-slate-500 hover:text-[#2D8CFF] transition-colors"
                style={glassSubtle}
              >
                <IconGear className="w-3.5 h-3.5" />
                Cabinet
              </button>
            </div>
            <button onClick={close} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Fermer</button>
          </div>
        </Modal>
      )}

      {/* ════════════ MODAL: Settings cabinet (Gérant only) ════════════ */}
      {view === "settings" && isGerant && (
        <Modal title="Paramètres du cabinet" subtitle="Logo, nom et coordonnées affichés dans l'espace pro" onClose={close}>
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Logo */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-2">Logo du cabinet</label>
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div
                  className="h-14 w-14 rounded-xl flex-shrink-0 overflow-hidden grid place-items-center"
                  style={settingsForm.logo
                    ? { border: "1px solid rgba(0,0,0,0.10)" }
                    : { background: "#2D8CFF" }}
                >
                  {settingsForm.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settingsForm.logo} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#2D8CFF] transition-colors hover:bg-blue-50"
                    style={glassSubtle}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    {settingsForm.logo ? "Changer le logo" : "Importer un logo"}
                  </button>
                  {settingsForm.logo && (
                    <button
                      onClick={() => setSettingsForm(f => ({ ...f, logo: undefined }))}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors text-left"
                    >
                      Supprimer le logo
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400">PNG, JPG, SVG — recommandé 80×80 px</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            {/* Nom du cabinet */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nom du cabinet / enseigne *</label>
              <input
                value={settingsForm.nom}
                onChange={e => setSettingsForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="ex : Clair Vision"
                className={inputCls}
              />
            </div>

            {/* Adresse */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Adresse</label>
                <input value={settingsForm.adresse ?? ""} onChange={e => setSettingsForm(f => ({ ...f, adresse: e.target.value }))} placeholder="12 rue de la Paix" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Code postal</label>
                <input value={settingsForm.codePostal ?? ""} onChange={e => setSettingsForm(f => ({ ...f, codePostal: e.target.value }))} placeholder="75001" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Ville</label>
                <input value={settingsForm.ville ?? ""} onChange={e => setSettingsForm(f => ({ ...f, ville: e.target.value }))} placeholder="Paris" className={inputCls} />
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Téléphone</label>
                <input value={settingsForm.telephone ?? ""} onChange={e => setSettingsForm(f => ({ ...f, telephone: e.target.value }))} placeholder="01 23 45 67 89" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
                <input value={settingsForm.email ?? ""} onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@cabinet.fr" className={inputCls} type="email" />
              </div>
            </div>

            {/* Identifiants réglementaires */}
            <div className="pt-1 border-t border-slate-200/60">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Identifiants réglementaires</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">SIRET</label>
                  <input value={settingsForm.siret ?? ""} onChange={e => setSettingsForm(f => ({ ...f, siret: e.target.value }))} placeholder="123 456 789 00012" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">N° ADELI</label>
                  <input value={settingsForm.adeli ?? ""} onChange={e => setSettingsForm(f => ({ ...f, adeli: e.target.value }))} placeholder="75-0123456" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">RPPS (opt.)</label>
                  <input value={settingsForm.rpps ?? ""} onChange={e => setSettingsForm(f => ({ ...f, rpps: e.target.value }))} placeholder="10 chiffres" className={inputCls} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Ces informations apparaissent dans les devis normalisés et factures.</p>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveSettings}
                disabled={!settingsForm.nom.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background:"#2D8CFF", boxShadow:"0 2px 8px rgba(45,140,255,.28)" }}
              >
                {settingsSaved ? (
                  <><IconCheck className="w-4 h-4" />Enregistré !</>
                ) : (
                  <><IconGear className="w-4 h-4" />Enregistrer les paramètres</>
                )}
              </button>
              <button onClick={() => setView("manage")} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Retour
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ════════════ MODAL: Add account ════════════ */}
      {view === "add" && isGerant && (
        <Modal title="Nouveau compte" subtitle="Créez un accès pour un collaborateur" onClose={close}>
          <div className="px-6 py-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nom complet *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ex: Lucie Moreau" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Rôle *</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className={inputCls}
                >
                  {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email (optionnel)</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="prenom@enseigne.fr" className={inputCls} type="email" />
              </div>
            </div>

            {/* Role preview */}
            {newName && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:`${ROLE_COLORS[newRole]}10`, border:`1px solid ${ROLE_COLORS[newRole]}30` }}>
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold flex-shrink-0"
                  style={{ background:`${ROLE_COLORS[newRole]}20`, color: ROLE_COLORS[newRole] }}
                >
                  {getInitials(newName)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{newName}</div>
                  <div className="text-xs font-medium" style={{ color: ROLE_COLORS[newRole] }}>{newRole}</div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Mot de passe *</label>
              <PasswordInput value={newPwd} onChange={setNewPwd} placeholder="Minimum 6 caractères" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Confirmer le mot de passe *</label>
              <PasswordInput value={newPwd2} onChange={setNewPwd2} placeholder="Répétez le mot de passe" />
            </div>

            {addError && (
              <p className="text-xs text-[#EF4444] flex items-center gap-1">{addError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setView("manage")}
                className="flex-1 rounded-[var(--radius-pill)] py-2.5 text-sm font-medium text-slate-500 transition-colors"
                style={glassSubtle}
              >
                Retour
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background:"#2D8CFF", boxShadow:"0 2px 8px rgba(45,140,255,.28)" }}
              >
                <IconCheck className="w-4 h-4" />
                Créer le compte
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
