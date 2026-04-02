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
          ? "border-sidebar-primary/50 bg-sidebar-accent/50"
          : "border-sidebar-border bg-sidebar-accent/50"
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={onToggle}
      >
        <h2
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider transition-colors",
            enabled ? "text-sidebar-primary/90" : "text-sidebar-foreground/70"
          )}
        >
          {title}
        </h2>
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            enabled
              ? "bg-sidebar-primary shadow-[0_0_6px_hsl(var(--sidebar-primary)/0.25)]"
              : "bg-sidebar-foreground/20"
          )}
        />
      </div>

      {enabled && children && (
        <div
          className="mt-3 space-y-2.5 border-t border-sidebar-border/50 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default ProcessingCard;