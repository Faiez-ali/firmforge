import dynamic from "next/dynamic";

const SerialMonitor = dynamic(
  () => import("@/components/serial/SerialMonitor"),
  { ssr: false }
);

export default function SerialPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 pt-8 pb-4 flex-shrink-0">
        <p className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-1">Serial Monitor</p>
        <h1 className="text-2xl font-bold">Device logs</h1>
        <p className="text-gray-400 text-sm mt-1">
          Connect via USB to view real-time device output. Chrome and Edge only.
        </p>
      </div>
      <div className="flex-1 min-h-0 mx-6 mb-6 border border-white/5 rounded-2xl overflow-hidden bg-gray-950">
        <SerialMonitor />
      </div>
    </div>
  );
}
