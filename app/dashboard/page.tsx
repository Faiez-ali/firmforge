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
  const limit = plan === "free" ? 3 : -1;
  const remaining = limit === -1 ? "∞" : Math.max(0, limit - usedToday);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {plan === "free"
            ? `${remaining} of ${limit} free generations remaining today (resets midnight UTC)`
            : "Unlimited generations · Pro plan"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Generations today"
          value={String(usedToday)}
          sub={plan === "free" ? `of ${limit} free · resets midnight UTC` : "unlimited"}
        />
        <StatCard
          label="Total projects"
          value={String(recentProjects?.length ?? 0)}
          sub="all time"
        />
        <StatCard
          label="Credits"
          value={String(profile?.credits ?? 0)}
          sub={
            <Link href="/dashboard/settings#billing" className="text-brand-400 hover:underline">
              {plan === "free" ? "Upgrade to Pro" : "Buy credits"}
            </Link>
          }
        />
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/generate"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm transition-all hover:scale-105 mb-10"
      >
        ⚡ Start new project
      </Link>

      {/* Recent projects */}
      {recentProjects && recentProjects.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
            Recent projects
          </h2>
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium font-mono text-brand-300">
                    {project.spec?.mcu ?? "Unknown MCU"} — {project.spec?.description?.slice(0, 50) ?? "No description"}
                    {(project.spec?.description?.length ?? 0) > 50 ? "..." : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={project.status} />
                  {project.output_url && (
                    <a
                      href={project.output_url}
                      className="text-xs text-brand-400 hover:text-brand-300"
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
            className="block text-center text-xs text-gray-500 hover:text-gray-300 mt-4 transition-colors"
          >
            View all projects →
          </Link>
        </div>
      )}

      {(!recentProjects || recentProjects.length === 0) && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-3xl mb-3">🔧</div>
          <p className="text-sm">No projects yet. Generate your first firmware project.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    complete: "bg-green-500/10 text-green-400",
    generating: "bg-brand-500/10 text-brand-400",
    failed: "bg-red-500/10 text-red-400",
    draft: "bg-white/5 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}
