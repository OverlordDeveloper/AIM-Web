import * as SliderPrimitive from "@radix-ui/react-slider";
import { ScanSearch, Ban, Power, MoveDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DetectionModel } from "@/lib/defectMock";

export interface ClassState {
  enabled: boolean;
  threshold: number;
}

interface DefectSidebarProps {
  models: DetectionModel[];
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  model: DetectionModel | null;
  classStates: Record<string, ClassState>;
  onClassToggle: (classId: string, enabled: boolean) => void;
  onThresholdChange: (classId: string, value: number) => void;
  detectEnabled: boolean;
  onDetectEnabledChange: (v: boolean) => void;
  rejectEnabled: boolean;
  onRejectEnabledChange: (v: boolean) => void;
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
}

interface ActionTileProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeStatus: string;
  inactiveStatus: string;
  tone: "primary" | "destructive";
}

const ActionTile = ({
  active,
  onClick,
  icon,
  label,
  activeStatus,
  inactiveStatus,
  tone,
}: ActionTileProps) => {
  const toneCls = tone === "primary"
    ? {
        on: "bg-primary/15 border-primary text-primary",
        dot: "bg-primary text-primary",
      }
    : {
        on: "bg-destructive/15 border-destructive text-destructive ring-1 ring-inset ring-destructive/30",
        dot: "bg-destructive text-destructive",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-1 px-2 py-2 rounded-sm border transition-colors text-left",
        "min-h-[64px]",
        active
          ? toneCls.on
          : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className={cn("flex items-center justify-center w-6 h-6 rounded-sm", active ? "bg-background/40" : "bg-background/30")}>
          {icon}
        </div>
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            active ? cn(toneCls.dot, "led-pulse") : "bg-muted-foreground/40"
          )}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">
          {active ? activeStatus : inactiveStatus}
        </span>
      </div>
    </button>
  );
};

interface ChannelSliderProps {
  value: number;
  color: string; // raw HSL triplet "210 50% 50%"
  disabled?: boolean;
  onChange: (v: number) => void;
}

const ChannelSlider = ({ value, color, disabled, onChange }: ChannelSliderProps) => {
  return (
    <div className="relative px-0.5">
      {/* tick marks */}
      <div className="absolute inset-x-0.5 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="w-px h-2 bg-border/70" />
        ))}
      </div>
      <SliderPrimitive.Root
        value={[value]}
        min={0}
        max={1}
        step={0.01}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        className="relative flex w-full touch-none select-none items-center py-1.5"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-sm bg-background border border-border">
          <SliderPrimitive.Range
            className="absolute h-full"
            style={{ background: disabled ? "hsl(var(--muted-foreground) / 0.3)" : `hsl(${color})` }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-4 w-2 rounded-[2px] border bg-foreground shadow-md transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
          style={{ borderColor: disabled ? "hsl(var(--border))" : `hsl(${color})` }}
        />
      </SliderPrimitive.Root>
    </div>
  );
};

const DefectSidebar = ({
  models,
  selectedModelId,
  onSelectModel,
  model,
  classStates,
  onClassToggle,
  onThresholdChange,
  detectEnabled,
  onDetectEnabledChange,
  rejectEnabled,
  onRejectEnabledChange,
  autoScroll,
  onAutoScrollToggle,
}: DefectSidebarProps) => {
  const totalClasses = model?.classes.length ?? 0;
  const enabledCount = model?.classes.filter((c) => classStates[c.id]?.enabled ?? true).length ?? 0;

  return (
    <aside className="w-[22%] min-w-[260px] max-w-[360px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-wider font-mono">
          Defect Detection Settings
        </h2>
      </div>

      {/* CONTROLS */}
      <div className="px-3 pt-2 pb-3 space-y-1.5 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Controls
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ActionTile
            active={detectEnabled}
            onClick={() => onDetectEnabledChange(!detectEnabled)}
            icon={<ScanSearch className="w-4 h-4" />}
            label="Detection"
            activeStatus="● Active"
            inactiveStatus="○ Standby"
            tone="primary"
          />
          <ActionTile
            active={rejectEnabled}
            onClick={() => onRejectEnabledChange(!rejectEnabled)}
            icon={<Ban className="w-4 h-4" />}
            label="Reject"
            activeStatus="● Armed"
            inactiveStatus="○ Disarmed"
            tone="destructive"
          />
        </div>
        {rejectEnabled && (
          <p className="text-[9px] font-mono text-muted-foreground leading-tight pt-0.5">
            Reject pulse will fire on detected defect.
          </p>
        )}
      </div>

      {/* MODEL */}
      <div className="px-3 py-2 space-y-1 border-b border-border">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Model
        </label>
        <Select value={selectedModelId} onValueChange={onSelectModel}>
          <SelectTrigger className="h-8 text-[11px] bg-secondary border-border font-mono">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-[11px] font-mono">
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CATEGORIES HEADER */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Categories
          </span>
          <span className="text-[10px] font-mono tabular-nums text-foreground">
            {enabledCount} / {totalClasses} <span className="text-muted-foreground">ON</span>
          </span>
        </div>
        <Button
          size="sm"
          variant={autoScroll ? "default" : "ghost"}
          className="h-6 text-[9px] px-1.5 gap-1 font-mono uppercase tracking-wider"
          onClick={onAutoScrollToggle}
        >
          <MoveDown className="w-3 h-3" />
          Auto
        </Button>
      </div>

      <Separator />

      {/* CHANNEL STRIPS */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {model?.classes.map((cls) => {
            const state = classStates[cls.id] ?? { enabled: true, threshold: 0.5 };
            const enabled = state.enabled;
            return (
              <div
                key={cls.id}
                className={cn(
                  "relative flex border-b border-border transition-colors",
                  enabled ? "bg-secondary/40 hover:bg-secondary/70" : "bg-transparent"
                )}
              >
                {/* Color bar */}
                <span
                  className="w-[3px] shrink-0 self-stretch"
                  style={{
                    background: `hsl(${cls.color})`,
                    opacity: enabled ? 1 : 0.3,
                  }}
                />
                <div className={cn("flex-1 px-2.5 py-2 space-y-1.5", !enabled && "opacity-50")}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground flex-1 truncate">
                      {cls.name}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-sm border text-[10px] font-mono tabular-nums leading-none",
                        enabled
                          ? "bg-background border-border text-primary"
                          : "bg-background/40 border-border text-muted-foreground"
                      )}
                    >
                      {enabled ? state.threshold.toFixed(2) : "OFF"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onClassToggle(cls.id, !enabled)}
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-sm border transition-colors",
                        enabled
                          ? "border-border bg-background/60"
                          : "border-border/50 bg-transparent hover:border-foreground/40"
                      )}
                      style={enabled ? { color: `hsl(${cls.color})` } : undefined}
                      aria-label={enabled ? "Disable class" : "Enable class"}
                    >
                      <Power className="w-3 h-3" />
                    </button>
                  </div>
                  <ChannelSlider
                    value={state.threshold}
                    color={cls.color}
                    disabled={!enabled}
                    onChange={(v) => onThresholdChange(cls.id, v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default DefectSidebar;
