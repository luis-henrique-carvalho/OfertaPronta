import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomStyleInstructionsCollapsibleProps {
  customStyleInstructions?: string;
  isInstructionsOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomStyleInstructionsChange: (instructions: string) => void;
}

export function CustomStyleInstructionsCollapsible({
  customStyleInstructions,
  isInstructionsOpen,
  onOpenChange,
  onCustomStyleInstructionsChange,
}: CustomStyleInstructionsCollapsibleProps) {
  return (
    <Collapsible
      open={isInstructionsOpen}
      onOpenChange={onOpenChange}
      className="w-full border-t border-border/60 pt-3"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-testid="toggle-custom-instructions-button"
          className="flex w-full min-h-[44px] items-center justify-between px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Instruções extras de estilo para a IA (opcional)
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isInstructionsOpen && "rotate-180",
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <Field>
          <FieldLabel htmlFor="custom-instructions">
            Detalhes visuais adicionais
          </FieldLabel>
          <Textarea
            id="custom-instructions"
            data-testid="custom-instructions-textarea"
            placeholder="Ex: 'Quero um visual noturno com fumaça quente', 'Adicione folhas de manjericão e azeite no fundo', 'Fundo amarelo vibrante de supermercado'"
            value={customStyleInstructions}
            onChange={(e) => onCustomStyleInstructionsChange(e.target.value)}
            className="resize-none min-h-[70px] text-xs"
            maxLength={300}
          />
          <FieldDescription>
            Personalize detalhes específicos de cores, cenário ou atmosfera para
            a geração multimodal.
          </FieldDescription>
        </Field>
      </CollapsibleContent>
    </Collapsible>
  );
}
