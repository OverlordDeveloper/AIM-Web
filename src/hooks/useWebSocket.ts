import { useCallback, useEffect, useRef, useState } from "react";

type ServerJsonMessage = {
  type: string;
  config?: any;
  [key: string]: any;
};

type StreamState = {
  live: string | null;
  mask: string | null;
  connected: boolean;
  lastMessage: ServerJsonMessage | null;
  sendJson: (payload: unknown) => boolean;
};

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

export function useWebSocket(url: string): StreamState {
  const [state, setState] = useState<Omit<StreamState, "sendJson">>({
    live: null,
    mask: null,
    connected: false,
    lastMessage: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const liveUrlRef = useRef<string | null>(null);
  const maskUrlRef = useRef<string | null>(null);

  const sendJson = useCallback((payload: unknown): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open, cannot send:", payload);
      return false;
    }

    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error("Failed to send WS message:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log("🟡 Connecting to WebSocket:", url);

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🟢 WebSocket opened");
      setState((prev) => ({ ...prev, connected: true }));
    };

    ws.onmessage = (e) => {
      try {
        if (typeof e.data === "string") {
          try {
            const msg = JSON.parse(e.data) as ServerJsonMessage;
            console.log("📩 Text message from server:", msg);

            setState((prev) => ({
              ...prev,
              lastMessage: msg,
            }));
          } catch (err) {
            console.error("Failed to parse WS JSON:", err, e.data);
          }
          return;
        }

        const buffer = e.data as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        if (bytes.length < 8) {
          console.error("Packet too small:", bytes.length);
          return;
        }

        const liveSize = readUint32LE(bytes, 0);
        const maskSize = readUint32LE(bytes, 4);

        const liveStart = 8;
        const liveEnd = liveStart + liveSize;
        const maskStart = liveEnd;
        const maskEnd = maskStart + maskSize;

        if (bytes.length < maskEnd) {
          console.error("Incomplete packet", {
            total: bytes.length,
            liveSize,
            maskSize,
            expected: maskEnd,
          });
          return;
        }

        const liveBytes = bytes.slice(liveStart, liveEnd);
        const maskBytes = bytes.slice(maskStart, maskEnd);

        const liveBlob = new Blob([liveBytes], { type: "image/jpeg" });
        const maskBlob = new Blob([maskBytes], { type: "image/png" });

        const liveUrl = URL.createObjectURL(liveBlob);
        const maskUrl = URL.createObjectURL(maskBlob);

        if (liveUrlRef.current) URL.revokeObjectURL(liveUrlRef.current);
        if (maskUrlRef.current) URL.revokeObjectURL(maskUrlRef.current);

        liveUrlRef.current = liveUrl;
        maskUrlRef.current = maskUrl;

        setState((prev) => ({
          ...prev,
          live: liveUrl,
          mask: maskUrl,
          connected: true,
        }));
      } catch (err) {
        console.error("Failed to decode WS packet:", err);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onclose = () => {
      console.log("🔴 WebSocket closed");
      setState((prev) => ({ ...prev, connected: false }));
    };

    return () => {
      ws.close();
      wsRef.current = null;

      if (liveUrlRef.current) {
        URL.revokeObjectURL(liveUrlRef.current);
        liveUrlRef.current = null;
      }

      if (maskUrlRef.current) {
        URL.revokeObjectURL(maskUrlRef.current);
        maskUrlRef.current = null;
      }
    };
  }, [url]);

  return {
    ...state,
    sendJson,
  };
}