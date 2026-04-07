"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Idea pool (30 project ideas) ──────────────────────────────────────────────
// Every page load picks 10 at random — no two tabs share the same set.

interface Idea {
  mcu:   string;
  cat:   string;
  title: string;
  sub:   string;
  color: string; // tailwind accent
}

const IDEA_POOL: Idea[] = [
  { mcu: "STM32F407",  cat: "IoT",         title: "Weather station",            sub: "BME280 + SSD1306 OLED + CMake",          color: "blue"   },
  { mcu: "ESP32-S3",   cat: "Smart Home",  title: "Home automation hub",        sub: "MQTT + WiFi + 8-ch relay board",         color: "cyan"   },
  { mcu: "RP2040",     cat: "USB",         title: "USB macro keyboard",         sub: "TinyUSB HID + rotary encoders + OLED",   color: "violet" },
  { mcu: "nRF52840",   cat: "BLE",         title: "Heart rate monitor",         sub: "MAX30102 + BLE + coin cell power",       color: "rose"   },
  { mcu: "STM32F4",    cat: "Motor",       title: "Brushless motor controller", sub: "DRV8305 + FOC algorithm + CAN bus",      color: "orange" },
  { mcu: "ESP32-CAM",  cat: "Vision",      title: "Security camera",            sub: "Motion detection + MJPEG stream",        color: "amber"  },
  { mcu: "STM32F407",  cat: "Logging",     title: "CAN bus data logger",        sub: "MCP2515 + SD card + RTC timestamp",      color: "teal"   },
  { mcu: "RP2040",     cat: "Audio",       title: "Spectrum analyzer",          sub: "FFT + WS2812B LED matrix display",       color: "purple" },
  { mcu: "ESP32",      cat: "GPS",         title: "Asset tracker",              sub: "NEO-M8N + SIM800L cellular backup",      color: "green"  },
  { mcu: "AVR",        cat: "Agriculture", title: "Soil moisture logger",       sub: "Capacitive sensor + LoRa telemetry",     color: "lime"   },
  { mcu: "STM32F4",    cat: "Robotics",    title: "Drone flight controller",    sub: "MPU-6050 + PID loop + PWM ESCs",        color: "sky"    },
  { mcu: "ESP32",      cat: "Air Quality", title: "Air quality monitor",        sub: "MQ-135 + BME680 + OLED dashboard",       color: "emerald"},
  { mcu: "nRF52",      cat: "Sensor Node", title: "Wireless sensor node",       sub: "BLE mesh + deep sleep + coin cell",      color: "indigo" },
  { mcu: "STM32",      cat: "Industrial",  title: "RTD temperature controller", sub: "MAX31865 PT100 + PID + relay output",    color: "red"    },
  { mcu: "RP2040",     cat: "Test & Meas", title: "USB oscilloscope",           sub: "1 Msps ADC + WebUSB waveform viewer",    color: "yellow" },
  { mcu: "ESP32",      cat: "Energy",      title: "Energy monitor",             sub: "CT sensor + MQTT + Home Assistant",      color: "cyan"   },
  { mcu: "STM32",      cat: "Robotics",    title: "6-DOF robot arm",            sub: "Servo PID + UART joystick + IK solver",  color: "blue"   },
  { mcu: "ESP32",      cat: "Garden",      title: "Auto plant watering",        sub: "Soil sensor + relay + NTP schedule",     color: "green"  },
  { mcu: "ESP32-S3",   cat: "Audio",       title: "Voice recorder",             sub: "I2S MEMS mic + SD card + VAD engine",    color: "violet" },
  { mcu: "nRF52",      cat: "Sports",      title: "Cycling power meter",        sub: "Strain gauge + BLE ANT+ power profile",  color: "orange" },
  { mcu: "STM32F407",  cat: "CNC",         title: "3-axis CNC controller",      sub: "Stepper drivers + limit switches + G-code", color: "teal"},
  { mcu: "RP2040",     cat: "Music",       title: "USB MIDI controller",        sub: "16-pad matrix + USB MIDI + DAW sync",    color: "purple" },
  { mcu: "STM32",      cat: "Medical",     title: "ECG monitor",                sub: "ADS1292R + 60Hz notch filter + BLE",     color: "rose"   },
  { mcu: "RP2040",     cat: "LED",         title: "LED matrix wall",            sub: "WS2812B 16×16 + WiFi web control",       color: "amber"  },
  { mcu: "ESP32",      cat: "Environment", title: "CO₂ sensor node",            sub: "SCD40 + e-ink display + BLE export",     color: "sky"    },
  { mcu: "STM32",      cat: "Industrial",  title: "Modbus RTU gateway",         sub: "RS-485 + Ethernet bridge + SCADA",       color: "indigo" },
  { mcu: "nRF52840",   cat: "Access",      title: "BLE smart lock",             sub: "RFID + servo actuator + tamper alert",   color: "emerald"},
  { mcu: "ESP32",      cat: "Balloon",     title: "Weather balloon payload",    sub: "BME280 + GPS + LoRa ground station",     color: "lime"   },
  { mcu: "AVR",        cat: "Solar",       title: "MPPT solar charger",         sub: "Buck converter + INA219 + UART log",     color: "yellow" },
  { mcu: "STM32",      cat: "BMS",         title: "Battery management system",  sub: "BQ76920 + coulomb counter + CAN BMS",    color: "red"    },
];

// Tailwind color map — must be complete strings (no dynamic construction)
const COLOR_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  blue:    { badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",    border: "hover:border-blue-500/40",   glow: "hover:shadow-blue-500/10"   },
  cyan:    { badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",    border: "hover:border-cyan-500/40",   glow: "hover:shadow-cyan-500/10"   },
  violet:  { badge: "bg-violet-500/15 text-violet-400 border-violet-500/25", border: "hover:border-violet-500/40", glow: "hover:shadow-violet-500/10" },
  purple:  { badge: "bg-purple-500/15 text-purple-400 border-purple-500/25", border: "hover:border-purple-500/40", glow: "hover:shadow-purple-500/10" },
  rose:    { badge: "bg-rose-500/15 text-rose-400 border-rose-500/25",    border: "hover:border-rose-500/40",   glow: "hover:shadow-rose-500/10"   },
  orange:  { badge: "bg-orange-500/15 text-orange-400 border-orange-500/25", border: "hover:border-orange-500/40", glow: "hover:shadow-orange-500/10" },
  amber:   { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25", border: "hover:border-amber-500/40", glow: "hover:shadow-amber-500/10"  },
  teal:    { badge: "bg-teal-500/15 text-teal-400 border-teal-500/25",    border: "hover:border-teal-500/40",   glow: "hover:shadow-teal-500/10"   },
  green:   { badge: "bg-green-500/15 text-green-400 border-green-500/25", border: "hover:border-green-500/40", glow: "hover:shadow-green-500/10"  },
  lime:    { badge: "bg-lime-500/15 text-lime-400 border-lime-500/25",    border: "hover:border-lime-500/40",   glow: "hover:shadow-lime-500/10"   },
  emerald: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", border: "hover:border-emerald-500/40", glow: "hover:shadow-emerald-500/10" },
  sky:     { badge: "bg-sky-500/15 text-sky-400 border-sky-500/25",       border: "hover:border-sky-500/40",    glow: "hover:shadow-sky-500/10"    },
  indigo:  { badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25", border: "hover:border-indigo-500/40", glow: "hover:shadow-indigo-500/10" },
  red:     { badge: "bg-red-500/15 text-red-400 border-red-500/25",       border: "hover:border-red-500/40",    glow: "hover:shadow-red-500/10"    },
  yellow:  { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", border: "hover:border-yellow-500/40", glow: "hover:shadow-yellow-500/10" },
};

function IdeaCard({ idea }: { idea: Idea }) {
  const c = COLOR_STYLES[idea.color] ?? COLOR_STYLES.blue;
  return (
    <Link
      href="/dashboard/generate"
      className={`group relative flex-none w-[268px] rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 transition-all duration-300 hover:bg-white/[0.05] hover:shadow-xl ${c.border} ${c.glow}`}
    >
      {/* Top row: MCU + category */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.badge}`}>
          {idea.mcu}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">{idea.cat}</span>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold text-white leading-snug mb-1.5">
        {idea.title}
      </div>

      {/* Subtitle */}
      <div className="text-[11px] text-gray-500 leading-snug">
        {idea.sub}
      </div>

      {/* Build hint on hover */}
      <div className="absolute bottom-3.5 right-4 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400">
        Build this →
      </div>
    </Link>
  );
}

// ── Main ticker ───────────────────────────────────────────────────────────────

export default function IdeaTicker() {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    // Pick 10 random ideas — runs client-side only so every tab is unique
    const pool = [...IDEA_POOL];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setIdeas(pool.slice(0, 10));
  }, []);

  if (ideas.length === 0) {
    // SSR / pre-hydration: reserve the space so no layout shift
    return <div className="mt-16 h-[120px]" />;
  }

  // Duplicate for seamless loop: translate -50% = one full set
  const track = [...ideas, ...ideas];

  return (
    <div className="relative mt-16 w-screen left-1/2 -translate-x-1/2">
      {/* Left fade */}
      <div className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-r from-[#060610] to-transparent" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none bg-gradient-to-l from-[#060610] to-transparent" />

      {/* Scrolling track — pause on hover */}
      <div className="overflow-hidden py-2">
        <div
          className="flex gap-4 w-max animate-ticker hover:[animation-play-state:paused]"
        >
          {track.map((idea, i) => (
            <IdeaCard key={i} idea={idea} />
          ))}
        </div>
      </div>

      {/* Label below */}
      <p className="text-center text-xs text-gray-600 font-mono mt-4 tracking-wider">
        Click any idea to start building it
      </p>
    </div>
  );
}
