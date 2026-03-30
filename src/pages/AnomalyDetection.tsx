import { useState, useMemo, useCallback, useEffect } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import AnomalySidebar from "@/components/anomaly/AnomalySidebar";
import AnomalyChart from "@/components/anomaly/AnomalyChart";
import AnomalyImageViewer from "@/components/anomaly/AnomalyImageViewer";

const WS_URL = "ws://192.168.1.156:18080/api/ws/anomaly";
const IMAGE_BASE_URL = "http://192.168.1.156:18080/api/anomaly/memory";

export interface AnomalyItem {
  id: number;
  name: string;
  value: number;
  timestamp: string;
}

type MemoryStatus = "empty" | "storing" | "temp_ready" | "building" | "ready";

type BackendSlot = {
  filled?: boolean;
  included?: boolean;
};

type AnomalyBackendState = {
  train?: boolean;
  threshold?: number;
  detectEnabled?: boolean;
  reject?: boolean;
  bankSize?: number;
  storing?: boolean;
  building?: boolean;
  tempMemoryReady?: boolean;
  memoryReady?: boolean;
  buildProgress?: number;
  slots?: BackendSlot[];
};

type MemoryImage = {
  checked: boolean;
  filled: boolean;
  url: string | null;
};

const AnomalyDetection = () => {
  const { connected, lastMessage, sendJson } = useWebSocket(WS_URL);

  const [anomalyState, setAnomalyState] = useState<AnomalyBackendState | null>(null);

  useEffect(() => {
    if (lastMessage?.type === "anomaly.state") {
      setAnomalyState((lastMessage.state?.anomaly as AnomalyBackendState) ?? null);
    }
  }, [lastMessage]);

  const mode: "train" | "detect" =
    anomalyState?.train === false ? "detect" : "train";

  const threshold = anomalyState?.threshold ?? 1;
  const anomalyDetectEnabled = anomalyState?.detectEnabled ?? false;
  const rejectEnabled = anomalyState?.reject ?? false;
  const bankSize = anomalyState?.bankSize ?? 100;
  const buildProgress = Math.round((anomalyState?.buildProgress ?? 0) * 100);

const memoryStatus: MemoryStatus = anomalyState?.storing
  ? "storing"
  : anomalyState?.building
  ? "building"
  : anomalyState?.memoryReady
  ? "ready"
  : anomalyState?.tempMemoryReady
  ? "temp_ready"
  : "empty";

  // Local-only UI state
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // UI representation of backend slots
  const [memoryImages, setMemoryImages] = useState<MemoryImage[]>([]);

  // Rebuild slot state from backend
  useEffect(() => {
    const slots = anomalyState?.slots ?? [];
    const totalSlots = anomalyState?.bankSize ?? 0;

    setMemoryImages((prev) =>
      Array.from({ length: totalSlots }, (_, i) => {
        const slot = slots[i];

        return {
          checked: slot?.included ?? true,
          filled: slot?.filled ?? false,
          url: slot?.filled ? `${IMAGE_BASE_URL}/${i}` : null,
        };
      })
    );
  }, [anomalyState?.slots, anomalyState?.bankSize]);

  // Mock chart data for now
  const anomalyData = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      index: i,
      value: Math.random() * 40 + 5,
    }));
  }, []);

  const anomalyItems: AnomalyItem[] = useMemo(() => {
    return anomalyData
      .filter((d) => d.value > threshold)
      .map((d, i) => ({
        id: i,
        name: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(
          Math.floor(Math.random() * 60)
        ).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        value: d.value,
        timestamp: new Date().toISOString(),
      }));
  }, [anomalyData, threshold]);

  const handleStartStoring = useCallback(() => {
    sendJson({
      type: "action",
      name: "anomaly.startStoring",
    });
  }, [sendJson]);

  const handleResetMemory = useCallback(() => {
    setMemoryImages([]);
    sendJson({
      type: "action",
      name: "anomaly.resetMemory",
    });
  }, [sendJson]);

  const handleBuild = useCallback(() => {
    sendJson({
      type: "action",
      name: "anomaly.buildMemory",
      payload: {
        includedImages: memoryImages.map((img) => img.checked),
      },
    });
  }, [sendJson, memoryImages]);

  const handleModeChange = useCallback(
    (value: "train" | "detect") => {
      sendJson({
        type: "set",
        path: "anomaly.train",
        value: value === "train",
      });
    },
    [sendJson]
  );

  const handleBankSizeChange = useCallback(
    (value: number) => {
      sendJson({
        type: "set",
        path: "anomaly.bankSize",
        value,
      });
    },
    [sendJson]
  );

  const handleDetectEnabledChange = useCallback(
    (value: boolean) => {
      sendJson({
        type: "set",
        path: "anomaly.detectEnabled",
        value,
      });
    },
    [sendJson]
  );

  const handleRejectChange = useCallback(
    (value: boolean) => {
      sendJson({
        type: "set",
        path: "anomaly.reject",
        value,
      });
    },
    [sendJson]
  );

  const handleThresholdChange = useCallback(
    (value: number) => {
      sendJson({
        type: "set",
        path: "anomaly.threshold",
        value,
      });
    },
    [sendJson]
  );

  const toggleMemoryImage = useCallback((index: number) => {
    setMemoryImages((prev) => {
      const next = prev.map((img, i) =>
        i === index ? { ...img, checked: !img.checked } : img
      );

      sendJson({
        type: "action",
        name: "anomaly.setIncludedImages",
        payload: {
          includedImages: next.map((img) => img.checked),
        },
      });

      return next;
    });
  }, [sendJson]);

  useEffect(() => {
    console.log("anomalyState updated:", anomalyState);
  }, [anomalyState]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 flex overflow-hidden">
        <AnomalySidebar
          mode={mode}
          onModeChange={handleModeChange}
          memoryStatus={memoryStatus}
          bankSize={bankSize}
          onBankSizeChange={handleBankSizeChange}
          buildProgress={buildProgress}
          memoryImages={memoryImages}
          onStartStoring={handleStartStoring}
          onResetMemory={handleResetMemory}
          onBuild={handleBuild}
          onToggleMemoryImage={toggleMemoryImage}
          anomalyItems={anomalyItems}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          anomalyDetectEnabled={anomalyDetectEnabled}
          onAnomalyDetectChange={handleDetectEnabledChange}
          rejectEnabled={rejectEnabled}
          onRejectChange={handleRejectChange}
          autoScroll={autoScroll}
          onAutoScrollToggle={() => setAutoScroll((p) => !p)}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <AnomalyChart
            data={anomalyData}
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
            enabled={anomalyDetectEnabled && mode === "detect"}
          />

          <AnomalyImageViewer
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap((p) => !p)}
            selectedItem={anomalyItems[selectedItem] ?? null}
          />
        </main>
      </div>
    </div>
  );
};

export default AnomalyDetection;