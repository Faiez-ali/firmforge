import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            Firm<span className="text-brand-400">Forge</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">
            beta
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#showcase" className="hover:text-white transition-colors">Showcase</Link>
          <Link
            href="/dashboard/generate"
            className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
          >
            Start building
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32 max-w-7xl mx-auto text-center bg-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          AI-powered firmware generation is here
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Firmware projects,
          <br />
          <span className="text-brand-400">assembled in minutes.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Describe what your embedded device does. FirmForge searches the open-source
          ecosystem, selects the best drivers, and assembles a complete layered codebase
          — from drivers to application layer.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/dashboard/generate"
            className="px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-lg transition-all hover:scale-105"
          >
            Generate your project →
          </Link>
          <Link
            href="#showcase"
            className="px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg transition-colors border border-white/10"
          >
            See examples
          </Link>
        </div>

        {/* Supported MCUs */}
        <div className="mt-16 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">Supports</span>
          {["STM32", "ESP32", "RP2040", "nRF52", "AVR", "SAME5x"].map((mcu) => (
            <span
              key={mcu}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 font-mono"
            >
              {mcu}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">How FirmForge works</h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Six AI agents run in sequence after you approve your Bill of Materials.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Describe your project",
              desc: "Tell FirmForge what your device does in plain language. The intake agent asks targeted questions until it has a complete picture.",
              color: "text-brand-400",
            },
            {
              step: "02",
              title: "Approve your BOM",
              desc: "Review a Bill of Materials with live prices from LCSC and Mouser. Swap components, approve, and generation begins.",
              color: "text-purple-400",
            },
            {
              step: "03",
              title: "Open-source discovery",
              desc: "FirmForge searches GitHub, PlatformIO, Arduino, and ESP-IDF for the best available drivers per component.",
              color: "text-cyan-400",
            },
            {
              step: "04",
              title: "Library evaluation",
              desc: "Each candidate is scored on stars, recency, license, and MCU compatibility. Only the best makes it in.",
              color: "text-teal-400",
            },
            {
              step: "05",
              title: "Codebase assembly",
              desc: "Drivers, HAL, middleware, and application layers assembled into a structured project. Claude fills any gaps.",
              color: "text-green-400",
            },
            {
              step: "06",
              title: "Download & go",
              desc: "Browse the generated files in-browser. Download as zip or push directly to a GitHub repo (Pro).",
              color: "text-amber-400",
            },
          ].map((f) => (
            <div
              key={f.step}
              className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className={`font-mono text-sm mb-3 ${f.color}`}>{f.step}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-gray-400 text-center mb-16">Start free. Upgrade when you need more.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                per: "",
                features: [
                  "3 generations / month",
                  "STM32 + ESP32",
                  "Bare-metal only",
                  "Zip download",
                ],
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
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border ${
                  plan.highlight
                    ? "border-brand-500/50 bg-brand-500/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs text-brand-400 font-mono mb-3 uppercase tracking-wider">
                    Most popular
                  </div>
                )}
                <div className="font-semibold text-lg mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.per}</span>
                </div>
                <div className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400 text-xs">✓</span>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-xs">—</span>
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/generate"
                  className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-brand-500 hover:bg-brand-400 text-white"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span>
            Firm<span className="text-brand-400">Forge</span> © 2026
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="https://github.com/Faiez-ali/firmforge" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
