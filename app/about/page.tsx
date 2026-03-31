"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};


const LAYERS = [
  { name: "Application layer", desc: "main.c, tasks, state machines", source: "Claude-generated", color: "bg-blue-500/20 text-blue-300" },
  { name: "Middleware layer", desc: "RTOS, protocol stacks, services", source: "Open-source + Claude", color: "bg-violet-500/20 text-violet-300" },
  { name: "Platform / HAL", desc: "BSP, clock, GPIO, peripheral init", source: "Vendor HAL", color: "bg-cyan-500/20 text-cyan-300" },
  { name: "Driver layer", desc: "IC-specific drivers", source: "Open-source repos", color: "bg-teal-500/20 text-teal-300" },
  { name: "CMSIS / Vendor SDK", desc: "Startup, linker scripts", source: "Always vendor-sourced", color: "bg-gray-500/20 text-gray-300" },
];

const MCUS = [
  { name: "STM32", status: "Full support", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { name: "ESP32", status: "Full support", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { name: "RP2040", status: "Experimental", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "nRF52", status: "Experimental", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "AVR", status: "Experimental", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "SAME5x", status: "Experimental", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#060610] text-white overflow-x-hidden">

      {/* Aurora background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px]" />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#060610]/80 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              beta
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/#features" className="hover:text-white transition-colors hidden md:block">Features</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors hidden md:block">Pricing</Link>
            <Link href="/about" className="text-white">About</Link>
            <Link
              href="/dashboard/generate"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-500/20"
            >
              Start building
            </Link>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 space-y-32">

        {/* ── Hero ── */}
        <motion.section initial="hidden" animate="show" className="text-center">
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            About FirmForge
          </motion.p>
          <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Built by an embedded engineer,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              for embedded engineers.
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            FirmForge exists because starting a new firmware project from scratch is painful —
            hunting down drivers, wiring up HALs, and assembling boilerplate before you've written
            a single line of application code. We automate that entire layer.
          </motion.p>
        </motion.section>

        {/* ── What is FirmForge ── */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-6">
            What is FirmForge?
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="space-y-4 text-gray-400 text-lg leading-relaxed">
            <p>
              FirmForge is an AI-powered firmware project architect. You describe your embedded
              device in plain language — the MCU, the peripherals, what the device needs to do —
              and FirmForge does the rest.
            </p>
            <p>
              Six AI agents run in sequence: intake, discovery, evaluation, assembly, compile
              validation, and delivery. Each agent has a specific job. Together they produce a
              complete, layered, production-ready firmware project in under 60 seconds.
            </p>
            <p>
              The generated code is not boilerplate. It&apos;s assembled from real open-source libraries
              matched to your exact hardware, with Claude filling in any gaps and writing the
              application layer to match your spec.
            </p>
          </motion.div>
        </motion.section>

        {/* ── The why ── */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }}
          className="relative rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest relative">
            The why
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold mb-6 relative">
            The problem we&apos;re solving
          </motion.h2>
          <motion.div variants={fadeUp} custom={2} className="space-y-4 text-gray-400 leading-relaxed relative">
            <p>
              The average firmware project wastes 2–4 hours before any real work begins.
              Finding a driver for your sensor, checking if it works with your MCU family,
              reading the HAL docs, wiring up the initialization sequence — it&apos;s all known
              work that shouldn&apos;t require your attention.
            </p>
            <p>
              For solo founders and small hardware teams shipping products on tight timelines,
              that overhead is a serious problem. FirmForge eliminates it.
            </p>
            <p className="text-white font-medium">
              Describe once. Get a complete project. Ship faster.
            </p>
          </motion.div>
        </motion.section>

        {/* ── Code architecture ── */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            Architecture
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold mb-3">
            Layered code architecture
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-400 mb-10">
            Every generated project follows a standard bottom-to-top firmware stack.
          </motion.p>
          <div className="space-y-2">
            {LAYERS.map((layer, i) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
              >
                <div className={`px-3 py-1 rounded-lg text-xs font-mono font-medium ${layer.color} shrink-0 min-w-[140px] text-center`}>
                  {layer.name}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-300">{layer.desc}</span>
                </div>
                <div className="text-xs text-gray-600 font-mono shrink-0 hidden sm:block">
                  {layer.source}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── MCU support ── */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            Hardware support
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold mb-3">
            MCU families
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-400 mb-10">
            Launch support for the most popular embedded platforms. More coming in v1.1.
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MCUS.map((mcu, i) => (
              <motion.div
                key={mcu.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`p-4 rounded-xl border font-mono text-center ${mcu.color}`}
              >
                <div className="text-xl font-bold mb-1">{mcu.name}</div>
                <div className="text-xs opacity-70">{mcu.status}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Founder ── */}
        <motion.section
          initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            variants={fadeUp} custom={0}
            className="inline-block w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6 shadow-lg shadow-blue-500/25 text-3xl flex items-center justify-center"
          >
            <span className="text-3xl">⚡</span>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            Founder
          </motion.p>
          <motion.h2 variants={fadeUp} custom={2} className="text-3xl font-bold mb-4">Faiez Ali</motion.h2>
          <motion.p variants={fadeUp} custom={3} className="text-gray-400 leading-relaxed max-w-xl mx-auto">
            Embedded firmware engineer and sole founder of FirmForge. Built this after spending
            too many hours on driver wiring and project scaffolding that should have been
            automated years ago.
          </motion.p>
        </motion.section>

        {/* ── CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-violet-500/5 p-16 overflow-hidden">
            <h2 className="text-4xl font-bold mb-4">
              Try FirmForge
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              3 free generations a month. No credit card required.
            </p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-lg transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              Start for free →
            </Link>
          </div>
        </motion.section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 mt-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500">
          <span>
            Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold">Forge</span> © 2026
          </span>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="https://github.com/Faiez-ali/firmforge" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
