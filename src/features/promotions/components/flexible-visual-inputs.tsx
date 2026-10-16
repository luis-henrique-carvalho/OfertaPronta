import { useState, useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import type { BusinessSegment } from '../data/offer-brief.schema'
import { SEGMENT_CATALOG } from '../data/offer-brief.schema'
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Palette,
  Lightbulb,
  Check,
  AlertCircle,
} from 'lucide-react'

interface FlexibleVisualInputsProps {
  segment: BusinessSegment
  productImageDataUrl?: string
  referenceImageDataUrl?: string
  stylePresetId?: string
  customStyleInstructions?: string
  imageError?: string | null
  onProductImageChange: (dataUrl: string | undefined) => void
  onReferenceImageChange: (dataUrl: string | undefined) => void
  onStylePresetChange: (presetId: string | undefined) => void
  onCustomStyleInstructionsChange: (instructions: string) => void
  onApplyExample: (example: {
    title: string
    promoPrice: string
    originalPrice?: string
    stylePresetId: string
  }) => void
}

export function FlexibleVisualInputs({
  segment,
  productImageDataUrl,
  referenceImageDataUrl,
  stylePresetId,
  customStyleInstructions = '',
  imageError: externalImageError,
  onProductImageChange,
  onReferenceImageChange,
  onStylePresetChange,
  onCustomStyleInstructionsChange,
  onApplyExample,
}: FlexibleVisualInputsProps) {
  const productInputRef = useRef<HTMLInputElement>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const [internalImageError, setInternalImageError] = useState<string | null>(null)

  const activeImageError = externalImageError ?? internalImageError
  const catalogItem = SEGMENT_CATALOG[segment]

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void
  ) => {
    setInternalImageError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setInternalImageError('Formato inválido. Selecione uma imagem JPEG, PNG ou WebP.')
      e.target.value = ''
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setInternalImageError('A imagem selecionada ultrapassa o limite de 4MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSuccess(reader.result)
      }
    }
    reader.onerror = () => {
      setInternalImageError('Erro ao processar imagem. Tente novamente.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Botões de Preenchimento Rápido com Exemplos do Segmento */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-primary">
            <Lightbulb className="size-4" />
            <Typography variant="muted" className="text-xs font-semibold text-primary">
              Sugestões Rápidas de {catalogItem.label}
            </Typography>
          </div>
          <CardTitle className="text-base font-bold">
            Teste com 1 toque um exemplo do seu nicho:
          </CardTitle>
          <CardDescription>
            Preenche o título, os preços e o melhor estilo para você ver o Card pronto imediatamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {catalogItem.exampleOffers.map((example, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onApplyExample(example)}
                className="h-auto py-2 px-3 text-xs font-medium text-left justify-start gap-1.5 rounded-lg border-border hover:border-primary/50 hover:bg-primary/5 whitespace-normal break-words max-w-full"
              >
                <Sparkles className="size-3 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{example.title}</span>
                <span className="text-primary font-bold shrink-0">({example.promoPrice})</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uploaders Combináveis: Foto do Produto e Imagem de Referência */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="gap-1 text-xs shrink-0">
              <Sparkles className="size-3 text-primary" />
              Insumos Visuais para a IA
            </Badge>
            <Typography variant="muted" className="text-xs font-medium">
              Opcionais & Combináveis
            </Typography>
          </div>
          <CardTitle className="pt-2 text-xl font-bold">
            Fotos e Referências Visuais
          </CardTitle>
          <CardDescription>
            Envie a foto do seu produto e/ou uma arte de referência que você goste. Se não enviar fotos, a IA criará o card 100% do zero com base no estilo escolhido.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-0">
          {activeImageError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{activeImageError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 1. Uploader: Foto do Produto */}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Typography variant="muted" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  Foto do Produto / Serviço
                </Typography>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Opcional
                </Badge>
              </div>
              <Typography variant="muted" className="text-xs">
                A foto real do seu prato, carne, corte ou produto (até 4MB).
              </Typography>

              {/* shadcn-ignore: hidden native file input controlled via accessible button */}
              <input
                ref={productInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileUpload(e, onProductImageChange)}
              />

              {productImageDataUrl ? (
                <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-background">
                  <img
                    src={productImageDataUrl}
                    alt="Foto do produto selecionada"
                    className="size-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onProductImageChange(undefined)}
                    className="absolute top-2 right-2 size-8 p-0 rounded-full shadow-md"
                    title="Remover foto do produto"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => productInputRef.current?.click()}
                  className="mt-2 flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-dashed border-border bg-background hover:border-primary/50 hover:bg-muted/30"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <Typography variant="muted" className="text-xs font-semibold text-foreground">
                    Tirar foto ou enviar arquivo
                  </Typography>
                  <Typography variant="muted" className="text-[10px]">
                    JPG, PNG ou WebP até 4MB
                  </Typography>
                </Button>
              )}
            </div>

            {/* 2. Uploader: Imagem de Referência */}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Typography variant="muted" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-secondary" />
                  Imagem de Referência
                </Typography>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Opcional
                </Badge>
              </div>
              <Typography variant="muted" className="text-xs">
                Um print ou card de referência cujo estilo visual ou composição você queira imitar.
              </Typography>

              {/* shadcn-ignore: hidden native file input controlled via accessible button */}
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileUpload(e, onReferenceImageChange)}
              />

              {referenceImageDataUrl ? (
                <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-background">
                  <img
                    src={referenceImageDataUrl}
                    alt="Imagem de referência selecionada"
                    className="size-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onReferenceImageChange(undefined)}
                    className="absolute top-2 right-2 size-8 p-0 rounded-full shadow-md"
                    title="Remover imagem de referência"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => referenceInputRef.current?.click()}
                  className="mt-2 flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-dashed border-border bg-background hover:border-secondary/50 hover:bg-muted/30"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <Typography variant="muted" className="text-xs font-semibold text-foreground">
                    Enviar arte de referência
                  </Typography>
                  <Typography variant="muted" className="text-[10px]">
                    JPG, PNG ou WebP até 4MB
                  </Typography>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seletor de Estilo Visual (Style Preset) do Segmento */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5 text-primary">
            <Palette className="size-4" />
            <Typography variant="muted" className="text-xs font-semibold text-primary">
              Estilos Visuais de {catalogItem.label}
            </Typography>
          </div>
          <CardTitle className="text-lg font-bold">
            Escolha o Clima Publicitário do Card
          </CardTitle>
          <CardDescription>
            Define a atmosfera, contraste, iluminação e visual gráfico sugerido para a IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogItem.stylePresets.map((preset) => {
              const isSelected = stylePresetId === preset.id

              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onStylePresetChange(isSelected ? undefined : preset.id)}
                  className={`relative flex h-auto w-full min-w-0 flex-col items-start justify-start p-3.5 text-left whitespace-normal break-words rounded-xl transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
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
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
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
                      isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                    }`}
                  >
                    {preset.description}
                  </Typography>
                </Button>
              )
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
              Personalize detalhes específicos de cores, cenário ou atmosfera para a geração multimodal.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
