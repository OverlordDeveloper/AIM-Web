import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AnomalyChartProps {
  data: { index: number; value: number }[];
  threshold: number;
  onThresholdChange: (value: number) => void;
  enabled: boolean;
}

const chartConfig: ChartConfig = {
  normal: { label: "Normal", color: "hsl(200, 70%, 50%)" },
  anomaly: { label: "Anomaly", color: "hsl(0, 72%, 51%)" },
};

const AnomalyChart = ({ data, threshold, onThresholdChange, enabled }: AnomalyChartProps) => {
  return (
    <div className={cn("flex-1 min-h-0 p-3 flex flex-col", !enabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
          Anomaly Score
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground">
            Threshold: {threshold.toFixed(1)}
          </span>
          <Slider
            value={[threshold]}
            onValueChange={([v]) => onThresholdChange(v)}
            min={0}
            max={50}
            step={0.5}
            className="w-32"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 18%)" />
            <XAxis dataKey="index" type="number" hide />
            <YAxis dataKey="value" type="number" domain={[0, 50]} tick={{ fontSize: 10 }} stroke="hsl(220, 8%, 45%)" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={threshold}
              stroke="hsl(0, 72%, 51%)"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: "Threshold", position: "right", fontSize: 10, fill: "hsl(0, 72%, 51%)" }}
            />
            <Scatter name="Values" data={data} fill="hsl(200, 70%, 50%)">
              {data.map((entry) => (
                <Cell
                  key={entry.index}
                  fill={entry.value > threshold ? "hsl(0, 72%, 51%)" : "hsl(200, 70%, 50%)"}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default AnomalyChart;
