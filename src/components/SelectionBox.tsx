import { useState, useRef, useCallback, useEffect } from "react";

interface SelectionBoxProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

type Corner = "nw" | "ne" | "sw" | "se";

const MIN_SIZE = 30;

const SelectionBox = ({ containerRef }: SelectionBoxProps) => {
  const [box, setBox] = useState({ x: 20, y: 20, w: 120, h: 120 });
  const dragRef = useRef<{
    type: "move" | Corner;
    startMouse: { x: number; y: number };
    startBox: typeof box;
  } | null>(null);

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? null;
  }, [containerRef]);

  const clampBox = useCallback(
    (b: typeof box) => {
      const cr = getContainerRect();
      if (!cr) return b;
      const cw = cr.width;
      const ch = cr.height;
      const w = Math.max(MIN_SIZE, Math.min(b.w, cw));
      const h = Math.max(MIN_SIZE, Math.min(b.h, ch));
      const x = Math.max(0, Math.min(b.x, cw - w));
      const y = Math.max(0, Math.min(b.y, ch - h));
      return { x, y, w, h };
    },
    [getContainerRect]
  );

  const onPointerDown = useCallback(
    (type: "move" | Corner) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        type,
        startMouse: { x: e.clientX, y: e.clientY },
        startBox: { ...box },
      };
    },
    [box]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { type, startMouse, startBox } = dragRef.current;
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;

      if (type === "move") {
        setBox(clampBox({ ...startBox, x: startBox.x + dx, y: startBox.y + dy }));
      } else {
        let { x, y, w, h } = startBox;
        if (type === "se") {
          w += dx;
          h += dy;
        } else if (type === "sw") {
          x += dx;
          w -= dx;
          h += dy;
        } else if (type === "ne") {
          w += dx;
          y += dy;
          h -= dy;
        } else if (type === "nw") {
          x += dx;
          w -= dx;
          y += dy;
          h -= dy;
        }
        setBox(clampBox({ x, y, w, h }));
      }
    },
    [clampBox]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const cornerClass =
    "absolute w-3 h-3 rounded-full bg-sidebar-primary border-2 border-sidebar shadow-[0_0_6px_hsl(180_50%_45%/0.5)]";

  return (
    <div
      className="absolute border-2 border-dashed border-sidebar-primary/80"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
      }}
    >
      {/* Move handle – full area */}
      <div
        className="absolute inset-0 cursor-move"
        onPointerDown={onPointerDown("move")}
      />

      {/* Corner handles */}
      <div
        className={`${cornerClass} -top-1.5 -left-1.5 cursor-nw-resize`}
        onPointerDown={onPointerDown("nw")}
      />
      <div
        className={`${cornerClass} -top-1.5 -right-1.5 cursor-ne-resize`}
        onPointerDown={onPointerDown("ne")}
      />
      <div
        className={`${cornerClass} -bottom-1.5 -left-1.5 cursor-sw-resize`}
        onPointerDown={onPointerDown("sw")}
      />
      <div
        className={`${cornerClass} -bottom-1.5 -right-1.5 cursor-se-resize`}
        onPointerDown={onPointerDown("se")}
      />

      {/* Dashed crosshair lines */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-sidebar-primary/40" />
      <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-sidebar-primary/40" />
    </div>
  );
};

export default SelectionBox;
