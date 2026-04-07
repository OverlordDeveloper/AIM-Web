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

export interface YoloConfig {
  enabled: boolean;
}

export interface HardwareConfig {
  enabled: boolean;
}

export interface TimedConfig {
  enabled: boolean;
  fps: number;
}

export interface InspectionConfig {
  classic: ClassicConfig;
  yolo: YoloConfig;
  hardware: HardwareConfig;
  timed: TimedConfig;
}

const defaultConfig: InspectionConfig = {
  classic: {
    enabled: false,
    lowH: 0,
    lowS: 0,
    lowV: 0,
    highH: 255,
    highS: 255,
    highV: 255,
    size: 100,
    contours: false,
    tracking: false,
    drawTracking: false,
  },
  yolo: {
    enabled: false,
  },
  hardware: {
    enabled: false,
  },
  timed: {
    enabled: false,
    fps: 1,
  },
};

export function useInspectionConfig() {
  const [config, setConfigState] = useState<InspectionConfig>(defaultConfig);

  const updateConfig = useCallback((path: string, value: unknown) => {
    const [group, key] = path.split(".");

    if (!group || !key) {
      console.warn("Invalid config path:", path);
      return;
    }

    setConfigState((prev) => ({
      ...prev,
      [group]: {
        ...(prev as any)[group],
        [key]: value,
      },
    }));
  }, []);

  const setConfig = useCallback((nextConfig: InspectionConfig) => {
    setConfigState(nextConfig);
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(defaultConfig);
  }, []);

  return {
    config,
    updateConfig,
    setConfig,
    resetConfig,
  };
}