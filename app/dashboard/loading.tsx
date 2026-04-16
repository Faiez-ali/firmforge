import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl animate-pulse-none">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-7 w-52 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative bg-white/[0.025] border border-white/5 rounded-xl p-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 rounded-t-xl" />
            <Skeleton className="w-8 h-8 rounded-lg mb-3" />
            <Skeleton className="h-2.5 w-12 mb-1.5" />
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-1 w-full mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Skeleton className="h-11 w-44 rounded-xl mb-10" />

      {/* Recent projects heading */}
      <Skeleton className="h-3 w-28 mb-3" />

      {/* Project rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 mb-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full ml-4 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
