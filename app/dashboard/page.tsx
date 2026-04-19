import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, plan, generations_today, credits")
    .eq("id", user!.id)
    .single();

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, spec, status, created_at, output_url")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const plan = profile?.plan ?? "free";
  const usedToday = profile?.generations_today ?? 0;
  const limit = plan === "free" ? 3 : Infinity;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usedToday);
  const usePct = limit === Infinity ? 0 : Math.min(100, Math.round((usedToday / 3) * 100));

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {plan === "free"
            ? `${remaining === Infinity ? "∞" : remaining} of 3 free generations remaining today · resets midnight UTC`
            : "Unlimited generations · Pro plan"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="⚡"
          label="Today"
          value={plan === "free" ? `${usedToday}/3` : String(usedToday)}
          sub={plan === "free" ? "resets midnight UTC" : "unlimited"}
          accent="blue"
          progress={plan === "free" ? usePct : null}
          progressLabel={plan === "free" ? `${remaining} remaining` : undefined}
        />
        <StatCard
          icon="📁"
          label="Projects"
          value={String(recentProjects?.length ?? 0)}
          sub="all time"
          accent="violet"
          progress={null}
        />
        <StatCard
          icon="💳"
          label="Credits"
          value={String(profile?.credits ?? 0)}
          sub={
            plan === "free"
              ? <Link href="/dashboard/settings#billing" className="text-blue-400 hover:text-blue-300 transition-colors">Upgrade to Pro →</Link>
              : <Link href="/dashboard/settings#billing" className="text-gray-500 hover:text-gray-400 transition-colors">Buy credits</Link>
          }
          accent="green"
          progress={null}
        />
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/generate"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] mb-10"
      >
        ⚡ Start new project
      </Link>

      {/* Recent projects */}
      {recentProjects && recentProjects.length > 0 ? (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            Recent projects
          </h2>
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 hover:bg-white/[0.035] transition-all duration-200"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium font-mono text-blue-300 truncate">
                    {project.spec?.mcu ?? "Unknown MCU"}
                    <span className="text-gray-500 mx-1.5">—</span>
                    <span className="text-gray-300 font-sans font-normal">
                      {project.spec?.description?.slice(0, 55) ?? "No description"}
                      {(project.spec?.description?.length ?? 0) > 55 ? "…" : ""}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={project.status} />
                  {project.output_url && (
                    <a
                      href={project.output_url}
                      className="text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      download
                    >
                      ↓ zip
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/projects"
            className="block text-center text-xs text-gray-600 hover:text-gray-400 mt-4 transition-colors"
          >
            View all projects →
          </Link>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  progress,
  progressLabel,
}: {
  icon: string;
  label: string;
  value: string;
  sub: React.ReactNode;
  accent: "blue" | "violet" | "green";
  progress: number | null;
  progressLabel?: string;
}) {
  const colors = {
    blue:   { bar: "from-blue-500 to-cyan-400",    icon: "bg-blue-500/10 text-blue-300",   num: "text-blue-300",   top: "from-blue-500 to-cyan-400" },
    violet: { bar: "from-violet-500 to-purple-400", icon: "bg-violet-500/10 text-violet-300", num: "text-violet-300", top: "from-violet-500 to-purple-400" },
    green:  { bar: "from-emerald-500 to-teal-400",  icon: "bg-emerald-500/10 text-emerald-300", num: "text-emerald-300", top: "from-emerald-500 to-teal-400" },
  }[accent];

  return (
    <div className="relative bg-white/[0.025] border border-white/5 rounded-xl p-4 overflow-hidden">
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${colors.top} opacity-60`} />

      <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center text-sm mb-3`}>
        {icon}
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1`}>{label}</div>
      <div className={`text-2xl font-bold ${colors.num} mb-1`}>{value}</div>

      {progress !== null && (
        <div className="mb-1.5">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progressLabel && (
            <div className="text-[10px] text-gray-600 mt-1">{progressLabel}</div>
          )}
        </div>
      )}

      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-blue-500/20 rounded-2xl p-10 text-center bg-gradient-to-b from-blue-500/5 to-transparent">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        ⚡
      </div>
      <h3 className="text-base font-semibold text-white mb-2">Start your first project</h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
        Describe your embedded device and FirmForge will search the open-source ecosystem,
        select the best drivers, and assemble the complete firmware stack.
      </p>
      <Link
        href="/dashboard/generate"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
      >
        ⚡ Generate firmware
      </Link>
      <div className="flex justify-center gap-8 mt-8">
        {[
          { value: "47", label: "files avg." },
          { value: "<60s", label: "generation" },
          { value: "6", label: "AI agents" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-lg font-bold text-blue-400">{stat.value}</div>
            <div className="text-[10px] text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    complete:   "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    generating: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    failed:     "bg-red-500/10 text-red-400 border border-red-500/20",
    draft:      "bg-white/5 text-gray-500 border border-white/5",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}
