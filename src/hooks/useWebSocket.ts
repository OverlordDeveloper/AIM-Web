import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("🟡 Connecting to WebSocket:", url);
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const blob = new Blob([e.data], { type: "image/jpeg" });
      const objectUrl = URL.createObjectURL(blob);
      setImageSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
    };

    ws.onerror = (e) => console.error("WebSocket error:", e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url]);

  return imageSrc;
}
