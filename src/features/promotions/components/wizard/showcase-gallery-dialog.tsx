import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SHOWCASE_SEED_CATALOG,
  normalizeSegment,
  type ShowcaseCardItem,
} from "../../data/showcase-catalog";

export interface ShowcaseGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: string;
  segmentLabel?: string;
  activeStyleId?: string | null;
  onSelectStyle: (styleId: string) => void;
  cards?: ShowcaseCardItem[];
}

/**
 * Componente acessível mobile-first construído com primitivos do shadcn/ui.
 * Apresenta uma galeria com cards publicitários reais criados por IA para inspirar
 * o comerciante e permitir a aplicação do estilo visual em 1 toque.
 */
export function ShowcaseGalleryDialog({
  open,
  onOpenChange,
  segment,
  segmentLabel,
  activeStyleId,
  onSelectStyle,
  cards,
}: ShowcaseGalleryDialogProps) {
  // Se cards não foram injetados externamente, filtra deterministicamente a semente estática
  const normalized = normalizeSegment(segment);
  const displayCards =
    cards && cards.length > 0
      ? cards
      : SHOWCASE_SEED_CATALOG.filter((item) => {
          return (
            item.businessSegment === segment ||
            item.businessSegment === normalized ||
            normalizeSegment(item.businessSegment) === normalized
          );
        });

  // Se por alguma razão o segmento não encontrou cards, exibe os primeiros da vitrine
  const finalCards =
    displayCards.length > 0 ? displayCards : SHOWCASE_SEED_CATALOG.slice(0, 3);

  const handleSelectStyle = (stylePresetId: string) => {
    onSelectStyle(stylePresetId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border bg-background shadow-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-card/50 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 text-xs font-semibold"
            >
              <Sparkles className="size-3 text-primary shrink-0" />
              <span>Exemplos Criados por IA</span>
            </Badge>
            {segmentLabel && (
              <Badge
                variant="outline"
                className="text-[11px] font-medium capitalize"
              >
                {segmentLabel}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight pt-1">
            Vitrine de Artes Prontas para Inspirar
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Cards publicitários reais criados pela IA. Toque em &ldquo;Usar este
            Estilo&rdquo; para aplicar a direção de arte e paleta diretamente ao
            seu card.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-3.5 sm:p-5 overflow-y-auto">
          <div
            data-testid="showcase-cards-grid"
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3.5"
          >
            {finalCards.map((card) => {
              const isSelected = activeStyleId === card.stylePresetId;

              return (
                <Card
                  key={card.id}
                  data-testid={`showcase-card-item-${card.id}`}
                  className={cn(
                    "overflow-hidden border flex flex-col transition-all duration-200 hover:shadow-md",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  <div className="relative overflow-hidden bg-muted/40">
                    {/* shadcn-ignore: moldura estrutural de proporção de aspecto */}
                    <AspectRatio ratio={4 / 5}>
                      {/* shadcn-ignore: imagem de alta resolução do card da vitrine */}
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="size-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    </AspectRatio>

                    {card.metadata?.promoPrice && (
                      <Badge className="absolute top-2 right-2 bg-black/80 text-white backdrop-blur-xs font-bold text-xs shadow-sm">
                        {card.metadata.promoPrice}
                      </Badge>
                    )}

                    {isSelected && (
                      <Badge
                        variant="default"
                        className="absolute top-2 left-2 gap-1 bg-primary text-primary-foreground font-semibold text-[11px] shadow-sm"
                      >
                        <Check className="size-3" />
                        <span>Estilo Atual</span>
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-1">
                      <Typography
                        variant="h4"
                        className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-1"
                      >
                        {card.title}
                      </Typography>

                      {card.description && (
                        <Typography
                          variant="muted"
                          className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2"
                        >
                          {card.description}
                        </Typography>
                      )}

                      {card.metadata?.highlights &&
                        card.metadata.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {card.metadata.highlights.slice(0, 2).map((h) => (
                              <Badge
                                key={h}
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 font-normal"
                              >
                                {h}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "default"}
                      size="sm"
                      data-testid={`btn-use-style-${card.id}`}
                      onClick={() => handleSelectStyle(card.stylePresetId)}
                      className="w-full min-h-[44px] text-xs font-bold gap-1.5 select-none"
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          <span>Estilo Selecionado</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 shrink-0" />
                          <span>Usar este Estilo</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-card/60 flex flex-row items-center justify-between sm:justify-end gap-2">
          <Typography
            variant="muted"
            className="text-[11px] text-muted-foreground hidden sm:inline"
          >
            Artes geradas com modelos multimodais de alta precisão
          </Typography>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] text-xs font-semibold px-4"
          >
            Fechar Vitrine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
