export interface DetectionClass {
  id: string;
  name: string;
  color: string;
}

export interface DetectionModel {
  id: string;
  name: string;
  classes: DetectionClass[];
}

export interface DetectionBox {
  classId: string;
  label?: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DetectionFrame {
  id: number;
  timestamp: string;
  date?: string;
  time?: string;
  imageUrl: string;
  boxes: DetectionBox[];
}

export interface BackendDefectRecord {
  id: number;
  timestamp: string;
  date?: string;
  time?: string;
  imageUrl?: string;
  yoloReject?: boolean;
  defects?: any[];
  detections?: any[];
  boxes?: any[];
}

export function backendRecordToFrame(
  record: BackendDefectRecord,
  apiBase: string
): DetectionFrame {
  const rawBoxes = record.boxes ?? record.detections ?? record.defects ?? [];

  return {
    id: record.id,
    timestamp: record.timestamp.replace(" ", "T"),
    date: record.date,
    time: record.time,
    imageUrl: record.imageUrl
    ? `${apiBase}${record.imageUrl}`
    : `${apiBase}/api/defect/live/image?id=${record.id}`,
    boxes: rawBoxes.map((b: any) => ({
      classId: b.classId ?? b.label,
      label: b.label ?? b.classId,
      confidence: b.confidence ?? 0,
      x: b.x ?? b.box?.x ?? 0,
      y: b.y ?? b.box?.y ?? 0,
      w: b.w ?? b.width ?? b.box?.width ?? 0,
      h: b.h ?? b.height ?? b.box?.height ?? 0,
    })),
  };
}