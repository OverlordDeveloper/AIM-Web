import ProcessingCard from "@/components/ProcessingCard";
import InspectionSlider from "@/components/InspectionSlider";
import ImagePanel from "@/components/ImagePanel";
import CameraSettingsPanel from "@/components/CameraSettingsDialog";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useInspectionConfig } from "@/hooks/useInspectionConfig";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${protocol}://${window.location.hostname}:18080/api/ws/live`;

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
    // If enabling a processing mode, disable the others
    if (path.endsWith(".enabled") && value === true) {
      const groups = ["classic", "yolo", "seg"];
      const activeGroup = path.split(".")[0];
      groups.filter(g => g !== activeGroup).forEach(g => {
        updateConfig(`${g}.enabled`, false);
        sendJson({ type: "config.update", path: `${g}.enabled`, value: false });
      });
    }

    updateConfig(path, value);
    sendJson({ type: "config.update", path, value });
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className={`shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-300 overflow-hidden ${controlsOpen ? 'w-64' : 'w-10'}`}>
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
                
                <div className="border-t border-sidebar-border/50 pt-2 mt-1 space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-sidebar-foreground/50">Options</span>
                  {[
                    { key: "contours", label: "Contours" },
                    { key: "tracking", label: "Tracking" },
                    { key: "drawTracking", label: "Draw Tracking" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={(config.classic as any)[key]}
                        onCheckedChange={(v) => handleConfigUpdate(`classic.${key}`, !!v)}
                        className="h-3.5 w-3.5 border-sidebar-foreground/30 data-[state=checked]:bg-sidebar-primary data-[state=checked]:border-sidebar-primary"
                      />
                      <span className="text-[10px] font-mono text-sidebar-foreground/70 group-hover:text-sidebar-foreground transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
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

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-background">
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
            <ImagePanel title="Live Feed" imgSrc={live} />
            <ImagePanel title="Mask" imgSrc={mask} showSelection={config.seg.enabled} onSelectionCommit={handleSelectionCommit} />
          </div>

          {/* Bottom camera settings bar */}
          <CameraSettingsPanel />
        </main>
      </div>
    </div>);

};

export default Index;