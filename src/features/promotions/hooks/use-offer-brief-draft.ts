import { useState, useCallback, useTransition, useMemo } from "react";
import type {
  BusinessSegment,
  CardAspectRatio,
  CardIntent,
  SaveOfferDraftInput,
} from "../data/offer-brief.schema";
import {
  SEGMENT_CATALOG,
  deriveVisualInputMode,
  REFERENCE_STYLE_PRESET_ID,
} from "../data/offer-brief.schema";
import {
  saveDraftFn,
  type SaveDraftResponse,
} from "../server/functions/drafts.functions";
import {
  generatePreviewFn,
  type GeneratePreviewResponse,
} from "../server/functions/generator.functions";
import { initiateCheckoutFn as defaultInitiateCheckoutFn } from "../../checkout/server/functions/checkout.functions";
import type { InitiateCheckoutInput } from "../../checkout/data/checkout.schemas";

export type GenerationStage = "briefing" | "composing" | "watermarking";

export interface GenerationError {
  code: string;
  message: string;
}

export type GenerateAiPreviewResult =
  | {
      success: true;
      previewUrl: string;
      aiGenerationCount: 1;
    }
  | {
      success: false;
      code: "AI_QUOTA_EXCEEDED";
      message: string;
      previewUrl?: string | null;
      aiGenerationCount?: number;
    }
  | {
      success: false;
      code: string;
      message: string;
      aiGenerationCount?: number;
    };

export type GenerateCardAndCheckoutResult =
  | {
      success: true;
      orderId: string;
    }
  | {
      success: false;
      error: GenerationError;
      code: string;
      message: string;
    };

export type SaveDraftFunction = (args: {
  data: SaveOfferDraftInput;
}) => Promise<SaveDraftResponse>;

export type GeneratePreviewFunction = (args: {
  data: { draftId: string };
}) => Promise<GeneratePreviewResponse>;

export type InitiateCheckoutFunction = (args: {
  data: InitiateCheckoutInput;
}) => Promise<{ orderId: string }>;

export interface UseOfferBriefDraftOptions {
  initialDraft?: Partial<SaveOfferDraftInput> & {
    aiGenerationCount?: number;
    customStyleNote?: string;
  };
  onSavedSuccess?: (draftId: string) => void;
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
  initiateCheckoutFn?: InitiateCheckoutFunction;
}

export interface FormFieldsState {
  targetAspectRatio: CardAspectRatio;
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
  cardIntent: CardIntent;
  customIntentText: string;
  logoImageDataUrl?: string;
  customStyleNote: string;
}

function getInitialFields(
  initialDraft:
    (Partial<SaveOfferDraftInput> & { customStyleNote?: string }) | undefined,
  segment: BusinessSegment,
): FormFieldsState {
  const placeholders = SEGMENT_CATALOG[segment].placeholders;
  return {
    targetAspectRatio: initialDraft?.targetAspectRatio ?? "feed",
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
      (initialDraft?.referenceImageDataUrl
        ? REFERENCE_STYLE_PRESET_ID
        : SEGMENT_CATALOG[segment].stylePresets[0].id),
    customStyleInstructions:
      initialDraft?.customStyleInstructions ??
      initialDraft?.customStyleNote ??
      "",
    cardIntent: initialDraft?.cardIntent ?? "promo",
    customIntentText: initialDraft?.customIntentText ?? "",
    logoImageDataUrl: initialDraft?.logoImageDataUrl ?? undefined,
    customStyleNote:
      initialDraft?.customStyleNote ??
      initialDraft?.customStyleInstructions ??
      "",
  };
}

function buildDraftPayload(
  draftId: string | undefined,
  businessSegment: BusinessSegment,
  fields: FormFieldsState,
  previewCardImageUrl?: string | null,
): SaveOfferDraftInput {
  return {
    id: draftId,
    businessSegment,
    targetAspectRatio: fields.targetAspectRatio,
    cardIntent: fields.cardIntent,
    customIntentText: fields.customIntentText || null,
    businessName: fields.businessName,
    offerTitle: fields.offerTitle,
    promoPrice: fields.promoPrice,
    originalPrice: fields.originalPrice || null,
    callToAction: fields.callToAction || null,
    whatsapp: fields.whatsapp || null,
    productImageDataUrl: fields.productImageDataUrl || null,
    referenceImageDataUrl: fields.referenceImageDataUrl || null,
    logoImageDataUrl: fields.logoImageDataUrl || null,
    stylePresetId: fields.stylePresetId || null,
    customStyleInstructions:
      fields.customStyleNote || fields.customStyleInstructions || null,
    previewCardImageUrl: previewCardImageUrl || null,
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
    referenceImageDataUrl: undefined,
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

function createFieldSetters(
  setFields: React.Dispatch<React.SetStateAction<FormFieldsState>>,
) {
  return {
    setTargetAspectRatio: (v: CardAspectRatio) =>
      setFields((p) => ({ ...p, targetAspectRatio: v })),
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
      setFields((p) => ({
        ...p,
        referenceImageDataUrl: v,
        stylePresetId: v ? REFERENCE_STYLE_PRESET_ID : p.stylePresetId,
      })),
    setStylePresetId: (v?: string) =>
      setFields((p) => ({
        ...p,
        stylePresetId: v,
      })),
    setCustomStyleInstructions: (v: string) =>
      setFields((p) => ({
        ...p,
        customStyleInstructions: v,
        customStyleNote: v,
      })),
    setCardIntent: (intent: CardIntent) =>
      setFields((p) => ({ ...p, cardIntent: intent })),
    setCustomIntentText: (text: string) =>
      setFields((p) => ({ ...p, customIntentText: text })),
    setLogoImageDataUrl: (url?: string) =>
      setFields((p) => ({ ...p, logoImageDataUrl: url })),
    setCustomStyleNote: (note: string) =>
      setFields((p) => ({
        ...p,
        customStyleNote: note,
        customStyleInstructions: note,
      })),
  };
}

function useDraftFormFields(
  initialSegment: BusinessSegment,
  initialDraft?: Partial<SaveOfferDraftInput> & { customStyleNote?: string },
) {
  const [fields, setFields] = useState<FormFieldsState>(() =>
    getInitialFields(initialDraft, initialSegment),
  );

  const applyExample = useCallback(
    (example: {
      title: string;
      promoPrice?: string;
      price?: string;
      originalPrice?: string;
      stylePresetId?: string;
    }) => {
      const priceVal = example.promoPrice ?? example.price;
      setFields((prev) => ({
        ...prev,
        offerTitle: example.title,
        ...(priceVal !== undefined ? { promoPrice: priceVal } : {}),
        originalPrice: example.originalPrice ?? prev.originalPrice,
        ...(example.stylePresetId
          ? { stylePresetId: example.stylePresetId }
          : {}),
      }));
    },
    [],
  );

  const updateField = useCallback(
    <K extends keyof FormFieldsState>(field: K, value: FormFieldsState[K]) => {
      setFields((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const fieldSetters = useMemo(
    () => createFieldSetters(setFields),
    [setFields],
  );

  return {
    fields,
    setFields,
    applyExample,
    updateField,
    ...fieldSetters,
  };
}

function useSaveDraft(
  draftId: string | undefined,
  setDraftId: (id: string) => void,
  businessSegment: BusinessSegment,
  fields: FormFieldsState,
  options: UseOfferBriefDraftOptions,
  previewCardImageUrl: string | null,
) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  const saveDraft = useCallback(async (): Promise<string | null> => {
    setSaveError(null);
    const payload = buildDraftPayload(
      draftId,
      businessSegment,
      fields,
      previewCardImageUrl,
    );

    return new Promise((resolve) => {
      startSavingTransition(async () => {
        try {
          const fn = options.saveDraftFn ?? saveDraftFn;
          const saved = await fn({ data: payload });
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
  }, [
    draftId,
    businessSegment,
    fields,
    options,
    previewCardImageUrl,
    setDraftId,
  ]);

  return { saveError, isSaving, saveDraft };
}

function applyPreviewResult(
  res: GeneratePreviewResponse,
  setPreviewCardImageUrl: (url: string | null) => void,
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>,
  setGenerationError: (err: GenerationError | null) => void,
): GeneratePreviewResponse {
  if (res.success) {
    setPreviewCardImageUrl(res.previewUrl);
    setAiGenerationCount(res.aiGenerationCount);
    setGenerationError(null);
    return res;
  }

  if (res.code === "AI_QUOTA_EXCEEDED") {
    if (res.previewUrl) setPreviewCardImageUrl(res.previewUrl);
    if (res.aiGenerationCount !== undefined) {
      setAiGenerationCount(res.aiGenerationCount);
    }
  }

  setGenerationError({ code: res.code, message: res.message });
  return res;
}

function startStageProgressTimers(
  setStage: React.Dispatch<React.SetStateAction<GenerationStage>>,
) {
  const timer1 = setTimeout(() => setStage("composing"), 2500);
  const timer2 = setTimeout(() => setStage("watermarking"), 5500);
  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
  };
}

async function callPreviewRpc(
  draftId: string,
  genFn: GeneratePreviewFunction,
): Promise<GeneratePreviewResponse | GenerationError> {
  try {
    return await genFn({ data: { draftId } });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Instabilidade temporária na geração por IA. Por favor, tente novamente.";
    return { code: "AI_GENERATION_FAILED", message: msg };
  }
}

async function callCheckoutRpc(
  draftId: string,
  chkFn: InitiateCheckoutFunction,
  customerWhatsapp?: string,
): Promise<{ orderId: string } | GenerationError> {
  try {
    return await chkFn({
      data: {
        draftId,
        ...(customerWhatsapp ? { customerWhatsapp } : {}),
      },
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Falha ao iniciar checkout Pix. Por favor, tente novamente.";
    return { code: "CHECKOUT_INIT_FAILED", message: msg };
  }
}

async function executeContinuousFlow(params: {
  draftId: string;
  options: UseOfferBriefDraftOptions;
  setPreviewCardImageUrl: (url: string | null) => void;
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>;
  setGenerationError: (err: GenerationError | null) => void;
  setIsInitiatingCheckout: (val: boolean) => void;
  customerWhatsapp?: string;
}): Promise<GenerateCardAndCheckoutResult> {
  const {
    draftId,
    options,
    setPreviewCardImageUrl,
    setAiGenerationCount,
    setGenerationError,
    setIsInitiatingCheckout,
    customerWhatsapp,
  } = params;

  const genFn = options.generatePreviewFn ?? generatePreviewFn;
  const previewRes = await callPreviewRpc(draftId, genFn);
  if ("code" in previewRes && !("success" in previewRes)) {
    setGenerationError(previewRes);
    return {
      success: false,
      error: previewRes,
      code: previewRes.code,
      message: previewRes.message,
    };
  }

  const res = previewRes as GeneratePreviewResponse;
  applyPreviewResult(
    res,
    setPreviewCardImageUrl,
    setAiGenerationCount,
    setGenerationError,
  );

  if (!res.success && res.code !== "AI_QUOTA_EXCEEDED") {
    const errObj: GenerationError = { code: res.code, message: res.message };
    return {
      success: false,
      error: errObj,
      code: errObj.code,
      message: errObj.message,
    };
  }

  setIsInitiatingCheckout(true);
  try {
    const chkFn = options.initiateCheckoutFn ?? defaultInitiateCheckoutFn;
    const checkoutRes = await callCheckoutRpc(draftId, chkFn, customerWhatsapp);
    if ("code" in checkoutRes) {
      setGenerationError(checkoutRes);
      return {
        success: false,
        error: checkoutRes,
        code: checkoutRes.code,
        message: checkoutRes.message,
      };
    }
    setGenerationError(null);
    return { success: true, orderId: checkoutRes.orderId };
  } finally {
    setIsInitiatingCheckout(false);
  }
}

interface ContinuousOrchestrationParams {
  saveDraft: () => Promise<string | null>;
  saveError: string | null;
  options: UseOfferBriefDraftOptions;
  defaultCustomerWhatsapp?: string;
  setIsGenerating: (v: boolean) => void;
  setGenerationError: (err: GenerationError | null) => void;
  setGenerationStage: React.Dispatch<React.SetStateAction<GenerationStage>>;
  setPreviewCardImageUrl: (url: string | null) => void;
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>;
}

function useContinuousCheckoutOrchestration(
  params: ContinuousOrchestrationParams,
) {
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false);
  const {
    saveDraft,
    saveError,
    options,
    defaultCustomerWhatsapp,
    setIsGenerating,
    setGenerationError,
    setGenerationStage,
    setPreviewCardImageUrl,
    setAiGenerationCount,
  } = params;

  const generateCardAndInitiateCheckout = useCallback(
    async (overrideParams?: {
      customerWhatsapp?: string;
    }): Promise<GenerateCardAndCheckoutResult> => {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationStage("briefing");
      const clearTimers = startStageProgressTimers(setGenerationStage);

      try {
        const currentDraftId = await saveDraft();
        if (!currentDraftId) {
          const err: GenerationError = {
            code: "SAVE_FAILED",
            message:
              saveError ||
              "Não foi possível salvar os dados do rascunho antes da geração.",
          };
          setGenerationError(err);
          return {
            success: false,
            error: err,
            code: err.code,
            message: err.message,
          };
        }

        const rawWhatsapp =
          overrideParams?.customerWhatsapp ?? defaultCustomerWhatsapp;
        const customerWhatsapp =
          rawWhatsapp && rawWhatsapp.trim().length > 0
            ? rawWhatsapp.trim()
            : undefined;

        return await executeContinuousFlow({
          draftId: currentDraftId,
          options,
          setPreviewCardImageUrl,
          setAiGenerationCount,
          setGenerationError,
          setIsInitiatingCheckout,
          customerWhatsapp,
        });
      } finally {
        clearTimers();
        setIsGenerating(false);
      }
    },
    [
      saveDraft,
      saveError,
      options,
      defaultCustomerWhatsapp,
      setIsGenerating,
      setGenerationError,
      setGenerationStage,
      setPreviewCardImageUrl,
      setAiGenerationCount,
    ],
  );

  return { isInitiatingCheckout, generateCardAndInitiateCheckout };
}

function useAiPreviewGeneration(
  saveDraft: () => Promise<string | null>,
  saveError: string | null,
  options: UseOfferBriefDraftOptions,
  defaultCustomerWhatsapp?: string,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("briefing");
  const [generationError, setGenerationError] =
    useState<GenerationError | null>(null);
  const [previewCardImageUrl, setPreviewCardImageUrl] = useState<string | null>(
    options.initialDraft?.previewCardImageUrl ?? null,
  );
  const [aiGenerationCount, setAiGenerationCount] = useState<number>(
    options.initialDraft?.aiGenerationCount ?? 0,
  );

  const generateAiPreview =
    useCallback(async (): Promise<GenerateAiPreviewResult> => {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationStage("briefing");
      const clearTimers = startStageProgressTimers(setGenerationStage);

      try {
        const currentDraftId = await saveDraft();
        if (!currentDraftId) {
          const err: GenerationError = {
            code: "SAVE_FAILED",
            message:
              saveError ||
              "Não foi possível salvar os dados do rascunho antes da geração.",
          };
          setGenerationError(err);
          return { success: false, ...err, aiGenerationCount: 0 };
        }

        const genFn = options.generatePreviewFn ?? generatePreviewFn;
        const res = await callPreviewRpc(currentDraftId, genFn);
        if ("code" in res && !("success" in res)) {
          setGenerationError(res);
          return { success: false, ...res, aiGenerationCount: 0 };
        }

        return applyPreviewResult(
          res as GeneratePreviewResponse,
          setPreviewCardImageUrl,
          setAiGenerationCount,
          setGenerationError,
        );
      } finally {
        clearTimers();
        setIsGenerating(false);
      }
    }, [saveDraft, options.generatePreviewFn, saveError]);

  const orchestration = useContinuousCheckoutOrchestration({
    saveDraft,
    saveError,
    options,
    defaultCustomerWhatsapp,
    setIsGenerating,
    setGenerationError,
    setGenerationStage,
    setPreviewCardImageUrl,
    setAiGenerationCount,
  });

  const clearGenerationError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    isGenerating,
    ...orchestration,
    generationStage,
    generationError,
    previewCardImageUrl,
    aiGenerationCount,
    generateAiPreview,
    setPreviewCardImageUrl,
    clearGenerationError,
  };
}

export function isStep2Valid(fields: {
  businessName?: string;
  offerTitle?: string;
  cardIntent?: CardIntent;
  promoPrice?: string;
  customIntentText?: string;
}): boolean {
  if (!fields.businessName || !fields.businessName.trim()) return false;
  if (!fields.offerTitle || !fields.offerTitle.trim()) return false;
  const intent = fields.cardIntent ?? "promo";
  if (intent === "promo") {
    return Boolean(fields.promoPrice && fields.promoPrice.trim().length > 0);
  }
  if (intent === "custom") {
    return Boolean(
      fields.customIntentText && fields.customIntentText.trim().length > 0,
    );
  }
  return true;
}

function computeStep2Errors(fields: FormFieldsState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.businessName || !fields.businessName.trim()) {
    errors.businessName = "Informe o nome do estabelecimento";
  }
  if (!fields.offerTitle || !fields.offerTitle.trim()) {
    errors.offerTitle = "Informe o título ou mensagem principal";
  }
  if (
    fields.cardIntent === "promo" &&
    (!fields.promoPrice || !fields.promoPrice.trim())
  ) {
    errors.promoPrice = "Informe o preço promocional";
  }
  if (
    fields.cardIntent === "custom" &&
    (!fields.customIntentText || !fields.customIntentText.trim())
  ) {
    errors.customIntentText = "Descreva o tipo de card que você deseja criar";
  }
  return errors;
}

function computeFormErrors(fields: FormFieldsState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.businessName.trim())
    errors.businessName = "Informe o nome do estabelecimento";
  if (!fields.offerTitle.trim())
    errors.offerTitle = "Informe o título da promoção ou produto";
  if (fields.cardIntent === "promo" && !fields.promoPrice.trim())
    errors.promoPrice = "Informe o preço promocional";
  if (fields.cardIntent === "custom" && !fields.customIntentText.trim())
    errors.customIntentText = "Descreva o tipo de card que você deseja criar";
  return errors;
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
    options.initialDraft?.previewCardImageUrl ?? null,
  );

  const aiPreview = useAiPreviewGeneration(
    saveDraft,
    saveError,
    options,
    fields.whatsapp,
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

  const validateStep2 = useCallback((): boolean => {
    const errors = computeStep2Errors(fields);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fields]);

  const validateForm = useCallback((): boolean => {
    const errors = computeFormErrors(fields);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fields]);

  const step2Valid = useMemo(() => isStep2Valid(fields), [fields]);

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
    formData: fields,
    visualInputMode,
    validationErrors,
    saveError,
    isSaving,
    isStep2Valid: step2Valid,
    validateStep2,
    setBusinessSegment: handleSegmentChange,
    applyExample: handleApplyExample,
    validateForm,
    saveDraft,
    ...aiPreview,
  };
}
