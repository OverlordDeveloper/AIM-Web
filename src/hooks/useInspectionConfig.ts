import { useState, useCallback } from "react";

export interface ClassicConfig {
  enabled: boolean;
  lowH: number;
  lowS: number;
  lowV: number;
  highH: number;
  highS: number;
  highV: number;
  size: number;
  contours: boolean;
  tracking: boolean;
  drawTracking: boolean;
}

export interface InspectionConfig {
  classic: ClassicConfig;
  yolo: { enabled: boolean };
  seg: { enabled: boolean };
}

const API_BASE = "http://localhost:8000/api";

export function useInspectionConfig() {
  const [config, setConfig] = useState<InspectionConfig>({
    classic: { enabled: false, lowH: 0, lowS: 0, lowV: 0, highH: 255, highS: 255, highV: 255, size: 100, contours: false, tracking: false, drawTracking: false },
    yolo: { enabled: false },
    seg: { enabled: false },
  });

  const updateBackend = useCallback(async (path: string, value: unknown) => {
    const [group, key] = path.split(".");
    const update = { [group]: { [key]: value } };

    try {
      await fetch(`${API_BASE}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch (err) {
      console.error("Failed to update backend:", err);
    }
  }, []);

  const updateConfig = useCallback(
    (path: string, value: unknown) => {
      const [group, key] = path.split(".");
      setConfig((prev) => ({
        ...prev,
        [group]: { ...(prev as any)[group], [key]: value },
      }));
      updateBackend(path, value);
    },
    [updateBackend]
  );
  
  return { config, updateConfig };
}
