import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** Only allow relative paths — prevent open-redirect to external domains. */
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return "/dashboard";
  // Must start with exactly one "/" and not be a protocol-relative URL like //evil.com
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  // Reject anything containing a protocol (e.g. encoded http://)
  if (/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(raw)) return "/dashboard";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = sanitizeRedirect(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
