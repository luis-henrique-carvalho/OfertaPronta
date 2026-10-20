import { Button } from "@/components/ui/button";
import { Tag, PenLine, Palette, MessageSquare } from "lucide-react";

export type QuickIntent = "price" | "title" | "style" | "custom";

export interface QuickPanelIntentSelectorProps {
  activeIntent: QuickIntent;
  onSelect: (intent: QuickIntent) => void;
}

export function QuickPanelIntentSelector({
  activeIntent,
  onSelect,
}: QuickPanelIntentSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button
        type="button"
        variant={activeIntent === "price" ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs font-semibold"
        onClick={() => onSelect("price")}
      >
        <Tag className="size-3.5" data-icon="inline-start" />
        <span className="truncate">Mudar Preço</span>
      </Button>

      <Button
        type="button"
        variant={activeIntent === "title" ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs font-semibold"
        onClick={() => onSelect("title")}
      >
        <PenLine className="size-3.5" data-icon="inline-start" />
        <span className="truncate">Corrigir Título</span>
      </Button>

      <Button
        type="button"
        variant={activeIntent === "style" ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs font-semibold"
        onClick={() => onSelect("style")}
      >
        <Palette className="size-3.5" data-icon="inline-start" />
        <span className="truncate">Cores & Estilo</span>
      </Button>

      <Button
        type="button"
        variant={activeIntent === "custom" ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs font-semibold"
        onClick={() => onSelect("custom")}
      >
        <MessageSquare className="size-3.5" data-icon="inline-start" />
        <span className="truncate">Outro Ajuste</span>
      </Button>
    </div>
  );
}
