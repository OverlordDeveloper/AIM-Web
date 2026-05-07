import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
}

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
  autoScroll,
  onAutoScrollToggle,
}: DefectSidebarProps) => {
  return (
    <aside className="w-[22%] min-w-[260px] max-w-[360px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <h2 className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
          Defect Detection Settings
        </h2>
      </div>

      <div className="px-3 py-2 space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Model
        </label>
        <Select value={selectedModelId} onValueChange={onSelectModel}>
          <SelectTrigger className="h-8 text-[11px] bg-secondary border-border">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-[11px]">
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="px-3 py-2 flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-[11px]">
          <Checkbox
            checked={detectEnabled}
            onCheckedChange={(v) => onDetectEnabledChange(!!v)}
            className="w-3.5 h-3.5"
          />
          <span className="text-foreground">Detect</span>
        </label>
        <Button
          size="sm"
          variant={autoScroll ? "default" : "secondary"}
          className="ml-auto text-[10px] h-7"
          onClick={onAutoScrollToggle}
        >
          Auto-scroll
        </Button>
      </div>

      <Separator />

      <div className="px-3 py-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Categories ({model?.classes.length ?? 0})
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 space-y-3">
          {model?.classes.map((cls) => {
            const state = classStates[cls.id] ?? { enabled: true, threshold: 0.5 };
            return (
              <div key={cls.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={state.enabled}
                    onCheckedChange={(v) => onClassToggle(cls.id, !!v)}
                    className="w-3.5 h-3.5"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: `hsl(${cls.color})` }}
                  />
                  <span className="text-[11px] text-foreground flex-1 truncate">
                    {cls.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {state.threshold.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[state.threshold]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => onThresholdChange(cls.id, v)}
                  disabled={!state.enabled}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default DefectSidebar;
