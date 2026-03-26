import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch profile for plan badge and name
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, plan, generations_this_month, credits")
    .eq("id", user.id)
    .single();

  const displayName = profile?.name ?? user.email?.split("@")[0] ?? "User";
  const plan = profile?.plan ?? "free";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/5 flex flex-col py-5 px-3 flex-shrink-0">
        {/* Logo */}
        <Link href="/" className="px-3 mb-6 text-base font-semibold tracking-tight">
          Firm<span className="text-brand-400">Forge</span>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          <NavItem href="/dashboard/generate" icon="⚡">New project</NavItem>
          <NavItem href="/dashboard/projects" icon="📁">My projects</NavItem>
          <NavItem href="/dashboard/settings" icon="⚙">Settings</NavItem>
        </nav>

        {/* User info */}
        <div className="border-t border-white/5 pt-4 px-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-medium text-brand-400">
              {displayName[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{displayName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  plan === "pro" ? "bg-brand-500/20 text-brand-400" :
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
              className="w-full text-left text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
    >
      <span className="text-base">{icon}</span>
      {children}
    </Link>
  );
}
