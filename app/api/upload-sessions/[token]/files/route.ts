import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import type { UploadSession, UploadedFile } from "@/lib/supabase/types";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ token: string }>;
}

const SIGNED_URL_TTL_SECONDS = 60 * 5;

async function fetchValidSession(token: string): Promise<UploadSession | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("upload_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  const session = data as UploadSession | null;
  if (!session) return null;
  if (session.revoked) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  return session;
}

function isAllowedType(contentType: string, allowed: string[]): boolean {
  return allowed.some((pattern) => {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1);
      return contentType.startsWith(prefix);
    }
    return contentType === pattern;
  });
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\-]/g, "_").slice(0, 120);
  return cleaned.length > 0 ? cleaned : "fichier";
}

export async function POST(req: NextRequest, { params }: Params) {
  const ip = getIP(req);
  if (!rateLimit(`upload-file:${ip}`, 60, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });
  }

  const { token } = await params;
  const session = await fetchValidSession(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Session invalide ou expirée." }, { status: 410 });
  }

  const supabase = getSupabaseAdmin();

  const { count: existingCount } = await supabase
    .from("uploaded_files")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);
  if ((existingCount ?? 0) >= session.max_files) {
    return NextResponse.json(
      { ok: false, error: `Limite de ${session.max_files} fichiers atteinte.` },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Form data invalide." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Champ 'file' manquant." }, { status: 400 });
  }

  const maxBytes = session.max_file_size_mb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { ok: false, error: `Fichier trop lourd (max ${session.max_file_size_mb} Mo).` },
      { status: 400 },
    );
  }

  const contentType = file.type || "application/octet-stream";
  if (!isAllowedType(contentType, session.allowed_types)) {
    return NextResponse.json(
      { ok: false, error: `Type de fichier non autorisé : ${contentType}.` },
      { status: 400 },
    );
  }

  const safeName = sanitizeFilename(file.name);
  const uniquePrefix = randomBytes(6).toString("hex");
  const storagePath = `${session.app_source}/${session.patient_id}/${session.id}/${uniquePrefix}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });
  if (uploadError) {
    console.error("[upload-file] storage error:", uploadError);
    return NextResponse.json({ ok: false, error: "Erreur stockage." }, { status: 500 });
  }

  const { data: row, error: insertError } = await supabase
    .from("uploaded_files")
    .insert({
      session_id: session.id,
      filename: file.name,
      storage_path: storagePath,
      size_bytes: file.size,
      content_type: contentType,
    })
    .select("id, filename, size_bytes, content_type, uploaded_at")
    .single();

  if (insertError) {
    console.error("[upload-file] insert error:", insertError);
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json({ ok: false, error: "Erreur enregistrement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, file: row });
}

export async function GET(req: NextRequest, { params }: Params) {
  const ip = getIP(req);
  if (!rateLimit(`upload-file-list:${ip}`, 240, 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Trop de requêtes." }, { status: 429 });
  }

  const { token } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase
    .from("upload_sessions")
    .select("id, app_source")
    .eq("token", token)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Session introuvable." }, { status: 404 });
  }

  const { data: files, error } = await supabase
    .from("uploaded_files")
    .select("id, filename, storage_path, size_bytes, content_type, uploaded_at")
    .eq("session_id", session.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[upload-file-list] error:", error);
    return NextResponse.json({ ok: false, error: "Erreur lecture." }, { status: 500 });
  }

  const enriched = await Promise.all(
    (files as (UploadedFile & { storage_path: string })[]).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(f.storage_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: f.id,
        filename: f.filename,
        size_bytes: f.size_bytes,
        content_type: f.content_type,
        uploaded_at: f.uploaded_at,
        url: signed?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json({ ok: true, files: enriched });
}
