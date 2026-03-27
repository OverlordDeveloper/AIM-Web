import { Slider } from "@/components/ui/slider";

interface InspectionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
}

const InspectionSlider = ({ label, value, onChange, max = 255, min = 0 }: InspectionSliderProps) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/60">{label}</span>
        <span className="text-[10px] font-mono text-sidebar-primary tabular-nums">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={max}
        min={min}
        step={1}
        className="cursor-pointer"
      />
    </div>
  );
};

export default InspectionSlider;
