"use client";

import type { BOM, ProjectSpec } from "@/types";

interface Props {
  bom: BOM;
  spec: ProjectSpec;
  onApprove: () => void;
  onBack: () => void;
  loading?: boolean;
}

export default function BOMApproval({ bom, spec, onApprove, onBack, loading = false }: Props) {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Review your Bill of Materials</h2>
        <p className="text-gray-400 text-sm">
          Confirm the components below before generation starts.
          FirmForge will search for drivers for each item.
        </p>
      </div>

      {/* BOM table */}
      <div className="border border-white/10 rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-12 text-xs text-gray-500 font-mono px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
          <div className="col-span-4">Component</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Unit price</div>
          <div className="col-span-1 text-right">Total</div>
        </div>
        {bom.items.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-12 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors text-sm"
          >
            <div className="col-span-4 font-mono text-brand-300 font-medium">{item.name}</div>
            <div className="col-span-3 text-gray-400 text-xs self-center">{item.description}</div>
            <div className="col-span-2 text-center text-gray-300">{item.quantity}</div>
            <div className="col-span-2 text-right text-gray-300">
              {item.lcscPrice
                ? <span className="text-green-400">${item.lcscPrice.toFixed(2)}</span>
                : <span className="text-gray-500">~${item.estimatedUnitPrice.toFixed(2)}</span>
              }
            </div>
            <div className="col-span-1 text-right text-gray-400 text-xs">
              ${((item.lcscPrice ?? item.estimatedUnitPrice) * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center px-4 py-3 bg-white/[0.02] text-sm">
          <div className="text-gray-500">
            {bom.pricesFetchedAt
              ? <span className="text-green-400 font-mono text-xs">● Live prices from LCSC</span>
              : <span className="text-yellow-500/70 font-mono text-xs">● Estimated prices</span>
            }
          </div>
          <div className="font-semibold">
            Total ~<span className="text-white">${bom.totalEstimatedCost.toFixed(2)} USD</span>
          </div>
        </div>
      </div>

      {bom.notes && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-200/80 mb-6">
          <span className="font-mono text-xs text-amber-400">NOTE </span>
          {bom.notes}
        </div>
      )}

      {/* Project summary */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
        <div className="text-xs text-gray-500 font-mono mb-3">PROJECT SUMMARY</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">MCU</span>
            <span className="font-mono text-brand-300">{spec.mcu} {spec.mcuModel ?? ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">RTOS</span>
            <span className="font-mono text-gray-300">{spec.rtos === "none" ? "Bare-metal" : spec.rtos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Build system</span>
            <span className="font-mono text-gray-300">{spec.buildSystem}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Output</span>
            <span className="font-mono text-gray-300">{spec.outputScope}</span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 mb-8 text-sm text-gray-400">
        <span className="text-blue-400 font-mono text-xs block mb-1">NEXT STEPS</span>
        FirmForge will generate a wiring schematic, then run 4 AI agents to discover open-source
        drivers, evaluate them, assemble your layered codebase, and deliver a zip — typically in
        45–90 seconds.
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-40"
        >
          ← Edit project
        </button>
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner />
              Starting generation…
            </>
          ) : (
            "✓ Approve BOM & start generation"
          )}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
