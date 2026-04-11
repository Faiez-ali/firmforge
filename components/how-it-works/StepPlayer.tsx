"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEP_DURATION = 5200; // ms per step before auto-advance

// ── Individual scene components ───────────────────────────────────────────────

function IntakeScene({ active }: { active: boolean }) {
  const messages = [
    { role: "user", text: "I want to build a weather station with a display." },
    { role: "ai",   text: "Great. What MCU are you targeting?" },
    { role: "user", text: "STM32F407 — I have a dev board already." },
    { role: "ai",   text: "Which sensors do you need?" },
    { role: "user", text: "BME280 for temp/humidity, SSD1306 OLED display." },
    { role: "ai",   text: "Spec locked ✓  Generating BOM..." },
  ];
  // Spec fields that fill in as conversation progresses
  const specFields = [
    { label: "Project type",  value: "IoT Device",          appearsAt: 0 },
    { label: "MCU",           value: "STM32F407",           appearsAt: 2 },
    { label: "Dev board",     value: "Nucleo-F407ZG",       appearsAt: 2 },
    { label: "Build system",  value: "CMake",               appearsAt: 2 },
    { label: "Sensor",        value: "BME280 (I²C)",        appearsAt: 4 },
    { label: "Display",       value: "SSD1306 OLED (SPI)",  appearsAt: 4 },
    { label: "RTOS",          value: "Bare-metal",          appearsAt: 5 },
    { label: "Status",        value: "✓ Spec locked",       appearsAt: 5 },
  ];
  // count how many messages have appeared
  const msgCount = messages.length;
  return (
    <div className="flex gap-0 h-full w-full">
      {/* Left: chat */}
      <div className="flex-1 flex flex-col gap-3 p-8 justify-center overflow-hidden">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">AI Intake Agent</div>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6, x: msg.role === "user" ? 12 : -12 }}
            animate={active ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 6 }}
            transition={{ delay: active ? i * 0.42 : 0, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[88%] ${
              msg.role === "user"
                ? "bg-blue-600/80 text-white rounded-tr-sm"
                : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
            }`}>
              {msg.role === "ai" && (
                <span className="text-blue-400 font-mono text-[10px] block mb-0.5 uppercase tracking-wider">FirmForge AI</span>
              )}
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-white/5 self-stretch my-6" />

      {/* Right: live spec panel */}
      <div className="w-72 shrink-0 flex flex-col p-8 justify-center gap-3">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">Project Spec</div>
        {specFields.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: 10 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
            transition={{ delay: active ? f.appearsAt * 0.42 + 0.2 : 0, duration: 0.35 }}
            className="flex items-start justify-between gap-2"
          >
            <span className="text-[11px] text-gray-600 font-mono shrink-0">{f.label}</span>
            <span className={`text-[11px] font-mono text-right ${f.label === "Status" ? "text-green-400" : "text-gray-300"}`}>
              {f.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BOMScene({ active }: { active: boolean }) {
  const items = [
    { name: "STM32F407VGT6",           cat: "MCU",       price: "$8.50",  lcsc: "C8734",   note: "512KB Flash · 192KB SRAM" },
    { name: "BME280",                  cat: "Sensor",    price: "$3.20",  lcsc: "C92489",  note: "Temp · Humidity · Pressure" },
    { name: "SSD1306 OLED 128×64",     cat: "Display",   price: "$2.40",  lcsc: "C178850", note: "I²C · 3.3V" },
    { name: "Decoupling caps / pulls", cat: "Passive",   price: "$1.20",  lcsc: "—",       note: "100nF × 6 · 10kΩ × 4" },
  ];
  return (
    <div className="flex gap-0 h-full w-full">
      {/* Left: BOM table */}
      <div className="flex-1 flex flex-col p-8 justify-center">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4">Bill of Materials</div>
        <div className="rounded-xl border border-white/10 overflow-hidden mb-5">
          <div className="grid grid-cols-4 text-[10px] font-mono text-gray-500 px-5 py-2.5 border-b border-white/5 bg-white/[0.02] uppercase tracking-wider">
            <span>Component</span><span>Category</span><span>LCSC #</span><span className="text-right">Unit price</span>
          </div>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
              transition={{ delay: active ? 0.15 + i * 0.32 : 0, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-4 px-5 py-3 border-b border-white/5 hover:bg-white/[0.02]"
            >
              <div>
                <div className="text-gray-200 text-xs font-medium">{item.name}</div>
                <div className="text-gray-600 text-[10px] font-mono mt-0.5">{item.note}</div>
              </div>
              <span className="text-gray-500 text-xs font-mono self-center">{item.cat}</span>
              <span className="text-blue-400/70 text-xs font-mono self-center">{item.lcsc}</span>
              <span className="text-cyan-400 text-right font-mono text-xs self-center">{item.price}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: active ? 1.6 : 0, duration: 0.4 }}
            className="flex justify-between px-5 py-3 bg-white/[0.02]"
          >
            <span className="text-gray-400 text-sm">Total estimate</span>
            <span className="text-white font-bold font-mono">$15.30</span>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0 }}
          transition={{ delay: active ? 2.0 : 0, duration: 0.4 }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm text-center cursor-default select-none"
        >
          Approve BOM &amp; Generate →
        </motion.div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/5 self-stretch my-6" />

      {/* Right: sourcing summary */}
      <div className="w-64 shrink-0 flex flex-col p-8 justify-center gap-5">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Sourcing</div>
        {[
          { store: "LCSC",   items: 3, savings: "43% off MSRP", color: "text-blue-400"  },
          { store: "Mouser", items: 1, savings: "In-stock",      color: "text-cyan-400"  },
        ].map((s, i) => (
          <motion.div
            key={s.store}
            initial={{ opacity: 0, x: 12 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: active ? 1.8 + i * 0.3 : 0, duration: 0.4 }}
            className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3"
          >
            <div className={`text-sm font-bold font-mono mb-0.5 ${s.color}`}>{s.store}</div>
            <div className="text-xs text-gray-500">{s.items} parts · {s.savings}</div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: active ? 2.4 : 0 }}
          className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3"
        >
          <div className="text-xs font-mono text-green-400 mb-0.5">All in stock</div>
          <div className="text-[11px] text-gray-500">Ships in 3–5 days</div>
        </motion.div>
      </div>
    </div>
  );
}

function DiscoverScene({ active }: { active: boolean }) {
  const repos = [
    { name: "BoschSensortec/BME280_driver", stars: "990",  license: "BSD-3-Clause", tag: "BME280",  score: 96 },
    { name: "adafruit/Adafruit_SSD1306",    stars: "1.8k", license: "BSD-2-Clause", tag: "SSD1306", score: 89 },
    { name: "FreeRTOS/FreeRTOS-Kernel",     stars: "4.1k", license: "MIT",          tag: "RTOS",    score: 97 },
  ];
  return (
    <div className="flex gap-0 h-full w-full">
      {/* Left: search log */}
      <div className="w-56 shrink-0 flex flex-col p-8 justify-center gap-3 border-r border-white/5">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">Sources</div>
        {[
          { name: "GitHub",     status: "searching", delay: 0.1,  color: "text-blue-400"  },
          { name: "PlatformIO", status: "searching", delay: 0.5,  color: "text-violet-400"},
          { name: "ESP-IDF",    status: "searching", delay: 0.9,  color: "text-cyan-400"  },
          { name: "Zephyr",     status: "searching", delay: 1.3,  color: "text-teal-400"  },
          { name: "Curated DB", status: "match",     delay: 1.6,  color: "text-green-400" },
        ].map((src) => (
          <motion.div
            key={src.name}
            initial={{ opacity: 0, x: -8 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: active ? src.delay : 0, duration: 0.3 }}
            className="flex items-center justify-between"
          >
            <span className={`text-xs font-mono ${src.color}`}>{src.name}</span>
            <span className="text-[10px] text-gray-600 font-mono">
              {src.status === "match" ? "✓ match" : "···"}
            </span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: active ? 2.0 : 0 }}
          className="mt-2 text-[10px] font-mono text-green-400"
        >
          14 candidates found
        </motion.div>
      </div>

      {/* Right: repo cards in 2-column grid */}
      <div className="flex-1 p-8 flex flex-col justify-center gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="font-mono text-xs text-gray-500 flex items-center gap-2 mb-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Fetching metadata · checking license compatibility...
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          {repos.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
              transition={{ delay: active ? 0.45 + i * 0.38 : 0, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="text-blue-400 text-xs font-mono truncate mb-2">{r.name}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-mono">{r.license}</span>
                  <span className="text-[10px] text-gray-500">/{r.tag}</span>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-[11px] font-mono">⭐ {r.stars}</div>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Placeholder 4th card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
            transition={{ delay: active ? 0.45 + 3 * 0.38 : 0, duration: 0.45 }}
            className="rounded-xl border border-dashed border-white/5 bg-transparent px-4 py-3 flex items-center justify-center"
          >
            <span className="text-[11px] text-gray-700 font-mono">+11 more candidates</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function EvaluateScene({ active }: { active: boolean }) {
  const libs = [
    { name: "BoschSensortec/BME280_driver", score: 96, selected: true,  criteria: ["Stars: 990", "License: BSD-3", "MCU: ✓"] },
    { name: "adafruit/Adafruit_BME280",     score: 78, selected: false, criteria: ["Stars: 1.2k", "License: MIT",   "MCU: ✓"] },
    { name: "finitespace/BME280",           score: 59, selected: false, criteria: ["Stars: 310",  "License: MIT",   "MCU: ✓"] },
  ];
  return (
    <div className="flex gap-0 h-full w-full">
      {/* Left: scored library cards */}
      <div className="flex-1 flex flex-col p-8 justify-center gap-4">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Scoring: stars · recency · license · MCU match
        </div>
        {libs.map((lib, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
            transition={{ delay: active ? i * 0.38 : 0, duration: 0.4 }}
            className={`rounded-xl border p-4 ${lib.selected ? "border-green-500/40 bg-green-500/5" : "border-white/5 bg-white/[0.02]"}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-mono text-gray-300 truncate">{lib.name}</span>
              <span className={`text-base font-bold shrink-0 ml-2 ${lib.selected ? "text-green-400" : "text-gray-500"}`}>
                {lib.score}<span className="text-xs font-normal">/100</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2.5">
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: `${lib.score}%` } : { width: 0 }}
                transition={{ delay: active ? i * 0.38 + 0.2 : 0, duration: 0.65, ease: "easeOut" }}
                className={`h-full rounded-full ${lib.selected ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gray-600"}`}
              />
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              {lib.criteria.map((c) => (
                <span key={c} className="text-xs font-mono text-gray-500">{c}</span>
              ))}
              {lib.selected && <span className="text-xs font-mono text-green-400 ml-auto">✓ SELECTED</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-white/5 self-stretch my-6" />

      {/* Right: score breakdown legend */}
      <div className="w-64 shrink-0 flex flex-col p-8 justify-center gap-4">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Score Breakdown</div>
        {[
          { axis: "GitHub stars",    max: 25, val: 25, color: "from-blue-500 to-cyan-400"    },
          { axis: "Last commit",     max: 25, val: 22, color: "from-violet-500 to-purple-400"},
          { axis: "License",         max: 20, val: 20, color: "from-green-500 to-emerald-400"},
          { axis: "MCU match",       max: 20, val: 20, color: "from-cyan-500 to-teal-400"    },
          { axis: "README quality",  max: 10, val: 9,  color: "from-amber-500 to-orange-400" },
        ].map((row, i) => (
          <motion.div
            key={row.axis}
            initial={{ opacity: 0, x: 10 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: active ? 0.3 + i * 0.18 : 0, duration: 0.35 }}
          >
            <div className="flex justify-between mb-1">
              <span className="text-[11px] font-mono text-gray-500">{row.axis}</span>
              <span className="text-[11px] font-mono text-gray-400">{row.val}/{row.max}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={active ? { width: `${(row.val / row.max) * 100}%` } : { width: 0 }}
                transition={{ delay: active ? 0.5 + i * 0.18 : 0, duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AssembleScene({ active }: { active: boolean }) {
  const files = [
    "src/main.c",
    "src/bme280_driver.c",
    "src/ssd1306.c",
    "src/hal_gpio.c",
    "src/hal_spi.c",
    "include/config.h",
    "CMakeLists.txt",
    "README.md",
  ];
  const codeLines = [
    { c: "text-gray-600", t: "// FirmForge — auto-generated" },
    { c: "text-blue-400",  t: '#include "bme280_driver.h"' },
    { c: "text-blue-400",  t: '#include "ssd1306.h"' },
    { c: "text-gray-600", t: "" },
    { c: "text-cyan-400",  t: "int main(void) {" },
    { c: "text-gray-400",  t: "  HAL_Init();" },
    { c: "text-gray-400",  t: "  SystemClock_Config();" },
    { c: "text-gray-400",  t: "  BME280_Init(&hspi1);" },
    { c: "text-gray-400",  t: "  SSD1306_Init(&hi2c1);" },
    { c: "text-green-400", t: "  // Application loop ready" },
  ];
  return (
    <div className="h-full flex gap-0 w-full">
      {/* File tree */}
      <div className="w-52 shrink-0 border-r border-white/5 p-6 pt-8">
        <div className="text-xs text-gray-500 font-mono mb-3 px-1">firmware_stm32f4/</div>
        {files.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: active ? 0.1 + i * 0.22 : 0, duration: 0.3 }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono ${i === 0 ? "bg-blue-500/10 text-blue-400" : "text-gray-500 hover:bg-white/[0.03]"}`}
          >
            <span className={i === 0 ? "text-blue-500 text-[10px]" : "text-gray-700 text-[10px]"}>›</span> {f}
          </motion.div>
        ))}
      </div>
      {/* Code panel */}
      <div className="flex-1 bg-[#07070f] p-6 pt-8 overflow-hidden">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">main.c</span>
          <span className="text-[10px] font-mono text-gray-600">Claude Sonnet · auto-generated</span>
        </div>
        {codeLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: active ? 0.5 + i * 0.19 : 0, duration: 0.22 }}
            className={`font-mono text-[13px] leading-[1.8] ${line.c}`}
          >
            <span className="select-none text-gray-700 text-[10px] mr-4 inline-block w-5 text-right">{i + 1}</span>
            {line.t || "\u00A0"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DeliverScene({ active }: { active: boolean }) {
  return (
    <div className="flex gap-0 h-full w-full">
      {/* Left: delivery card */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="w-32 h-36 rounded-2xl bg-gradient-to-b from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex flex-col items-center justify-center gap-2 shadow-xl shadow-blue-500/10">
            <span className="text-5xl">📦</span>
            <span className="text-xs font-mono text-blue-400">.zip</span>
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ delay: 0.7, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-base text-white shadow-lg shadow-green-500/40"
          >
            ✓
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <div className="text-white font-semibold font-mono text-sm mb-1">firmware_stm32f4_weather.zip</div>
          <div className="text-gray-500 text-xs">47 files · HAL + drivers + application layer</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0 }}
          transition={{ delay: 1.4 }}
          className="flex gap-3 w-full max-w-xs"
        >
          <div className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold text-center cursor-default select-none">
            ↓ Download
          </div>
          <div className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm text-center cursor-default select-none">
            Browse →
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.0 }}
          className="text-green-400 font-mono text-xs flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Pipeline complete in 42s
        </motion.div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/5 self-stretch my-6" />

      {/* Right: layer breakdown */}
      <div className="w-72 shrink-0 flex flex-col p-8 justify-center gap-3">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1">Layer Breakdown</div>
        {[
          { layer: "Application",   files: "main.c · tasks.c",         color: "text-blue-400",   delay: 0.9  },
          { layer: "Middleware",     files: "freertos/ · lwip/",        color: "text-violet-400", delay: 1.1  },
          { layer: "Platform HAL",   files: "hal_gpio.c · clocks.c",   color: "text-cyan-400",   delay: 1.3  },
          { layer: "Drivers",        files: "bme280.c · ssd1306.c",    color: "text-teal-400",   delay: 1.5  },
          { layer: "CMSIS / SDK",    files: "startup_stm32.s · ld",    color: "text-gray-500",   delay: 1.7  },
        ].map((l) => (
          <motion.div
            key={l.layer}
            initial={{ opacity: 0, x: 12 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay: active ? l.delay : 0, duration: 0.35 }}
            className="rounded-lg border border-white/6 bg-white/[0.015] px-3.5 py-2.5"
          >
            <div className={`text-xs font-semibold font-mono mb-0.5 ${l.color}`}>{l.layer}</div>
            <div className="text-[10px] text-gray-600 font-mono">{l.files}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "intake",
    label: "Describe",
    sublabel: "AI intake agent",
    icon: "💬",
    Scene: IntakeScene,
    accent: "blue",
  },
  {
    id: "bom",
    label: "Approve BOM",
    sublabel: "Bill of Materials",
    icon: "📋",
    Scene: BOMScene,
    accent: "violet",
  },
  {
    id: "discover",
    label: "Discovery",
    sublabel: "GitHub + PlatformIO",
    icon: "🔍",
    Scene: DiscoverScene,
    accent: "cyan",
  },
  {
    id: "evaluate",
    label: "Evaluate",
    sublabel: "Score & rank",
    icon: "⚖️",
    Scene: EvaluateScene,
    accent: "teal",
  },
  {
    id: "assemble",
    label: "Assemble",
    sublabel: "Code generation",
    icon: "⚙️",
    Scene: AssembleScene,
    accent: "green",
  },
  {
    id: "deliver",
    label: "Download",
    sublabel: "Zip + file preview",
    icon: "📦",
    Scene: DeliverScene,
    accent: "amber",
  },
] as const;

const ACCENT_COLORS: Record<string, string> = {
  blue:   "border-blue-500/50 text-blue-400 bg-blue-500/10",
  violet: "border-violet-500/50 text-violet-400 bg-violet-500/10",
  cyan:   "border-cyan-500/50 text-cyan-400 bg-cyan-500/10",
  teal:   "border-teal-500/50 text-teal-400 bg-teal-500/10",
  green:  "border-green-500/50 text-green-400 bg-green-500/10",
  amber:  "border-amber-500/50 text-amber-400 bg-amber-500/10",
};

const ACCENT_BAR: Record<string, string> = {
  blue:   "from-blue-500 to-cyan-400",
  violet: "from-violet-500 to-purple-400",
  cyan:   "from-cyan-500 to-teal-400",
  teal:   "from-teal-500 to-cyan-400",
  green:  "from-green-500 to-emerald-400",
  amber:  "from-amber-500 to-orange-400",
};

// ── Main player ───────────────────────────────────────────────────────────────

export default function StepPlayer() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Mirror current into a ref so tick() always reads the live value
  // without needing it in useCallback's dependency array.
  const currentRef = useRef(0);
  currentRef.current = current;

  const step = STEPS[current];

  // ── Auto-play timer via rAF ──────────────────────────────────────────────
  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const elapsed = Date.now() - startTimeRef.current;
    const p = Math.min(elapsed / STEP_DURATION, 1);
    setProgress(p);

    if (p >= 1) {
      if (currentRef.current < STEPS.length - 1) {
        // Advance to next step and keep the loop running
        setCurrent((c) => c + 1);
        setProgress(0);
        startTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Reached the last step — stop
        setPlaying(false);
        startTimeRef.current = null;
      }
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    if (playing) {
      startTimeRef.current = Date.now() - progress * STEP_DURATION;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, tick]);

  // ── Auto-start when scrolled into view ──────────────────────────────────
  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !playing) {
          setPlaying(true);
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (i: number) => {
    setCurrent(i);
    setProgress(0);
    startTimeRef.current = Date.now();
    setPlaying(true);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      if (current === STEPS.length - 1 && progress >= 1) {
        goTo(0);
      } else {
        setPlaying(true);
      }
    }
  };

  const { Scene } = step;

  return (
    <div
      ref={playerRef}
      className="rounded-2xl border border-white/8 bg-[#0b0b18] overflow-hidden shadow-2xl"
    >
      {/* ── Step tabs ── */}
      <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none">
        {STEPS.map((s, i) => {
          const isActive = i === current;
          const isDone   = i < current;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`flex-1 min-w-[96px] flex flex-col items-center gap-1.5 px-4 py-4 text-center transition-all duration-200 border-b-2 ${
                isActive
                  ? `${ACCENT_COLORS[s.accent]} border-current`
                  : isDone
                  ? "text-gray-400 border-transparent bg-white/[0.01] hover:bg-white/[0.03]"
                  : "text-gray-600 border-transparent hover:text-gray-400 hover:bg-white/[0.02]"
              }`}
            >
              <span className="text-xl leading-none">
                {isDone ? "✓" : s.icon}
              </span>
              <span className="text-xs font-semibold leading-none">{s.label}</span>
              <span className="text-[10px] text-gray-600 leading-none hidden md:block">{s.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* ── Scene viewport ── */}
      <div className="relative h-[480px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Scene active={playing || progress > 0} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Controls ── */}
      <div className="border-t border-white/5 px-6 py-4 flex items-center gap-5">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-base transition-all shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Step label */}
        <div className="shrink-0 hidden sm:block">
          <div className="text-sm font-semibold text-white leading-none mb-0.5">{step.label}</div>
          <div className="text-xs text-gray-500 font-mono">{step.sublabel}</div>
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${ACCENT_BAR[step.accent]}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="text-xs text-gray-500 font-mono shrink-0">
          {current + 1} / {STEPS.length}
        </div>

        {/* Prev / Next */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => goTo(Math.max(0, current - 1))}
            disabled={current === 0}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-sm text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ‹
          </button>
          <button
            onClick={() => goTo(Math.min(STEPS.length - 1, current + 1))}
            disabled={current === STEPS.length - 1}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-sm text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
