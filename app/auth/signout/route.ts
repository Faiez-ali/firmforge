import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Use NEXT_PUBLIC_APP_URL if set; fall back to the request origin so this
  // never throws when the env var is absent (e.g. preview deployments).
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL("/auth/login", base));
}
