import { cn } from "@/lib/utils";

interface ProcessingCardProps {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const ProcessingCard = ({ title, enabled, onToggle, children }: ProcessingCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        enabled
          ? "border-primary/40 bg-primary/5 shadow-glow"
          : "border-border bg-card"
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={onToggle}
      >
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted"
          )}
        />
      </div>

      {enabled && children && (
        <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ProcessingCard;
