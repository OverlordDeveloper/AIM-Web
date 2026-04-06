import { useMemo, useState, useCallback } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Y_MAX_CAP = 15;

interface AnomalyChartPoint {
  index: number;
  value: number;
  id?: number;
}

interface AnomalyChartProps {
  data: AnomalyChartPoint[];
  threshold: number;
  onThresholdChange: (value: number) => void;
  enabled: boolean;
  selectedRecordId?: number | null;
}

const chartConfig: ChartConfig = {
  normal: { label: "Normal", color: "hsl(200, 70%, 50%)" },
  anomaly: { label: "Anomaly", color: "hsl(0, 72%, 51%)" },
};

const DEFAULT_Y_DOMAIN: [number, number] = [0, Y_MAX_CAP];
const MIN_Y_SPAN = 1;
const X_SPOTS = 30;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const AnomalyChart = ({
  data,
  threshold,
  onThresholdChange,
  enabled,
  selectedRecordId,
}: AnomalyChartProps) => {
  const [yDomain, setYDomain] = useState<[number, number]>(DEFAULT_Y_DOMAIN);

  const visibleData = useMemo(() => {
    const last30 = data.slice(-X_SPOTS);

    return last30.map((point, i) => ({
      ...point,
      slot: i,
    }));
  }, [data]);

  const xTicks = useMemo(
    () => Array.from({ length: X_SPOTS }, (_, i) => i),
    []
  );

  const handleResetYZoom = useCallback(() => {
    if (visibleData.length === 0) {
      setYDomain(DEFAULT_Y_DOMAIN);
      return;
    }

    const values = visibleData.map((p) => p.value);
    const dataMin = Math.min(...values, threshold);
    const dataMax = Math.max(...values, threshold);
    const dataSpan = Math.max(dataMax - dataMin, MIN_Y_SPAN);
    const padding = Math.max(dataSpan * 0.15, 1);

    let nextMin = Math.max(0, dataMin - padding);
    let nextMax = Math.min(dataMax + padding, Y_MAX_CAP);

    if (nextMax - nextMin < MIN_Y_SPAN) {
      nextMin = Math.max(0, nextMax - MIN_Y_SPAN);
      nextMax = Math.min(Y_MAX_CAP, nextMin + MIN_Y_SPAN);
    }

    setYDomain([nextMin, nextMax]);
  }, [visibleData, threshold]);

  const handleWheelZoom = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (visibleData.length === 0) return;

      const values = visibleData.map((p) => p.value);
      const dataMin = Math.min(...values, threshold);
      const dataMax = Math.max(...values, threshold);

      const dataSpanRaw = dataMax - dataMin;
      const dataSpan = Math.max(dataSpanRaw, MIN_Y_SPAN);
      const padding = Math.max(dataSpan * 0.15, 1);

      const targetMin = Math.max(0, dataMin - padding);
      const targetMax = Math.min(dataMax + padding, Y_MAX_CAP);
      const targetCenter = (targetMin + targetMax) / 2;
      const targetSpan = Math.max(targetMax - targetMin, MIN_Y_SPAN);

      setYDomain((prev) => {
        const prevSpan = prev[1] - prev[0];
        const zoomFactor = e.deltaY > 0 ? 1.6 : 0.5;
        const nextSpan = clamp(prevSpan * zoomFactor, MIN_Y_SPAN, Y_MAX_CAP);

        let nextMin = targetCenter - nextSpan / 2;
        let nextMax = targetCenter + nextSpan / 2;

        if (nextSpan < targetSpan) {
          nextMin = targetMin;
          nextMax = targetMax;
        }

        if (nextMin < 0) {
          nextMax -= nextMin;
          nextMin = 0;
        }

        if (nextMax > Y_MAX_CAP) {
          nextMin -= nextMax - Y_MAX_CAP;
          nextMax = Y_MAX_CAP;
        }

        nextMin = Math.max(0, nextMin);
        nextMax = Math.min(Y_MAX_CAP, nextMax);

        if (nextMax - nextMin < MIN_Y_SPAN) {
          nextMin = Math.max(0, nextMax - MIN_Y_SPAN);
          nextMax = Math.min(Y_MAX_CAP, nextMin + MIN_Y_SPAN);
        }

        return [nextMin, nextMax];
      });
    },
    [visibleData, threshold]
  );

  return (
    <div
      className={cn(
        "h-full min-h-0 p-3 flex flex-col",
        !enabled && "opacity-40 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider shrink-0">
          Anomaly Score
        </h3>

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            Threshold: {threshold.toFixed(1)}
          </span>

          <Slider
            value={[threshold]}
            onValueChange={([v]) => onThresholdChange(v)}
            min={0}
            max={Y_MAX_CAP}
            step={0.01}
            className="w-32"
          />

          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            Y: {yDomain[0].toFixed(1)} - {yDomain[1].toFixed(1)}
          </span>

          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-[10px]"
            onClick={handleResetYZoom}
          >
            Reset Y
          </Button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 rounded border border-border bg-card/30"
        onWheel={handleWheelZoom}
      >
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              margin={{ top: 12, right: 16, bottom: 12, left: 8 }}
              data={visibleData}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220, 10%, 18%)"
              />

              <XAxis
                dataKey="slot"
                type="number"
                domain={[0, X_SPOTS - 1]}
                ticks={xTicks}
                tick={false}
                tickLine={false}
                axisLine={{ stroke: "hsl(220, 8%, 30%)" }}
                allowDataOverflow
              />

              <YAxis
                dataKey="value"
                type="number"
                domain={[yDomain[0], Math.min(yDomain[1], Y_MAX_CAP)]}
                tick={{ fontSize: 10 }}
                stroke="hsl(220, 8%, 45%)"
                allowDataOverflow
                tickFormatter={(v: number) => v.toFixed(1)}
              />

              <ChartTooltip
              isAnimationActive={false}
              content={
                <ChartTooltipContent
                  formatter={(value: number) => value.toFixed(1)}
                />
              }
            />

              <ReferenceLine
                y={threshold}
                stroke="hsl(0, 72%, 51%)"
                strokeDasharray="6 3"
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{
                  value: "Threshold",
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(0, 72%, 51%)",
                }}
              />

              <Line
                type="linear"
                dataKey="value"
                stroke="hsl(200, 70%, 50%, 0.7)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

            <Scatter
              name="Values"
              data={visibleData}
              isAnimationActive={false}
              animationDuration={0}
            >
              {visibleData.map((entry) => (
                <Cell
                  key={entry.slot}
                  fill={
                    entry.value > threshold
                      ? "hsl(0, 72%, 51%)"
                      : "hsl(200, 70%, 50%)"
                  }
                />
              ))}
            </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default AnomalyChart;