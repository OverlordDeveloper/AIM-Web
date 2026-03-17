import { Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InspectionSlider from "@/components/InspectionSlider";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const RESOLUTION_PRESETS = [
  { label: "256 × 256", w: 256, h: 256 },
  { label: "512 × 512", w: 512, h: 512 },
  { label: "1024 × 1024", w: 1024, h: 1024 },
  { label: "Custom", w: 0, h: 0 },
];

interface CameraSettings {
  exposureTime: number;
  gain: number;
  brightness: number;
  contrast: number;
  saturation: number;
  width: number;
  height: number;
}

const CameraSettingsPanel = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<CameraSettings>({
    exposureTime: 100,
    gain: 50,
    brightness: 128,
    contrast: 128,
    saturation: 128,
    width: 1280,
    height: 720,
  });
  const [customRes, setCustomRes] = useState(false);

  const update = (key: keyof CameraSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreset = (val: string) => {
    const preset = RESOLUTION_PRESETS.find((p) => p.label === val);
    if (!preset) return;
    if (preset.w === 0) {
      setCustomRes(true);
    } else {
      setCustomRes(false);
      setSettings((prev) => ({ ...prev, width: preset.w, height: preset.h }));
    }
  };

  const currentPreset = customRes
    ? "Custom"
    : RESOLUTION_PRESETS.find((p) => p.w === settings.width && p.h === settings.height)?.label ?? "Custom";

  return (
    <>
      {/* Toggle button for the header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Camera
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Bottom drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border transition-transform duration-300 ease-in-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/60">
            Camera Settings
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 flex gap-6 overflow-x-auto">
          {/* Resolution */}
          <div className="space-y-2 min-w-[160px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resolution</span>
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
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground">W</span>
                  <Input
                    type="number"
                    value={settings.width}
                    onChange={(e) => update("width", Number(e.target.value))}
                    className="h-7 text-xs font-mono bg-secondary border-border"
                  />
                </div>
                <span className="text-muted-foreground text-xs mt-4">×</span>
                <div className="flex-1 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-muted-foreground">H</span>
                  <Input
                    type="number"
                    value={settings.height}
                    onChange={(e) => update("height", Number(e.target.value))}
                    className="h-7 text-xs font-mono bg-secondary border-border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exposure Time — input + slider */}
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Exposure Time</span>
              <span className="text-[10px] font-mono text-muted-foreground">ms</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={1000}
                value={settings.exposureTime}
                onChange={(e) => update("exposureTime", Math.min(1000, Math.max(1, Number(e.target.value))))}
                className="h-7 w-16 text-xs font-mono bg-secondary border-border tabular-nums"
              />
              <div className="flex-1">
                <InspectionSlider label="" value={settings.exposureTime} onChange={(v) => update("exposureTime", v)} max={1000} min={1} />
              </div>
            </div>
          </div>

          {/* Gain */}
          <div className="min-w-[150px]">
            <InspectionSlider label="Gain" value={settings.gain} onChange={(v) => update("gain", v)} max={100} />
          </div>

          {/* Brightness */}
          <div className="min-w-[150px]">
            <InspectionSlider label="Brightness" value={settings.brightness} onChange={(v) => update("brightness", v)} />
          </div>

          {/* Contrast */}
          <div className="min-w-[150px]">
            <InspectionSlider label="Contrast" value={settings.contrast} onChange={(v) => update("contrast", v)} />
          </div>

          {/* Saturation */}
          <div className="min-w-[150px]">
            <InspectionSlider label="Saturation" value={settings.saturation} onChange={(v) => update("saturation", v)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CameraSettingsPanel;
