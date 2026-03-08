import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface InspectionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
}

const InspectionSlider = ({ label, value, onChange, max = 255, min = 0 }: InspectionSliderProps) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-primary">{value}</span>
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
