"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import McuShowcase from "@/components/mcu/McuShowcase";
import CircuitBg from "@/components/hero/CircuitBg";
import StepPlayer from "@/components/how-it-works/StepPlayer";
import IdeaTicker from "@/components/hero/IdeaTicker";
import HwSwAnim from "@/components/cta/HwSwAnim";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    per: "",
    features: ["3 generations / month", "STM32 + ESP32", "Bare-metal only", "Zip download"],
    missing: ["Compile validation", "RTOS support", "GitHub push"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    per: "/mo",
    features: [
      "Unlimited generations",
      "All MCU families",
      "FreeRTOS support",
      "Compile validation",
      "GitHub push",
      "In-browser file preview",
    ],
    missing: [],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    per: "/mo",
    features: [
      "Everything in Pro",
      "REST API access",
      "CI/CD integration",
      "5 team seats",
      "Priority queue",
    ],
    missing: [],
    cta: "Start Team",
    highlight: false,
  },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <main className="min-h-screen bg-[#060610] text-white overflow-x-hidden">

      {/* ── Page-level aurora (below the fold) ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-600/6 blur-[100px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
      </div>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#060610]/80 px-8 lg:px-16 py-4"
      >
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold tracking-tight">
              Firm<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Forge</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              beta
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors hidden md:block">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors hidden md:block">Pricing</Link>
            <Link href="/about" className="hover:text-white transition-colors hidden md:block">About</Link>
            <Link
              href="/auth/login"
              className="hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard/generate"
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              Start building
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-16 pb-24 z-10 overflow-hidden">

        {/* Circuit board background animation */}
        <CircuitBg />

        {/* Radial gradient mask so text stays readable over the circuit */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, #060610 85%)",
          }}
        />

        {/* Subtle blue glow centered on the hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none z-[1]" />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-5xl mx-auto">

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-10 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400" />
            AI-powered firmware generation is here
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            Firmware projects,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              assembled in minutes.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Describe what your embedded device does. FirmForge searches the open-source
            ecosystem, selects the best drivers, and assembles a complete layered codebase —
            from drivers to application layer.
          </motion.p>

          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex items-center justify-center gap-4 flex-wrap mb-16"
          >
            <Link
              href="/dashboard/generate"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-lg transition-all duration-300 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2"
            >
              Generate your project
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg transition-all duration-300 border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
              See how it works
            </Link>
          </motion.div>

        </motion.div>

        {/* Idea ticker — random 10 per tab, seamless scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative z-10 w-full"
        >
          <IdeaTicker />
        </motion.div>
      </section>

      {/* ── How it works — interactive step player ── */}
      <section id="features" className="relative z-10 px-6 py-32 max-w-5xl mx-auto">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            How it works
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
            Six agents. One firmware project.
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-400 max-w-xl mx-auto">
            Watch the pipeline run — each step animates automatically.
            Click any tab to jump, or use the controls below.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <StepPlayer />
        </motion.div>
      </section>

      {/* ── MCU Showcase ── */}
      <section className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
            Hardware support
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
            Pick your chip.
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-400 max-w-xl mx-auto">
            FirmForge knows every quirk of each platform. Select yours and we handle the rest.
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <McuShowcase />
        </motion.div>
      </section>

      {/* ── Stats banner ── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.01] py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "47", label: "Files per project avg." },
            { value: "<60s", label: "Generation time" },
            { value: "6", label: "AI agents in pipeline" },
            { value: "100%", label: "Open-source drivers" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} custom={0} className="text-blue-400 font-mono text-sm mb-3 uppercase tracking-widest">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
              Simple, honest pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-gray-400">
              Start free. Upgrade when you need more.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                  plan.highlight
                    ? "border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-transparent scale-105 shadow-2xl shadow-blue-500/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  </>
                )}
                <div className="font-semibold text-lg mb-1 mt-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.per}</span>
                </div>
                <div className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <span className="w-4 h-4 flex items-center justify-center text-xs shrink-0">—</span>
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/generate"
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="relative z-10 px-8 lg:px-16 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-[#060610] to-violet-500/8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-600/5 to-violet-600/5" />

            <div className="relative flex flex-col lg:flex-row items-center gap-0">

              {/* ── Left: copy + CTA ── */}
              <div className="flex-none lg:w-[42%] px-12 py-16 flex flex-col items-start">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Ready to build your<br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    next firmware project?
                  </span>
                </h2>
                <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                  Join engineers shipping embedded products faster with AI.
                </p>
                <Link
                  href="/dashboard/generate"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-lg transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                >
                  Start for free →
                </Link>
              </div>

              {/* ── Divider ── */}
              <div className="hidden lg:block w-px self-stretch bg-white/5" />

              {/* ── Right: hardware–software animation ── */}
              <div className="flex-1 px-8 py-12 flex flex-col gap-3">
                <p className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">
                  Live signal flow
                </p>
                <div className="w-full h-[190px]">
                  <HwSwAnim />
                </div>
                <p className="text-[11px] text-gray-600 font-mono">
                  Hardware peripherals ↔ STM32 MCU ↔ Layered firmware — generated in seconds.
                </p>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Consultation CTA ── */}
      <section className="relative z-10 px-8 lg:px-16 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 rounded-2xl border border-white/8 bg-white/[0.025] px-10 py-10"
        >
          {/* Left — copy */}
          <div>
            <p className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-2">
              Expert help
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-2">
              Want us to build your<br className="hidden md:block" /> project together?
            </h2>
            <p className="text-gray-400 text-sm max-w-md">
              Book a 1-on-1 session with a firmware engineer. We&apos;ll scope
              your hardware, walk through the generated code, and get your
              device running faster.
            </p>
          </div>

          {/* Right — CTA */}
          <a
            href="mailto:hello@firmforge.dev?subject=Consultation%20Request&body=Hi%2C%20I%27d%20like%20to%20book%20a%20consultation."
            className="flex-none inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap"
          >
            Book a consultation →
          </a>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-8 lg:px-16 py-10">
        <div className="w-full flex items-center justify-between flex-wrap gap-4 text-sm text-gray-500">
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
