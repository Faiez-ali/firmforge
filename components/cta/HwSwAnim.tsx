"use client";

import { motion } from "framer-motion";

// ── Data model ────────────────────────────────────────────────────────────────

const HW_NODES = [
  { label: "BME280",    sub: "Temp / Humidity", color: "#3b82f6", y: 52,  dir: "in"  as const },
  { label: "MPU-6050",  sub: "6-axis IMU",      color: "#a78bfa", y: 96,  dir: "in"  as const },
  { label: "SSD1306",   sub: "OLED Display",    color: "#22d3ee", y: 140, dir: "out" as const },
];

const FW_LAYERS = [
  { label: "Application",  file: "main.c",       color: "#3b82f6", y: 52  },
  { label: "HAL / BSP",    file: "hal_gpio.c",   color: "#a78bfa", y: 96  },
  { label: "Drivers",      file: "bme280_drv.c", color: "#22d3ee", y: 140 },
];

// Coordinate constants
const HW_BOX_X    = 2;
const HW_BOX_W    = 142;
const HW_LINE_X   = HW_BOX_X + HW_BOX_W;       // 144 — right edge of HW boxes
const MCU_LEFT_X  = 194;
const MCU_RIGHT_X = 350;
const FW_LINE_X   = MCU_RIGHT_X + 6;            // 356
const FW_BOX_X    = FW_LINE_X + 44;             // 400
const FW_BOX_W    = 148;
const SVG_W       = FW_BOX_X + FW_BOX_W + 2;   // 550
const SVG_H       = 190;

// ── Signal dot ────────────────────────────────────────────────────────────────

interface DotProps {
  x1: number; x2: number; y: number;
  color: string; delay: number; dur?: number; repeatDelay?: number;
}

function SignalDot({ x1, x2, y, color, delay, dur = 1.6, repeatDelay = 2.8 }: DotProps) {
  return (
    <motion.circle
      r={3.5}
      fill={color}
      cy={y}
      animate={{
        cx:      [x1, x1, x2, x2],
        opacity: [0,  1,  1,  0 ],
      }}
      transition={{
        duration:    dur,
        delay,
        repeat:      Infinity,
        repeatDelay,
        ease:        "linear",
        times:       [0, 0.04, 0.96, 1],
      }}
      style={{ filter: `drop-shadow(0 0 5px ${color})` }}
    />
  );
}

// ── MCU pulsing ring ──────────────────────────────────────────────────────────

function McuPulse({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <motion.circle
        cx={cx} cy={cy} r={6}
        fill="#3b82f6"
        animate={{ opacity: [0.35, 1, 0.35], r: [5, 7, 5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "drop-shadow(0 0 8px #3b82f6)" }}
      />
      <motion.circle
        cx={cx} cy={cy} r={14}
        fill="none" stroke="#3b82f6" strokeWidth="0.8"
        animate={{ opacity: [0, 0.35, 0], r: [8, 20, 8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HwSwAnim() {
  const mcuCX = (MCU_LEFT_X + MCU_RIGHT_X) / 2;
  const mcuCY = SVG_H / 2;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Column headers ── */}
      <text x={HW_BOX_X + HW_BOX_W / 2} y="14" textAnchor="middle"
        fontSize="8" fill="#4b5563" fontFamily="monospace" letterSpacing="2.5">
        HARDWARE
      </text>
      <text x={mcuCX} y="14" textAnchor="middle"
        fontSize="8" fill="#4b5563" fontFamily="monospace" letterSpacing="2.5">
        PROCESSOR
      </text>
      <text x={FW_BOX_X + FW_BOX_W / 2} y="14" textAnchor="middle"
        fontSize="8" fill="#4b5563" fontFamily="monospace" letterSpacing="2.5">
        FIRMWARE
      </text>

      {/* ── MCU chip body ── */}
      <rect
        x={MCU_LEFT_X} y="22"
        width={MCU_RIGHT_X - MCU_LEFT_X} height={SVG_H - 32}
        rx="9" fill="rgba(255,255,255,0.018)"
        stroke="rgba(255,255,255,0.09)" strokeWidth="1"
      />
      {/* inner die outline */}
      <rect
        x={MCU_LEFT_X + 10} y="34"
        width={MCU_RIGHT_X - MCU_LEFT_X - 20} height={SVG_H - 56}
        rx="5" fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
      />
      {/* MCU text */}
      <text x={mcuCX} y={mcuCY - 12} textAnchor="middle"
        fontSize="14" fill="white" fontFamily="monospace" fontWeight="700">
        STM32
      </text>
      <text x={mcuCX} y={mcuCY + 4} textAnchor="middle"
        fontSize="9" fill="#6b7280" fontFamily="monospace">
        F407VG
      </text>

      {/* MCU activity pulse */}
      <McuPulse cx={mcuCX} cy={mcuCY + 24} />

      {/* ── Hardware nodes ── */}
      {HW_NODES.map((node) => (
        <g key={node.label}>
          {/* Dashed connector */}
          <line
            x1={HW_LINE_X} y1={node.y}
            x2={MCU_LEFT_X} y2={node.y}
            stroke={node.color} strokeWidth="0.7"
            strokeOpacity="0.22" strokeDasharray="4 3"
          />
          {/* MCU left pin mark */}
          <rect
            x={MCU_LEFT_X - 5} y={node.y - 2.5}
            width={5} height={5} rx="1.5"
            fill={node.color} opacity="0.45"
          />
          {/* HW node card */}
          <rect
            x={HW_BOX_X} y={node.y - 15}
            width={HW_BOX_W} height={28} rx="6"
            fill="rgba(255,255,255,0.02)"
            stroke={node.color} strokeWidth="0.6" strokeOpacity="0.35"
          />
          <text x={HW_BOX_X + 9} y={node.y - 3}
            fontSize="10.5" fill={node.color} fontFamily="monospace" fontWeight="600">
            {node.label}
          </text>
          <text x={HW_BOX_X + 9} y={node.y + 9}
            fontSize="8" fill="#6b7280" fontFamily="monospace">
            {node.sub}
          </text>
          {/* Direction arrow hint */}
          <text
            x={node.dir === "in" ? HW_LINE_X - 4 : MCU_LEFT_X + 4}
            y={node.y - 5}
            fontSize="7" fill={node.color} opacity="0.5"
            fontFamily="monospace" textAnchor="middle"
          >
            {node.dir === "in" ? "→" : "←"}
          </text>
        </g>
      ))}

      {/* ── Firmware layers ── */}
      {FW_LAYERS.map((layer) => (
        <g key={layer.label}>
          {/* Dashed connector */}
          <line
            x1={MCU_RIGHT_X} y1={layer.y}
            x2={FW_LINE_X + 42} y2={layer.y}
            stroke={layer.color} strokeWidth="0.7"
            strokeOpacity="0.22" strokeDasharray="4 3"
          />
          {/* MCU right pin mark */}
          <rect
            x={MCU_RIGHT_X} y={layer.y - 2.5}
            width={5} height={5} rx="1.5"
            fill={layer.color} opacity="0.45"
          />
          {/* FW layer card */}
          <rect
            x={FW_BOX_X} y={layer.y - 15}
            width={FW_BOX_W} height={28} rx="6"
            fill="rgba(255,255,255,0.02)"
            stroke={layer.color} strokeWidth="0.6" strokeOpacity="0.35"
          />
          <text x={FW_BOX_X + 9} y={layer.y - 3}
            fontSize="10.5" fill={layer.color} fontFamily="monospace" fontWeight="600">
            {layer.label}
          </text>
          <text x={FW_BOX_X + 9} y={layer.y + 9}
            fontSize="8" fill="#6b7280" fontFamily="monospace">
            {layer.file}
          </text>
        </g>
      ))}

      {/* ── Animated signal dots: HW ↔ MCU ── */}
      {HW_NODES.map((node, i) =>
        node.dir === "in" ? (
          <SignalDot
            key={`hw-in-${i}`}
            x1={HW_LINE_X + 4} x2={MCU_LEFT_X - 8}
            y={node.y} color={node.color}
            delay={i * 1.05} dur={1.5} repeatDelay={3}
          />
        ) : (
          <SignalDot
            key={`hw-out-${i}`}
            x1={MCU_LEFT_X - 8} x2={HW_LINE_X + 4}
            y={node.y} color={node.color}
            delay={i * 1.05 + 0.6} dur={1.5} repeatDelay={3}
          />
        )
      )}

      {/* ── Animated signal dots: MCU ↔ FW (bidirectional) ── */}
      {FW_LAYERS.map((layer, i) => (
        <g key={`fw-${i}`}>
          {/* FW sends command → MCU */}
          <SignalDot
            x1={FW_BOX_X - 2} x2={MCU_RIGHT_X + 8}
            y={layer.y} color={layer.color}
            delay={i * 0.95 + 0.35} dur={1.4} repeatDelay={3.2}
          />
          {/* MCU returns data → FW */}
          <SignalDot
            x1={MCU_RIGHT_X + 8} x2={FW_BOX_X - 2}
            y={layer.y} color={layer.color}
            delay={i * 0.95 + 1.7} dur={1.4} repeatDelay={3.2}
          />
        </g>
      ))}
    </svg>
  );
}
