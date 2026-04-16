import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectsLoading() {
  return (
    <div className="px-8 py-12 max-w-5xl">
      {/* Page header */}
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-10" />

      {/* Filter / search bar area */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Project rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-2/3 mb-1.5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
