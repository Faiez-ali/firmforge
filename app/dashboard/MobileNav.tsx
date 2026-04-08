"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  displayName: string;
  plan: string;
}

const NAV_ITEMS = [
  { href: "/dashboard/generate", icon: "⚡", label: "New project" },
  { href: "/dashboard/projects", icon: "📁", label: "My projects" },
  { href: "/dashboard/settings", icon: "⚙",  label: "Settings"    },
];

export function MobileNav({ displayName, plan }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Fixed mobile top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-white/5 bg-gray-950/95 backdrop-blur-xl flex items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Firm<span className="text-brand-400">Forge</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="4.5" x2="16" y2="4.5"/>
            <line x1="2" y1="9"   x2="16" y2="9"/>
            <line x1="2" y1="13.5" x2="16" y2="13.5"/>
          </svg>
        </button>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-out drawer ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-white/8 flex flex-col py-5 px-3 transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-3 mb-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Firm<span className="text-brand-400">Forge</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-brand-500/15 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 pt-4 px-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-medium text-brand-400">
              {displayName[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{displayName}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                plan === "pro"  ? "bg-brand-500/20 text-brand-400"   :
                plan === "team" ? "bg-purple-500/20 text-purple-400" :
                                  "bg-white/5 text-gray-500"
              }`}>
                {plan}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
