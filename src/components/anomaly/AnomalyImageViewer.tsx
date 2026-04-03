import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import type { AnomalyRecord } from "@/pages/AnomalyDetection";

interface AnomalyImageViewerProps {
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  selectedItem: (AnomalyRecord & {
    imageUrl?: string;
    heatmapUrl?: string;
  }) | null;
}

const formatRecordLabel = (item: AnomalyRecord) => {
  const date = new Date(item.timestamp);

  if (Number.isNaN(date.getTime())) {
    return `#${item.id} — ${item.timestamp}`;
  }

  return `#${item.id} — ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
};

const AnomalyImageViewer = ({
  showHeatmap,
  onToggleHeatmap,
  selectedItem,
}: AnomalyImageViewerProps) => {
  const imageSrc =
    showHeatmap && selectedItem?.heatmapUrl
      ? selectedItem.heatmapUrl
      : selectedItem?.imageUrl ?? null;

  const canToggleHeatmap = !!selectedItem?.heatmapUrl;

  return (
    <div className="h-[280px] shrink-0 border-t border-border p-3 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider shrink-0">
            Image Preview
          </h3>

          {selectedItem && (
            <span className="text-[10px] font-mono text-muted-foreground truncate">
              {formatRecordLabel(selectedItem)} — Score:{" "}
              {selectedItem.anomalyValue.toFixed(1)}
            </span>
          )}
        </div>

        <button
          onClick={onToggleHeatmap}
          disabled={!canToggleHeatmap}
          className={cn(
            "flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-colors shrink-0",
            showHeatmap
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            !canToggleHeatmap &&
              "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
          )}
        >
          {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Heatmap
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center pb-3">
        <div
          className={cn(
            "aspect-square h-[95%] max-h-full rounded bg-muted border border-border overflow-hidden flex items-center justify-center",
            "w-auto max-w-full shadow-sm",
            canToggleHeatmap && "cursor-pointer"
          )}
          onClick={canToggleHeatmap ? onToggleHeatmap : undefined}
        >
          {selectedItem && imageSrc ? (
            <img
              src={imageSrc}
              alt={`Record ${selectedItem.id}`}
              className="w-full h-full object-contain bg-black/20 transition"
            />
          ) : selectedItem ? (
            <span className="text-[11px] font-mono text-muted-foreground px-3 text-center">
              No image available for record #{selectedItem.id}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-muted-foreground px-3 text-center">
              Select a detection to preview
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyImageViewer;