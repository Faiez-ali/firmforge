/**
 * Base shimmer skeleton block.
 * Use className to control width, height, and border-radius.
 * The shimmer sweep animates via globals.css `.skeleton-shimmer`.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/[0.04] rounded-lg ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}
