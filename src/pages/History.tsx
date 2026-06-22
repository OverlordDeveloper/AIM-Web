import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  ImageIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

const WS_URL = "ws://192.168.1.156:18080/api/ws/history";
const API_BASE = "http://192.168.1.156:18080";
const RESULTS_PER_PAGE = 100;
const MAX_RECORDS = 1000;

const CLASS_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
];

const TIME_OPTIONS = [
  "Last 30 minutes",
  "Last 1 hour",
  "Last 4 hours",
  "Last 8 hours",
];

type YoloDetection = {
  bbox: [number, number, number, number];
  label: string;
  score: number;
};

export interface HistoryRecord {
  id: number;
  timestamp: string;
  path: string;
  anomalyReject: boolean;
  yoloReject: boolean;
  imageUrl?: string;
  overlayUrl?: string;
  yoloDetections?: YoloDetection[] | string;
}

type HistoryBackendState = {
  total?: number;
  newestTimestamp?: string;
  oldestTimestamp?: string;
};

const getLabelColor = (label: string) => {
  let hash = 0;

  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }

  return CLASS_COLORS[Math.abs(hash) % CLASS_COLORS.length];
};

const normalizeDetections = (
  detections?: YoloDetection[] | string | null
): YoloDetection[] => {
  if (!detections) return [];

  let raw: unknown = detections;

  if (typeof detections === "string") {
    try {
      raw = JSON.parse(detections);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((d) => {
      const item = d as any;

      if (!Array.isArray(item.bbox) || item.bbox.length < 4) {
        return null;
      }

      return {
        label: String(item.label ?? "defect"),
        score: Number(item.score ?? 0),
        bbox: [
          Number(item.bbox[0]),
          Number(item.bbox[1]),
          Number(item.bbox[2]),
          Number(item.bbox[3]),
        ] as [number, number, number, number],
      };
    })
    .filter(Boolean) as YoloDetection[];
};

const timeSelectionToMinutes = (value: string) => {
  switch (value) {
    case "0":
      return 30;
    case "1":
      return 60;
    case "2":
      return 4 * 60;
    case "3":
      return 8 * 60;
    default:
      return 30;
  }
};

const parseTimestamp = (value?: string | null) => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const m = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})[ ,T]+(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (m) {
    const [, dd, mm, yyyy, hh, min, ss] = m;

    return new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss ?? "0")
    );
  }

  return null;
};

const formatDateTimeForBackend = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const History = () => {
  const { connected, lastMessage, sendJson } = useWebSocket(WS_URL);

  const imageRef = useRef<HTMLImageElement | null>(null);

  const [historyState, setHistoryState] = useState<HistoryBackendState | null>(
    null
  );

  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [timeSelection, setTimeSelection] = useState("0");
  const [filterAnomaly, setFilterAnomaly] = useState(true);
  const [filterYolo, setFilterYolo] = useState(true);
  const [displayMode, setDisplayMode] = useState<"image" | "overlay">("image");

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

  const [manualTimeEnabled, setManualTimeEnabled] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastMessage?.type === "history.state") {
      setHistoryState((lastMessage.state as HistoryBackendState) ?? null);
      return;
    }

    if (lastMessage?.type === "history.records") {
      const incoming = (lastMessage.records ?? []) as HistoryRecord[];
      setRecords(incoming.slice(0, MAX_RECORDS));
      setCurrentPage(0);

      if (incoming.length > 0) {
        setSelectedRecordId((prev) => prev ?? incoming[0].id);
      } else {
        setSelectedRecordId(null);
      }

      return;
    }

    if (lastMessage?.type === "history.image.response") {
      if (!lastMessage.ok) {
        console.error("history.image.response failed:", lastMessage.error);
        return;
      }

      const id = Number(lastMessage.id);

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                imageUrl: lastMessage.imageUrl ?? r.imageUrl,
                overlayUrl: lastMessage.overlayUrl ?? r.overlayUrl,
              }
            : r
        )
      );

      return;
    }

    if (lastMessage?.type === "history.record") {
      const record = lastMessage.record as HistoryRecord;

      setRecords((prev) => {
        const next = [record, ...prev.filter((r) => r.id !== record.id)];
        return next.slice(0, MAX_RECORDS);
      });

      setSelectedRecordId((prev) => prev ?? record.id);
    }
  }, [lastMessage]);

  const activeFilterCount = [filterAnomaly, filterYolo].filter(Boolean).length;

  const selectedDateTime = useMemo(() => {
    if (!selectedDate) return null;

    const dt = new Date(selectedDate);
    dt.setHours(selectedHour, selectedMinute, 0, 0);

    return dt;
  }, [selectedDate, selectedHour, selectedMinute]);

  const referenceTime = useMemo(() => {
    if (manualTimeEnabled && selectedDateTime) return selectedDateTime;
    return currentTime;
  }, [manualTimeEnabled, selectedDateTime, currentTime]);

  const backendReferenceTime = useMemo(() => {
    if (manualTimeEnabled && selectedDateTime) return selectedDateTime;
    return new Date();
  }, [manualTimeEnabled, selectedDateTime]);

  const filteredResults = useMemo(() => {
    const selectedMinutes = timeSelectionToMinutes(timeSelection);
    const anchorTime = referenceTime;

    const fromTime = new Date(
      anchorTime.getTime() - selectedMinutes * 60 * 1000
    );

    return records.filter((r) => {
      const ts = parseTimestamp(r.timestamp);

      const matchAnomaly = filterAnomaly && r.anomalyReject;
      const matchYolo = filterYolo && r.yoloReject;
      const matchReject = matchAnomaly || matchYolo;

      if (!matchReject) return false;
      if (!ts) return true;

      const inSelectedDay = sameDay(ts, anchorTime);
      const inWindow =
        ts.getTime() >= fromTime.getTime() &&
        ts.getTime() <= anchorTime.getTime();

      return inSelectedDay && inWindow;
    });
  }, [records, filterAnomaly, filterYolo, timeSelection, referenceTime]);

  useEffect(() => {
    setCurrentPage(0);
  }, [
    filterAnomaly,
    filterYolo,
    timeSelection,
    manualTimeEnabled,
    selectedDate,
    selectedHour,
    selectedMinute,
  ]);

  useEffect(() => {
    if (filteredResults.length === 0) {
      setSelectedRecordId(null);
      return;
    }

    if (
      selectedRecordId == null ||
      !filteredResults.some((r) => r.id === selectedRecordId)
    ) {
      setSelectedRecordId(filteredResults[0].id);
      setDisplayMode("image");
    }
  }, [filteredResults, selectedRecordId]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / RESULTS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages - 1);

  const pageResults = filteredResults.slice(
    safeCurrentPage * RESULTS_PER_PAGE,
    (safeCurrentPage + 1) * RESULTS_PER_PAGE
  );

  const selectedRecord = useMemo(
    () => filteredResults.find((r) => r.id === selectedRecordId) ?? null,
    [filteredResults, selectedRecordId]
  );

  const selectedDetections = useMemo(
    () => normalizeDetections(selectedRecord?.yoloDetections),
    [selectedRecord]
  );

  const toApiUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url}`;
  };

  const selectedImageUrl = selectedRecord
    ? toApiUrl(selectedRecord.imageUrl)
    : null;

  const selectedOverlayUrl = selectedRecord
    ? toApiUrl(selectedRecord.overlayUrl)
    : null;

  const canToggleHeatmap =
    !!selectedRecord?.anomalyReject && !!selectedOverlayUrl;

  const shownImageUrl =
    displayMode === "overlay" && canToggleHeatmap
      ? selectedOverlayUrl
      : selectedImageUrl;

  const showBoxOverlay =
    selectedDetections.length > 0 &&
    imageSize.width > 0 &&
    imageSize.height > 0;

  const sendRefresh = useCallback(() => {
    sendJson({
      type: "history.refresh",
      timestamp: formatDateTimeForBackend(
        manualTimeEnabled && selectedDateTime ? selectedDateTime : new Date()
      ),
      timeSelection,
      filters: {
        anomaly: filterAnomaly,
        yolo: filterYolo,
      },
    });
  }, [
    manualTimeEnabled,
    selectedDateTime,
    timeSelection,
    filterAnomaly,
    filterYolo,
    sendJson,
  ]);

  useEffect(() => {
    sendJson({
      type: "history.refresh",
      timestamp: formatDateTimeForBackend(backendReferenceTime),
      timeSelection,
      filters: {
        anomaly: filterAnomaly,
        yolo: filterYolo,
      },
    });
  }, [
    backendReferenceTime,
    timeSelection,
    filterAnomaly,
    filterYolo,
    sendJson,
  ]);

  const displayedReferenceLabel = manualTimeEnabled
    ? `${selectedDateTime?.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })} ${selectedDateTime?.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`
    : "Live time";

  const handleSelectRecord = useCallback(
    (record: HistoryRecord) => {
      setSelectedRecordId(record.id);
      setDisplayMode("image");
      setImageSize({ width: 0, height: 0 });

      sendJson({
        type: "history.image.request",
        id: record.id,
      });
    },
    [sendJson]
  );

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[22%] min-w-[240px] flex flex-col border-r border-border bg-card">
          <div className="px-4 py-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between relative">
              <span className="text-xs font-mono text-muted-foreground/70 tabular-nums">
                {currentTime.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                {currentTime.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>

              <h2 className="text-base font-bold text-foreground tracking-wider uppercase absolute left-1/2 -translate-x-1/2">
                History
              </h2>

              <div className="w-0" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-semibold shrink-0">
                Filters:
              </span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm font-medium gap-1.5 flex-1"
                  >
                    <Filter className="w-3 h-3" />
                    Select filters
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 px-1.5 text-xs font-semibold"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-56 p-3" align="start">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filterAnomaly}
                        onCheckedChange={(v) => setFilterAnomaly(!!v)}
                      />
                      <span className="text-[11px] text-foreground">
                        Anomaly
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filterYolo}
                        onCheckedChange={(v) => setFilterYolo(!!v)}
                      />
                      <span className="text-[11px] text-foreground">
                        Defect Detection
                      </span>
                    </label>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-semibold shrink-0">
                Time:
              </span>

              <Select value={timeSelection} onValueChange={setTimeSelection}>
                <SelectTrigger className="h-8 text-sm font-medium flex-1">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {TIME_OPTIONS.map((opt, i) => (
                    <SelectItem key={i} value={String(i)} className="text-sm">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={(e) => {
                      if (manualTimeEnabled) {
                        e.preventDefault();
                        e.stopPropagation();
                        setManualTimeEnabled(false);
                        setCalendarOpen(false);
                        return;
                      }

                      setManualTimeEnabled(true);
                      setCalendarOpen(true);
                    }}
                    className={cn(
                      "h-7 w-7 shrink-0 transition-all",
                      manualTimeEnabled &&
                        "border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.65)] bg-primary/10"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setManualTimeEnabled(true);
                      }
                    }}
                    initialFocus
                    today={undefined}
                    className={cn("p-2 pointer-events-auto")}
                  />

                  <div className="flex items-center gap-2 px-2 pb-2 pt-1 border-t border-border mt-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />

                    <Select
                      value={String(selectedHour)}
                      onValueChange={(v) => {
                        setSelectedHour(Number(v));
                        setManualTimeEnabled(true);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-sm font-mono font-semibold">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={String(i)}
                            className="text-sm font-mono"
                          >
                            {String(i).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-sm font-bold text-muted-foreground">
                      :
                    </span>

                    <Select
                      value={String(selectedMinute)}
                      onValueChange={(v) => {
                        setSelectedMinute(Number(v));
                        setManualTimeEnabled(true);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px] text-sm font-mono font-semibold">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={String(i)}
                            className="text-sm font-mono"
                          >
                            {String(i).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Refresh"
                onClick={sendRefresh}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground font-mono">
              reference: {displayedReferenceLabel}
            </div>

            {historyState?.total != null && (
              <div className="text-xs text-muted-foreground font-mono">
                records: {historyState.total}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="py-1">
              {pageResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 font-medium">
                  No results found
                </p>
              )}

              {pageResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => handleSelectRecord(res)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-mono font-medium transition-colors",
                    selectedRecordId === res.id
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/80 hover:bg-secondary"
                  )}
                >
                  <span className="truncate flex-1">
                    {res.timestamp || res.path}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {res.anomalyReject && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-bold bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0"
                      >
                        anomaly
                      </Badge>
                    )}

                    {res.yoloReject && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-bold bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0"
                      >
                        Defect Detection
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="px-4 py-2 border-t border-border flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={safeCurrentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <span className="text-sm font-mono font-medium text-muted-foreground min-w-[60px] text-center">
              {safeCurrentPage + 1} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={safeCurrentPage >= totalPages - 1}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-background relative p-4">
          {selectedRecord ? (
            <>
              <button
                onClick={() => {
                  if (!canToggleHeatmap) return;
                  setDisplayMode((m) => (m === "image" ? "overlay" : "image"));
                }}
                className={cn(
                  "relative rounded border border-border bg-card overflow-hidden aspect-square",
                  canToggleHeatmap
                    ? "cursor-pointer hover:border-primary/40 transition-colors"
                    : "cursor-default"
                )}
                style={{
                  width: "min(calc(100% - 2rem), calc(100vh - 10rem))",
                  height: "min(calc(100% - 2rem), calc(100vh - 10rem))",
                }}
                title={
                  canToggleHeatmap
                    ? "Click to toggle anomaly heatmap"
                    : "Defect boxes are always shown"
                }
              >
                {shownImageUrl ? (
                  <>
                    <img
                      ref={imageRef}
                      src={shownImageUrl}
                      alt={selectedRecord.path}
                      className="w-full h-full object-contain"
                      onLoad={(e) => {
                        setImageSize({
                          width: e.currentTarget.naturalWidth,
                          height: e.currentTarget.naturalHeight,
                        });
                      }}
                    />

                    {showBoxOverlay && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {selectedDetections.map((det, index) => {
                          const [x, y, w, h] = det.bbox;
                          const color = getLabelColor(det.label);
                          const label = `${det.label} ${Math.round(
                            det.score * 100
                          )}%`;

                          return (
                            <g key={`${det.label}-${index}`}>
                              <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                fill="none"
                                stroke={color}
                                strokeWidth={3}
                              />

                              <rect
                                x={x}
                                y={Math.max(0, y - 24)}
                                width={Math.max(90, label.length * 8)}
                                height={24}
                                fill={color}
                                opacity={0.95}
                              />

                              <text
                                x={x + 6}
                                y={Math.max(16, y - 7)}
                                fontSize={14}
                                fontWeight={700}
                                fill="#ffffff"
                              >
                                {label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm text-muted-foreground font-mono font-medium">
                        {selectedRecord.path}
                      </p>
                    </div>
                  </div>
                )}
              </button>

              <div className="flex items-center gap-2 mt-2 shrink-0">
                <span className="text-xs text-muted-foreground font-mono font-medium">
                  {selectedRecord.timestamp}
                </span>

                {selectedRecord.anomalyReject && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-bold bg-[hsl(230,60%,70%)]/15 text-[hsl(230,60%,70%)] border-0"
                  >
                    anomaly
                  </Badge>
                )}

                {selectedRecord.yoloReject && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-bold bg-[hsl(35,90%,60%)]/15 text-[hsl(35,90%,60%)] border-0"
                  >
                    Defect Detection
                  </Badge>
                )}

                {selectedDetections.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-bold border-0"
                  >
                    {selectedDetections.length} boxes
                  </Badge>
                )}

                {canToggleHeatmap && (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold"
                  >
                    {displayMode === "overlay" ? "heatmap" : "image"}
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground font-mono font-medium">
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