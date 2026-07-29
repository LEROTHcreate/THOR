import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import type { UploadSession, UploadSessionPublicView } from "@/lib/supabase/types";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ token: string }>;
}

async function fetchSession(token: string): Promise<UploadSession | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) {
    console.error("[upload-session] fetch error:", error);
    return null;
  }
  return (data as UploadSession | null) ?? null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const ip = getIP(req);
  if (!rateLimit(`upload-session-get:${ip}`, 120, 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Trop de requêtes." }, { status: 429 });
  }

  const { token } = await params;
  const session = await fetchSession(token);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Session introuvable." }, { status: 404 });
  }
  if (session.revoked) {
    return NextResponse.json({ ok: false, error: "Session révoquée." }, { status: 410 });
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "Session expirée." }, { status: 410 });
  }

  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("uploaded_files")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);

  const view: UploadSessionPublicView = {
    token: session.token,
    app_source: session.app_source,
    patient_name: session.patient_name,
    praticien_name: session.praticien_name,
    message: session.message,
    expires_at: session.expires_at,
    max_files: session.max_files,
    max_file_size_mb: session.max_file_size_mb,
    allowed_types: session.allowed_types,
    files_count: count ?? 0,
  };

  return NextResponse.json({ ok: true, session: view });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const ip = getIP(req);
  if (!rateLimit(`upload-session-delete:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Trop de requêtes." }, { status: 429 });
  }

  const { token } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("upload_sessions")
    .update({ revoked: true })
    .eq("token", token);

  if (error) {
    console.error("[upload-session] revoke error:", error);
    return NextResponse.json({ ok: false, error: "Erreur révocation." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
