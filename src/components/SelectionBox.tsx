import { useState, useRef, useCallback, useEffect } from "react";

interface SelectionBoxProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onBoxCommit?: (box: { x: number; y: number; w: number; h: number }) => void;
}

type Corner = "nw" | "ne" | "sw" | "se";

const MIN_SIZE_PX = 30;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const SelectionBox = ({ containerRef, onBoxCommit }: SelectionBoxProps) => {
  // Store normalized box coords permanently
  const [box, setBox] = useState({ x: 0.1, y: 0.1, w: 0.3, h: 0.3 });

  const dragRef = useRef<{
    type: "move" | Corner;
    startMouse: { x: number; y: number };
    startBoxPx: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? null;
  }, [containerRef]);

  const getBoxPx = useCallback(() => {
    const cr = getContainerRect();
    if (!cr) return null;

    return {
      x: box.x * cr.width,
      y: box.y * cr.height,
      w: box.w * cr.width,
      h: box.h * cr.height,
    };
  }, [box, getContainerRect]);

  const clampBoxPx = useCallback(
    (b: { x: number; y: number; w: number; h: number }) => {
      const cr = getContainerRect();
      if (!cr) return b;

      const cw = cr.width;
      const ch = cr.height;

      const w = Math.max(MIN_SIZE_PX, Math.min(b.w, cw));
      const h = Math.max(MIN_SIZE_PX, Math.min(b.h, ch));
      const x = Math.max(0, Math.min(b.x, cw - w));
      const y = Math.max(0, Math.min(b.y, ch - h));

      return { x, y, w, h };
    },
    [getContainerRect]
  );

  const pxToNormalized = useCallback(
    (b: { x: number; y: number; w: number; h: number }) => {
      const cr = getContainerRect();
      if (!cr) return box;

      return {
        x: clamp01(b.x / cr.width),
        y: clamp01(b.y / cr.height),
        w: clamp01(b.w / cr.width),
        h: clamp01(b.h / cr.height),
      };
    },
    [box, getContainerRect]
  );

  const onPointerDown = useCallback(
    (type: "move" | Corner) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const currentPx = getBoxPx();
      if (!currentPx) return;

      dragRef.current = {
        type,
        startMouse: { x: e.clientX, y: e.clientY },
        startBoxPx: currentPx,
      };
    },
    [getBoxPx]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;

      const { type, startMouse, startBoxPx } = dragRef.current;
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;

      if (type === "move") {
        const nextPx = clampBoxPx({
          ...startBoxPx,
          x: startBoxPx.x + dx,
          y: startBoxPx.y + dy,
        });
        setBox(pxToNormalized(nextPx));
      } else {
        let { x, y, w, h } = startBoxPx;

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

        const nextPx = clampBoxPx({ x, y, w, h });
        setBox(pxToNormalized(nextPx));
      }
    },
    [clampBoxPx, pxToNormalized]
  );

  const onPointerUp = useCallback(() => {
    if (dragRef.current && onBoxCommit) {
      onBoxCommit(box);
    }
    dragRef.current = null;
  }, [box, onBoxCommit]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const boxPx = getBoxPx();
  if (!boxPx) return null;

  const cornerClass =
    "absolute w-3 h-3 rounded-full bg-sidebar-primary border-2 border-sidebar shadow-[0_0_6px_hsl(180_50%_45%/0.5)]";

  return (
    <div
      className="absolute border-2 border-dashed border-sidebar-primary/80"
      style={{
        left: boxPx.x,
        top: boxPx.y,
        width: boxPx.w,
        height: boxPx.h,
      }}
    >
      <div
        className="absolute inset-0 cursor-move"
        onPointerDown={onPointerDown("move")}
      />

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

      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-sidebar-primary/40" />
      <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-sidebar-primary/40" />
    </div>
  );
};

export default SelectionBox;