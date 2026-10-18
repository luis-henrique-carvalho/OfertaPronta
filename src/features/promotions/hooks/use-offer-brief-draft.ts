import { useState, useCallback, useTransition } from "react";
import type {
  BusinessSegment,
  CardAspectRatio,
  SaveOfferDraftInput,
} from "../data/offer-brief.schema";
import {
  SEGMENT_CATALOG,
  deriveVisualInputMode,
} from "../data/offer-brief.schema";
import {
  saveDraftFn,
  type SaveDraftResponse,
} from "../server/functions/drafts.functions";
import {
  generatePreviewFn,
  type GeneratePreviewResponse,
} from "../server/functions/generator.functions";

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

export type SaveDraftFunction = (args: {
  data: SaveOfferDraftInput;
}) => Promise<SaveDraftResponse>;

export type GeneratePreviewFunction = (args: {
  data: { draftId: string };
}) => Promise<GeneratePreviewResponse>;

export interface UseOfferBriefDraftOptions {
  initialDraft?: Partial<SaveOfferDraftInput> & { aiGenerationCount?: number };
  onSavedSuccess?: (draftId: string) => void;
  saveDraftFn?: SaveDraftFunction;
  generatePreviewFn?: GeneratePreviewFunction;
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
}

function getInitialFields(
  initialDraft: Partial<SaveOfferDraftInput> | undefined,
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
      SEGMENT_CATALOG[segment].stylePresets[0].id,
    customStyleInstructions: initialDraft?.customStyleInstructions ?? "",
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

  const updateField = useCallback(
    <K extends keyof FormFieldsState>(field: K, value: FormFieldsState[K]) => {
      setFields((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  return {
    fields,
    setFields,
    applyExample,
    updateField,
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
        ...(v ? { stylePresetId: undefined } : {}),
      })),
    setStylePresetId: (v?: string) =>
      setFields((p) => ({
        ...p,
        stylePresetId: v,
        ...(v ? { referenceImageDataUrl: undefined } : {}),
      })),
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

function handlePreviewRpcError(
  err: unknown,
  setGenerationError: (err: GenerationError | null) => void,
): GenerateAiPreviewResult {
  console.error(
    "[useOfferBriefDraft] Erro na chamada RPC de geração de prévia:",
    err,
  );
  const msg =
    err instanceof Error
      ? err.message
      : "Instabilidade temporária na geração por IA. Por favor, tente novamente.";
  const errObj: GenerationError = {
    code: "AI_GENERATION_FAILED",
    message: msg,
  };
  setGenerationError(errObj);
  return { success: false, ...errObj, aiGenerationCount: 0 };
}

function useAiPreviewGeneration(
  saveDraft: () => Promise<string | null>,
  saveError: string | null,
  options: UseOfferBriefDraftOptions,
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
          console.error(
            "[useOfferBriefDraft] Falha ao salvar rascunho antes da geração:",
            err,
          );
          setGenerationError(err);
          return { success: false, ...err, aiGenerationCount: 0 };
        }

        console.warn(
          "[useOfferBriefDraft] Chamando Server Function generatePreviewFn para draftId:",
          currentDraftId,
        );
        const genFn = options.generatePreviewFn ?? generatePreviewFn;
        const res = await genFn({ data: { draftId: currentDraftId } });
        console.warn(
          "[useOfferBriefDraft] Resposta recebida de generatePreviewFn:",
          res,
        );

        return applyPreviewResult(
          res,
          setPreviewCardImageUrl,
          setAiGenerationCount,
          setGenerationError,
        );
      } catch (err: unknown) {
        return handlePreviewRpcError(err, setGenerationError);
      } finally {
        clearTimers();
        setIsGenerating(false);
      }
    }, [saveDraft, options.generatePreviewFn, saveError]);

  const clearGenerationError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    isGenerating,
    generationStage,
    generationError,
    previewCardImageUrl,
    aiGenerationCount,
    generateAiPreview,
    setPreviewCardImageUrl,
    clearGenerationError,
  };
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

  const aiPreview = useAiPreviewGeneration(saveDraft, saveError, options);

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
    formData: fields,
    visualInputMode,
    validationErrors,
    saveError,
    isSaving,
    setBusinessSegment: handleSegmentChange,
    applyExample: handleApplyExample,
    validateForm,
    saveDraft,
    ...aiPreview,
  };
}
