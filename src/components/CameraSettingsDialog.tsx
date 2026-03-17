import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import InspectionSlider from "@/components/InspectionSlider";
import { useState } from "react";

interface CameraSettings {
  exposureTime: number;
  gain: number;
  brightness: number;
  contrast: number;
  saturation: number;
}

const CameraSettingsDialog = () => {
  const [settings, setSettings] = useState<CameraSettings>({
    exposureTime: 100,
    gain: 50,
    brightness: 128,
    contrast: 128,
    saturation: 128,
  });

  const update = (key: keyof CameraSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <Settings2 className="w-3.5 h-3.5" />
          Camera
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xs font-mono uppercase tracking-widest text-foreground/80">
            Camera Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <InspectionSlider label="Exposure Time" value={settings.exposureTime} onChange={(v) => update("exposureTime", v)} max={500} />
          <InspectionSlider label="Gain" value={settings.gain} onChange={(v) => update("gain", v)} max={100} />
          <InspectionSlider label="Brightness" value={settings.brightness} onChange={(v) => update("brightness", v)} />
          <InspectionSlider label="Contrast" value={settings.contrast} onChange={(v) => update("contrast", v)} />
          <InspectionSlider label="Saturation" value={settings.saturation} onChange={(v) => update("saturation", v)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraSettingsDialog;
