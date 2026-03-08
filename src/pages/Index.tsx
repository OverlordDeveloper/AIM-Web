import ProcessingCard from "@/components/ProcessingCard";
import InspectionSlider from "@/components/InspectionSlider";
import ImagePanel from "@/components/ImagePanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useInspectionConfig } from "@/hooks/useInspectionConfig";

const WS_URL = "ws://127.0.0.1:8000/api/ws/live";

const Index = () => {
  const imageSrc = useWebSocket(WS_URL);
  const { config, updateConfig } = useInspectionConfig();

  return (
    <div className="w-screen h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 p-5 border-r border-border bg-card overflow-y-auto space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
          Vision Inspector
        </h1>

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
          <p className="text-xs text-muted-foreground">Running object detection…</p>
        </ProcessingCard>

        <ProcessingCard
          title="Segmentation"
          enabled={config.seg.enabled}
          onToggle={() => updateConfig("seg.enabled", !config.seg.enabled)}
        >
          <p className="text-xs text-muted-foreground">Segmentation active…</p>
        </ProcessingCard>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        <div className="grid grid-cols-2 gap-6 w-full max-w-5xl">
          <ImagePanel title="Live Feed" imgSrc={imageSrc} />
          <ImagePanel title="Mask" imgSrc={imageSrc} />
        </div>
      </main>
    </div>
  );
};

export default Index;
