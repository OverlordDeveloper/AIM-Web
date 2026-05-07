import type { DetectionClass, DetectionFrame } from "@/lib/defectMock";

interface DefectViewerProps {
  frame: DetectionFrame | null;
  classMap: Record<string, DetectionClass>;
  classStates: Record<string, { enabled: boolean; threshold: number }>;
}

const DefectViewer = ({ frame, classMap, classStates }: DefectViewerProps) => {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
      <div className="relative aspect-square h-full max-h-full rounded-md bg-card border border-border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border shrink-0">
          <h2 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Detection View
          </h2>
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              frame ? "bg-status-online" : "bg-muted-foreground"
            }`}
          />
        </div>
        <div className="relative flex-1 flex items-center justify-center bg-background">
          {frame ? (
            <>
              <img
                src={frame.imageUrl}
                alt="Detection frame"
                className="w-full h-full object-cover"
              />
              {frame.boxes.map((box, i) => {
                const cls = classMap[box.classId];
                const state = classStates[box.classId];
                if (!cls || !state || !state.enabled) return null;
                if (box.confidence < state.threshold) return null;
                return (
                  <div
                    key={i}
                    className="absolute border-2 pointer-events-none"
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.w * 100}%`,
                      height: `${box.h * 100}%`,
                      borderColor: `hsl(${cls.color})`,
                      boxShadow: `0 0 0 1px hsl(${cls.color} / 0.3)`,
                    }}
                  >
                    <div
                      className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white whitespace-nowrap rounded-sm"
                      style={{ background: `hsl(${cls.color})` }}
                    >
                      {cls.name} {(box.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground">
              NO FRAME
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectViewer;
