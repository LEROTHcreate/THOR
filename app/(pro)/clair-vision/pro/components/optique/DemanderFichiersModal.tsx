"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface CreatedSession {
  token: string;
  upload_url: string;
  expires_at: string;
}

interface UploadedFileFromApi {
  id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
  url: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  praticienName?: string;
  appSource: "vision" | "audition";
}

function formatRemaining(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expirée";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min} min ${sec.toString().padStart(2, "0")}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M3 12a9 9 0 0 1 15.5-6.3M21 4v5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3M3 20v-5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DemanderFichiersModal({
  open,
  onClose,
  patientId,
  patientName,
  praticienName,
  appSource,
}: Props) {
  const [session, setSession] = useState<CreatedSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFileFromApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const createSession = useCallback(async () => {
    setCreating(true);
    setError(null);
    setFiles([]);
    try {
      const res = await fetch("/api/upload-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_source: appSource,
          patient_id: patientId,
          patient_name: patientName,
          praticien_name: praticienName ?? null,
          message: message.trim() || null,
          ttl_minutes: 15,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Erreur création session.");
      }
      setSession({ token: data.token, upload_url: data.upload_url, expires_at: data.expires_at });
      const url = await QRCode.toDataURL(data.upload_url, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setCreating(false);
    }
  }, [appSource, patientId, patientName, praticienName, message]);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setQrDataUrl(null);
      setFiles([]);
      setError(null);
      setMessage("");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!session) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/upload-sessions/${session.token}/files`);
        const data = await res.json();
        if (data.ok) setFiles(data.files);
      } catch {
        /* silencieux : prochaine itération réessaiera */
      }
    };
    fetchFiles();
    pollingRef.current = setInterval(fetchFiles, 3000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [session]);

  const handleClose = useCallback(async () => {
    if (session) {
      try {
        await fetch(`/api/upload-sessions/${session.token}`, { method: "DELETE" });
      } catch {
        /* tant pis : la session expirera d'elle-même */
      }
    }
    onClose();
  }, [session, onClose]);

  const copyLink = useCallback(async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.upload_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [session]);

  if (!open) return null;

  const expired = session ? new Date(session.expires_at).getTime() <= now : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Demander des fichiers</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {patientName} · {appSource === "vision" ? "Clair Vision" : "Clair Audition"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Fermer"
          >
            <IconClose />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {!session && !creating && !error && (
            <>
              <div>
                <label htmlFor="upload-message" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message au patient <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  id="upload-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ex : Merci de m'envoyer une photo de votre ordonnance et de votre carte mutuelle."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                />
                <div className="text-xs text-slate-400 mt-1">{message.length} / 500</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-2">
                <div className="font-medium text-slate-900">Comment ça marche</div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>Un QR code va être généré, valide 15 minutes</li>
                  <li>Le patient scanne le QR avec son téléphone</li>
                  <li>Il sélectionne ses photos, vidéos ou documents</li>
                  <li>Vous voyez les fichiers arriver en temps réel ci-dessous</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={createSession}
                className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 transition focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                Générer le QR code
              </button>
            </>
          )}

          {creating && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-sky-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              <div className="font-medium mb-1">Erreur</div>
              <div>{error}</div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900"
              >
                <IconRefresh /> Réessayer
              </button>
            </div>
          )}

          {session && qrDataUrl && (
            <>
              <div className="grid sm:grid-cols-2 gap-5 items-start">
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl border border-slate-200 p-3 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR code à scanner" width={280} height={280} />
                  </div>
                  <div className={`mt-3 text-sm font-semibold ${expired ? "text-red-600" : "text-slate-900"}`}>
                    {expired ? "Lien expiré" : `Valide encore ${formatRemaining(session.expires_at, now)}`}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Lien direct
                    </div>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={session.upload_url}
                        className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-slate-50 font-mono"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button
                        type="button"
                        onClick={copyLink}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-semibold"
                      >
                        {copied ? <IconCheck /> : <IconCopy />}
                        {copied ? "Copié" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900">
                    Demandez au patient de scanner le QR avec l&apos;appareil photo de son téléphone, ou
                    envoyez-lui le lien par SMS.
                  </div>

                  {expired && (
                    <button
                      type="button"
                      onClick={createSession}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 text-sm"
                    >
                      <IconRefresh /> Générer un nouveau QR
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fichiers reçus
                  </div>
                  <div className="text-xs text-slate-500">
                    {files.length === 0 ? "En attente…" : `${files.length} fichier${files.length > 1 ? "s" : ""}`}
                  </div>
                </div>
                {files.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Aucun fichier pour le moment. La page se met à jour automatiquement.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {files.map((f) => (
                      <li key={f.id} className="px-4 py-3 flex items-center gap-3">
                        {f.content_type.startsWith("image/") && f.url ? (
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={f.url}
                              alt={f.filename}
                              className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                            />
                          </a>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-xs uppercase">
                            {f.content_type.split("/")[1]?.slice(0, 4) ?? "?"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{f.filename}</div>
                          <div className="text-xs text-slate-500">{formatSize(f.size_bytes)}</div>
                        </div>
                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={f.filename}
                            className="shrink-0 text-xs font-semibold text-sky-700 hover:text-sky-900"
                          >
                            Ouvrir
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
