"use client";

import { useState, useMemo } from "react";
import type { Schematic, Connection } from "@/lib/agents/schematic";

const CONNECTION_COLORS: Record<Connection["type"], string> = {
  power:   "#f59e0b",
  ground:  "#6b7280",
  digital: "#5291ff",
  spi:     "#06b6d4",
  i2c:     "#8b5cf6",
  uart:    "#10b981",
  analog:  "#f97316",
};

interface Props {
  schematic: Schematic;
  onProceed: () => void;
}

export default function SchematicViewer({ schematic, onProceed }: Props) {
  const [hoveredNet, setHoveredNet] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Derive unique component names from connections
  const components = useMemo(() => {
    const names = new Set<string>();
    schematic.connections.forEach((c) => {
      names.add(c.from.split(".")[0]);
      names.add(c.to.split(".")[0]);
    });
    return Array.from(names);
  }, [schematic.connections]);

  // Group components: MCU first, then by interface type
  const mcuName = components.find((c) =>
    /^(STM32|ESP32|RP2040|nRF52|AVR|SAME5x|MCU)/i.test(c)
  ) ?? components[0];

  const peripherals = components.filter((c) => c !== mcuName);

  // Simple grid layout: MCU at center-left, peripherals in rows to the right
  const CARD_W = 120;
  const CARD_H = 48;
  const COL_GAP = 160;
  const ROW_GAP = 64;
  const SVG_W = 680;
  const SVG_H = Math.max(200, (peripherals.length + 1) * ROW_GAP + 40);

  const mcuPos = { x: 40, y: SVG_H / 2 - CARD_H / 2 };

  const peripheralPositions: Record<string, { x: number; y: number }> = {};
  peripherals.forEach((name, i) => {
    peripheralPositions[name] = {
      x: 40 + COL_GAP + (Math.floor(i / 5) * (CARD_W + 20)),
      y: 20 + (i % 5) * ROW_GAP,
    };
  });

  const getCenter = (name: string): { x: number; y: number } => {
    if (name === mcuName) return { x: mcuPos.x + CARD_W, y: mcuPos.y + CARD_H / 2 };
    const pos = peripheralPositions[name];
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x, y: pos.y + CARD_H / 2 };
  };

  const toggleStep = (i: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-1">Hardware Schematic</p>
        <h2 className="text-2xl font-bold mb-1">Wiring diagram</h2>
        <p className="text-gray-400 text-sm">
          Review how your components connect before generation starts.
          Hover connections to inspect signals.
        </p>
      </div>

      {schematic.voltageWarning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>{schematic.voltageWarning}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 mb-8">
        {/* SVG schematic */}
        <div className="bg-gray-900/60 border border-white/5 rounded-2xl overflow-hidden">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-4 py-2.5 border-b border-white/5">
            {Object.entries(CONNECTION_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-500 font-mono">{type}</span>
              </div>
            ))}
          </div>

          <svg
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ minHeight: 180 }}
          >
            {/* Power rail — top */}
            <line x1="20" y1="12" x2={SVG_W - 20} y2="12" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4" />
            <text x="24" y="10" fill="#f59e0b" fontSize="8" opacity="0.6" fontFamily="monospace">VCC</text>
            {/* Ground rail — bottom */}
            <line x1="20" y1={SVG_H - 12} x2={SVG_W - 20} y2={SVG_H - 12} stroke="#6b7280" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 4" />
            <text x="24" y={SVG_H - 4} fill="#6b7280" fontSize="8" opacity="0.6" fontFamily="monospace">GND</text>

            {/* Connections */}
            {schematic.connections.map((conn, i) => {
              const fromComp = conn.from.split(".")[0];
              const toComp = conn.to.split(".")[0];
              const from = getCenter(fromComp === mcuName ? mcuName : fromComp);
              const to = getCenter(toComp === mcuName ? mcuName : toComp);
              if (!from || !to || (from.x === 0 && from.y === 0) || (to.x === 0 && to.y === 0)) return null;

              const isHovered = hoveredNet === conn.net ||
                hoveredComponent === fromComp ||
                hoveredComponent === toComp;
              const color = CONNECTION_COLORS[conn.type] ?? "#5291ff";
              const midX = (from.x + to.x) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeOpacity={isHovered ? 1 : 0.45}
                    className="transition-all duration-150"
                  />
                  {/* Invisible wider hit area */}
                  <path
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    onMouseEnter={() => setHoveredNet(conn.net)}
                    onMouseLeave={() => setHoveredNet(null)}
                    style={{ cursor: "crosshair" }}
                  />
                  {isHovered && hoveredNet === conn.net && (
                    <text
                      x={midX}
                      y={(from.y + to.y) / 2 - 6}
                      fill={color}
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {conn.net}{conn.label ? ` (${conn.label})` : ""}
                    </text>
                  )}
                </g>
              );
            })}

            {/* MCU card */}
            <g
              onMouseEnter={() => setHoveredComponent(mcuName)}
              onMouseLeave={() => setHoveredComponent(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={mcuPos.x} y={mcuPos.y}
                width={CARD_W} height={CARD_H}
                rx="6"
                fill={hoveredComponent === mcuName ? "#1e3a5f" : "#0f1929"}
                stroke="#5291ff"
                strokeWidth="1.5"
                className="transition-colors duration-150"
              />
              <text x={mcuPos.x + CARD_W / 2} y={mcuPos.y + 18} textAnchor="middle" fill="#8ab8ff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                MCU
              </text>
              <text x={mcuPos.x + CARD_W / 2} y={mcuPos.y + 32} textAnchor="middle" fill="#5291ff" fontSize="10" fontFamily="monospace">
                {mcuName}
              </text>
            </g>

            {/* Peripheral cards */}
            {peripherals.map((name) => {
              const pos = peripheralPositions[name];
              if (!pos) return null;
              const isHov = hoveredComponent === name;
              return (
                <g
                  key={name}
                  onMouseEnter={() => setHoveredComponent(name)}
                  onMouseLeave={() => setHoveredComponent(null)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={pos.x} y={pos.y}
                    width={CARD_W} height={CARD_H}
                    rx="6"
                    fill={isHov ? "#1a1f2e" : "#0d1018"}
                    stroke={isHov ? "#8ab8ff" : "#ffffff18"}
                    strokeWidth="1"
                    className="transition-colors duration-150"
                  />
                  <text x={pos.x + CARD_W / 2} y={pos.y + 30} textAnchor="middle" fill={isHov ? "#e2e8f0" : "#94a3b8"} fontSize="10" fontFamily="monospace">
                    {name.length > 14 ? name.slice(0, 14) + "…" : name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Power-up guide */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Power-up guide</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Follow these steps to safely power your assembled device for the first time.
          </p>
          <ol className="space-y-3">
            {schematic.powerUpSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <button
                  onClick={() => toggleStep(i)}
                  className={`mt-0.5 w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                    checkedSteps.has(i)
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {checkedSteps.has(i) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm leading-relaxed transition-colors ${checkedSteps.has(i) ? "text-gray-600 line-through" : "text-gray-300"}`}>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {/* Power rails summary */}
          {schematic.powerRails.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/5">
              <p className="text-xs font-mono text-gray-600 mb-2">POWER RAILS</p>
              <div className="space-y-1.5">
                {schematic.powerRails.map((rail) => (
                  <div key={rail.name} className="flex items-center justify-between text-xs">
                    <span className="font-mono" style={{ color: rail.voltage === 0 ? "#6b7280" : "#f59e0b" }}>
                      {rail.name}
                    </span>
                    <span className="text-gray-500">{rail.voltage}V — {rail.consumers.length} component{rail.consumers.length !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Schematic is illustrative. Always verify pin assignments against your datasheet.
        </p>
        <button
          onClick={onProceed}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
        >
          Start generation →
        </button>
      </div>
    </div>
  );
}
