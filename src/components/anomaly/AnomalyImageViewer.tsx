import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import type { AnomalyItem } from "@/pages/AnomalyDetection";

interface AnomalyImageViewerProps {
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  selectedItem: AnomalyItem | null;
}

const AnomalyImageViewer = ({ showHeatmap, onToggleHeatmap, selectedItem }: AnomalyImageViewerProps) => {
  return (
    <div className="h-[280px] shrink-0 border-t border-border p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
            Image Preview
          </h3>
          {selectedItem && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {selectedItem.name} — Score: {selectedItem.value.toFixed(1)}
            </span>
          )}
        </div>
        <button
          onClick={onToggleHeatmap}
          className={cn(
            "flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded transition-colors",
            showHeatmap
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Heatmap
        </button>
      </div>
      <div
        className="flex-1 rounded bg-muted border border-border flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onToggleHeatmap}
      >
        {selectedItem ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="bg-secondary rounded w-full h-full flex items-center justify-center">
              <span className="text-[11px] font-mono text-muted-foreground">
                {showHeatmap ? "Heatmap overlay" : "Original image"} — {selectedItem.name}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground">
            Select an anomaly to preview
          </span>
        )}
      </div>
    </div>
  );
};

export default AnomalyImageViewer;
