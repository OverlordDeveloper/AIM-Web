export interface DetectionClass {
  id: string;
  name: string;
  color: string; // hsl string like "0 80% 60%"
}

export interface DetectionModel {
  id: string;
  name: string;
  classes: DetectionClass[];
}

export interface DetectionBox {
  classId: string;
  confidence: number;
  x: number; // normalized 0-1
  y: number;
  w: number;
  h: number;
}

export interface DetectionFrame {
  id: number;
  timestamp: string;
  imageUrl: string;
  boxes: DetectionBox[];
}

export const MOCK_MODELS: DetectionModel[] = [
  {
    id: "surface-v1",
    name: "Surface Defects v1",
    classes: [
      { id: "scratch", name: "Scratch", color: "0 80% 60%" },
      { id: "dent", name: "Dent", color: "30 90% 55%" },
      { id: "crack", name: "Crack", color: "280 70% 60%" },
      { id: "stain", name: "Stain", color: "200 80% 55%" },
      { id: "burn", name: "Burn Mark", color: "15 85% 50%" },
    ],
  },
  {
    id: "packaging-v2",
    name: "Packaging v2",
    classes: [
      { id: "tear", name: "Tear", color: "340 75% 60%" },
      { id: "missing-label", name: "Missing Label", color: "50 90% 55%" },
      { id: "misprint", name: "Misprint", color: "160 65% 50%" },
      { id: "seal-defect", name: "Seal Defect", color: "220 75% 60%" },
    ],
  },
];

const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/seed/defect1/640/640",
  "https://picsum.photos/seed/defect2/640/640",
  "https://picsum.photos/seed/defect3/640/640",
  "https://picsum.photos/seed/defect4/640/640",
  "https://picsum.photos/seed/defect5/640/640",
];

let nextId = 1;

export function generateMockFrame(model: DetectionModel, timestamp?: Date): DetectionFrame {
  const numBoxes = Math.floor(Math.random() * 5);
  const boxes: DetectionBox[] = Array.from({ length: numBoxes }, () => {
    const cls = model.classes[Math.floor(Math.random() * model.classes.length)];
    const w = 0.1 + Math.random() * 0.3;
    const h = 0.1 + Math.random() * 0.3;
    const x = Math.random() * (1 - w);
    const y = Math.random() * (1 - h);
    return {
      classId: cls.id,
      confidence: 0.3 + Math.random() * 0.7,
      x,
      y,
      w,
      h,
    };
  });

  return {
    id: nextId++,
    timestamp: (timestamp ?? new Date()).toISOString(),
    imageUrl: PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)],
    boxes,
  };
}

/**
 * Generate `count` backdated mock frames spaced `intervalMs` apart, ending now.
 * Returned newest-first.
 */
export function generateMockHistory(
  model: DetectionModel,
  count: number,
  intervalMs: number
): DetectionFrame[] {
  const now = Date.now();
  const frames: DetectionFrame[] = [];
  for (let i = 0; i < count; i++) {
    const ts = new Date(now - i * intervalMs);
    frames.push(generateMockFrame(model, ts));
  }
  return frames;
}
