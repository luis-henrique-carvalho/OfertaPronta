import { useState, useCallback, useTransition } from 'react'
import type { BusinessSegment, SaveOfferDraftInput } from '../data/offer-brief.schema'
import { SEGMENT_CATALOG, deriveVisualInputMode } from '../data/offer-brief.schema'
import { saveDraftFn } from '../server/server-functions'

export interface UseOfferBriefDraftOptions {
  initialDraft?: Partial<SaveOfferDraftInput>
  onSavedSuccess?: (draftId: string) => void
}

export function useOfferBriefDraft(options: UseOfferBriefDraftOptions = {}) {
  const initialSegment: BusinessSegment =
    (options.initialDraft?.businessSegment as BusinessSegment) || 'supermarket'

  const initialPlaceholders = SEGMENT_CATALOG[initialSegment].placeholders

  const [draftId, setDraftId] = useState<string | undefined>(options.initialDraft?.id)
  const [businessSegment, setBusinessSegment] = useState<BusinessSegment>(initialSegment)
  const [businessName, setBusinessName] = useState(
    options.initialDraft?.businessName ?? initialPlaceholders.businessName
  )
  const [offerTitle, setOfferTitle] = useState(
    options.initialDraft?.offerTitle ?? initialPlaceholders.offerTitle
  )
  const [promoPrice, setPromoPrice] = useState(
    options.initialDraft?.promoPrice ?? initialPlaceholders.promoPrice
  )
  const [originalPrice, setOriginalPrice] = useState(
    options.initialDraft?.originalPrice ?? initialPlaceholders.originalPrice
  )
  const [callToAction, setCallToAction] = useState(
    options.initialDraft?.callToAction ?? initialPlaceholders.callToAction
  )
  const [whatsapp, setWhatsapp] = useState(options.initialDraft?.whatsapp ?? '')

  // Insumos visuais flexíveis
  const [productImageDataUrl, setProductImageDataUrl] = useState<string | undefined>(
    options.initialDraft?.productImageDataUrl ?? undefined
  )
  const [referenceImageDataUrl, setReferenceImageDataUrl] = useState<string | undefined>(
    options.initialDraft?.referenceImageDataUrl ?? undefined
  )
  const [stylePresetId, setStylePresetId] = useState<string | undefined>(
    options.initialDraft?.stylePresetId ?? SEGMENT_CATALOG[initialSegment].stylePresets[0].id
  )
  const [customStyleInstructions, setCustomStyleInstructions] = useState(
    options.initialDraft?.customStyleInstructions ?? ''
  )

  // Erros e status
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSavingTransition] = useTransition()

  // Troca de segmento inteligente: adapta placeholders e o estilo padrão
  const handleSegmentChange = useCallback(
    (newSegment: BusinessSegment) => {
      setBusinessSegment(newSegment)
      const catalog = SEGMENT_CATALOG[newSegment]
      // Define o estilo default do novo segmento
      setStylePresetId(catalog.stylePresets[0].id)
      // Se os campos ainda forem o default do segmento anterior, atualiza para o novo
      const prevCatalog = SEGMENT_CATALOG[businessSegment]
      if (businessName === prevCatalog.placeholders.businessName) {
        setBusinessName(catalog.placeholders.businessName)
      }
      if (offerTitle === prevCatalog.placeholders.offerTitle) {
        setOfferTitle(catalog.placeholders.offerTitle)
      }
      if (promoPrice === prevCatalog.placeholders.promoPrice) {
        setPromoPrice(catalog.placeholders.promoPrice)
      }
      if (originalPrice === prevCatalog.placeholders.originalPrice) {
        setOriginalPrice(catalog.placeholders.originalPrice)
      }
      if (callToAction === prevCatalog.placeholders.callToAction) {
        setCallToAction(catalog.placeholders.callToAction)
      }
    },
    [businessSegment, businessName, offerTitle, promoPrice, originalPrice, callToAction]
  )

  // Preenchimento com 1 toque a partir de um exemplo do segmento
  const handleApplyExample = useCallback(
    (example: {
      title: string
      promoPrice: string
      originalPrice?: string
      stylePresetId: string
    }) => {
      setOfferTitle(example.title)
      setPromoPrice(example.promoPrice)
      if (example.originalPrice) {
        setOriginalPrice(example.originalPrice)
      }
      setStylePresetId(example.stylePresetId)
      // Limpa eventuais erros de campo preenchido
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next.offerTitle
        delete next.promoPrice
        return next
      })
    },
    []
  )

  // Modo de insumo visual derivado
  const visualInputMode = deriveVisualInputMode({
    hasProductImage: !!productImageDataUrl,
    hasReferenceImage: !!referenceImageDataUrl,
    hasStylePreset: !!stylePresetId,
  })

  // Validação básica client-side
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!businessName.trim()) {
      errors.businessName = 'Informe o nome do estabelecimento'
    }
    if (!offerTitle.trim()) {
      errors.offerTitle = 'Informe o título da promoção ou produto'
    }
    if (!promoPrice.trim()) {
      errors.promoPrice = 'Informe o preço promocional'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [businessName, offerTitle, promoPrice])

  // Salvar rascunho via Server Function
  const saveDraft = useCallback(async (): Promise<string | null> => {
    setSaveError(null)

    const payload: SaveOfferDraftInput = {
      id: draftId,
      businessSegment,
      businessName,
      offerTitle,
      promoPrice,
      originalPrice: originalPrice ? originalPrice : null,
      callToAction: callToAction ? callToAction : null,
      whatsapp: whatsapp ? whatsapp : null,
      productImageDataUrl: productImageDataUrl ? productImageDataUrl : null,
      referenceImageDataUrl: referenceImageDataUrl ? referenceImageDataUrl : null,
      stylePresetId: stylePresetId ? stylePresetId : null,
      customStyleInstructions: customStyleInstructions ? customStyleInstructions : null,
    }

    return new Promise((resolve) => {
      startSavingTransition(async () => {
        try {
          const saved = await saveDraftFn({ data: payload })
          setDraftId(saved.draftId)
          if (options.onSavedSuccess) {
            options.onSavedSuccess(saved.draftId)
          }
          resolve(saved.draftId)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Falha ao salvar rascunho da oferta'
          setSaveError(msg)
          resolve(null)
        }
      })
    })
  }, [
    draftId,
    businessSegment,
    businessName,
    offerTitle,
    promoPrice,
    originalPrice,
    callToAction,
    whatsapp,
    productImageDataUrl,
    referenceImageDataUrl,
    stylePresetId,
    customStyleInstructions,
    options,
  ])

  return {
    draftId,
    businessSegment,
    businessName,
    offerTitle,
    promoPrice,
    originalPrice,
    callToAction,
    whatsapp,
    productImageDataUrl,
    referenceImageDataUrl,
    stylePresetId,
    customStyleInstructions,
    visualInputMode,
    validationErrors,
    saveError,
    isSaving,
    setBusinessSegment: handleSegmentChange,
    setBusinessName,
    setOfferTitle,
    setPromoPrice,
    setOriginalPrice,
    setCallToAction,
    setWhatsapp,
    setProductImageDataUrl,
    setReferenceImageDataUrl,
    setStylePresetId,
    setCustomStyleInstructions,
    applyExample: handleApplyExample,
    validateForm,
    saveDraft,
  }
}
