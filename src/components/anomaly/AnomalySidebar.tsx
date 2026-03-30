import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, RotateCcw, Hammer, Play, Brain, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnomalyItem } from "@/pages/AnomalyDetection";

interface AnomalySidebarProps {
  mode: "train" | "detect";
  onModeChange: (mode: "train" | "detect") => void;
  memoryStatus: "empty" | "storing" | "temp_ready" | "building" | "ready";
  bankSize: number;
  onBankSizeChange: (size: number) => void;
  buildProgress: number;
  memoryImages: { checked: boolean; filled: boolean; url: string | null }[];
  onStartStoring: () => void;
  onResetMemory: () => void;
  onBuild: () => void;
  onToggleMemoryImage: (index: number) => void;
  anomalyItems: AnomalyItem[];
  selectedItem: number;
  onSelectItem: (index: number) => void;
  anomalyDetectEnabled: boolean;
  onAnomalyDetectChange: (enabled: boolean) => void;
  rejectEnabled: boolean;
  onRejectChange: (enabled: boolean) => void;
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
}

const MemoryStatusBadge = ({ status }: { status: AnomalySidebarProps["memoryStatus"] }) => {
  const config: Record<
    AnomalySidebarProps["memoryStatus"],
    { label: string; className: string }
  > = {
    empty: { label: "Empty", className: "text-destructive" },
    storing: { label: "Storing...", className: "text-yellow-400 animate-pulse" },
    temp_ready: { label: "Temp ready", className: "text-yellow-400" },
    building: { label: "Building...", className: "text-blue-400 animate-pulse" },
    ready: { label: "Ready", className: "text-[hsl(var(--status-online))]" },
  };

  const { label, className } = config[status];

  return (
    <span className={cn("text-[11px] font-mono font-semibold", className)}>
      {label}
    </span>
  );
};

const AnomalySidebar = ({
  mode,
  onModeChange,
  memoryStatus,
  bankSize,
  onBankSizeChange,
  buildProgress,
  memoryImages,
  onStartStoring,
  onResetMemory,
  onBuild,
  onToggleMemoryImage,
  anomalyItems,
  selectedItem,
  onSelectItem,
  anomalyDetectEnabled,
  onAnomalyDetectChange,
  rejectEnabled,
  onRejectChange,
  autoScroll,
  onAutoScrollToggle,
}: AnomalySidebarProps) => {
  return (
    <aside className="w-[20%] min-w-[220px] max-w-[320px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
          Anomaly Detection Settings
        </h2>
      </div>

      <div className="px-3 py-2 flex gap-1">
        <Button
          size="sm"
          variant={mode === "train" ? "default" : "secondary"}
          className="flex-1 text-[11px] h-7"
          onClick={() => onModeChange("train")}
        >
          <Brain className="w-3 h-3 mr-1" />
          Train
        </Button>
        <Button
          size="sm"
          variant={mode === "detect" ? "default" : "secondary"}
          className="flex-1 text-[11px] h-7"
          onClick={() => onModeChange("detect")}
        >
          <Search className="w-3 h-3 mr-1" />
          Detect
        </Button>
      </div>

      <Separator />

      <div className="px-3 py-2 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Memory Bank:</span>
        <MemoryStatusBadge status={memoryStatus} />
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-3">
          {mode === "train" ? (
            <TrainPanel
              memoryStatus={memoryStatus}
              bankSize={bankSize}
              onBankSizeChange={onBankSizeChange}
              buildProgress={buildProgress}
              memoryImages={memoryImages}
              onStartStoring={onStartStoring}
              onResetMemory={onResetMemory}
              onBuild={onBuild}
              onToggleMemoryImage={onToggleMemoryImage}
            />
          ) : (
            <DetectPanel
              memoryStatus={memoryStatus}
              anomalyItems={anomalyItems}
              selectedItem={selectedItem}
              onSelectItem={onSelectItem}
              anomalyDetectEnabled={anomalyDetectEnabled}
              onAnomalyDetectChange={onAnomalyDetectChange}
              rejectEnabled={rejectEnabled}
              onRejectChange={onRejectChange}
              autoScroll={autoScroll}
              onAutoScrollToggle={onAutoScrollToggle}
            />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

const TrainPanel = ({
  memoryStatus,
  bankSize,
  onBankSizeChange,
  buildProgress,
  memoryImages,
  onStartStoring,
  onResetMemory,
  onBuild,
  onToggleMemoryImage,
}: Pick<
  AnomalySidebarProps,
  | "memoryStatus"
  | "bankSize"
  | "onBankSizeChange"
  | "buildProgress"
  | "memoryImages"
  | "onStartStoring"
  | "onResetMemory"
  | "onBuild"
  | "onToggleMemoryImage"
>) => {
  const canStore = memoryStatus === "empty" || memoryStatus === "ready";
  const canBuild = memoryStatus === "temp_ready";
  const showProgress =
    memoryStatus === "storing" || memoryStatus === "building" || buildProgress > 0;

  return (
    <>
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Count
        </label>
        <Input
          type="number"
          min={1}
          max={100}
          value={bankSize}
          onChange={(e) =>
            onBankSizeChange(Math.max(1, Math.min(100, Number(e.target.value))))
          }
          className="h-7 text-[11px] font-mono bg-secondary border-border"
        />
      </div>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1 text-[10px] h-7"
          onClick={onStartStoring}
          disabled={!canStore}
        >
          <Play className="w-3 h-3 mr-1" />
          Store
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="text-[10px] h-7 px-2"
          onClick={onResetMemory}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="text-[10px] h-7 px-2"
          onClick={onBuild}
          disabled={!canBuild}
        >
          <Hammer className="w-3 h-3" />
        </Button>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress value={buildProgress} className="h-2" />
          <span className="text-[10px] font-mono text-muted-foreground">
            {buildProgress}%
          </span>
        </div>
      )}

      {memoryImages.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {memoryImages.map((img, index) => (
            <button
              key={index}
              onClick={() => onToggleMemoryImage(index)}
              className={cn(
                "relative aspect-square rounded bg-muted border border-border overflow-hidden transition-all",
                "hover:border-primary/50"
              )}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={`Memory ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-[9px] font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
              )}

              {!img.checked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <X className="w-8 h-8 text-destructive opacity-80" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

const DetectPanel = ({
  memoryStatus,
  anomalyItems,
  selectedItem,
  onSelectItem,
  anomalyDetectEnabled,
  onAnomalyDetectChange,
  rejectEnabled,
  onRejectChange,
  autoScroll,
  onAutoScrollToggle,
}: Pick<
  AnomalySidebarProps,
  | "memoryStatus"
  | "anomalyItems"
  | "selectedItem"
  | "onSelectItem"
  | "anomalyDetectEnabled"
  | "onAnomalyDetectChange"
  | "rejectEnabled"
  | "onRejectChange"
  | "autoScroll"
  | "onAutoScrollToggle"
>) => {
  const canEnable = memoryStatus === "ready";

  return (
    <>
      <div className="flex items-center gap-4">
        <label
          className={cn(
            "flex items-center gap-1.5 text-[11px]",
            !canEnable && "opacity-50"
          )}
        >
          <Checkbox
            checked={anomalyDetectEnabled}
            onCheckedChange={(v) => onAnomalyDetectChange(!!v)}
            disabled={!canEnable}
            className="w-3.5 h-3.5"
          />
          <span className="text-foreground">Enabled</span>
        </label>

        <label
          className={cn(
            "flex items-center gap-1.5 text-[11px]",
            !canEnable && "opacity-50"
          )}
        >
          <Checkbox
            checked={rejectEnabled}
            onCheckedChange={(v) => onRejectChange(!!v)}
            disabled={!canEnable}
            className="w-3.5 h-3.5"
          />
          <span className="text-foreground">Reject</span>
        </label>
      </div>

      <Separator />

      <Button
        size="sm"
        variant={autoScroll ? "default" : "secondary"}
        className="w-full text-[10px] h-7"
        onClick={onAutoScrollToggle}
      >
        Auto-scroll
      </Button>

      <div className="space-y-0.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Detections ({anomalyItems.length})
        </span>

        <ScrollArea className="h-[300px]">
          {anomalyItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(index)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors",
                selectedItem === index
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{item.name}</span>
                <span className="text-destructive font-semibold">
                  {item.value.toFixed(1)}
                </span>
              </div>
            </button>
          ))}

          {anomalyItems.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">
              No anomalies detected
            </p>
          )}
        </ScrollArea>
      </div>
    </>
  );
};

export default AnomalySidebar;