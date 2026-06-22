import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import DefectSidebar, { ClassState } from "@/components/defect/DefectSidebar";
import DefectViewer from "@/components/defect/DefectViewer";
import DefectHistoryPanel from "@/components/defect/DefectHistoryPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  backendRecordToFrame,
  type BackendDefectRecord,
  type DetectionClass,
  type DetectionFrame,
  type DetectionModel,
} from "@/lib/defectMock";

const API_BASE = "http://192.168.1.156:18080";
const WS_URL = "ws://192.168.1.156:18080/api/defectdetection";
const MAX_RECORDS = 300;

const CLASS_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
];

type BackendState = {
  detectEnabled?: boolean;
  rejectEnabled?: boolean;
  selectedModelId?: string | null;
  models?: DetectionModel[];
  classStates?: Record<string, ClassState>;
};

const withClassColors = (models: DetectionModel[]): DetectionModel[] => {
  return models.map((model) => ({
    ...model,
    classes: model.classes.map((cls, index) => ({
      ...cls,
      color: CLASS_COLORS[index % CLASS_COLORS.length],
    })),
  }));
};

const DefectDetection = () => {
  const { connected, lastMessage, sendJson } = useWebSocket(WS_URL);

  const [models, setModels] = useState<DetectionModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [classStates, setClassStates] = useState<Record<string, ClassState>>({});

  const [detectEnabled, setDetectEnabled] = useState(false);
  const [rejectEnabled, setRejectEnabled] = useState(false);

  const [frames, setFrames] = useState<DetectionFrame[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewerMode, setViewerMode] = useState<"live" | "paused">("live");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const viewerModeRef = useRef(viewerMode);

  useEffect(() => {
    viewerModeRef.current = viewerMode;
  }, [viewerMode]);

  useEffect(() => {
    if (!connected) return;

    sendJson({
      type: "defect.getState",
    });

  }, [connected, sendJson]);

  const model = useMemo(() => {
    if (!selectedModelId) return null;
    return models.find((m) => m.id === selectedModelId) ?? null;
  }, [models, selectedModelId]);

  const placeholderModel: DetectionModel = useMemo(
    () => ({
      id: selectedModelId ?? "none",
      name: connected ? "No model loaded" : "Connecting...",
      classes: [],
    }),
    [connected, selectedModelId]
  );

  const sidebarModel = model ?? placeholderModel;

  const classMap = useMemo(() => {
    const map: Record<string, DetectionClass> = {};

    sidebarModel.classes.forEach((cls) => {
      map[cls.id] = cls;
    });

    return map;
  }, [sidebarModel]);

  const recordToFrame = useCallback((record: BackendDefectRecord) => {
    return backendRecordToFrame(record, API_BASE);
  }, []);

  const buildDefaultClassStates = useCallback((targetModel: DetectionModel) => {
    const next: Record<string, ClassState> = {};

    targetModel.classes.forEach((cls) => {
      next[cls.id] = {
        enabled: true,
        threshold: 0.5,
      };
    });

    return next;
  }, []);

  useEffect(() => {
    if (!lastMessage?.type) return;

    if (lastMessage.type === "defect.state") {
      const state = (lastMessage.state ?? {}) as BackendState;

      const incomingModels = withClassColors(state.models ?? []);
      const incomingSelectedModelId =
        state.selectedModelId ?? incomingModels[0]?.id ?? null;

      const selectedModel =
        incomingModels.find((m) => m.id === incomingSelectedModelId) ?? null;

      setDetectEnabled(Boolean(state.detectEnabled));
      setRejectEnabled(Boolean(state.rejectEnabled));
      setModels(incomingModels);
      setSelectedModelId(incomingSelectedModelId);

      setClassStates(() => {
        const defaults = selectedModel ? buildDefaultClassStates(selectedModel) : {};

        return {
          ...defaults,
          ...(state.classStates ?? {}),
        };
      });

      return;
    }

    if (lastMessage.type === "defect.history") {
      const incoming = ((lastMessage.records ?? []) as BackendDefectRecord[]).map(
        recordToFrame
      );

      setFrames(incoming);
      setSelectedId(incoming[0]?.id ?? null);
      return;
    }

    if (lastMessage.type === "defect.record") {
      const record = lastMessage.record as BackendDefectRecord;
      const frame = recordToFrame(record);

      setFrames((prev) => {
        const next = [frame, ...prev.filter((f) => f.id !== frame.id)];
        return next.slice(0, MAX_RECORDS);
      });

      if (viewerModeRef.current === "live") {
        setSelectedId(frame.id);
      }
    }
  }, [lastMessage, recordToFrame, buildDefaultClassStates]);

  const selectedFrame = useMemo(
    () => frames.find((f) => f.id === selectedId) ?? frames[0] ?? null,
    [frames, selectedId]
  );

  const sendStatePatch = useCallback(
    (patch: Partial<BackendState>) => {
      sendJson({
        type: "defect.update",
        patch,
      });
    },
    [sendJson]
  );

  const handleDetectEnabledChange = (value: boolean) => {
    sendStatePatch({ detectEnabled: value });
  };

  const handleRejectEnabledChange = (value: boolean) => {
    sendStatePatch({ rejectEnabled: value });
  };

  const handleSelectModel = (id: string) => {
    sendStatePatch({
      selectedModelId: id,
    });
  };

  const handleClassToggle = (id: string, enabled: boolean) => {
    sendStatePatch({
      classStates: {
        [id]: {
          ...(classStates[id] ?? { threshold: 0.5 }),
          enabled,
        },
      },
    });
  };

  const handleThresholdChange = (id: string, threshold: number) => {
    sendStatePatch({
      classStates: {
        [id]: {
          ...(classStates[id] ?? { enabled: true }),
          threshold,
        },
      },
    });
  };

  const handleSelectFrame = (id: number) => {
    setViewerMode("paused");
    setSelectedId(id);
  };

  const handleResumeLive = () => {
    setViewerMode("live");

    if (frames[0]) {
      setSelectedId(frames[0].id);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 flex overflow-hidden">
        <DefectSidebar
          models={models}
          selectedModelId={selectedModelId ?? ""}
          onSelectModel={handleSelectModel}
          model={sidebarModel}
          classStates={classStates}
          onClassToggle={handleClassToggle}
          onThresholdChange={handleThresholdChange}
          detectEnabled={detectEnabled}
          onDetectEnabledChange={handleDetectEnabledChange}
          rejectEnabled={rejectEnabled}
          onRejectEnabledChange={handleRejectEnabledChange}
          autoScroll={viewerMode === "live"}
          onAutoScrollToggle={() =>
            viewerMode === "live" ? setViewerMode("paused") : handleResumeLive()
          }
        />

        <main className="flex-1 flex overflow-hidden bg-background">
          <div className="flex-1 flex flex-col overflow-hidden">
            <DefectViewer
              frame={selectedFrame}
              classMap={classMap}
              classStates={classStates}
              paused={viewerMode === "paused"}
              onResumeLive={handleResumeLive}
            />
          </div>

          <DefectHistoryPanel
            frames={frames}
            selectedId={selectedFrame?.id ?? null}
            onSelect={handleSelectFrame}
            classMap={classMap}
            collapsed={historyCollapsed}
            onToggleCollapsed={() => setHistoryCollapsed((c) => !c)}
          />
        </main>
      </div>
    </div>
  );
};

export default DefectDetection;