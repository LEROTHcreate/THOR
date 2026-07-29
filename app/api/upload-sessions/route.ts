import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import type { AppSource } from "@/lib/supabase/types";

export const runtime = "nodejs";

const VALID_APPS: AppSource[] = ["vision", "audition"];
const DEFAULT_TTL_MINUTES = 15;
const MAX_TTL_MINUTES = 60;

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  if (!rateLimit(`upload-session:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Trop de demandes. Réessayez dans 1 heure." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 });
  }

  const appSource = body.app_source as AppSource | undefined;
  const patientId = body.patient_id as string | undefined;
  const patientName = (body.patient_name as string | undefined) ?? null;
  const praticienName = (body.praticien_name as string | undefined) ?? null;
  const message = (body.message as string | undefined) ?? null;
  const ttlMinutes = Math.min(
    Math.max(Number(body.ttl_minutes) || DEFAULT_TTL_MINUTES, 5),
    MAX_TTL_MINUTES,
  );

  if (!appSource || !VALID_APPS.includes(appSource)) {
    return NextResponse.json(
      { ok: false, error: "app_source doit valoir 'vision' ou 'audition'." },
      { status: 400 },
    );
  }
  if (!patientId || typeof patientId !== "string") {
    return NextResponse.json({ ok: false, error: "patient_id requis." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("upload_sessions")
    .insert({
      token,
      app_source: appSource,
      patient_id: patientId,
      patient_name: patientName,
      praticien_name: praticienName,
      message,
      expires_at: expiresAt,
    })
    .select("token, expires_at")
    .single();

  if (error) {
    console.error("[upload-sessions] insert error:", error);
    return NextResponse.json({ ok: false, error: "Erreur création session." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const uploadUrl = `${siteUrl.replace(/\/$/, "")}/upload/${data.token}`;

  return NextResponse.json({
    ok: true,
    token: data.token,
    upload_url: uploadUrl,
    expires_at: data.expires_at,
  });
}
