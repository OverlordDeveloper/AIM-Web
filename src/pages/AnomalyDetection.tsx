import { useState, useMemo, useCallback } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import AnomalySidebar from "@/components/anomaly/AnomalySidebar";
import AnomalyChart from "@/components/anomaly/AnomalyChart";
import AnomalyImageViewer from "@/components/anomaly/AnomalyImageViewer";

const WS_URL = "ws://127.0.0.1:18080/api/ws/live";

export interface AnomalyItem {
  id: number;
  name: string;
  value: number;
  timestamp: string;
}

const AnomalyDetection = () => {
  const { connected } = useWebSocket(WS_URL);

  const [mode, setMode] = useState<"train" | "detect">("train");
  const [threshold, setThreshold] = useState(25);
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [anomalyDetectEnabled, setAnomalyDetectEnabled] = useState(false);
  const [rejectEnabled, setRejectEnabled] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Memory bank state (train mode)
  const [memoryStatus, setMemoryStatus] = useState<"empty" | "storing" | "temp_ready" | "ready">("empty");
  const [bankSize, setBankSize] = useState(10);
  const [buildProgress, setBuildProgress] = useState(0);
  const [memoryImages, setMemoryImages] = useState<{ checked: boolean }[]>([]);

  // Mock anomaly data
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
        name: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        value: d.value,
        timestamp: new Date().toISOString(),
      }));
  }, [anomalyData, threshold]);

  const handleStartStoring = useCallback(() => {
    setMemoryStatus("storing");
    // Simulate storing
    setTimeout(() => {
      setMemoryImages(Array.from({ length: 6 }, () => ({ checked: true })));
      setMemoryStatus("temp_ready");
    }, 1500);
  }, []);

  const handleResetMemory = useCallback(() => {
    setMemoryStatus("empty");
    setMemoryImages([]);
    setBuildProgress(0);
  }, []);

  const handleBuild = useCallback(() => {
    setBuildProgress(0);
    const interval = setInterval(() => {
      setBuildProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setMemoryStatus("ready");
          return 100;
        }
        return p + 10;
      });
    }, 200);
  }, []);

  const toggleMemoryImage = useCallback((index: number) => {
    setMemoryImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, checked: !img.checked } : img))
    );
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - 20% */}
        <AnomalySidebar
          mode={mode}
          onModeChange={setMode}
          memoryStatus={memoryStatus}
          bankSize={bankSize}
          onBankSizeChange={setBankSize}
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
          onAnomalyDetectChange={setAnomalyDetectEnabled}
          rejectEnabled={rejectEnabled}
          onRejectChange={setRejectEnabled}
          autoScroll={autoScroll}
          onAutoScrollToggle={() => setAutoScroll(true)}
        />

        {/* Right Content - 80% */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <AnomalyChart
            data={anomalyData}
            threshold={threshold}
            onThresholdChange={setThreshold}
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
