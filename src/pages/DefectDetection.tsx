import { useEffect, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import DefectSidebar, { ClassState } from "@/components/defect/DefectSidebar";
import DefectViewer from "@/components/defect/DefectViewer";
import DefectHistory from "@/components/defect/DefectHistory";
import {
  MOCK_MODELS,
  generateMockFrame,
  type DetectionFrame,
  type DetectionClass,
} from "@/lib/defectMock";

const MAX_FRAMES = 30;

const DefectDetection = () => {
  const [selectedModelId, setSelectedModelId] = useState(MOCK_MODELS[0].id);
  const [classStates, setClassStates] = useState<Record<string, ClassState>>({});
  const [detectEnabled, setDetectEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [frames, setFrames] = useState<DetectionFrame[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const model = useMemo(
    () => MOCK_MODELS.find((m) => m.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  // Reset class states when model changes
  useEffect(() => {
    if (!model) return;
    const next: Record<string, ClassState> = {};
    for (const cls of model.classes) {
      next[cls.id] = { enabled: true, threshold: 0.5 };
    }
    setClassStates(next);
    setFrames([]);
    setSelectedId(null);
  }, [model]);

  // Mock frame stream
  useEffect(() => {
    if (!detectEnabled || !model) return;
    const interval = setInterval(() => {
      const frame = generateMockFrame(model);
      setFrames((prev) => [frame, ...prev].slice(0, MAX_FRAMES));
      if (autoScroll) setSelectedId(frame.id);
    }, 1500);
    return () => clearInterval(interval);
  }, [detectEnabled, model, autoScroll]);

  const classMap = useMemo(() => {
    const map: Record<string, DetectionClass> = {};
    model?.classes.forEach((c) => (map[c.id] = c));
    return map;
  }, [model]);

  const selectedFrame = useMemo(
    () => frames.find((f) => f.id === selectedId) ?? frames[0] ?? null,
    [frames, selectedId]
  );

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
          autoScroll={autoScroll}
          onAutoScrollToggle={() => setAutoScroll((p) => !p)}
        />

        <main className="flex-1 flex flex-row overflow-hidden bg-background">
          <div className="flex-1 flex flex-col overflow-hidden">
            <DefectViewer
              frame={selectedFrame}
              classMap={classMap}
              classStates={classStates}
            />
          </div>
          <DefectHistory
            frames={frames}
            selectedId={selectedFrame?.id ?? null}
            onSelect={setSelectedId}
            classMap={classMap}
          />
        </main>
      </div>
    </div>
  );
};

export default DefectDetection;
