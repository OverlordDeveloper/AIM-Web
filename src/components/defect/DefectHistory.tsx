import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DetectionFrame } from "@/lib/defectMock";

interface DefectHistoryProps {
  frames: DetectionFrame[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const DefectHistory = ({ frames, selectedId, onSelect }: DefectHistoryProps) => {
  return (
    <div className="border-t border-border bg-card">
      <div className="px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Live History ({frames.length})
        </span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 px-3 pb-3">
          {frames.map((f) => {
            const isSelected = f.id === selectedId;
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f.id)}
                className={cn(
                  "relative shrink-0 w-20 h-20 rounded border overflow-hidden transition-all",
                  isSelected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <img
                  src={f.imageUrl}
                  alt={`Frame ${f.id}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-[9px] font-mono text-white flex justify-between">
                  <span>#{f.id}</span>
                  <span>{f.boxes.length}</span>
                </div>
              </button>
            );
          })}
          {frames.length === 0 && (
            <div className="text-[10px] text-muted-foreground py-6 px-2">
              No frames yet
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default DefectHistory;
