import { useState, useMemo } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, RefreshCw, Filter, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WS_URL = "ws://127.0.0.1:18080/api/ws/live";

interface HistoryResult {
  id: number;
  time: string;
  path: string;
  anomalyReject: boolean;
  yoloReject: boolean;
}

const generateMockResults = (): HistoryResult[] => {
  const results: HistoryResult[] = [];
  const now = new Date();
  for (let i = 0; i < 247; i++) {
    const t = new Date(now.getTime() - i * 45000);
    const timeStr = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = t.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    results.push({
      id: i,
      time: `${dateStr} ${timeStr}`,
      path: `rejects/img_${String(i).padStart(4, "0")}.aim`,
      anomalyReject: Math.random() > 0.4,
      yoloReject: Math.random() > 0.6,
    });
  }
  return results;
};

const RESULTS_PER_PAGE = 60;
const TIME_OPTIONS = ["Last 30 minutes", "Last 1 hour", "Last 8 hours", "Last 24 hours"];

const History = () => {
  const { connected } = useWebSocket(WS_URL);
  const [results] = useState<HistoryResult[]>(generateMockResults);
  const [selectedId, setSelectedId] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeSelection, setTimeSelection] = useState("0");
  const [filterAnomaly, setFilterAnomaly] = useState(true);
  const [filterYolo, setFilterYolo] = useState(true);
  const [displayMode, setDisplayMode] = useState<"image" | "overlay">("image");

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchAnomaly = filterAnomaly && r.anomalyReject;
      const matchYolo = filterYolo && r.yoloReject;
      return matchAnomaly || matchYolo;
    });
  }, [results, filterAnomaly, filterYolo]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE));
  const pageResults = filteredResults.slice(
    currentPage * RESULTS_PER_PAGE,
    (currentPage + 1) * RESULTS_PER_PAGE
  );

  const selectedResult = filteredResults.find((r) => r.id === selectedId);

  const activeFilterCount = [filterAnomaly, filterYolo].filter(Boolean).length;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      {/* Top toolbar */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-card flex items-center gap-3 flex-wrap">
        <h2 className="text-xs font-semibold text-foreground tracking-wider uppercase mr-2">History</h2>

        <div className="h-4 w-px bg-border" />

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
              <Filter className="w-3 h-3" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-3" align="start">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={filterAnomaly} onCheckedChange={(v) => { setFilterAnomaly(!!v); setCurrentPage(0); }} />
                <span className="text-[11px] text-foreground">Anomaly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={filterYolo} onCheckedChange={(v) => { setFilterYolo(!!v); setCurrentPage(0); }} />
                <span className="text-[11px] text-foreground">YOLO</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>

        {/* Time range */}
        <Select value={timeSelection} onValueChange={setTimeSelection}>
          <SelectTrigger className="h-7 w-[160px] text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((opt, i) => (
              <SelectItem key={i} value={String(i)} className="text-[11px]">{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="h-7 w-7" title="Refresh">
          <RefreshCw className="w-3 h-3" />
        </Button>

        <div className="flex-1" />

        {/* Pagination */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-mono mr-1">
            {filteredResults.length} results
          </span>
          <Button variant="outline" size="icon" className="h-6 w-6" disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground min-w-[40px] text-center">
            {currentPage + 1}/{totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-6 w-6" disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid area */}
        <ScrollArea className={cn("flex-1 transition-all", selectedResult ? "w-[55%]" : "w-full")}>
          <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
            {pageResults.map((res) => (
              <button
                key={res.id}
                onClick={() => { setSelectedId(res.id); setDisplayMode("image"); }}
                className={cn(
                  "text-left rounded-md border p-2.5 transition-all",
                  selectedId === res.id
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/20 hover:bg-card/80"
                )}
              >
                {/* Thumbnail placeholder */}
                <div className="w-full aspect-video rounded bg-secondary/50 mb-2 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-muted-foreground/20" />
                </div>
                <p className="text-[10px] font-mono text-foreground/80 truncate">{res.time}</p>
                <div className="flex items-center gap-1 mt-1">
                  {res.anomalyReject && (
                    <Badge variant="secondary" className="h-3.5 px-1 text-[8px] font-semibold bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0">
                      anomaly
                    </Badge>
                  )}
                  {res.yoloReject && (
                    <Badge variant="secondary" className="h-3.5 px-1 text-[8px] font-semibold bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0">
                      yolo
                    </Badge>
                  )}
                </div>
              </button>
            ))}
            {pageResults.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <p className="text-[11px] text-muted-foreground">No results found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Side panel — image preview */}
        {selectedResult && (
          <div className="w-[45%] min-w-[360px] border-l border-border bg-card flex flex-col">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-foreground/80">{selectedResult.time}</span>
                {selectedResult.anomalyReject && (
                  <Badge variant="secondary" className="text-[8px] bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0">anomaly</Badge>
                )}
                {selectedResult.yoloReject && (
                  <Badge variant="secondary" className="text-[8px] bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0">yolo</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedId(-1)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <button
                onClick={() => setDisplayMode((m) => (m === "image" ? "overlay" : "image"))}
                className="relative rounded border border-border bg-background overflow-hidden cursor-pointer hover:border-primary/30 transition-colors w-full max-w-[640px] aspect-video flex items-center justify-center"
                title="Click to toggle overlay"
              >
                <div className="text-center space-y-2">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-[10px] text-muted-foreground font-mono">{selectedResult.path}</p>
                  <p className="text-[9px] text-muted-foreground/50">
                    {displayMode === "image" ? "Base Image" : "Image + Anomaly Overlay"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
