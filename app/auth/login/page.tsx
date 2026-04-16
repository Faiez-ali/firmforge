// Server component — force-dynamic prevents prerendering at build time,
// keeping the Supabase client out of the static generation phase.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { AuthFormSkeleton } from "@/components/auth/AuthFormSkeleton";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060610] text-white flex overflow-hidden relative">

      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[110px]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-600/5 blur-[90px]" />
      </div>

      {/* ── Back to home — pinned top-left ── */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-200 transition-colors group"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to home
        </Link>
      </div>

      {/* ── Left branding panel — desktop only ── */}
      <div className="hidden lg:flex flex-col justify-center w-[46%] px-16 relative z-10 border-r border-white/5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-14">
          <span className="text-2xl font-bold tracking-tight">
            Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            beta
          </span>
        </Link>

        <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-4">
          AI firmware generation
        </p>
        <h2 className="text-4xl font-bold leading-tight mb-6">
          Welcome back
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            to FirmForge.
          </span>
        </h2>
        <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
          Your firmware projects are waiting. Sign in to continue building or
          start a new generation right away.
        </p>

        <ul className="space-y-4">
          {[
            { icon: "⚡", text: "6 AI agents run in sequence" },
            { icon: "🔩", text: "Real drivers, not stubs" },
            { icon: "📦", text: "Zip download in under 60 seconds" },
            { icon: "🆓", text: "3 free generations per day" },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm text-gray-300">
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">
                {item.icon}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
        <Suspense fallback={<AuthFormSkeleton variant="login" />}>
          <LoginForm />
        </Suspense>
      </div>

    </div>
  );
}
