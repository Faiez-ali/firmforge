import { Skeleton } from "@/components/ui/Skeleton";

/** Matches the shape of LoginForm / SignupForm while they hydrate. */
export function AuthFormSkeleton({ variant = "login" }: { variant?: "login" | "signup" }) {
  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-5 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-44 mx-auto" />
      </div>

      {/* Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        {/* OAuth buttons */}
        <div className="flex flex-col gap-2 mb-5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/5" />
          <Skeleton className="h-3 w-4 rounded" />
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Input fields */}
        <div className="space-y-3">
          {variant === "signup" && <Skeleton className="h-10 w-full rounded-lg" />}
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl mt-1" />
        </div>
      </div>

      {/* Footer link */}
      <div className="text-center mt-5">
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
    </div>
  );
}
