import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { DetectionClass, DetectionFrame } from "@/lib/defectMock";

interface DefectHistoryProps {
  frames: DetectionFrame[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  classMap: Record<string, DetectionClass>;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour12: false });
};

const DefectHistory = ({ frames, selectedId, onSelect, classMap }: DefectHistoryProps) => {
  return (
    <aside className="w-64 shrink-0 border-l border-border bg-card flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Live History ({frames.length})
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {frames.map((f) => {
            const isSelected = f.id === selectedId;
            const uniqueClassIds = Array.from(new Set(f.boxes.map((b) => b.classId)));
            return (
              <HoverCard key={f.id} openDelay={150} closeDelay={50}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => onSelect(f.id)}
                    className={cn(
                      "text-left px-3 py-2 border-b border-border/50 transition-colors",
                      isSelected
                        ? "bg-muted/40 ring-1 ring-inset ring-primary"
                        : "hover:bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-foreground">{formatTime(f.timestamp)}</span>
                      <span className="text-muted-foreground">{f.boxes.length} det</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 min-h-[10px]">
                      {uniqueClassIds.map((cid) => {
                        const cls = classMap[cid];
                        if (!cls) return null;
                        return (
                          <span
                            key={cid}
                            title={cls.name}
                            className="w-2 h-2 rounded-full"
                            style={{ background: `hsl(${cls.color})` }}
                          />
                        );
                      })}
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="left" align="start" className="p-1 w-44">
                  <img
                    src={f.imageUrl}
                    alt={`Frame ${f.id}`}
                    className="w-full aspect-square object-cover rounded"
                  />
                  <div className="px-1 py-1 text-[10px] font-mono text-muted-foreground flex justify-between">
                    <span>#{f.id}</span>
                    <span>{formatTime(f.timestamp)}</span>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
          {frames.length === 0 && (
            <div className="text-[10px] text-muted-foreground py-6 px-3">
              No frames yet
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default DefectHistory;
