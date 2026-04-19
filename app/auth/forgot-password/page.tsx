"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/LogoMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white flex items-center justify-center px-6">
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to sign in
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <LogoMark size={26} />
            <span className="text-xl font-bold tracking-tight">
              Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold mb-1">Reset your password</h1>
          <p className="text-gray-400 text-sm">
            {sent ? "Check your inbox" : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">📬</div>
            <p className="text-gray-300 text-sm mb-1">
              We sent a password reset link to
            </p>
            <p className="font-medium text-white mb-5">{email}</p>
            <p className="text-gray-500 text-xs">
              Didn't receive it? Check your spam folder or{" "}
              <button onClick={() => setSent(false)} className="text-blue-400 hover:text-blue-300 underline">
                try again
              </button>.
            </p>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
