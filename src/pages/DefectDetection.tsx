import { useEffect, useMemo, useRef, useState } from "react";
import { History } from "lucide-react";
import TopNav from "@/components/TopNav";
import DefectSidebar, { ClassState } from "@/components/defect/DefectSidebar";
import DefectViewer from "@/components/defect/DefectViewer";
import DefectHistory from "@/components/defect/DefectHistory";
import { Button } from "@/components/ui/button";
import {
  MOCK_MODELS,
  generateMockFrame,
  generateMockHistory,
  type DetectionFrame,
  type DetectionClass,
} from "@/lib/defectMock";

const MAX_FRAMES = 2000;
const HISTORY_HOURS = 6;
const HISTORY_INTERVAL_MS = 30 * 1000;

const DefectDetection = () => {
  const [selectedModelId, setSelectedModelId] = useState(MOCK_MODELS[0].id);
  const [classStates, setClassStates] = useState<Record<string, ClassState>>({});
  const [detectEnabled, setDetectEnabled] = useState(true);
  const [rejectEnabled, setRejectEnabled] = useState(false);
  const [frames, setFrames] = useState<DetectionFrame[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewerMode, setViewerMode] = useState<"live" | "paused">("live");
  const [historyOpen, setHistoryOpen] = useState(false);

  const viewerModeRef = useRef(viewerMode);
  viewerModeRef.current = viewerMode;

  const model = useMemo(
    () => MOCK_MODELS.find((m) => m.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  // Reset class states + seed mock history when model changes
  useEffect(() => {
    if (!model) return;
    const next: Record<string, ClassState> = {};
    for (const cls of model.classes) {
      next[cls.id] = { enabled: true, threshold: 0.5 };
    }
    setClassStates(next);
    const seeded = generateMockHistory(
      model,
      Math.floor((HISTORY_HOURS * 3600 * 1000) / HISTORY_INTERVAL_MS),
      HISTORY_INTERVAL_MS
    );
    setFrames(seeded);
    setSelectedId(seeded[0]?.id ?? null);
    setViewerMode("live");
  }, [model]);

  // Live frame stream
  useEffect(() => {
    if (!detectEnabled || !model) return;
    const interval = setInterval(() => {
      const frame = generateMockFrame(model);
      setFrames((prev) => [frame, ...prev].slice(0, MAX_FRAMES));
      if (viewerModeRef.current === "live") setSelectedId(frame.id);
    }, 1500);
    return () => clearInterval(interval);
  }, [detectEnabled, model]);

  const classMap = useMemo(() => {
    const map: Record<string, DetectionClass> = {};
    model?.classes.forEach((c) => (map[c.id] = c));
    return map;
  }, [model]);

  const selectedFrame = useMemo(
    () => frames.find((f) => f.id === selectedId) ?? frames[0] ?? null,
    [frames, selectedId]
  );

  const handleSelectFrame = (id: number) => {
    setViewerMode("paused");
    setSelectedId(id);
  };

  const handleResumeLive = () => {
    setViewerMode("live");
    if (frames[0]) setSelectedId(frames[0].id);
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={detectEnabled} />

      <div className="flex-1 flex overflow-hidden">
        <DefectSidebar
          models={MOCK_MODELS}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          model={model}
          classStates={classStates}
          onClassToggle={(id, enabled) =>
            setClassStates((p) => ({ ...p, [id]: { ...p[id], enabled } }))
          }
          onThresholdChange={(id, threshold) =>
            setClassStates((p) => ({ ...p, [id]: { ...p[id], threshold } }))
          }
          detectEnabled={detectEnabled}
          onDetectEnabledChange={setDetectEnabled}
          rejectEnabled={rejectEnabled}
          onRejectEnabledChange={setRejectEnabled}
          autoScroll={viewerMode === "live"}
          onAutoScrollToggle={() =>
            viewerMode === "live" ? setViewerMode("paused") : handleResumeLive()
          }
        />

        <main className="flex-1 relative flex flex-col overflow-hidden bg-background">
          <DefectViewer
            frame={selectedFrame}
            classMap={classMap}
            classStates={classStates}
            paused={viewerMode === "paused"}
            onResumeLive={handleResumeLive}
          />

          {/* History edge toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 right-0 h-auto py-3 px-1.5 rounded-l-md rounded-r-none border border-r-0 border-border text-[10px] font-mono uppercase tracking-wider flex flex-col items-center gap-1"
          >
            <History className="w-3.5 h-3.5" />
            <span className="[writing-mode:vertical-rl] rotate-180">History</span>
          </Button>

          <DefectHistory
            frames={frames}
            selectedId={selectedFrame?.id ?? null}
            onSelect={handleSelectFrame}
            classMap={classMap}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
          />
        </main>
      </div>
    </div>
  );
};

export default DefectDetection;
