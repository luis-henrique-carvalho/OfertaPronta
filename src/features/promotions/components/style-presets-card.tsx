import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Check } from "lucide-react";
import type { SegmentCatalogItem } from "../data/offer-brief.schema";

export interface StylePresetsCardProps {
  catalogItem: SegmentCatalogItem;
  stylePresetId?: string | null;
  customStyleInstructions?: string;
  onStylePresetChange: (presetId: string | undefined) => void;
  onCustomStyleInstructionsChange: (instructions: string) => void;
}

export function StylePresetsCard({
  catalogItem,
  stylePresetId,
  customStyleInstructions = "",
  onStylePresetChange,
  onCustomStyleInstructionsChange,
}: StylePresetsCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5 text-primary">
          <Palette className="size-4" />
          <Typography
            variant="muted"
            className="text-xs font-semibold text-primary"
          >
            Estilos Visuais de {catalogItem.label}
          </Typography>
        </div>
        <CardTitle className="text-lg font-bold">
          Escolha o Clima Publicitário do Card
        </CardTitle>
        <CardDescription>
          Define a atmosfera, contraste, iluminação e visual gráfico sugerido
          para a IA.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {catalogItem.stylePresets.map((preset) => {
            const isSelected = stylePresetId === preset.id;

            return (
              <Button
                key={preset.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() =>
                  onStylePresetChange(isSelected ? undefined : preset.id)
                }
                className={`relative flex h-auto w-full min-w-0 flex-col items-start justify-start p-3.5 text-left whitespace-normal break-words rounded-xl transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex w-full items-start justify-between gap-2 pb-1.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="size-3 rounded-full shrink-0 shadow-xs mt-0.5"
                      style={{ backgroundColor: preset.previewBadgeColor }}
                    />
                    <Typography
                      as="span"
                      variant="muted"
                      className={`text-xs font-bold leading-snug break-words ${
                        isSelected
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {preset.label}
                    </Typography>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-primary-foreground shrink-0 mt-0.5" />
                  )}
                </div>
                <Typography
                  as="span"
                  variant="muted"
                  className={`text-[11px] leading-relaxed break-words w-full ${
                    isSelected
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground"
                  }`}
                >
                  {preset.description}
                </Typography>
              </Button>
            );
          })}
        </div>

        {/* Campo de Instruções Customizadas Livres para a IA */}
        <Field className="pt-2">
          <FieldLabel htmlFor="custom-instructions">
            Instruções extras de estilo para a IA (opcional)
          </FieldLabel>
          <Textarea
            id="custom-instructions"
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
      </CardContent>
    </Card>
  );
}
