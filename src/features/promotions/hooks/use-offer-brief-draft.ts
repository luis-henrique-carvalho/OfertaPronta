import { useState, useCallback, useTransition } from "react";
import type {
  BusinessSegment,
  SaveOfferDraftInput,
} from "../data/offer-brief.schema";
import {
  SEGMENT_CATALOG,
  deriveVisualInputMode,
} from "../data/offer-brief.schema";
import { saveDraftFn } from "../server";

export interface UseOfferBriefDraftOptions {
  initialDraft?: Partial<SaveOfferDraftInput>;
  onSavedSuccess?: (draftId: string) => void;
}

interface FormFieldsState {
  businessName: string;
  offerTitle: string;
  promoPrice: string;
  originalPrice: string;
  callToAction: string;
  whatsapp: string;
  productImageDataUrl?: string;
  referenceImageDataUrl?: string;
  stylePresetId?: string;
  customStyleInstructions: string;
}

function getInitialFields(
  initialDraft: Partial<SaveOfferDraftInput> | undefined,
  segment: BusinessSegment,
): FormFieldsState {
  const placeholders = SEGMENT_CATALOG[segment].placeholders;
  return {
    businessName: initialDraft?.businessName ?? placeholders.businessName,
    offerTitle: initialDraft?.offerTitle ?? placeholders.offerTitle,
    promoPrice: initialDraft?.promoPrice ?? placeholders.promoPrice,
    originalPrice: initialDraft?.originalPrice ?? placeholders.originalPrice,
    callToAction: initialDraft?.callToAction ?? placeholders.callToAction,
    whatsapp: initialDraft?.whatsapp ?? "",
    productImageDataUrl: initialDraft?.productImageDataUrl ?? undefined,
    referenceImageDataUrl: initialDraft?.referenceImageDataUrl ?? undefined,
    stylePresetId:
      initialDraft?.stylePresetId ??
      SEGMENT_CATALOG[segment].stylePresets[0].id,
    customStyleInstructions: initialDraft?.customStyleInstructions ?? "",
  };
}

function buildDraftPayload(
  draftId: string | undefined,
  businessSegment: BusinessSegment,
  fields: FormFieldsState,
): SaveOfferDraftInput {
  return {
    id: draftId,
    businessSegment,
    businessName: fields.businessName,
    offerTitle: fields.offerTitle,
    promoPrice: fields.promoPrice,
    originalPrice: fields.originalPrice || null,
    callToAction: fields.callToAction || null,
    whatsapp: fields.whatsapp || null,
    productImageDataUrl: fields.productImageDataUrl || null,
    referenceImageDataUrl: fields.referenceImageDataUrl || null,
    stylePresetId: fields.stylePresetId || null,
    customStyleInstructions: fields.customStyleInstructions || null,
  };
}

function updateSegmentPlaceholders(
  prev: FormFieldsState,
  oldSegment: BusinessSegment,
  newSegment: BusinessSegment,
): FormFieldsState {
  const prevPl = SEGMENT_CATALOG[oldSegment].placeholders;
  const newPl = SEGMENT_CATALOG[newSegment].placeholders;
  return {
    ...prev,
    stylePresetId: SEGMENT_CATALOG[newSegment].stylePresets[0].id,
    businessName:
      prev.businessName === prevPl.businessName
        ? newPl.businessName
        : prev.businessName,
    offerTitle:
      prev.offerTitle === prevPl.offerTitle
        ? newPl.offerTitle
        : prev.offerTitle,
    promoPrice:
      prev.promoPrice === prevPl.promoPrice
        ? newPl.promoPrice
        : prev.promoPrice,
    originalPrice:
      prev.originalPrice === prevPl.originalPrice
        ? newPl.originalPrice
        : prev.originalPrice,
    callToAction:
      prev.callToAction === prevPl.callToAction
        ? newPl.callToAction
        : prev.callToAction,
  };
}

function useDraftFormFields(
  initialSegment: BusinessSegment,
  initialDraft?: Partial<SaveOfferDraftInput>,
) {
  const [fields, setFields] = useState<FormFieldsState>(() =>
    getInitialFields(initialDraft, initialSegment),
  );

  const applyExample = useCallback(
    (example: {
      title: string;
      promoPrice: string;
      originalPrice?: string;
      stylePresetId: string;
    }) => {
      setFields((prev) => ({
        ...prev,
        offerTitle: example.title,
        promoPrice: example.promoPrice,
        originalPrice: example.originalPrice ?? prev.originalPrice,
        stylePresetId: example.stylePresetId,
      }));
    },
    [],
  );

  return {
    fields,
    setFields,
    applyExample,
    setBusinessName: (v: string) =>
      setFields((p) => ({ ...p, businessName: v })),
    setOfferTitle: (v: string) => setFields((p) => ({ ...p, offerTitle: v })),
    setPromoPrice: (v: string) => setFields((p) => ({ ...p, promoPrice: v })),
    setOriginalPrice: (v: string) =>
      setFields((p) => ({ ...p, originalPrice: v })),
    setCallToAction: (v: string) =>
      setFields((p) => ({ ...p, callToAction: v })),
    setWhatsapp: (v: string) => setFields((p) => ({ ...p, whatsapp: v })),
    setProductImageDataUrl: (v?: string) =>
      setFields((p) => ({ ...p, productImageDataUrl: v })),
    setReferenceImageDataUrl: (v?: string) =>
      setFields((p) => ({ ...p, referenceImageDataUrl: v })),
    setStylePresetId: (v?: string) =>
      setFields((p) => ({ ...p, stylePresetId: v })),
    setCustomStyleInstructions: (v: string) =>
      setFields((p) => ({ ...p, customStyleInstructions: v })),
  };
}

function useSaveDraft(
  draftId: string | undefined,
  setDraftId: (id: string) => void,
  businessSegment: BusinessSegment,
  fields: FormFieldsState,
  options: UseOfferBriefDraftOptions,
) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  const saveDraft = useCallback(async (): Promise<string | null> => {
    setSaveError(null);
    const payload = buildDraftPayload(draftId, businessSegment, fields);

    return new Promise((resolve) => {
      startSavingTransition(async () => {
        try {
          const saved = await saveDraftFn({ data: payload });
          setDraftId(saved.draftId);
          options.onSavedSuccess?.(saved.draftId);
          resolve(saved.draftId);
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : "Falha ao salvar rascunho da oferta";
          setSaveError(msg);
          resolve(null);
        }
      });
    });
  }, [draftId, businessSegment, fields, options, setDraftId]);

  return { saveError, isSaving, saveDraft };
}

export function useOfferBriefDraft(options: UseOfferBriefDraftOptions = {}) {
  const initialSegment: BusinessSegment =
    (options.initialDraft?.businessSegment as BusinessSegment) || "supermarket";

  const [draftId, setDraftId] = useState<string | undefined>(
    options.initialDraft?.id,
  );
  const [businessSegment, setBusinessSegment] =
    useState<BusinessSegment>(initialSegment);
  const { fields, setFields, applyExample, ...fieldSetters } =
    useDraftFormFields(initialSegment, options.initialDraft);

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { saveError, isSaving, saveDraft } = useSaveDraft(
    draftId,
    setDraftId,
    businessSegment,
    fields,
    options,
  );

  const handleSegmentChange = useCallback(
    (newSegment: BusinessSegment) => {
      setBusinessSegment((curr) => {
        setFields((f) => updateSegmentPlaceholders(f, curr, newSegment));
        return newSegment;
      });
    },
    [setFields],
  );

  const handleApplyExample = useCallback(
    (example: Parameters<typeof applyExample>[0]) => {
      applyExample(example);
      setValidationErrors(({ offerTitle: _, promoPrice: __, ...next }) => next);
    },
    [applyExample],
  );

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!fields.businessName.trim())
      errors.businessName = "Informe o nome do estabelecimento";
    if (!fields.offerTitle.trim())
      errors.offerTitle = "Informe o título da promoção ou produto";
    if (!fields.promoPrice.trim())
      errors.promoPrice = "Informe o preço promocional";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fields.businessName, fields.offerTitle, fields.promoPrice]);

  const visualInputMode = deriveVisualInputMode({
    hasProductImage: !!fields.productImageDataUrl,
    hasReferenceImage: !!fields.referenceImageDataUrl,
    hasStylePreset: !!fields.stylePresetId,
  });

  return {
    draftId,
    businessSegment,
    ...fields,
    ...fieldSetters,
    visualInputMode,
    validationErrors,
    saveError,
    isSaving,
    setBusinessSegment: handleSegmentChange,
    applyExample: handleApplyExample,
    validateForm,
    saveDraft,
  };
}
