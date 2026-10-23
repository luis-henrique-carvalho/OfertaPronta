import { useState, useCallback, useTransition, useMemo } from "react";
import type {
  BusinessSegment,
  CardAspectRatio,
  CardIntent,
  SaveOfferDraftInput,
  DraftClientDto,
  BlockedReason,
  GeneratePreviewOutput,
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
import { formatBlockedReasonMessage } from "./use-preview-quota";

export type GenerationStage = "briefing" | "composing" | "watermarking";

export interface GenerationError {
  code: string;
  message: string;
}

export type GenerateAiPreviewResult =
  | {
      status: "OK";
      draft: DraftClientDto;
      success: true;
      previewUrl: string;
      aiGenerationCount: number;
    }
  | {
      status: "LIMIT_REACHED";
      reason: BlockedReason;
      lastDraft: DraftClientDto | null;
      success: false;
      code: "AI_QUOTA_EXCEEDED";
      message: string;
      previewUrl?: string | null;
      aiGenerationCount?: number;
    }
  | {
      status: "ERROR";
      code: string;
      message: string;
      success: false;
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
}) => Promise<GeneratePreviewOutput | GeneratePreviewResponse>;

export type InitiateCheckoutFunction = (args: {
  data: InitiateCheckoutInput;
}) => Promise<{ orderId: string }>;

export interface UseOfferBriefDraftOptions {
  initialDraft?: Partial<DraftClientDto> & {
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
) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  const saveDraft = useCallback(async (): Promise<string | null> => {
    setSaveError(null);
    const payload = buildDraftPayload(draftId, businessSegment, fields);

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
  }, [draftId, businessSegment, fields, options, setDraftId]);

  return { saveError, isSaving, saveDraft };
}

function normalizePreviewResult(
  raw: GeneratePreviewOutput | Record<string, unknown>,
  fallbackDraftId?: string,
): GeneratePreviewOutput {
  if ("status" in raw && typeof raw.status === "string") {
    return raw as GeneratePreviewOutput;
  }
  const legacy = raw as Record<string, unknown>;
  // Suporte a retorno legado para compatibilidade com mocks anteriores
  if (legacy.success) {
    return {
      status: "OK",
      draft: {
        id: fallbackDraftId ?? "draft-ok",
        businessSegment: "supermarket",
        targetAspectRatio: "feed",
        businessName: "",
        offerTitle: "",
        promoPrice: "",
        cardIntent: "promo",
        previewCardImageUrl:
          typeof legacy.previewUrl === "string" ? legacy.previewUrl : null,
        aiGenerationCount:
          typeof legacy.aiGenerationCount === "number"
            ? legacy.aiGenerationCount
            : 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }
  if (legacy.code === "AI_QUOTA_EXCEEDED") {
    return {
      status: "LIMIT_REACHED",
      reason: "visitor",
      lastDraft:
        typeof legacy.previewUrl === "string"
          ? {
              id: fallbackDraftId ?? "draft-quota",
              businessSegment: "supermarket",
              targetAspectRatio: "feed",
              businessName: "",
              offerTitle: "",
              promoPrice: "",
              cardIntent: "promo",
              previewCardImageUrl: legacy.previewUrl,
              aiGenerationCount:
                typeof legacy.aiGenerationCount === "number"
                  ? legacy.aiGenerationCount
                  : 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : null,
    };
  }
  return {
    status: "ERROR",
    code: typeof legacy.code === "string" ? legacy.code : "UNKNOWN_ERROR",
    message:
      typeof legacy.message === "string" ? legacy.message : "Erro desconhecido",
  };
}

function applyPreviewResult(
  rawRes: GeneratePreviewOutput | GeneratePreviewResponse,
  setPreviewCardImageUrl: (url: string | null) => void,
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>,
  setGenerationError: (err: GenerationError | null) => void,
  setIsLimitReached: (val: boolean) => void,
  setLimitReason: (reason: BlockedReason | null) => void,
  setLastDraft: (draft: DraftClientDto | null) => void,
  fallbackDraftId?: string,
): GenerateAiPreviewResult {
  const norm = normalizePreviewResult(rawRes, fallbackDraftId);

  if (norm.status === "OK") {
    setPreviewCardImageUrl(norm.draft.previewCardImageUrl ?? null);
    setAiGenerationCount(norm.draft.aiGenerationCount);
    setGenerationError(null);
    setIsLimitReached(false);
    setLimitReason(null);
    setLastDraft(norm.draft);
    return {
      status: "OK",
      draft: norm.draft,
      success: true,
      previewUrl: norm.draft.previewCardImageUrl ?? "",
      aiGenerationCount: norm.draft.aiGenerationCount,
    };
  }

  if (norm.status === "LIMIT_REACHED") {
    setIsLimitReached(true);
    setLimitReason(norm.reason);
    setLastDraft(norm.lastDraft);
    setGenerationError(null); // CRÍTICO: Não deve ser tratado como erro genérico
    if (norm.lastDraft?.previewCardImageUrl) {
      setPreviewCardImageUrl(norm.lastDraft.previewCardImageUrl);
    }
    if (norm.lastDraft) {
      setAiGenerationCount(norm.lastDraft.aiGenerationCount);
    }
    return {
      status: "LIMIT_REACHED",
      reason: norm.reason,
      lastDraft: norm.lastDraft,
      success: false,
      code: "AI_QUOTA_EXCEEDED",
      message: formatBlockedReasonMessage(norm.reason),
      previewUrl: norm.lastDraft?.previewCardImageUrl ?? null,
      aiGenerationCount: norm.lastDraft?.aiGenerationCount ?? 1,
    };
  }

  // norm.status === "ERROR"
  const errObj: GenerationError = { code: norm.code, message: norm.message };
  setGenerationError(errObj);
  setIsLimitReached(false);
  return {
    status: "ERROR",
    code: norm.code,
    message: norm.message,
    success: false,
    aiGenerationCount: 0,
  };
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
): Promise<GeneratePreviewOutput | GeneratePreviewResponse> {
  try {
    return await genFn({ data: { draftId } });
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Instabilidade temporária na geração por IA. Por favor, tente novamente.";
    return {
      status: "ERROR",
      code: "AI_GENERATION_FAILED",
      message: msg,
    };
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

async function performCheckoutFlow(
  draftId: string,
  options: UseOfferBriefDraftOptions,
  setGenerationError: (err: GenerationError | null) => void,
  setIsInitiatingCheckout: (val: boolean) => void,
  customerWhatsapp?: string,
): Promise<GenerateCardAndCheckoutResult> {
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

function resolveContinuousCheckoutDraftId(
  applied: ReturnType<typeof applyPreviewResult>,
  draftId: string,
): { targetDraftId?: string; error?: GenerationError } {
  if (applied.status === "ERROR") {
    return { error: { code: applied.code, message: applied.message } };
  }
  if (applied.status === "LIMIT_REACHED") {
    if (!applied.lastDraft) {
      return {
        error: {
          code: "LIMIT_REACHED",
          message:
            applied.message ||
            "Limite de prévias atingido sem rascunho anterior.",
        },
      };
    }
    return { targetDraftId: applied.lastDraft.id };
  }
  return { targetDraftId: draftId ?? applied.draft.id };
}

async function executeContinuousFlow(params: {
  draftId: string;
  options: UseOfferBriefDraftOptions;
  setPreviewCardImageUrl: (url: string | null) => void;
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>;
  setGenerationError: (err: GenerationError | null) => void;
  setIsLimitReached: (val: boolean) => void;
  setLimitReason: (reason: BlockedReason | null) => void;
  setLastDraft: (draft: DraftClientDto | null) => void;
  setIsInitiatingCheckout: (val: boolean) => void;
  customerWhatsapp?: string;
}): Promise<GenerateCardAndCheckoutResult> {
  const genFn = params.options.generatePreviewFn ?? generatePreviewFn;
  const previewRes = await callPreviewRpc(params.draftId, genFn);

  const applied = applyPreviewResult(
    previewRes,
    params.setPreviewCardImageUrl,
    params.setAiGenerationCount,
    params.setGenerationError,
    params.setIsLimitReached,
    params.setLimitReason,
    params.setLastDraft,
    params.draftId,
  );

  const resolved = resolveContinuousCheckoutDraftId(applied, params.draftId);
  if (resolved.error) {
    return {
      success: false,
      error: resolved.error,
      code: resolved.error.code,
      message: resolved.error.message,
    };
  }

  return performCheckoutFlow(
    resolved.targetDraftId!,
    params.options,
    params.setGenerationError,
    params.setIsInitiatingCheckout,
    params.customerWhatsapp,
  );
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
  setIsLimitReached: (val: boolean) => void;
  setLimitReason: (reason: BlockedReason | null) => void;
  setLastDraft: (draft: DraftClientDto | null) => void;
}

async function runContinuousCheckoutOrchestration(
  params: ContinuousOrchestrationParams,
  setIsInitiatingCheckout: (val: boolean) => void,
  overrideWhatsapp?: string,
): Promise<GenerateCardAndCheckoutResult> {
  params.setIsGenerating(true);
  params.setGenerationError(null);
  params.setGenerationStage("briefing");
  const clearTimers = startStageProgressTimers(params.setGenerationStage);

  try {
    const currentDraftId = await params.saveDraft();
    if (!currentDraftId) {
      const err: GenerationError = {
        code: "SAVE_FAILED",
        message:
          params.saveError ||
          "Não foi possível salvar os dados do rascunho antes da geração.",
      };
      params.setGenerationError(err);
      return {
        success: false,
        error: err,
        code: err.code,
        message: err.message,
      };
    }

    const rawWhatsapp = overrideWhatsapp ?? params.defaultCustomerWhatsapp;
    const customerWhatsapp =
      rawWhatsapp && rawWhatsapp.trim().length > 0
        ? rawWhatsapp.trim()
        : undefined;

    return await executeContinuousFlow({
      draftId: currentDraftId,
      options: params.options,
      setPreviewCardImageUrl: params.setPreviewCardImageUrl,
      setAiGenerationCount: params.setAiGenerationCount,
      setGenerationError: params.setGenerationError,
      setIsLimitReached: params.setIsLimitReached,
      setLimitReason: params.setLimitReason,
      setLastDraft: params.setLastDraft,
      setIsInitiatingCheckout,
      customerWhatsapp,
    });
  } finally {
    clearTimers();
    params.setIsGenerating(false);
  }
}

function useContinuousCheckoutOrchestration(
  params: ContinuousOrchestrationParams,
) {
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false);

  const generateCardAndInitiateCheckout = useCallback(
    (overrideParams?: { customerWhatsapp?: string }) => {
      return runContinuousCheckoutOrchestration(
        params,
        setIsInitiatingCheckout,
        overrideParams?.customerWhatsapp,
      );
    },
    [params],
  );

  return {
    isInitiatingCheckout,
    setIsInitiatingCheckout,
    generateCardAndInitiateCheckout,
  };
}

interface ExecutePreviewStepParams {
  saveDraft: () => Promise<string | null>;
  currentDraftId?: string;
  saveError: string | null;
  options: UseOfferBriefDraftOptions;
  setPreviewCardImageUrl: (url: string | null) => void;
  setAiGenerationCount: React.Dispatch<React.SetStateAction<number>>;
  setGenerationError: (err: GenerationError | null) => void;
  setIsLimitReached: (val: boolean) => void;
  setLimitReason: (reason: BlockedReason | null) => void;
  setLastDraft: (draft: DraftClientDto | null) => void;
}

async function executePreviewStep(
  params: ExecutePreviewStepParams,
): Promise<GenerateAiPreviewResult> {
  const activeDraftId = (await params.saveDraft()) ?? params.currentDraftId;
  if (!activeDraftId) {
    const err: GenerationError = {
      code: "SAVE_FAILED",
      message:
        params.saveError ||
        "Não foi possível salvar os dados do rascunho antes da geração.",
    };
    params.setGenerationError(err);
    return {
      status: "ERROR",
      code: err.code,
      message: err.message,
      success: false,
      aiGenerationCount: 0,
    };
  }

  const genFn = params.options.generatePreviewFn ?? generatePreviewFn;
  const res = await callPreviewRpc(activeDraftId, genFn);

  return applyPreviewResult(
    res,
    params.setPreviewCardImageUrl,
    params.setAiGenerationCount,
    params.setGenerationError,
    params.setIsLimitReached,
    params.setLimitReason,
    params.setLastDraft,
    activeDraftId,
  );
}

async function executeLastDraftCheckout(
  targetDraftId: string | undefined,
  options: UseOfferBriefDraftOptions,
  setGenerationError: (err: GenerationError | null) => void,
  setIsInitiatingCheckout: (val: boolean) => void,
  customerWhatsapp?: string,
): Promise<GenerateCardAndCheckoutResult> {
  if (!targetDraftId) {
    const err: GenerationError = {
      code: "NO_DRAFT",
      message: "Nenhum rascunho anterior disponível para checkout.",
    };
    setGenerationError(err);
    return { success: false, error: err, code: err.code, message: err.message };
  }
  setGenerationError(null);
  return performCheckoutFlow(
    targetDraftId,
    options,
    setGenerationError,
    setIsInitiatingCheckout,
    customerWhatsapp,
  );
}

function usePreviewState(
  initialDraft?: UseOfferBriefDraftOptions["initialDraft"],
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("briefing");
  const [generationError, setGenerationError] =
    useState<GenerationError | null>(null);
  const [previewCardImageUrl, setPreviewCardImageUrl] = useState<string | null>(
    initialDraft?.previewCardImageUrl ?? null,
  );
  const [aiGenerationCount, setAiGenerationCount] = useState<number>(
    initialDraft?.aiGenerationCount ?? 0,
  );
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitReason, setLimitReason] = useState<BlockedReason | null>(null);
  const [lastDraft, setLastDraft] = useState<DraftClientDto | null>(null);

  return {
    isGenerating,
    setIsGenerating,
    generationStage,
    setGenerationStage,
    generationError,
    setGenerationError,
    previewCardImageUrl,
    setPreviewCardImageUrl,
    aiGenerationCount,
    setAiGenerationCount,
    isLimitReached,
    setIsLimitReached,
    limitReason,
    setLimitReason,
    lastDraft,
    setLastDraft,
  };
}

function useAiPreviewGeneration(
  saveDraft: () => Promise<string | null>,
  saveError: string | null,
  options: UseOfferBriefDraftOptions,
  defaultCustomerWhatsapp?: string,
  currentDraftId?: string,
) {
  const state = usePreviewState(options.initialDraft);

  const generateAiPreview =
    useCallback(async (): Promise<GenerateAiPreviewResult> => {
      state.setIsGenerating(true);
      state.setGenerationError(null);
      state.setGenerationStage("briefing");
      const clearTimers = startStageProgressTimers(state.setGenerationStage);
      try {
        return await executePreviewStep({
          saveDraft,
          currentDraftId,
          saveError,
          options,
          setPreviewCardImageUrl: state.setPreviewCardImageUrl,
          setAiGenerationCount: state.setAiGenerationCount,
          setGenerationError: state.setGenerationError,
          setIsLimitReached: state.setIsLimitReached,
          setLimitReason: state.setLimitReason,
          setLastDraft: state.setLastDraft,
        });
      } finally {
        clearTimers();
        state.setIsGenerating(false);
      }
    }, [saveDraft, currentDraftId, options, saveError, state]);

  const orchestration = useContinuousCheckoutOrchestration({
    saveDraft,
    saveError,
    options,
    defaultCustomerWhatsapp,
    ...state,
  });

  const clearGenerationError = useCallback(() => {
    state.setGenerationError(null);
  }, [state]);

  const initiateLastDraftCheckout = useCallback(
    (overrideWhatsapp?: string) => {
      const targetDraftId = state.lastDraft?.id ?? currentDraftId;
      return executeLastDraftCheckout(
        targetDraftId,
        options,
        state.setGenerationError,
        orchestration.setIsInitiatingCheckout,
        overrideWhatsapp ?? defaultCustomerWhatsapp,
      );
    },
    [
      state.lastDraft,
      state.setGenerationError,
      currentDraftId,
      options,
      orchestration.setIsInitiatingCheckout,
      defaultCustomerWhatsapp,
    ],
  );

  return {
    isGenerating: state.isGenerating,
    ...orchestration,
    generationStage: state.generationStage,
    generationError: state.generationError,
    previewCardImageUrl: state.previewCardImageUrl,
    aiGenerationCount: state.aiGenerationCount,
    isLimitReached: state.isLimitReached,
    limitReason: state.limitReason,
    lastDraft: state.lastDraft,
    generateAiPreview,
    setPreviewCardImageUrl: state.setPreviewCardImageUrl,
    clearGenerationError,
    initiateLastDraftCheckout,
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
  );

  const aiPreview = useAiPreviewGeneration(
    saveDraft,
    saveError,
    options,
    fields.whatsapp,
    draftId,
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
