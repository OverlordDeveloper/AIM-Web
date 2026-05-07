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
} from "recharts";
import { TrendingUp, Eye, CheckCircle, XCircle } from "lucide-react";

const WS_URL = "ws://192.168.1.156:18080/api/ws/analytics";

interface AnalyticsStats {
  total: number;
  anomalyRejects: number;
  yoloRejects: number;
  totalDefects: number;
  passRate: number;
  defectRate: number;
}

interface DailyDataItem {
  date: string;
  total: number;
  anomaly: number;
  yolo: number;
}

interface DailyRateDataItem {
  date: string;
  anomalyRate: number;
  yoloRate: number;
}

interface HourlyDataItem {
  hour: string;
  defects: number;
}

interface PieDataItem {
  name: string;
  value: number;
  fill?: string;
}

interface AnalyticsSummaryMessage {
  type: "analytics.summary";
  range: string;
  stats: AnalyticsStats;
  dailyData: DailyDataItem[];
  dailyRateData: DailyRateDataItem[];
  hourlyData: HourlyDataItem[];
  pieData: PieDataItem[];
}

const emptyStats: AnalyticsStats = {
  total: 0,
  anomalyRejects: 0,
  yoloRejects: 0,
  totalDefects: 0,
  passRate: 0,
  defectRate: 0,
};

const RANGE_OPTIONS = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

const PIE_COLORS: Record<string, string> = {
  "Anomaly Only": "hsl(0, 72%, 51%)",
  "YOLO Only": "hsl(45, 100%, 55%)",
  Both: "hsl(200, 80%, 55%)",
  Passed: "hsl(142, 71%, 45%)",
};

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
  both: { label: "Both", color: "hsl(200, 80%, 55%)" },
  passed: { label: "Passed", color: "hsl(142, 71%, 45%)" },
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

const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeSummary = (msg: any): AnalyticsSummaryMessage => {
  const stats = msg?.stats ?? {};

  return {
    type: "analytics.summary",
    range: String(msg?.range ?? "7d"),
    stats: {
      total: asNumber(stats.total),
      anomalyRejects: asNumber(stats.anomalyRejects),
      yoloRejects: asNumber(stats.yoloRejects),
      totalDefects: asNumber(stats.totalDefects),
      passRate: asNumber(stats.passRate),
      defectRate: asNumber(stats.defectRate),
    },
    dailyData: Array.isArray(msg?.dailyData)
      ? msg.dailyData.map((d: any) => ({
          date: String(d.date ?? ""),
          total: asNumber(d.total),
          anomaly: asNumber(d.anomaly),
          yolo: asNumber(d.yolo),
        }))
      : [],
    dailyRateData: Array.isArray(msg?.dailyRateData)
      ? msg.dailyRateData.map((d: any) => ({
          date: String(d.date ?? ""),
          anomalyRate: asNumber(d.anomalyRate),
          yoloRate: asNumber(d.yoloRate),
        }))
      : [],
    hourlyData: Array.isArray(msg?.hourlyData)
      ? msg.hourlyData.map((d: any) => ({
          hour: String(d.hour ?? ""),
          defects: asNumber(d.defects),
        }))
      : [],
    pieData: Array.isArray(msg?.pieData)
      ? msg.pieData.map((d: any) => ({
          name: String(d.name ?? ""),
          value: asNumber(d.value),
          fill: PIE_COLORS[String(d.name ?? "")],
        }))
      : [],
  };
};

const formatDateLabel = (val: string) => {
  const parts = val.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
};

const Analytics = () => {
  const { connected, lastMessage, sendJson } = useWebSocket(WS_URL);

  const [range, setRange] = useState("7d");
  const [summary, setSummary] = useState<AnalyticsSummaryMessage>({
    type: "analytics.summary",
    range: "7d",
    stats: emptyStats,
    dailyData: [],
    dailyRateData: [],
    hourlyData: [],
    pieData: [],
  });

  useEffect(() => {
    if (lastMessage?.type === "analytics.summary") {
      setSummary(normalizeSummary(lastMessage));
    }
  }, [lastMessage]);

  useEffect(() => {
    if (!connected) return;

    sendJson({
      type: "analytics.refresh",
      timestamp: formatDateTimeForBackend(new Date()),
      range,
    });
  }, [connected, range, sendJson]);

  const stats = summary.stats;
  const dailyData = summary.dailyData;
  const dailyRateData = summary.dailyRateData;
  const hourlyData = summary.hourlyData;

  const pieData = useMemo(
    () => summary.pieData.filter((item) => item.value > 0),
    [summary.pieData]
  );

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-wide uppercase">
                  Analytics
                </h1>

                <p className="text-xs text-muted-foreground mt-1">
                  Aggregated inspection summary
                </p>
              </div>

              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[180px] h-9 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {RANGE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-sm"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Detections Over Time
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <ChartContainer
                    config={barChartConfig}
                    className="h-[280px] w-full"
                  >
                    <BarChart data={dailyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(220 10% 18%)"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateLabel}
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />

                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />

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

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Defect Rate Trend
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <ChartContainer
                    config={lineChartConfig}
                    className="h-[280px] w-full"
                  >
                    <LineChart data={dailyRateData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(220 10% 18%)"
                      />

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

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Hourly Defect Distribution
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <ChartContainer
                    config={hourlyChartConfig}
                    className="h-[280px] w-full"
                  >
                    <BarChart data={hourlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(220 10% 18%)"
                      />

                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />

                      <YAxis
                        tick={{ fontSize: 10 }}
                        stroke="hsl(220 8% 45%)"
                      />

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

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Defects by Type
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex items-center justify-center">
                  <ChartContainer
                    config={pieChartConfig}
                    className="h-[280px] w-full"
                  >
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
                          <Cell
                            key={`${entry.name}-${i}`}
                            fill={entry.fill ?? "hsl(var(--primary))"}
                          />
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
        <p className="text-xl font-bold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </CardContent>
  </Card>
);

export default Analytics;