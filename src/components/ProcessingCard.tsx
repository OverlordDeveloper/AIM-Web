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
        "rounded-md border p-3 transition-all duration-200",
        enabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-secondary/30"
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={onToggle}
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{title}</h2>
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-colors",
            enabled ? "bg-primary shadow-glow" : "bg-muted-foreground/30"
          )}
        />
      </div>

      {enabled && children && (
        <div className="mt-3 space-y-2.5 border-t border-border/50 pt-3" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ProcessingCard;
