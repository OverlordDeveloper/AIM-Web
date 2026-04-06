import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import AnomalySidebar from "@/components/anomaly/AnomalySidebar";
import AnomalyChart from "@/components/anomaly/AnomalyChart";
import AnomalyImageViewer from "@/components/anomaly/AnomalyImageViewer";

const WS_URL = "ws://192.168.1.156:18080/api/ws/anomaly";
const API_BASE = "http://192.168.1.156:18080";
const IMAGE_BASE_URL = "http://192.168.1.156:18080/api/anomaly/memory";
const MAX_RECORDS = 30;

export interface AnomalyRecord {
  id: number;
  timestamp: string;
  anomalyValue: number;
  anomalyReject: boolean;
  yoloReject: boolean;
  hasHeatmap: boolean;
  imageUrl?: string;
  heatmapUrl?: string;
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
  const [records, setRecords] = useState<AnomalyRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [memoryImages, setMemoryImages] = useState<MemoryImage[]>([]);

  useEffect(() => {
    if (lastMessage?.type === "anomaly.state") {
      setAnomalyState((lastMessage.state?.anomaly as AnomalyBackendState) ?? null);
      return;
    }

    if (lastMessage?.type === "anomaly.records") {
      const incoming = (lastMessage.records ?? []) as AnomalyRecord[];
      setRecords(incoming);

      if (incoming.length > 0 && selectedRecordId == null) {
        setSelectedRecordId(incoming[0].id);
      }
      return;
    }

    if (lastMessage?.type === "anomaly.record") {
      const record = lastMessage.record as AnomalyRecord;

      setRecords((prev) => {
        const next = [record, ...prev.filter((r) => r.id !== record.id)];
        return next.slice(0, MAX_RECORDS);
      });

      if (autoScroll) {
        setSelectedRecordId(record.id);
      }
    }
  }, [lastMessage, autoScroll, selectedRecordId]);

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

  useEffect(() => {
    const slots = anomalyState?.slots ?? [];
    const totalSlots = anomalyState?.bankSize ?? 0;

    setMemoryImages(
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

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) ?? null,
    [records, selectedRecordId]
  );

const anomalyData = useMemo(() => {
  return [...records]
    .slice()
    .reverse()
    .map((r, i) => ({
      index: i,
      id: r.id,
      timestamp: r.timestamp,
      value: r.anomalyValue,
      reject: r.anomalyReject,
      yoloReject: r.yoloReject,
    }));
}, [records]);
  const toApiUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
  };
  const selectedImageUrl = selectedRecord
  ? toApiUrl(selectedRecord.imageUrl) ??
    `${API_BASE}/api/anomaly/live/${selectedRecord.id}/image`
  : null;

const selectedHeatmapUrl =
  selectedRecord && selectedRecord.hasHeatmap
    ? toApiUrl(selectedRecord.heatmapUrl) ??
      `${API_BASE}/api/anomaly/live/${selectedRecord.id}/heatmap`
    : null;

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

  const toggleMemoryImage = useCallback(
    (index: number) => {
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
    },
    [sendJson]
  );

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
          anomalyItems={records}
          selectedRecordId={selectedRecordId}
          onSelectRecord={setSelectedRecordId}
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
            selectedItem={
              selectedRecord
                ? {
                    ...selectedRecord,
                    imageUrl: selectedImageUrl,
                    heatmapUrl: selectedHeatmapUrl,
                  }
                : null
            }
          />
        </main>
      </div>
    </div>
  );
};

export default AnomalyDetection;