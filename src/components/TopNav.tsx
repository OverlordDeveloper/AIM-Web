import { NavLink } from "react-router-dom";
import { Activity, ShieldAlert, Clock, BarChart3, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Inspector", icon: Activity },
  { to: "/anomaly-detection", label: "Anomaly Detection", icon: ShieldAlert },
  { to: "/defect-detection", label: "Defect Detection", icon: ScanSearch },
  { to: "/history", label: "History", icon: Clock },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const TopNav = ({ connected }: { connected: boolean }) => {
  return (
    <header className="h-11 shrink-0 flex items-center justify-between px-5 border-b border-border bg-card">
      <nav className="flex items-center gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-status-online animate-pulse-dot' : 'bg-status-offline'}`} />
        <span className="text-[10px] font-mono text-muted-foreground">
          {connected ? 'CONNECTED' : 'OFFLINE'}
        </span>
      </div>
    </header>
  );
};

export default TopNav;
