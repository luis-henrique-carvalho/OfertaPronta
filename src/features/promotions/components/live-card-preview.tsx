import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import type { BusinessSegment } from '../data/offer-brief.schema'
import { SEGMENT_CATALOG } from '../data/offer-brief.schema'
import {
  Smartphone,
  Layers,
  Sparkles,
  ShoppingBag,
  Flame,
  UtensilsCrossed,
  Pizza,
  Store,
  type LucideIcon,
} from 'lucide-react'

export type PreviewAspectRatio = 'feed' | 'story'

export interface LiveCardPreviewProps {
  businessSegment: BusinessSegment
  businessName: string
  offerTitle: string
  promoPrice: string
  originalPrice?: string | null
  callToAction?: string | null
  whatsapp?: string | null
  productImageDataUrl?: string | null
  referenceImageDataUrl?: string | null
  stylePresetId?: string | null
  aspectRatio?: PreviewAspectRatio
  onAspectRatioChange?: (ratio: PreviewAspectRatio) => void
  showWatermark?: boolean
}

const SEGMENT_ICONS: Record<BusinessSegment, LucideIcon> = {
  supermarket: ShoppingBag,
  'beauty-salon': Sparkles,
  pizzeria: Pizza,
  'burger-shop': Flame,
  restaurant: UtensilsCrossed,
  'local-retail': Store,
}

export function LiveCardPreview({
  businessSegment,
  businessName,
  offerTitle,
  promoPrice,
  originalPrice,
  callToAction = 'Peça agora!',
  whatsapp,
  productImageDataUrl,
  referenceImageDataUrl,
  stylePresetId,
  aspectRatio: externalAspectRatio,
  onAspectRatioChange,
  showWatermark = true,
}: LiveCardPreviewProps) {
  const [internalAspectRatio, setInternalAspectRatio] = useState<PreviewAspectRatio>('feed')
  const currentRatio = externalAspectRatio ?? internalAspectRatio

  const handleRatioChange = (ratio: PreviewAspectRatio) => {
    if (onAspectRatioChange) {
      onAspectRatioChange(ratio)
    } else {
      setInternalAspectRatio(ratio)
    }
  }

  const catalog = SEGMENT_CATALOG[businessSegment]
  const SegmentIcon = SEGMENT_ICONS[businessSegment]

  // Encontra o estilo selecionado
  const activePreset =
    catalog.stylePresets.find((p) => p.id === stylePresetId) || catalog.stylePresets[0]

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <Badge variant="secondary" className="gap-1.5 text-xs w-fit py-1 px-2.5 shrink-0">
            <Sparkles className="size-3 text-primary shrink-0" />
            <span>Prévia do Card IA</span>
          </Badge>

          {/* Toggle Feed (4:5) vs Story (9:16) */}
          {/* shadcn-ignore: layout */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-full sm:w-auto justify-center">
            <Button
              type="button"
              variant={currentRatio === 'feed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleRatioChange('feed')}
              className="h-8 px-3 text-xs font-semibold flex-1 sm:flex-none"
            >
              <Layers className="size-3.5 mr-1.5 shrink-0" />
              Feed (4:5)
            </Button>
            <Button
              type="button"
              variant={currentRatio === 'story' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleRatioChange('story')}
              className="h-8 px-3 text-xs font-semibold flex-1 sm:flex-none"
            >
              <Smartphone className="size-3.5 mr-1.5 shrink-0" />
              Story (9:16)
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <CardTitle className="text-base sm:text-lg font-bold leading-tight">
            Card Publicitário ({currentRatio === 'feed' ? '1080×1350' : '1080×1920'})
          </CardTitle>
          <Badge variant="outline" className="text-[11px] font-medium capitalize shrink-0 max-w-full truncate">
            {catalog.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex justify-center p-2 sm:p-6 bg-muted/10 overflow-hidden">
        {/* Contêiner da Arte com Proporção Estrita */}
        <div
          className={`relative w-full max-w-[280px] xs:max-w-xs sm:max-w-[340px] overflow-hidden rounded-2xl shadow-xl transition-all duration-300 border border-border/80 ${
            currentRatio === 'feed' ? 'aspect-[4/5]' : 'aspect-[9/16]'
          }`}
          style={{
            background: `linear-gradient(145deg, #0f172a 0%, #1e293b 60%, ${activePreset.previewBadgeColor}33 100%)`,
          }}
        >
          {/* Fundo de Imagem (Produto ou Referência) quando fornecida */}
          {productImageDataUrl ? (
            <div className="absolute inset-0">
              <img
                src={productImageDataUrl}
                alt="Produto de fundo"
                className="size-full object-cover opacity-60 mix-blend-luminosity scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/70" />
            </div>
          ) : referenceImageDataUrl ? (
            <div className="absolute inset-0">
              <img
                src={referenceImageDataUrl}
                alt="Referência de fundo"
                className="size-full object-cover opacity-40 blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/80" />
            </div>
          ) : (
            <div className="absolute inset-0 opacity-20">
              <div
                className="size-full"
                style={{
                  backgroundImage: `radial-gradient(${activePreset.previewBadgeColor} 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />
            </div>
          )}

          {/* Marca d'Água Diagonal Protetora em Prévia Gratuita */}
          {showWatermark && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
              <div className="rotate-[-32deg] select-none text-center">
                <span className="block text-2xl sm:text-3xl font-black uppercase tracking-widest text-white/20 drop-shadow-md">
                  PRÉVIA OFERTAPRONTA
                </span>
                <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/20">
                  ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX
                </span>
              </div>
            </div>
          )}

          {/* Conteúdo Gráfico do Card Publicitário */}
          <div className="relative z-10 flex size-full flex-col justify-between p-5 text-white">
            {/* Topo: Nome do Estabelecimento e Badge de Segmento */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 border border-white/10">
                <SegmentIcon className="size-3.5 text-primary" />
                <span className="text-xs font-bold truncate max-w-[150px]">
                  {businessName || catalog.placeholders.businessName}
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md border border-white/20 text-white"
                style={{ backgroundColor: `${activePreset.previewBadgeColor}88` }}
              >
                {activePreset.label.split(' ')[0]}
              </span>
            </div>

            {/* Centro: Foto em Destaque (se houver) ou Ícone de Clima */}
            <div className="my-auto flex flex-col items-center justify-center text-center">
              {productImageDataUrl ? (
                <div className="relative size-32 sm:size-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                  <img
                    src={productImageDataUrl}
                    alt="Produto em destaque"
                    className="size-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Foto Real
                  </div>
                </div>
              ) : (
                <div
                  className="flex size-20 items-center justify-center rounded-3xl backdrop-blur-md border border-white/15 shadow-xl"
                  style={{ backgroundColor: `${activePreset.previewBadgeColor}44` }}
                >
                  <SegmentIcon className="size-10 text-white" />
                </div>
              )}
            </div>

            {/* Rodapé: Headline da Oferta + Selo de Preço + CTA */}
            <div className="flex flex-col gap-2.5">
              <div>
                <Typography
                  as="h3"
                  className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-md line-clamp-2"
                >
                  {offerTitle || catalog.placeholders.offerTitle}
                </Typography>
              </div>

              {/* Bloco de Preços */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-md">
                  {promoPrice || catalog.placeholders.promoPrice}
                </span>
                {originalPrice && (
                  <span className="text-xs sm:text-sm text-white/60 line-through">
                    {originalPrice}
                  </span>
                )}
              </div>

              {/* Rodapé com CTA e WhatsApp */}
              <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[11px] font-semibold">
                <span className="text-white/90">
                  {callToAction || catalog.placeholders.callToAction}
                </span>
                {whatsapp && (
                  // shadcn-ignore: decorativo
                  <span className="text-emerald-400 font-bold truncate max-w-[110px]">
                    {whatsapp}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-1 border-t border-border bg-card p-3 text-center sm:text-left">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          ✨ Card gerado por IA com fusão harmoniosa de cores, iluminação e tipografia comercial.
        </Typography>
      </CardFooter>
    </Card>
  )
}
