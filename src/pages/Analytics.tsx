import { useState, useMemo, useEffect } from "react";
import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

const WS_URL = "ws://192.168.1.156:18080/api/ws/history";
const API_BASE = "http://192.168.1.156:18080";

interface HistoryRecord {
  id: number;
  timestamp: string;
  path: string;
  anomalyReject: boolean;
  yoloReject: boolean;
  imageUrl?: string;
  overlayUrl?: string;
}

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

const RANGE_OPTIONS = [
  { label: "Last 24 hours", value: "24h", hours: 24 },
  { label: "Last 7 days", value: "7d", hours: 7 * 24 },
  { label: "Last 30 days", value: "30d", hours: 30 * 24 },
];

const PIE_COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(45, 100%, 55%)",
  "hsl(142, 71%, 45%)",
  "hsl(200, 80%, 55%)",
];

const barChartConfig: ChartConfig = {
  total: { label: "Total", color: "hsl(var(--primary))" },
  anomaly: { label: "Anomaly", color: "hsl(0, 72%, 51%)" },
  yolo: { label: "YOLO", color: "hsl(45, 100%, 55%)" },
};

const lineChartConfig: ChartConfig = {
  anomalyRate: { label: "Anomaly %", color: "hsl(0, 72%, 51%)" },
  yoloRate: { label: "YOLO %", color: "hsl(45, 100%, 55%)" },
};

const hourlyChartConfig: ChartConfig = {
  defects: { label: "Defects", color: "hsl(0, 72%, 51%)" },
};

const pieChartConfig: ChartConfig = {
  anomalyOnly: { label: "Anomaly Only", color: "hsl(0, 72%, 51%)" },
  yoloOnly: { label: "YOLO Only", color: "hsl(45, 100%, 55%)" },
  both: { label: "Both", color: "hsl(280, 70%, 55%)" },
  passed: { label: "Passed", color: "hsl(142, 71%, 45%)" },
};

const Analytics = () => {
  const { connected, lastMessage, sendJson } = useWebSocket(WS_URL);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [range, setRange] = useState("7d");

  useEffect(() => {
    if (lastMessage?.type === "history.records") {
      const incoming = (lastMessage.records ?? []) as HistoryRecord[];
      setRecords(incoming);
    }
    if (lastMessage?.type === "history.record") {
      const record = lastMessage.record as HistoryRecord;
      setRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
    }
  }, [lastMessage]);

  // Request data on mount and range change
  useEffect(() => {
    const now = new Date();
    sendJson({
      type: "history.refresh",
      timestamp: formatDateTimeForBackend(now),
      timeSelection: "3", // request max window
      filters: { anomaly: true, yolo: true },
    });
  }, [range, sendJson]);

  const rangeHours = RANGE_OPTIONS.find((r) => r.value === range)?.hours ?? 168;

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);
    return records.filter((r) => {
      const ts = parseTimestamp(r.timestamp);
      return ts && ts.getTime() >= cutoff.getTime();
    });
  }, [records, rangeHours]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const anomalyRejects = filteredRecords.filter((r) => r.anomalyReject).length;
    const yoloRejects = filteredRecords.filter((r) => r.yoloReject).length;
    const totalDefects = filteredRecords.filter(
      (r) => r.anomalyReject || r.yoloReject
    ).length;
    const passRate = total > 0 ? ((total - totalDefects) / total) * 100 : 0;
    const defectRate = total > 0 ? (totalDefects / total) * 100 : 0;
    return { total, anomalyRejects, yoloRejects, totalDefects, passRate, defectRate };
  }, [filteredRecords]);

  // Daily aggregation for bar + line charts
  const dailyData = useMemo(() => {
    const buckets: Record<
      string,
      { date: string; total: number; anomaly: number; yolo: number }
    > = {};

    filteredRecords.forEach((r) => {
      const ts = parseTimestamp(r.timestamp);
      if (!ts) return;
      const key = ts.toISOString().slice(0, 10);
      if (!buckets[key])
        buckets[key] = { date: key, total: 0, anomaly: 0, yolo: 0 };
      buckets[key].total++;
      if (r.anomalyReject) buckets[key].anomaly++;
      if (r.yoloReject) buckets[key].yolo++;
    });

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const dailyRateData = useMemo(() => {
    return dailyData.map((d) => ({
      date: d.date,
      anomalyRate: d.total > 0 ? +((d.anomaly / d.total) * 100).toFixed(1) : 0,
      yoloRate: d.total > 0 ? +((d.yolo / d.total) * 100).toFixed(1) : 0,
    }));
  }, [dailyData]);

  // Hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, "0"),
      defects: 0,
    }));
    filteredRecords.forEach((r) => {
      if (!r.anomalyReject && !r.yoloReject) return;
      const ts = parseTimestamp(r.timestamp);
      if (!ts) return;
      hours[ts.getHours()].defects++;
    });
    return hours;
  }, [filteredRecords]);

  // Pie data
  const pieData = useMemo(() => {
    let anomalyOnly = 0;
    let yoloOnly = 0;
    let both = 0;
    let passed = 0;
    filteredRecords.forEach((r) => {
      if (r.anomalyReject && r.yoloReject) both++;
      else if (r.anomalyReject) anomalyOnly++;
      else if (r.yoloReject) yoloOnly++;
      else passed++;
    });
    return [
      { name: "Anomaly Only", value: anomalyOnly, fill: PIE_COLORS[0] },
      { name: "YOLO Only", value: yoloOnly, fill: PIE_COLORS[1] },
      { name: "Both", value: both, fill: PIE_COLORS[3] },
      { name: "Passed", value: passed, fill: PIE_COLORS[2] },
    ].filter((d) => d.value > 0);
  }, [filteredRecords]);

  const formatDateLabel = (val: string) => {
    const parts = val.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground tracking-wide uppercase">
                Analytics
              </h1>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[180px] h-9 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Inspections"
                value={stats.total}
                icon={<Eye className="w-4 h-4" />}
              />
              <StatCard
                title="Total Defects"
                value={stats.totalDefects}
                icon={<XCircle className="w-4 h-4" />}
                accent="destructive"
              />
              <StatCard
                title="Defect Rate"
                value={`${stats.defectRate.toFixed(1)}%`}
                icon={<TrendingUp className="w-4 h-4" />}
                accent="destructive"
              />
              <StatCard
                title="Pass Rate"
                value={`${stats.passRate.toFixed(1)}%`}
                icon={<CheckCircle className="w-4 h-4" />}
                accent="success"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Detections Over Time */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Detections Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={barChartConfig} className="h-[280px] w-full">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateLabel}
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220 8% 45%)" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--primary))"
                        radius={[3, 3, 0, 0]}
                        name="Total"
                      />
                      <Bar
                        dataKey="anomaly"
                        fill="hsl(0, 72%, 51%)"
                        radius={[3, 3, 0, 0]}
                        name="Anomaly"
                      />
                      <Bar
                        dataKey="yolo"
                        fill="hsl(45, 100%, 55%)"
                        radius={[3, 3, 0, 0]}
                        name="YOLO"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Defect Rate Trend */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Defect Rate Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
                    <LineChart data={dailyRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateLabel}
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                        unit="%"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="anomalyRate"
                        stroke="hsl(0, 72%, 51%)"
                        strokeWidth={2}
                        dot={false}
                        name="Anomaly %"
                      />
                      <Line
                        type="monotone"
                        dataKey="yoloRate"
                        stroke="hsl(45, 100%, 55%)"
                        strokeWidth={2}
                        dot={false}
                        name="YOLO %"
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Hourly Distribution */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Hourly Defect Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={hourlyChartConfig} className="h-[280px] w-full">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220 8% 45%)" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="defects"
                        fill="hsl(0, 72%, 51%)"
                        radius={[3, 3, 0, 0]}
                        name="Defects"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Defects by Type */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Defects by Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        strokeWidth={2}
                        stroke="hsl(220 14% 11%)"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "destructive" | "success";
}) => (
  <Card className="bg-card border-border">
    <CardContent className="p-4 flex items-center gap-3">
      <div
        className={`p-2 rounded-lg ${
          accent === "destructive"
            ? "bg-destructive/10 text-destructive"
            : accent === "success"
            ? "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]"
            : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default Analytics;
