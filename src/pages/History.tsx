import { useState, useMemo } from "react";
import { format } from "date-fns";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, RefreshCw, Filter, ImageIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const WS_URL = "ws://127.0.0.1:18080/api/ws/live";

interface HistoryResult {
  id: number;
  time: string;
  path: string;
  anomalyReject: boolean;
  yoloReject: boolean;
}

// Mock data for UI demonstration
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

const RESULTS_PER_PAGE = 100;
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
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

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
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — 30% */}
        <div className="w-[30%] min-w-[280px] flex flex-col border-r border-border bg-card">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border space-y-3">
            <h2 className="text-xs font-semibold text-foreground tracking-wider uppercase text-center">
              History
            </h2>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium shrink-0">Filters:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5 flex-1">
                    <Filter className="w-3 h-3" />
                    Select filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filterAnomaly}
                        onCheckedChange={(v) => {
                          setFilterAnomaly(!!v);
                          setCurrentPage(0);
                        }}
                      />
                      <span className="text-[11px] text-foreground">Anomaly</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filterYolo}
                        onCheckedChange={(v) => {
                          setFilterYolo(!!v);
                          setCurrentPage(0);
                        }}
                      />
                      <span className="text-[11px] text-foreground">YOLO</span>
                    </label>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Time range */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium shrink-0">Time:</span>
              <Select value={timeSelection} onValueChange={setTimeSelection}>
                <SelectTrigger className="h-7 text-[11px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((opt, i) => (
                    <SelectItem key={i} value={String(i)} className="text-[11px]">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={(dateFrom || dateTo) ? "secondary" : "outline"}
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title="Custom date range"
                  >
                    <Clock className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="space-y-3">
                    <p className="text-[11px] font-medium text-foreground">Custom Date Range</p>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">From</span>
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className={cn("p-2 pointer-events-auto rounded border border-border")}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">To</span>
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          className={cn("p-2 pointer-events-auto rounded border border-border")}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5 w-full"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Fetch results
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Refresh"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Results list */}
          <ScrollArea className="flex-1">
            <div className="py-1">
              {pageResults.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-8">
                  No results found
                </p>
              )}
              {pageResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    setSelectedId(res.id);
                    setDisplayMode("image");
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono transition-colors",
                    selectedId === res.id
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-secondary"
                  )}
                >
                  <span className="truncate flex-1">{res.time}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {res.anomalyReject && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[8px] font-semibold bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0"
                      >
                        anomaly
                      </Badge>
                    )}
                    {res.yoloReject && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[8px] font-semibold bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0"
                      >
                        yolo
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="px-4 py-2 border-t border-border flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground min-w-[60px] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Right panel — 70% image viewer */}
        <div className="flex-1 flex flex-col items-center justify-center bg-background relative p-4">
          {selectedResult ? (
            <>
              <button
                onClick={() =>
                  setDisplayMode((m) => (m === "image" ? "overlay" : "image"))
                }
                className="relative rounded border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 transition-colors aspect-square"
                style={{ width: 'min(calc(100% - 2rem), calc(100vh - 10rem))', height: 'min(calc(100% - 2rem), calc(100vh - 10rem))' }}
                title="Click to toggle overlay"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {selectedResult.path}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      Mode: {displayMode === "image" ? "Base Image" : "Image + Anomaly Overlay"}
                    </p>
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-2 mt-2 shrink-0">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {selectedResult.time}
                </span>
                {selectedResult.anomalyReject && (
                  <Badge variant="secondary" className="text-[9px] bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0">
                    anomaly
                  </Badge>
                )}
                {selectedResult.yoloReject && (
                  <Badge variant="secondary" className="text-[9px] bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0">
                    yolo
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-[11px] text-muted-foreground font-mono">
                Select a result to view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
