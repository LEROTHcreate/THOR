"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";

interface SessionView {
  token: string;
  app_source: "vision" | "audition";
  patient_name: string | null;
  praticien_name: string | null;
  message: string | null;
  expires_at: string;
  max_files: number;
  max_file_size_mb: number;
  allowed_types: string[];
  files_count: number;
}

interface UploadedFileItem {
  id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
  progress?: number;
}

const APP_THEME = {
  vision: {
    primary: "bg-sky-600 hover:bg-sky-700",
    primaryText: "text-sky-600",
    accent: "bg-sky-50 border-sky-200",
    ring: "focus:ring-sky-300",
    name: "Clair Vision",
  },
  audition: {
    primary: "bg-emerald-600 hover:bg-emerald-700",
    primaryText: "text-emerald-600",
    accent: "bg-emerald-50 border-emerald-200",
    ring: "focus:ring-emerald-300",
    name: "Clair Audition",
  },
} as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirée";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min === 0) return `${sec}s`;
  return `${min} min ${sec.toString().padStart(2, "0")}s`;
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.5-2h5L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v5M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [session, setSession] = useState<SessionView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [items, setItems] = useState<UploadedFileItem[]>([]);
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/upload-sessions/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!data.ok) {
          setLoadError(data.error ?? "Lien invalide.");
          return;
        }
        setSession(data.session);
      })
      .catch(() => {
        if (alive) setLoadError("Impossible de joindre le serveur.");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const uploadFile = useCallback(
    async (file: File) => {
      const tempId = `tmp-${crypto.randomUUID()}`;
      const tempItem: UploadedFileItem = {
        id: tempId,
        filename: file.name,
        size_bytes: file.size,
        content_type: file.type,
        uploaded_at: new Date().toISOString(),
        status: "uploading",
      };
      setItems((prev) => [tempItem, ...prev]);

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/upload-sessions/${token}/files`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Échec de l'envoi.");
        }
        setItems((prev) =>
          prev.map((it) =>
            it.id === tempId ? { ...it, id: data.file.id, status: "done" } : it,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue.";
        setItems((prev) =>
          prev.map((it) => (it.id === tempId ? { ...it, status: "error", errorMsg: msg } : it)),
        );
      }
    },
    [token],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach(uploadFile);
    },
    [uploadFile],
  );

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <IconAlert />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Lien invalide</h1>
          <p className="text-sm text-slate-600">{loadError}</p>
          <p className="text-xs text-slate-400 mt-4">
            Demandez à votre praticien de vous générer un nouveau lien.
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm text-slate-500">Chargement…</div>
      </main>
    );
  }

  const theme = APP_THEME[session.app_source];
  const remaining = formatRemaining(session.expires_at);
  const expired = new Date(session.expires_at).getTime() <= now;
  const remainingSlots = session.max_files - (session.files_count + items.filter((i) => i.status !== "error").length);
  const canUpload = !expired && remainingSlots > 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <div className={`text-xs font-semibold uppercase tracking-wider ${theme.primaryText}`}>
            {theme.name}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Envoyer des fichiers</h1>
          {session.praticien_name && (
            <p className="text-sm text-slate-600 mt-1">
              Demande de <span className="font-medium text-slate-900">{session.praticien_name}</span>
              {session.patient_name && (
                <>
                  {" "}pour <span className="font-medium text-slate-900">{session.patient_name}</span>
                </>
              )}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-4">
        {session.message && (
          <div className={`rounded-2xl border p-4 ${theme.accent}`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Message du praticien
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{session.message}</p>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Lien valide</div>
            <div className={`text-base font-semibold mt-0.5 ${expired ? "text-red-600" : "text-slate-900"}`}>
              {remaining}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-500">Fichiers restants</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">
              {Math.max(remainingSlots, 0)} / {session.max_files}
            </div>
          </div>
        </div>

        {canUpload ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-6 text-white font-semibold transition focus:outline-none focus:ring-2 ${theme.primary} ${theme.ring}`}
            >
              <IconCamera />
              <span>Prendre une photo</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-6 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <IconUpload />
              <span>Choisir un fichier</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={session.allowed_types.join(",")}
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            {expired
              ? "Ce lien a expiré. Demandez un nouveau lien à votre praticien."
              : "Vous avez atteint le nombre maximum de fichiers pour ce lien."}
          </div>
        )}

        <p className="text-xs text-slate-500 text-center px-4">
          Taille max : {session.max_file_size_mb} Mo par fichier · Formats acceptés : photos, vidéos, PDF
        </p>

        {items.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Vos envois
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <IconFile />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 truncate">{item.filename}</div>
                    <div className="text-xs text-slate-500">{formatSize(item.size_bytes)}</div>
                    {item.status === "error" && (
                      <div className="text-xs text-red-600 mt-0.5">{item.errorMsg}</div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === "uploading" && (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                    )}
                    {item.status === "done" && (
                      <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <IconCheck />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="h-7 w-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <IconAlert />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
