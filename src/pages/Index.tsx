import ProcessingCard from "@/components/ProcessingCard";
import InspectionSlider from "@/components/InspectionSlider";
import ImagePanel from "@/components/ImagePanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useInspectionConfig } from "@/hooks/useInspectionConfig";
import { Activity } from "lucide-react";

const WS_URL = "ws://127.0.0.1:8000/api/ws/live";

const Index = () => {
  const imageSrc = useWebSocket(WS_URL);
  const { config, updateConfig } = useInspectionConfig();

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-11 shrink-0 flex items-center justify-between px-5 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Vision Inspector
          </span>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">v1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${imageSrc ? 'bg-status-online animate-pulse-dot' : 'bg-status-offline'}`} />
          <span className="text-[10px] font-mono text-muted-foreground">
            {imageSrc ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 p-4 border-r border-border bg-card overflow-y-auto space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Processing Modules
          </p>

          <ProcessingCard
            title="Classic Processing"
            enabled={config.classic.enabled}
            onToggle={() => updateConfig("classic.enabled", !config.classic.enabled)}
          >
            <InspectionSlider label="Low H" value={config.classic.lowH} onChange={(v) => updateConfig("classic.lowH", v)} />
            <InspectionSlider label="Low S" value={config.classic.lowS} onChange={(v) => updateConfig("classic.lowS", v)} />
            <InspectionSlider label="Low V" value={config.classic.lowV} onChange={(v) => updateConfig("classic.lowV", v)} />
            <InspectionSlider label="High H" value={config.classic.highH} onChange={(v) => updateConfig("classic.highH", v)} />
            <InspectionSlider label="High S" value={config.classic.highS} onChange={(v) => updateConfig("classic.highS", v)} />
            <InspectionSlider label="High V" value={config.classic.highV} onChange={(v) => updateConfig("classic.highV", v)} />
            <InspectionSlider label="Size" value={config.classic.size} onChange={(v) => updateConfig("classic.size", v)} max={200} />
          </ProcessingCard>

          <ProcessingCard
            title="YOLO Detector"
            enabled={config.yolo.enabled}
            onToggle={() => updateConfig("yolo.enabled", !config.yolo.enabled)}
          >
            <p className="text-[10px] font-mono text-muted-foreground">Running object detection…</p>
          </ProcessingCard>

          <ProcessingCard
            title="Segmentation"
            enabled={config.seg.enabled}
            onToggle={() => updateConfig("seg.enabled", !config.seg.enabled)}
          >
            <p className="text-[10px] font-mono text-muted-foreground">Segmentation active…</p>
          </ProcessingCard>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-8 bg-background">
          <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
            <ImagePanel title="Live Feed" imgSrc={imageSrc} />
            <ImagePanel title="Mask" imgSrc={imageSrc} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
