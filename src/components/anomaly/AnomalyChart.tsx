import { useMemo, useState, useCallback, useRef } from "react";
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

const Y_MAX_CAP = 10;

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
  normal: { label: "Normal", color: "hsl(var(--primary))" },
  anomaly: { label: "Anomaly", color: "hsl(var(--destructive))" },
};

const DEFAULT_Y_DOMAIN: [number, number] = [0, Y_MAX_CAP];
const MIN_Y_SPAN = 1;
const X_SPOTS = 30;

// pixel distance allowed to "grab" the threshold line
const THRESHOLD_HIT_PX = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

// step scales with zoom span
const getThresholdStep = (span: number) => {
  if (span <= 1) return 0.01;
  if (span <= 2) return 0.02;
  if (span <= 4) return 0.05;
  if (span <= 8) return 0.1;
  return 0.25;
};

const AnomalyChart = ({
  data,
  threshold,
  onThresholdChange,
  enabled,
  selectedRecordId,
}: AnomalyChartProps) => {
  const [yDomain, setYDomain] = useState<[number, number]>(DEFAULT_Y_DOMAIN);

  const chartAreaRef = useRef<HTMLDivElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartDomainRef = useRef<[number, number] | null>(null);
  const isDraggingChartRef = useRef(false);
  const isDraggingThresholdRef = useRef(false);

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
    setYDomain(DEFAULT_Y_DOMAIN);
  }, []);

  const handleWheelZoom = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      setYDomain((prev) => {
        const prevSpan = prev[1] - prev[0];
        const zoomFactor = e.deltaY > 0 ? 1.6 : 0.5;
        const nextSpan = clamp(prevSpan * zoomFactor, MIN_Y_SPAN, Y_MAX_CAP);

        let nextMin = prev[0];
        let nextMax = nextMin + nextSpan;

        if (nextMax > Y_MAX_CAP) {
          nextMin = Y_MAX_CAP - nextSpan;
          nextMax = Y_MAX_CAP;
        }

        if (nextMin < 0) {
          nextMin = 0;
          nextMax = nextSpan;
        }

        return [nextMin, nextMax];
      });
    },
    []
  );

  const yToPixel = useCallback(
    (value: number, rect: DOMRect) => {
      const [minY, maxY] = yDomain;
      const ratio = (value - minY) / (maxY - minY);
      return rect.bottom - ratio * rect.height;
    },
    [yDomain]
  );

  const pixelToY = useCallback(
    (clientY: number, rect: DOMRect) => {
      const [minY, maxY] = yDomain;
      const ratio = clamp((rect.bottom - clientY) / rect.height, 0, 1);
      return minY + ratio * (maxY - minY);
    },
    [yDomain]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !chartAreaRef.current) return;

      const rect = chartAreaRef.current.getBoundingClientRect();
      const thresholdPixelY = yToPixel(threshold, rect);
      const isNearThreshold =
        Math.abs(e.clientY - thresholdPixelY) <= THRESHOLD_HIT_PX;

      if (isNearThreshold) {
        isDraggingThresholdRef.current = true;
        return;
      }

      dragStartYRef.current = e.clientY;
      dragStartDomainRef.current = yDomain;
      isDraggingChartRef.current = true;
    },
    [enabled, threshold, yDomain, yToPixel]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartAreaRef.current) return;

      const rect = chartAreaRef.current.getBoundingClientRect();

      if (isDraggingThresholdRef.current) {
        const rawValue = pixelToY(e.clientY, rect);
        const step = getThresholdStep(yDomain[1] - yDomain[0]);
        const snappedValue = roundToStep(rawValue, step);
        const nextThreshold = clamp(snappedValue, 0, Y_MAX_CAP);
        onThresholdChange(Number(nextThreshold.toFixed(4)));
        return;
      }

      if (
        !isDraggingChartRef.current ||
        dragStartYRef.current === null ||
        dragStartDomainRef.current === null
      ) {
        return;
      }

      if (rect.height <= 0) return;

      const pixelDelta = e.clientY - dragStartYRef.current;
      const startDomain = dragStartDomainRef.current;
      const span = startDomain[1] - startDomain[0];

      const valueDelta = (pixelDelta / rect.height) * span;
      let nextMin = startDomain[0] + valueDelta;
      let nextMax = startDomain[1] + valueDelta;

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

      setYDomain([nextMin, nextMax]);
    },
    [onThresholdChange, pixelToY, yDomain]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingChartRef.current = false;
    isDraggingThresholdRef.current = false;
    dragStartYRef.current = null;
    dragStartDomainRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingChartRef.current = false;
    isDraggingThresholdRef.current = false;
    dragStartYRef.current = null;
    dragStartDomainRef.current = null;
  }, []);

  const currentThresholdStep = getThresholdStep(yDomain[1] - yDomain[0]);
  
  const normalPoints = useMemo(
  () => visibleData.filter((entry) => entry.value <= threshold),
  [visibleData, threshold]
  );

  const rejectedPoints = useMemo(
    () => visibleData.filter((entry) => entry.value > threshold),
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
            Threshold: {threshold.toFixed(2)}
          </span>

          <Slider
            value={[threshold]}
            onValueChange={([v]) => onThresholdChange(v)}
            min={0}
            max={Y_MAX_CAP}
            step={currentThresholdStep}
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
        ref={chartAreaRef}
        className={cn(
          "relative flex-1 min-h-0 rounded border border-border bg-card/30 select-none",
          enabled && "cursor-grab active:cursor-grabbing"
        )}
        onWheel={handleWheelZoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
                tickFormatter={(v: number) => v.toFixed(2)}
              />

              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    formatter={(value: number) => value.toFixed(2)}
                  />
                }
              />

              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 3"
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{
                  value: "Threshold",
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--destructive))",
                }}
              />

              <Line
                type="linear"
                dataKey="value"
                stroke="hsl(var(--primary) / 0.55)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              <Scatter
                name="Values"
                data={normalPoints}
                isAnimationActive={false}
                animationDuration={0}
                fill="hsl(var(--primary))"
                shape="circle"
              />

              <Scatter
                name="Rejected"
                data={rejectedPoints}
                isAnimationActive={false}
                animationDuration={0}
                fill="hsl(var(--destructive))"
                shape="circle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="pointer-events-none absolute right-2 top-2 rounded bg-background/70 px-2 py-1 text-[10px] font-mono text-muted-foreground">
          threshold step: {currentThresholdStep}
        </div>
      </div>
    </div>
  );
};

export default AnomalyChart;