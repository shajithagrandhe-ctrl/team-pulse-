import { useRealtimeStatus } from "@/realtime/RealTimeListener";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-emerald-500" },
  connecting: { label: "Connecting", className: "bg-amber-500 animate-pulse" },
  reconnecting: { label: "Reconnecting", className: "bg-orange-500 animate-pulse" },
  offline: { label: "Offline", className: "bg-gray-400" },
  disconnected: { label: "Disconnected", className: "bg-gray-500" }
};

const RealtimeStatusIndicator = () => {
  const { status, transport } = useRealtimeStatus();
  const config = statusStyles[status] ?? statusStyles.disconnected;

  return (
    <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
      <span className={cn("h-2 w-2 rounded-full", config.className)} aria-hidden="true" />
      <span>Live: {config.label}</span>
      <span className="text-sidebar-foreground/40">({transport.toUpperCase()})</span>
    </div>
  );
};

export default RealtimeStatusIndicator;
