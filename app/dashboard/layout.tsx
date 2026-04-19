import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { LogoMark } from "@/components/ui/LogoMark";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, plan, generations_today, credits")
    .eq("id", user.id)
    .single();

  const displayName = profile?.name ?? user.email?.split("@")[0] ?? "User";
  const plan = profile?.plan ?? "free";

  return (
    <div className="min-h-screen bg-[#060610] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/5 flex flex-col py-5 px-3 flex-shrink-0 bg-[#07080f]">
        {/* Logo */}
        <Link href="/" className="px-3 mb-7 flex items-center gap-1.5">
          <LogoMark size={18} />
          <span className="text-base font-bold tracking-tight">
            Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">beta</span>
        </Link>

        {/* Client nav — handles active state via usePathname */}
        <SidebarNav />

        {/* Plan upgrade nudge for free users */}
        {plan === "free" && (
          <div className="mx-1 mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-500/8 to-violet-500/8 border border-blue-500/15">
            <p className="text-[11px] font-semibold text-blue-300 mb-0.5">Free plan</p>
            <p className="text-[10px] text-gray-500 mb-2">3 generations / day</p>
            <Link
              href="/dashboard/settings#billing"
              className="block text-center text-[10px] font-bold py-1.5 rounded-lg bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 text-white transition-all"
            >
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* User info */}
        <div className="border-t border-white/5 pt-3 px-1">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-500/20 flex-shrink-0">
              {displayName[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate text-gray-200">{displayName}</div>
              <div className="mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  plan === "pro"  ? "bg-blue-500/20 text-blue-400" :
                  plan === "team" ? "bg-purple-500/20 text-purple-400" :
                                   "bg-white/5 text-gray-500"
                }`}>
                  {plan}
                </span>
              </div>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-xs text-gray-600 hover:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
