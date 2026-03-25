import TopNav from "@/components/TopNav";
import { useWebSocket } from "@/hooks/useWebSocket";

const WS_URL = "ws://127.0.0.1:18080/api/ws/live";

const History = () => {
  const { connected } = useWebSocket(WS_URL);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopNav connected={connected} />
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold text-foreground">History</h1>
          <p className="text-xs text-muted-foreground font-mono">Coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default History;
