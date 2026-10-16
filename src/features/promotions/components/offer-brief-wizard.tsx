import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { SegmentSelector } from './segment-selector'
import { FlexibleVisualInputs } from './flexible-visual-inputs'
import { LiveCardPreview } from './live-card-preview'
import { useOfferBriefDraft } from '../hooks/use-offer-brief-draft'
import { SEGMENT_CATALOG } from '../data/offer-brief.schema'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Wand2,
  Store,
  QrCode,
} from 'lucide-react'

export function OfferBriefWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  const draft = useOfferBriefDraft()
  const currentCatalog = SEGMENT_CATALOG[draft.businessSegment]

  const handleNextStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      const isValid = draft.validateForm()
      if (!isValid) return

      // Salva o rascunho antes de prosseguir para o Passo 3
      await draft.saveDraft()
      setCurrentStep(3)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Barra de Progresso em 3 Etapas Mobile-First */}
      {/* shadcn-ignore: layout */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-primary">
            <Sparkles className="size-3.5" />
            Criação de Card com IA
          </span>
          <span className="text-muted-foreground">Etapa {currentStep} de 3</span>
        </div>

        {/* Indicadores Visuais de Etapa */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div
            className={`h-2 rounded-full transition-all ${
              currentStep >= 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all ${
              currentStep >= 2 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all ${
              currentStep === 3 ? 'bg-secondary' : 'bg-muted'
            }`}
          />
        </div>

        <div className="flex justify-between pt-1 text-[11px] font-medium text-muted-foreground">
          <span className={currentStep === 1 ? 'font-bold text-foreground' : ''}>
            1. Ramo
          </span>
          <span className={currentStep === 2 ? 'font-bold text-foreground' : ''}>
            2. Oferta & Fotos
          </span>
          <span className={currentStep === 3 ? 'font-bold text-secondary' : ''}>
            3. Prévia do Card
          </span>
        </div>
      </div>

      {/* Conteúdo Dinâmico por Etapa */}

      {/* ETAPA 1: Seleção de Segmento Comercial */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-6">
          <SegmentSelector
            value={draft.businessSegment}
            onChange={(newSegment) => draft.setBusinessSegment(newSegment)}
          />

          <Button
            type="button"
            size="lg"
            onClick={handleNextStep}
            className="h-13 w-full rounded-xl bg-primary text-base font-bold shadow-md hover:bg-primary/90"
          >
            Avançar para dados da oferta
            <ArrowRight className="size-5 ml-1" />
          </Button>
        </div>
      )}

      {/* ETAPA 2: Dados do Briefing + Insumos Visuais Combináveis */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-6">
          {/* Card com os dados essenciais da oferta */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline" className="gap-1 text-xs shrink-0">
                  <Store className="size-3 text-primary" />
                  {currentCatalog.label}
                </Badge>
                <Typography variant="muted" className="text-xs font-semibold">
                  Passo 2 de 3
                </Typography>
              </div>
              <CardTitle className="pt-2 text-xl font-bold">
                Dados da sua Promoção
              </CardTitle>
              <CardDescription>
                Informe o nome do seu negócio, produto e preços que a IA integrará no Card.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              <Field data-invalid={!!draft.validationErrors.businessName}>
                <FieldLabel htmlFor="business-name">Nome do seu Negócio</FieldLabel>
                <Input
                  id="business-name"
                  placeholder={currentCatalog.placeholders.businessName}
                  value={draft.businessName}
                  onChange={(e) => draft.setBusinessName(e.target.value)}
                  aria-invalid={!!draft.validationErrors.businessName}
                />
                {draft.validationErrors.businessName ? (
                  <FieldError>{draft.validationErrors.businessName}</FieldError>
                ) : (
                  <FieldDescription>Aparecerá no topo do Card Publicitário.</FieldDescription>
                )}
              </Field>

              <Field data-invalid={!!draft.validationErrors.offerTitle}>
                <FieldLabel htmlFor="offer-title">Título da Oferta / Produto</FieldLabel>
                <Input
                  id="offer-title"
                  placeholder={currentCatalog.placeholders.offerTitle}
                  value={draft.offerTitle}
                  onChange={(e) => draft.setOfferTitle(e.target.value)}
                  aria-invalid={!!draft.validationErrors.offerTitle}
                />
                {draft.validationErrors.offerTitle ? (
                  <FieldError>{draft.validationErrors.offerTitle}</FieldError>
                ) : (
                  <FieldDescription>O produto ou serviço em promoção principal.</FieldDescription>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={!!draft.validationErrors.promoPrice}>
                  <FieldLabel htmlFor="promo-price">Preço com Desconto *</FieldLabel>
                  <Input
                    id="promo-price"
                    placeholder={currentCatalog.placeholders.promoPrice}
                    value={draft.promoPrice}
                    onChange={(e) => draft.setPromoPrice(e.target.value)}
                    aria-invalid={!!draft.validationErrors.promoPrice}
                  />
                  {draft.validationErrors.promoPrice && (
                    <FieldError>{draft.validationErrors.promoPrice}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="original-price">Preço Original (opcional)</FieldLabel>
                  <Input
                    id="original-price"
                    placeholder={currentCatalog.placeholders.originalPrice}
                    value={draft.originalPrice || ''}
                    onChange={(e) => draft.setOriginalPrice(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="cta">Texto de Ação (CTA)</FieldLabel>
                  <Input
                    id="cta"
                    placeholder={currentCatalog.placeholders.callToAction}
                    value={draft.callToAction || ''}
                    onChange={(e) => draft.setCallToAction(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="whatsapp">WhatsApp / Contato (opcional)</FieldLabel>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={draft.whatsapp || ''}
                    onChange={(e) => draft.setWhatsapp(e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Insumos Visuais: Upload Foto + Upload Referência + Presets + Exemplos */}
          <FlexibleVisualInputs
            segment={draft.businessSegment}
            productImageDataUrl={draft.productImageDataUrl}
            referenceImageDataUrl={draft.referenceImageDataUrl}
            stylePresetId={draft.stylePresetId}
            customStyleInstructions={draft.customStyleInstructions}
            onProductImageChange={draft.setProductImageDataUrl}
            onReferenceImageChange={draft.setReferenceImageDataUrl}
            onStylePresetChange={draft.setStylePresetId}
            onCustomStyleInstructionsChange={draft.setCustomStyleInstructions}
            onApplyExample={draft.applyExample}
          />

          {/* Navegação entre Etapas */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrevStep}
              className="h-13 w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm px-2"
            >
              <ArrowLeft className="size-4 mr-1 shrink-0" />
              <span>Voltar</span>
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={draft.isSaving}
              onClick={handleNextStep}
              className="h-13 w-2/3 rounded-xl bg-primary text-xs sm:text-base font-bold shadow-md hover:bg-primary/90 px-3 whitespace-normal break-words text-center"
            >
              {draft.isSaving ? (
                <>Salvando dados...</>
              ) : (
                <>
                  <span>Gerar Prévia com IA</span>
                  <Wand2 className="size-4 sm:size-5 ml-1 shrink-0" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Prévia Completa do Card Publicitário & Avanço para Checkout */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-6">
          <LiveCardPreview
            businessSegment={draft.businessSegment}
            businessName={draft.businessName}
            offerTitle={draft.offerTitle}
            promoPrice={draft.promoPrice}
            originalPrice={draft.originalPrice}
            callToAction={draft.callToAction}
            whatsapp={draft.whatsapp}
            productImageDataUrl={draft.productImageDataUrl}
            referenceImageDataUrl={draft.referenceImageDataUrl}
            stylePresetId={draft.stylePresetId}
            showWatermark={true}
          />

          {/* Informações de Entrega e CTA de Pagamento Pix */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-secondary">
                <CheckCircle2 className="size-4" />
                <Typography variant="muted" className="text-xs font-bold text-secondary">
                  Card Pronto nos 2 Formatos (Feed + Story)
                </Typography>
              </div>
              <CardTitle className="pt-1 text-2xl font-black">
                Gostou da prévia? Libere em Alta Resolução
              </CardTitle>
              <CardDescription>
                Pague apenas R$ 9,90 via Pix Dinâmico e baixe os arquivos nítidos sem marca d&apos;água imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="size-4 text-primary" />
                  Feed (1080×1350) + Story (1080×1920)
                </span>
                <span className="text-primary font-black text-sm">R$ 9,90 avulso</span>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação Final */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              className="h-auto min-h-14 w-full rounded-2xl bg-primary py-3.5 px-4 text-sm sm:text-base font-bold shadow-lg hover:bg-primary/90 whitespace-normal break-words text-center"
              onClick={() => {
                // Rota de checkout a ser conectada no Épico 3
                alert('Avançando para o Checkout Pix (R$ 9,90)...')
              }}
            >
              <QrCode className="size-5 mr-1.5 shrink-0" />
              <span>Liberar em HD sem marca d&apos;água (R$ 9,90)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrevStep}
              className="h-11 w-full rounded-xl border-border font-medium text-xs text-muted-foreground"
            >
              <ArrowLeft className="size-3.5 mr-1" />
              Editar dados ou trocar fotos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
