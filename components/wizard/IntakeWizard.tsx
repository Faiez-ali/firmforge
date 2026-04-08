"use client";

import { useState, useRef, useEffect } from "react";
import type { ProjectSpec, MCUFamily, BuildSystem, RTOSType, Interface } from "@/types";

const MCU_OPTIONS: { value: MCUFamily; label: string; badge: string }[] = [
  { value: "STM32",    label: "STM32",          badge: "Professional"  },
  { value: "ESP32",    label: "ESP32",           badge: "WiFi / BLE"   },
  { value: "RP2040",   label: "Pico / RP2040",  badge: "RPi Pico"     },
  { value: "RP2350",   label: "Pico 2 / RP2350",badge: "RPi Pico 2"   },
  { value: "nRF52",    label: "nRF52",           badge: "BLE"          },
  { value: "AVR",      label: "AVR / Arduino",  badge: "Uno · Mega"   },
  { value: "SAME5x",   label: "SAME5x",          badge: "Industrial"   },
  { value: "RPiLinux", label: "Raspberry Pi",    badge: "Linux GPIO"   },
  { value: "custom",   label: "Suggest for me",  badge: "AI picks"     },
];

// MCUs that support Arduino IDE as a build system
const ARDUINO_COMPATIBLE: MCUFamily[] = ["AVR", "ESP32", "RP2040", "RP2350", "STM32"];

// MCUs that run Linux — no vendor SDK, no RTOS, CMake only
const LINUX_MCUS: MCUFamily[] = ["RPiLinux"];

const INTERFACE_OPTIONS: { value: Interface; label: string }[] = [
  { value: "uart", label: "UART" },
  { value: "spi", label: "SPI" },
  { value: "i2c", label: "I2C" },
  { value: "can", label: "CAN" },
  { value: "usb", label: "USB" },
  { value: "ble", label: "BLE" },
  { value: "wifi", label: "WiFi" },
  { value: "adc", label: "ADC" },
  { value: "pwm", label: "PWM" },
  { value: "gpio", label: "GPIO" },
];

const RTOS_OPTIONS: { value: RTOSType; label: string; desc: string }[] = [
  { value: "none", label: "Bare-metal", desc: "Super-loop, no RTOS" },
  { value: "freertos", label: "FreeRTOS", desc: "Most popular embedded RTOS" },
  { value: "zephyr", label: "Zephyr", desc: "Modern, feature-rich (v1.1)" },
];

const BUILD_OPTIONS: { value: BuildSystem; label: string }[] = [
  { value: "cmake", label: "CMake" },
  { value: "platformio", label: "PlatformIO" },
  { value: "arduino", label: "Arduino IDE" },
  { value: "espidf", label: "ESP-IDF" },
];

type Step = "describe" | "hardware" | "firmware" | "scope";

interface Props {
  initialSpec: Partial<ProjectSpec>;
  onComplete: (spec: ProjectSpec) => void;
}

export default function IntakeWizard({ initialSpec, onComplete }: Props) {
  const [step, setStep] = useState<Step>("describe");
  const [spec, setSpec] = useState<Partial<ProjectSpec>>(initialSpec);
  const [componentInput, setComponentInput] = useState("");
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  function update<K extends keyof ProjectSpec>(key: K, value: ProjectSpec[K]) {
    setSpec((prev) => {
      const next = { ...prev, [key]: value };
      // When MCU changes, enforce build system + RTOS compatibility
      if (key === "mcu") {
        const mcu = value as MCUFamily;
        if (LINUX_MCUS.includes(mcu)) {
          next.buildSystem = "cmake";
          next.rtos = "none";
        } else if (!ARDUINO_COMPATIBLE.includes(mcu) && next.buildSystem === "arduino") {
          next.buildSystem = "cmake";
        }
      }
      // When Arduino IDE selected, lock RTOS to none
      if (key === "buildSystem" && value === "arduino") {
        next.rtos = "none";
      }
      return next;
    });
  }

  function toggleInterface(iface: Interface) {
    const current = spec.interfaces ?? [];
    const updated = current.includes(iface)
      ? current.filter((i) => i !== iface)
      : [...current, iface];
    update("interfaces", updated);
  }

  function addComponent() {
    if (!componentInput.trim()) return;
    const parts = componentInput.split(" - ");
    const newComponent = {
      name: parts[0].trim(),
      description: parts[1]?.trim() ?? "",
      interface: "spi" as Interface,
      quantity: 1,
    };
    update("components", [...(spec.components ?? []), newComponent]);
    setComponentInput("");
  }

  function removeComponent(index: number) {
    update("components", (spec.components ?? []).filter((_, i) => i !== index));
  }

  async function getAIHint() {
    if (!spec.description) return;
    setLoadingHint(true);
    try {
      const res = await fetch("/api/agents/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: spec.description, step }),
      });
      const data = await res.json();
      setAiHint(data.hint);
    } catch {
      setAiHint(null);
    } finally {
      setLoadingHint(false);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case "describe": return !!spec.description?.trim() && spec.description.length > 10;
      case "hardware": return !!spec.mcu && (spec.interfaces?.length ?? 0) > 0;
      case "firmware": return spec.rtos !== undefined && !!spec.buildSystem;
      case "scope": return spec.outputScope !== undefined;
      default: return false;
    }
  }

  function proceed() {
    const order: Step[] = ["describe", "hardware", "firmware", "scope"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      setStep(order[idx + 1]);
    } else {
      // Complete — build final spec
      const final: ProjectSpec = {
        description: spec.description!,
        projectType: spec.projectType ?? "prototype",
        hasExistingHardware: spec.hasExistingHardware ?? false,
        mcu: spec.mcu ?? "ESP32",
        mcuModel: spec.mcuModel,
        devBoard: spec.devBoard,
        components: spec.components ?? [],
        interfaces: spec.interfaces ?? [],
        rtos: spec.rtos ?? "none",
        hasRealTimeConstraints: spec.hasRealTimeConstraints ?? false,
        hasPowerConstraints: spec.hasPowerConstraints ?? false,
        buildSystem: spec.buildSystem ?? "cmake",
        outputScope: spec.outputScope ?? "full_app",
        pushToGitHub: spec.pushToGitHub ?? false,
      };
      onComplete(final);
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: "describe", label: "Project" },
    { key: "hardware", label: "Hardware" },
    { key: "firmware", label: "Firmware" },
    { key: "scope", label: "Output" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step pills */}
      <div className="flex items-center gap-2 mb-10 justify-center">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => i <= stepIndex && setStep(s.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                i === stepIndex
                  ? "bg-brand-500 text-white"
                  : i < stepIndex
                  ? "bg-green-500/10 text-green-400 cursor-pointer hover:bg-green-500/20"
                  : "bg-white/5 text-gray-600 cursor-default"
              }`}
            >
              {i < stepIndex ? "✓ " : ""}{s.label}
            </button>
            {i < steps.length - 1 && <span className="text-gray-700">→</span>}
          </div>
        ))}
      </div>

      {/* Step: Describe */}
      {step === "describe" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold mb-2">What does your device do?</h2>
            <p className="text-gray-400 text-sm">
              Describe the end behaviour in plain language — not components, just what it achieves.
            </p>
          </div>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand-500/50 text-sm leading-relaxed"
            rows={4}
            placeholder="e.g. Read temperature and humidity every 30 seconds and send the data over WiFi to an MQTT broker. Alert via buzzer if temperature exceeds 40°C."
            value={spec.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "product", label: "Building a product" },
              { value: "prototype", label: "Rapid prototype" },
              { value: "learning", label: "Learning / university" },
              { value: "client", label: "Client project" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("projectType", opt.value as ProjectSpec["projectType"])}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  spec.projectType === opt.value
                    ? "border-brand-500/50 bg-brand-500/10 text-white"
                    : "border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {spec.description && spec.description.length > 15 && (
            <button
              onClick={getAIHint}
              disabled={loadingHint}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition-colors"
            >
              {loadingHint ? "Thinking..." : "✦ Ask AI for suggestions"}
            </button>
          )}

          {aiHint && (
            <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-sm text-gray-300">
              <span className="text-brand-400 font-mono text-xs">AI HINT </span>
              {aiHint}
            </div>
          )}
        </div>
      )}

      {/* Step: Hardware */}
      {step === "hardware" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hardware selection</h2>
            <p className="text-gray-400 text-sm">
              Select your MCU family and tell FirmForge what components you're using.
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-3 block">MCU family</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MCU_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update("mcu", opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    spec.mcu === opt.value
                      ? "border-brand-500/50 bg-brand-500/10"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10"
                  }`}
                >
                  <div className="font-mono font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.badge}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-3 block">Interfaces in use</label>
            <div className="flex flex-wrap gap-2">
              {INTERFACE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleInterface(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-mono transition-all ${
                    spec.interfaces?.includes(opt.value)
                      ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                      : "border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              External components / ICs
              <span className="text-gray-600 ml-2">(format: NAME - description)</span>
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 font-mono"
                placeholder="e.g. MPU-6050 - 6-axis IMU"
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComponent()}
              />
              <button
                onClick={addComponent}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
              >
                Add
              </button>
            </div>
            {(spec.components ?? []).length > 0 && (
              <div className="mt-3 space-y-1">
                {spec.components?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-sm">
                    <span className="font-mono text-brand-300">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.description}</span>
                    <button onClick={() => removeComponent(i)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Firmware */}
      {step === "firmware" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold mb-2">Firmware configuration</h2>
            <p className="text-gray-400 text-sm">RTOS, real-time needs, and build system.</p>
          </div>

          {/* RPiLinux banner — no vendor SDK, Linux handles scheduling */}
          {LINUX_MCUS.includes(spec.mcu as MCUFamily) && (
            <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs text-cyan-300">
              Raspberry Pi runs Linux — no bare-metal RTOS or vendor SDK needed.
              FirmForge generates C/C++ with <span className="font-mono">libgpiod</span> / <span className="font-mono">pigpio</span> and a CMake project.
            </div>
          )}

          {/* RTOS — hidden for Linux, locked to "none" for Arduino IDE */}
          {!LINUX_MCUS.includes(spec.mcu as MCUFamily) && (
            <div>
              <label className="text-sm text-gray-400 mb-3 block">RTOS</label>
              {spec.buildSystem === "arduino" && (
                <p className="text-xs text-amber-400/80 mb-2">
                  Arduino IDE uses its own <span className="font-mono">setup()</span> / <span className="font-mono">loop()</span> — RTOS is not applicable.
                </p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {RTOS_OPTIONS.map((opt) => {
                  const lockedByArduino = spec.buildSystem === "arduino" && opt.value !== "none";
                  const isZephyr = opt.value === "zephyr";
                  const disabled = lockedByArduino || isZephyr;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => !disabled && update("rtos", opt.value)}
                      disabled={disabled}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        spec.rtos === opt.value
                          ? "border-brand-500/50 bg-brand-500/10"
                          : disabled
                          ? "border-white/5 opacity-40 cursor-not-allowed"
                          : "border-white/5 bg-white/[0.02] hover:border-white/10"
                      }`}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {isZephyr ? "v1.1" : lockedByArduino ? "n/a with Arduino" : opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-3 block">Build system</label>
            {spec.mcu && !ARDUINO_COMPATIBLE.includes(spec.mcu as MCUFamily) && spec.buildSystem === "arduino" && (
              <p className="text-xs text-amber-400/80 mb-2">
                Arduino IDE is not supported for {spec.mcu} — switching to CMake.
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              {BUILD_OPTIONS.map((opt) => {
                // Arduino IDE only available for compatible MCUs
                const arduinoLocked =
                  opt.value === "arduino" &&
                  spec.mcu &&
                  !ARDUINO_COMPATIBLE.includes(spec.mcu as MCUFamily);
                // RPiLinux: only CMake makes sense
                const linuxLocked =
                  LINUX_MCUS.includes(spec.mcu as MCUFamily) &&
                  opt.value !== "cmake";
                const disabled = arduinoLocked || linuxLocked;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && update("buildSystem", opt.value)}
                    disabled={!!disabled}
                    className={`px-4 py-2 rounded-lg border text-sm font-mono transition-all ${
                      spec.buildSystem === opt.value
                        ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                        : disabled
                        ? "border-white/5 text-gray-700 cursor-not-allowed opacity-40"
                        : "border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <div className="text-sm font-medium">Hard real-time constraints?</div>
              <div className="text-xs text-gray-500 mt-0.5">Motor control, audio, high-freq sampling</div>
            </div>
            <button
              onClick={() => update("hasRealTimeConstraints", !spec.hasRealTimeConstraints)}
              className={`w-12 h-6 rounded-full transition-colors ${spec.hasRealTimeConstraints ? "bg-brand-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${spec.hasRealTimeConstraints ? "translate-x-6" : ""}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <div className="text-sm font-medium">Power / battery constraints?</div>
              <div className="text-xs text-gray-500 mt-0.5">Sleep modes, low-power targets</div>
            </div>
            <button
              onClick={() => update("hasPowerConstraints", !spec.hasPowerConstraints)}
              className={`w-12 h-6 rounded-full transition-colors ${spec.hasPowerConstraints ? "bg-brand-500" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${spec.hasPowerConstraints ? "translate-x-6" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Scope */}
      {step === "scope" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold mb-2">Output scope</h2>
            <p className="text-gray-400 text-sm">How complete should the generated project be?</p>
          </div>

          <div className="space-y-3">
            {[
              { value: "full_app", label: "Full working application", desc: "Drivers + HAL + application logic — ready to flash and test" },
              { value: "drivers_hal_stub", label: "Drivers + HAL + empty app stub", desc: "Full lower layers, empty main.c for you to fill in" },
              { value: "drivers_only", label: "Drivers only", desc: "Just the component drivers — you handle the rest" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("outputScope", opt.value as ProjectSpec["outputScope"])}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  spec.outputScope === opt.value
                    ? "border-brand-500/50 bg-brand-500/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
        <button
          onClick={() => {
            const order: Step[] = ["describe", "hardware", "firmware", "scope"];
            const idx = order.indexOf(step);
            if (idx > 0) setStep(order[idx - 1]);
          }}
          className={`px-5 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors ${step === "describe" ? "invisible" : ""}`}
        >
          ← Back
        </button>
        <button
          onClick={proceed}
          disabled={!canProceed()}
          className="px-8 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step === "scope" ? "Generate BOM →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
