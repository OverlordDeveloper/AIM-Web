import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, ChevronDown, History as HistoryIcon, SlidersHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { DetectionClass, DetectionFrame } from "@/lib/defectMock";

type QuickRange = "1h" | "4h" | "8h";

interface DefectHistoryPanelProps {
  frames: DetectionFrame[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  classMap: Record<string, DetectionClass>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
};

const DefectHistoryPanel = ({
  frames,
  selectedId,
  onSelect,
  classMap,
  collapsed,
  onToggleCollapsed,
}: DefectHistoryPanelProps) => {
  const [quickRange, setQuickRange] = useState<QuickRange>("1h");
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [minConfidence, setMinConfidence] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    setSelectedClassIds(new Set());
    setMinConfidence(0);
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
    const windowMs =
      quickRange === "1h" ? 60 * 60 * 1000 : quickRange === "4h" ? 4 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const out: { frame: DetectionFrame; qualifying: typeof frames[number]["boxes"] }[] = [];
    for (const f of frames) {
      const t = new Date(f.timestamp).getTime();
      if (now - t > windowMs) continue;
      const qualifying = f.boxes.filter(
        (b) =>
          b.confidence >= minConfidence &&
          (selectedClassIds.size === 0 || selectedClassIds.has(b.classId))
      );
      const hasActiveFilter = selectedClassIds.size > 0 || minConfidence > 0;
      if (hasActiveFilter && qualifying.length === 0) continue;
      out.push({ frame: f, qualifying });
    }
    return out;
  }, [frames, quickRange, selectedClassIds, minConfidence]);

  const ranges: { id: QuickRange; label: string }[] = [
    { id: "1h", label: "Last 1 h" },
    { id: "4h", label: "Last 4 h" },
    { id: "8h", label: "Last 8 h" },
  ];

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        className="w-7 shrink-0 border-l border-border bg-card hover:bg-secondary/60 flex flex-col items-center justify-start gap-2 py-2 transition-colors"
        aria-label="Expand history panel"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        <HistoryIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          History
        </span>
      </button>
    );
  }

  return (
    <aside className="w-[320px] shrink-0 border-l border-border bg-card flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-foreground">
          History
        </span>
        <button
          onClick={onToggleCollapsed}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Collapse history panel"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-2 space-y-2 border-b border-border">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3" />
            Filters
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1.5">
              {filtered.length}
            </Badge>
            <ChevronDown
              className={cn("w-3.5 h-3.5 transition-transform", !filtersOpen && "-rotate-90")}
            />
          </span>
        </button>

        {filtersOpen && (
          <div className="space-y-2 pt-1">
        <div className="grid grid-cols-3 gap-1">
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
              Min confidence
            </span>
            <span className="text-[10px] font-mono text-foreground tabular-nums">
              {Math.round(minConfidence * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round(minConfidence * 100)]}
            onValueChange={(v) => setMinConfidence((v[0] ?? 0) / 100)}
            min={0}
            max={100}
            step={5}
            className="py-1"
          />
          <div className="grid grid-cols-4 gap-1">
            {[0, 50, 75, 90].map((p) => {
              const active = Math.round(minConfidence * 100) === p;
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={active ? "default" : "secondary"}
                  className="h-6 text-[10px] px-1"
                  onClick={() => setMinConfidence(p / 100)}
                >
                  {p}%
                </Button>
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
          {filtered.map(({ frame: f, qualifying }) => {
            const isSelected = f.id === selectedId;
            const uniqueClassIds = Array.from(new Set(qualifying.map((b) => b.classId)));
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
                  <span className="text-muted-foreground">{qualifying.length} det</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 min-h-[10px]">
                  {uniqueClassIds.map((cid) => {
                    const cls = classMap[cid];
                    if (!cls) return null;
                    return (
                      <span
                        key={cid}
                        className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono leading-none"
                        style={{ borderColor: `hsl(${cls.color})`, color: `hsl(${cls.color})` }}
                      >
                        {cls.name}
                      </span>
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

      <div className="px-3 py-2 border-t border-border">
        <Link
          to="/history"
          className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          Older records → History
        </Link>
      </div>
    </aside>
  );
};

export default DefectHistoryPanel;
