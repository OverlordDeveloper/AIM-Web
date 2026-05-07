import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DetectionClass, DetectionFrame } from "@/lib/defectMock";

type QuickRange = "5m" | "1h" | "today" | "all";

interface DefectHistoryProps {
  frames: DetectionFrame[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  classMap: Record<string, DetectionClass>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour12: false });
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
};

const DefectHistory = ({
  frames,
  selectedId,
  onSelect,
  classMap,
  open,
  onOpenChange,
}: DefectHistoryProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [quickRange, setQuickRange] = useState<QuickRange>("all");
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  // Reset class filter when model (classMap) changes
  useEffect(() => {
    setSelectedClassIds(new Set());
  }, [classMap]);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    return frames.filter((f) => {
      const t = new Date(f.timestamp).getTime();
      if (date) {
        const d = new Date(f.timestamp);
        if (
          d.getFullYear() !== date.getFullYear() ||
          d.getMonth() !== date.getMonth() ||
          d.getDate() !== date.getDate()
        )
          return false;
      }
      const inRange = (() => {
        switch (quickRange) {
          case "5m":
            return now - t <= 5 * 60 * 1000;
          case "1h":
            return now - t <= 60 * 60 * 1000;
          case "today": {
            const d = new Date(f.timestamp);
            const today = new Date();
            return (
              d.getFullYear() === today.getFullYear() &&
              d.getMonth() === today.getMonth() &&
              d.getDate() === today.getDate()
            );
          }
          case "all":
          default:
            return true;
        }
      })();
      if (!inRange) return false;
      if (selectedClassIds.size > 0) {
        const hit = f.boxes.some((b) => selectedClassIds.has(b.classId));
        if (!hit) return false;
      }
      return true;
    });
  }, [frames, date, quickRange, selectedClassIds]);

  const ranges: { id: QuickRange; label: string }[] = [
    { id: "5m", label: "Last 5 min" },
    { id: "1h", label: "Last 1 h" },
    { id: "today", label: "Today" },
    { id: "all", label: "All" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:max-w-[380px] p-0 flex flex-col bg-card border-l border-border"
      >
        <SheetHeader className="px-3 py-2 border-b border-border">
          <SheetTitle className="text-[11px] font-mono uppercase tracking-wider text-foreground">
            History
          </SheetTitle>
        </SheetHeader>

        <div className="px-3 py-2 space-y-2 border-b border-border">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 w-full justify-start text-[11px] font-mono bg-secondary border-border",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                {date ? format(date, "PPP") : "Any date"}
                {date && (
                  <X
                    className="w-3 h-3 ml-auto opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDate(undefined);
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="grid grid-cols-4 gap-1">
            {ranges.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={quickRange === r.id ? "default" : "secondary"}
                className="h-7 text-[10px] px-1"
                onClick={() => setQuickRange(r.id)}
              >
                {r.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                Categories
              </span>
              {selectedClassIds.size > 0 && (
                <button
                  onClick={() => setSelectedClassIds(new Set())}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.values(classMap).map((cls) => {
                const active = selectedClassIds.has(cls.id);
                return (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] font-mono transition-colors",
                      active
                        ? "bg-muted border-primary ring-1 ring-primary text-foreground"
                        : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: `hsl(${cls.color})` }}
                    />
                    {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Results</span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {filtered.length}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filtered.map((f) => {
              const isSelected = f.id === selectedId;
              const uniqueClassIds = Array.from(new Set(f.boxes.map((b) => b.classId)));
              return (
                <button
                  key={f.id}
                  onClick={() => onSelect(f.id)}
                  className={cn(
                    "text-left px-3 py-2 border-b border-border/50 transition-colors",
                    isSelected
                      ? "bg-muted/40 ring-1 ring-inset ring-primary"
                      : "hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-foreground">{formatDateTime(f.timestamp)}</span>
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
              );
            })}
            {filtered.length === 0 && (
              <div className="text-[10px] text-muted-foreground py-6 px-3 font-mono">
                No frames match the filter
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default DefectHistory;
