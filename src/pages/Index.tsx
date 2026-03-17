import ProcessingCard from "@/components/ProcessingCard";
import InspectionSlider from "@/components/InspectionSlider";
import ImagePanel from "@/components/ImagePanel";
import CameraSettingsPanel from "@/components/CameraSettingsDialog";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useInspectionConfig } from "@/hooks/useInspectionConfig";
import { Activity, Settings, ChevronRight } from "lucide-react";
import { useState } from "react";

const WS_URL = "ws://127.0.0.1:18080/api/ws/live";

const Index = () => {
  const { live, mask, connected, sendJson } = useWebSocket(WS_URL);
  const { config, updateConfig } = useInspectionConfig();
  const [controlsOpen, setControlsOpen] = useState(true);
  
  const handleSelectionCommit = (box: { x: number; y: number; w: number; h: number }) => {
    sendJson({
      type: "roi.update",
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
    });
  };

  const handleConfigUpdate = (path: string, value: number | boolean) => {
    updateConfig(path, value);

    sendJson({
      type: "config.update",
      path,
      value,
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-11 shrink-0 flex items-center justify-between px-5 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Vision Inspector
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-status-online animate-pulse-dot' : 'bg-status-offline'}`} />
          <span className="text-[10px] font-mono text-muted-foreground">
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-background">
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
            <ImagePanel title="Live Feed" imgSrc={live} />
            <ImagePanel title="Mask" imgSrc={mask} showSelection={config.seg.enabled} onSelectionCommit={handleSelectionCommit} />
          </div>

          {/* Bottom camera settings bar */}
          <CameraSettingsPanel />
        </main>

        {/* Right Sidebar - Controls */}
        <aside className={`shrink-0 border-l border-sidebar-border bg-sidebar flex flex-col transition-all duration-300 overflow-hidden ${controlsOpen ? 'w-64' : 'w-10'}`}>
          <div
            className="px-2.5 py-3 border-b border-sidebar-border flex items-center gap-2 cursor-pointer select-none hover:bg-sidebar-accent/50 transition-colors"
            onClick={() => setControlsOpen(!controlsOpen)}
          >
            <Settings className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />
            {controlsOpen && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/60 whitespace-nowrap">
                  Controls
                </span>
                <ChevronRight className="w-3 h-3 text-sidebar-foreground/40 ml-auto shrink-0" />
              </>
            )}
          </div>

          {controlsOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <ProcessingCard
                title="Classic Processing"
                enabled={config.classic.enabled}
                onToggle={() => handleConfigUpdate("classic.enabled", !config.classic.enabled)}>
                
                <InspectionSlider label="Low H" value={config.classic.lowH} onChange={(v) => handleConfigUpdate("classic.lowH", v)} />
                <InspectionSlider label="Low S" value={config.classic.lowS} onChange={(v) => handleConfigUpdate("classic.lowS", v)} />
                <InspectionSlider label="Low V" value={config.classic.lowV} onChange={(v) => handleConfigUpdate("classic.lowV", v)} />
                <InspectionSlider label="High H" value={config.classic.highH} onChange={(v) => handleConfigUpdate("classic.highH", v)} />
                <InspectionSlider label="High S" value={config.classic.highS} onChange={(v) => handleConfigUpdate("classic.highS", v)} />
                <InspectionSlider label="High V" value={config.classic.highV} onChange={(v) => handleConfigUpdate("classic.highV", v)} />
                <InspectionSlider label="Size" value={config.classic.size} onChange={(v) => handleConfigUpdate("classic.size", v)} max={200} />
              </ProcessingCard>

              <ProcessingCard
                title="YOLO Detector"
                enabled={config.yolo.enabled}
                onToggle={() => handleConfigUpdate("yolo.enabled", !config.yolo.enabled)}>
                
                <p className="text-[10px] font-mono text-muted-foreground">Running object detection…</p>
              </ProcessingCard>

              <ProcessingCard
                title="Segmentation"
                enabled={config.seg.enabled}
                onToggle={() => handleConfigUpdate("seg.enabled", !config.seg.enabled)}>
                
                <p className="text-[10px] font-mono text-muted-foreground">Segmentation active…</p>
              </ProcessingCard>
            </div>
          )}
        </aside>
      </div>
    </div>);

};

export default Index;