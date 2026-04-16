import { Skeleton } from "@/components/ui/Skeleton";

export default function GenerateLoading() {
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      {/* Stage indicator skeleton — 4 circles + connecting lines */}
      <div className="flex items-center mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
            {i < 3 && (
              <div className="flex-1 mx-2 mb-5">
                <Skeleton className="h-[2px] w-full rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wizard card skeleton */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
        {/* Card header */}
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-80 mb-8" />

        {/* Form fields */}
        <div className="space-y-5">
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
