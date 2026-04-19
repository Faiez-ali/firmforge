"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface LogLine {
  ts: string;
  text: string;
  type: "rx" | "tx" | "system";
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

type Status = "disconnected" | "connecting" | "connected" | "error";

const STATUS_STYLES: Record<Status, string> = {
  disconnected: "bg-gray-500/20 text-gray-400",
  connecting:   "bg-amber-500/20 text-amber-400",
  connected:    "bg-emerald-500/20 text-emerald-400",
  error:        "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<Status, string> = {
  disconnected: "● Disconnected",
  connecting:   "● Connecting…",
  connected:    "● Connected",
  error:        "● Error",
};

const MAX_LINES = 2000;

function timestamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}.${String(d.getMilliseconds()).padStart(3,"0")}`;
}

declare global {
  interface Navigator { serial?: { requestPort: () => Promise<SerialPort> } }
  interface SerialPort {
    open(opts: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }
}

export default function SerialMonitor() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [baud, setBaud] = useState(115200);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [sendText, setSendText] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasWebSerial = typeof navigator !== "undefined" && !!navigator.serial;

  const addLine = useCallback((text: string, type: LogLine["type"] = "rx") => {
    setLines((prev) => {
      const next = [...prev, { ts: timestamp(), text, type }];
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  }, []);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoScroll]);

  async function connect() {
    if (!navigator.serial) return;
    setStatus("connecting");
    addLine("Requesting port access…", "system");
    try {
      const port = await navigator.serial.requestPort();
      portRef.current = port;
      await port.open({ baudRate: baud });
      setStatus("connected");
      addLine(`Connected at ${baud} baud`, "system");

      const decoder = new TextDecoder();
      const reader = port.readable?.getReader();
      if (!reader) return;
      readerRef.current = reader;

      if (port.writable) {
        writerRef.current = port.writable.getWriter();
      }

      let buffer = "";
      const read = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";
            parts.forEach((line) => addLine(line, "rx"));
          }
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            setStatus("error");
            addLine(`Read error: ${(err as Error)?.message}`, "system");
          }
        }
      };
      read();
    } catch (err) {
      setStatus(portRef.current ? "error" : "disconnected");
      if ((err as Error)?.name !== "NotFoundError") {
        addLine(`Connection failed: ${(err as Error)?.message}`, "system");
      }
    }
  }

  async function disconnect() {
    try {
      readerRef.current?.cancel();
      writerRef.current?.releaseLock();
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    readerRef.current = null;
    writerRef.current = null;
    setStatus("disconnected");
    addLine("Disconnected", "system");
  }

  async function sendLine() {
    if (!writerRef.current || !sendText) return;
    const enc = new TextEncoder();
    await writerRef.current.write(enc.encode(sendText + "\n"));
    addLine(sendText, "tx");
    setSendText("");
  }

  function copyAll() {
    const text = lines.map((l) => `[${l.ts}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
  }

  if (!hasWebSerial) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🌐</div>
        <h2 className="text-xl font-bold mb-3">Browser not supported</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Serial Monitor requires the Web Serial API, which is available in{" "}
          <strong className="text-white">Chrome</strong> and{" "}
          <strong className="text-white">Edge</strong> only.
          Firefox and Safari do not support WebSerial yet.
        </p>
        <p className="text-gray-600 text-xs mt-4">
          Open this page in Chrome or Edge to use the serial monitor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0 flex-wrap">
        <button
          onClick={status === "connected" ? disconnect : connect}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            status === "connected"
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20"
          }`}
        >
          {status === "connected" ? "Disconnect" : "Connect device"}
        </button>

        <select
          value={baud}
          onChange={(e) => setBaud(Number(e.target.value))}
          disabled={status === "connected"}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 font-mono focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
        >
          {BAUD_RATES.map((r) => (
            <option key={r} value={r}>{r} baud</option>
          ))}
        </select>

        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyAll}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            Copy all
          </button>
          <button
            onClick={() => setLines([])}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
          >
            Clear
          </button>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-blue-500"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Terminal log */}
      <div
        className="flex-1 overflow-y-auto bg-gray-950 font-mono text-xs p-4 space-y-0.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
          setAutoScroll(atBottom);
        }}
      >
        {lines.length === 0 ? (
          <p className="text-gray-700 select-none">Connect a device to start receiving data…</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-3 leading-5">
              <span className="text-gray-700 flex-shrink-0">[{line.ts}]</span>
              <span className={
                line.type === "tx" ? "text-cyan-400" :
                line.type === "system" ? "text-gray-500 italic" :
                "text-gray-300"
              }>
                {line.type === "tx" && <span className="text-gray-600 mr-1">TX›</span>}
                {line.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      <div className="flex gap-2 px-4 py-3 border-t border-white/5 flex-shrink-0">
        <input
          type="text"
          value={sendText}
          onChange={(e) => setSendText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendLine()}
          placeholder={status === "connected" ? "Send command…" : "Connect a device to send data"}
          disabled={status !== "connected"}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
        />
        <button
          onClick={sendLine}
          disabled={status !== "connected" || !sendText}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium transition-all disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
}
