import { Settings2, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InspectionSlider from "@/components/InspectionSlider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";

const RESOLUTION_PRESETS = [
  { label: "256 × 256", w: 256, h: 256 },
  { label: "512 × 512", w: 512, h: 512 },
  { label: "1024 × 1024", w: 1024, h: 1024 },
  { label: "Custom", w: 0, h: 0 },
];

export interface CameraSettings {
  aeEnable: boolean;
  exposureTime: number;
  analogueGain: number;
  awbEnable: boolean;
  brightness: number;
  contrast: number;
  width: number;
  height: number;
}

interface CameraSettingsPanelProps {
  settings: CameraSettings;
  onUpdate: (key: keyof CameraSettings, value: number) => void;
}

const CameraSettingsPanel = ({ settings, onUpdate }: CameraSettingsPanelProps) => {
  const [open, setOpen] = useState(false);

  const customRes = useMemo(() => {
    return !RESOLUTION_PRESETS.some(
      (p) => p.w !== 0 && p.w === settings.width && p.h === settings.height
    );
  }, [settings.width, settings.height]);

  const handlePreset = (val: string) => {
    const preset = RESOLUTION_PRESETS.find((p) => p.label === val);
    if (!preset) return;

    if (preset.w === 0) return;

    onUpdate("width", preset.w);
    onUpdate("height", preset.h);
  };

  const currentPreset = customRes
    ? "Custom"
    : RESOLUTION_PRESETS.find((p) => p.w === settings.width && p.h === settings.height)?.label ?? "Custom";

  return (
    <div className="shrink-0 border-t border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
      >
        <Settings2 className="w-3 h-3" />
        <span>Camera</span>
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronUp className="w-3 h-3 ml-auto" />}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-40" : "max-h-0"
        }`}
      >
        <div className="px-4 py-2.5 flex gap-6 overflow-x-auto border-t border-border">
          <div className="space-y-1.5 min-w-[140px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Resolution
            </span>
            <Select value={currentPreset} onValueChange={handlePreset}>
              <SelectTrigger className="h-7 text-xs font-mono bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label} className="text-xs font-mono">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {customRes && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={settings.width}
                  onChange={(e) => onUpdate("width", Number(e.target.value))}
                  className="h-6 text-[10px] font-mono bg-secondary border-border w-16"
                />
                <span className="text-muted-foreground text-[10px]">×</span>
                <Input
                  type="number"
                  value={settings.height}
                  onChange={(e) => onUpdate("height", Number(e.target.value))}
                  className="h-6 text-[10px] font-mono bg-secondary border-border w-16"
                />
              </div>
            )}
          </div>

          <div className="min-w-[150px]">
            <InspectionSlider
              label="Exposure (ms)"
              value={settings.exposureTime}
              onChange={(v) => onUpdate("exposureTime", v)}
              max={1000}
              min={1}
            />
          </div>

          <div className="min-w-[150px]">
            <InspectionSlider
              label="Gain"
              value={settings.gain}
              onChange={(v) => onUpdate("gain", v)}
              max={100}
            />
          </div>

          <div className="min-w-[150px]">
            <InspectionSlider
              label="Brightness"
              value={settings.brightness}
              onChange={(v) => onUpdate("brightness", v)}
            />
          </div>

          <div className="min-w-[150px]">
            <InspectionSlider
              label="Contrast"
              value={settings.contrast}
              onChange={(v) => onUpdate("contrast", v)}
            />
          </div>

          <div className="min-w-[150px]">
            <InspectionSlider
              label="Saturation"
              value={settings.saturation}
              onChange={(v) => onUpdate("saturation", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraSettingsPanel;