"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

/* ── MCU data ─────────────────────────────────────────────────── */
const MCUS = [
  {
    id: "stm32",
    name: "STM32",
    vendor: "STMicroelectronics",
    status: "Full support",
    tagline: "The workhorse of professional embedded systems.",
    specs: { cores: "Cortex-M0 – M7", flash: "Up to 2 MB", ram: "Up to 1 MB", freq: "Up to 480 MHz" },
    usedFor: ["Industrial control", "Motor drives", "IoT gateways", "Medical devices"],
    accent: "#2b6aff",
    glow: "rgba(43,106,255,0.35)",
    bg: "from-blue-600/20 via-blue-900/10 to-transparent",
    border: "border-blue-500/40",
    chipColor: "#1a3a8f",
    pinColor: "#c0c8e0",
    labelColor: "#6ea8fe",
  },
  {
    id: "esp32",
    name: "ESP32",
    vendor: "Espressif",
    status: "Full support",
    tagline: "Wi-Fi + Bluetooth in a tiny, affordable package.",
    specs: { cores: "Dual Xtensa LX6", flash: "Up to 16 MB", ram: "520 KB SRAM", freq: "Up to 240 MHz" },
    usedFor: ["Smart home", "BLE beacons", "Wi-Fi sensors", "Wearables"],
    accent: "#e8423c",
    glow: "rgba(232,66,60,0.35)",
    bg: "from-red-600/20 via-red-900/10 to-transparent",
    border: "border-red-500/40",
    chipColor: "#5a1a1a",
    pinColor: "#e0c8c0",
    labelColor: "#fca5a5",
  },
  {
    id: "rp2040",
    name: "RP2040",
    vendor: "Raspberry Pi",
    status: "Experimental",
    tagline: "Dual-core with programmable I/O — a new breed.",
    specs: { cores: "Dual Cortex-M0+", flash: "External (up to 16 MB)", ram: "264 KB SRAM", freq: "Up to 133 MHz" },
    usedFor: ["USB HID devices", "Audio DSP", "Custom protocols", "Education"],
    accent: "#c026d3",
    glow: "rgba(192,38,211,0.35)",
    bg: "from-purple-600/20 via-purple-900/10 to-transparent",
    border: "border-purple-500/40",
    chipColor: "#3b1a5a",
    pinColor: "#d0c0e0",
    labelColor: "#d8b4fe",
  },
  {
    id: "nrf52",
    name: "nRF52",
    vendor: "Nordic Semiconductor",
    status: "Experimental",
    tagline: "Ultra-low power BLE — built for battery life.",
    specs: { cores: "Cortex-M4F", flash: "Up to 1 MB", ram: "Up to 256 KB", freq: "64 MHz" },
    usedFor: ["Wearables", "BLE sensors", "Asset tracking", "Health monitors"],
    accent: "#0ea5e9",
    glow: "rgba(14,165,233,0.35)",
    bg: "from-sky-600/20 via-sky-900/10 to-transparent",
    border: "border-sky-500/40",
    chipColor: "#0c2a3a",
    pinColor: "#b0d0e8",
    labelColor: "#7dd3fc",
  },
  {
    id: "avr",
    name: "AVR",
    vendor: "Microchip / Atmel",
    status: "Experimental",
    tagline: "The classic 8-bit that taught a generation.",
    specs: { cores: "AVR 8-bit RISC", flash: "Up to 256 KB", ram: "Up to 32 KB", freq: "Up to 20 MHz" },
    usedFor: ["Arduino projects", "Simple automation", "Sensor nodes", "Robotics"],
    accent: "#10b981",
    glow: "rgba(16,185,129,0.35)",
    bg: "from-emerald-600/20 via-emerald-900/10 to-transparent",
    border: "border-emerald-500/40",
    chipColor: "#0a2a1a",
    pinColor: "#b0e0c8",
    labelColor: "#6ee7b7",
  },
  {
    id: "same5x",
    name: "SAME5x",
    vendor: "Microchip",
    status: "Experimental",
    tagline: "Industrial-grade ARM with rich peripherals.",
    specs: { cores: "Dual Cortex-M4F", flash: "Up to 1 MB", ram: "Up to 256 KB", freq: "120 MHz" },
    usedFor: ["Industrial IO", "CAN bus", "EtherCAT", "Motor control"],
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.35)",
    bg: "from-amber-600/20 via-amber-900/10 to-transparent",
    border: "border-amber-500/40",
    chipColor: "#2a1a00",
    pinColor: "#e0d0a0",
    labelColor: "#fcd34d",
  },
];

/* ── SVG chip illustrations ────────────────────────────────────── */
function ChipSVG({ mcu }: { mcu: typeof MCUS[0] }) {
  const pins = 10;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
      {/* Glow */}
      <defs>
        <radialGradient id={`glow-${mcu.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={mcu.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={mcu.accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${mcu.id}`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="90" fill={`url(#glow-${mcu.id})`} />

      {/* PCB board */}
      <rect x="30" y="30" width="140" height="140" rx="8" fill="#0a0e1a" stroke={mcu.accent} strokeWidth="0.5" strokeOpacity="0.4" />

      {/* Chip body */}
      <rect x="55" y="55" width="90" height="90" rx="6" fill={mcu.chipColor} />
      <rect x="57" y="57" width="86" height="86" rx="5" fill="none" stroke={mcu.accent} strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Corner marks */}
      <circle cx="63" cy="63" r="3" fill={mcu.accent} fillOpacity="0.8" />

      {/* Chip label */}
      <text x="100" y="94" textAnchor="middle" fill={mcu.labelColor} fontSize="11" fontFamily="monospace" fontWeight="bold">
        {mcu.name}
      </text>
      <text x="100" y="108" textAnchor="middle" fill={mcu.labelColor} fontSize="6.5" fontFamily="monospace" fillOpacity="0.7">
        {mcu.vendor.toUpperCase()}
      </text>

      {/* Trace lines */}
      {[0, 1, 2, 3].map(i => (
        <line key={i}
          x1={65 + i * 24} y1="57" x2={65 + i * 24} y2="45"
          stroke={mcu.accent} strokeWidth="0.5" strokeOpacity="0.3"
        />
      ))}
      {[0, 1, 2, 3].map(i => (
        <line key={i}
          x1={65 + i * 24} y1="143" x2={65 + i * 24} y2="155"
          stroke={mcu.accent} strokeWidth="0.5" strokeOpacity="0.3"
        />
      ))}
      {[0, 1, 2, 3].map(i => (
        <line key={i}
          x1="57" y1={65 + i * 24} x2="45" y2={65 + i * 24}
          stroke={mcu.accent} strokeWidth="0.5" strokeOpacity="0.3"
        />
      ))}
      {[0, 1, 2, 3].map(i => (
        <line key={i}
          x1="143" y1={65 + i * 24} x2="155" y2={65 + i * 24}
          stroke={mcu.accent} strokeWidth="0.5" strokeOpacity="0.3"
        />
      ))}

      {/* Pins top */}
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x={34 + i * 14} y="24" width="6" height="10" rx="1"
          fill={mcu.pinColor} fillOpacity="0.6" />
      ))}
      {/* Pins bottom */}
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x={34 + i * 14} y="166" width="6" height="10" rx="1"
          fill={mcu.pinColor} fillOpacity="0.6" />
      ))}
      {/* Pins left */}
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x="24" y={34 + i * 14} width="10" height="6" rx="1"
          fill={mcu.pinColor} fillOpacity="0.6" />
      ))}
      {/* Pins right */}
      {Array.from({ length: pins }).map((_, i) => (
        <rect key={i} x="166" y={34 + i * 14} width="10" height="6" rx="1"
          fill={mcu.pinColor} fillOpacity="0.6" />
      ))}

      {/* Scan line animation */}
      <rect x="55" y="55" width="90" height="3" rx="1" fill={mcu.accent} fillOpacity="0.15">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,87;0,0"
          dur="3s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function McuShowcase() {
  const [active, setActive] = useState(0);
  const mcu = MCUS[active];
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D tilt from mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), { stiffness: 200, damping: 30 });

  function onMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }
  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="w-full">
      {/* ── Tab selector ── */}
      <div className="relative flex items-center justify-center gap-1 mb-12 overflow-x-auto pb-2 scrollbar-hide">
        {MCUS.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            className="relative px-5 py-2.5 rounded-full text-sm font-mono font-medium transition-colors duration-200 whitespace-nowrap shrink-0 focus:outline-none"
            style={{ color: active === i ? m.accent : "rgb(107 114 128)" }}
          >
            {active === i && (
              <motion.div
                layoutId="mcu-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: `${m.accent}18`, border: `1px solid ${m.accent}50` }}
                transition={{ type: "spring", stiffness: 380, damping: 35 }}
              />
            )}
            <span className="relative z-10">{m.name}</span>
          </button>
        ))}
      </div>

      {/* ── Main display ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mcu.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`relative rounded-3xl border ${mcu.border} bg-gradient-to-br ${mcu.bg} overflow-hidden`}
          style={{ boxShadow: `0 0 80px -20px ${mcu.glow}` }}
        >
          {/* Ambient glow blob */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${mcu.accent}20` }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left — chip visual */}
            <div
              ref={containerRef}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
              className="flex items-center justify-center p-12 md:p-16 cursor-none"
              style={{ perspective: "800px" }}
            >
              <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="w-56 h-56 md:w-64 md:h-64 drop-shadow-2xl"
              >
                <ChipSVG mcu={mcu} />
              </motion.div>
            </div>

            {/* Right — info */}
            <div className="flex flex-col justify-center p-8 md:p-12 border-t md:border-t-0 md:border-l border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono px-2 py-1 rounded-full border"
                  style={{ color: mcu.accent, borderColor: `${mcu.accent}40`, background: `${mcu.accent}10` }}>
                  {mcu.status}
                </span>
                <span className="text-xs text-gray-500 font-mono">{mcu.vendor}</span>
              </div>

              <h3 className="text-4xl font-bold mb-2" style={{ color: mcu.accent }}>{mcu.name}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">{mcu.tagline}</p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {Object.entries(mcu.specs).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-xs text-gray-500 font-mono mb-1 capitalize">{k}</div>
                    <div className="text-sm text-white font-medium">{v}</div>
                  </div>
                ))}
              </div>

              {/* Use cases */}
              <div>
                <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-wider">Best for</div>
                <div className="flex flex-wrap gap-2">
                  {mcu.usedFor.map(u => (
                    <span key={u} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 py-5 border-t border-white/5">
            {MCUS.map((m, i) => (
              <button key={m.id} onClick={() => setActive(i)}
                className="transition-all duration-300 rounded-full focus:outline-none"
                style={{
                  width: active === i ? 24 : 6,
                  height: 6,
                  background: active === i ? mcu.accent : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Keyboard hint ── */}
      <p className="text-center text-xs text-gray-600 font-mono mt-4">
        click a chip to explore · hover the board to tilt
      </p>
    </div>
  );
}
