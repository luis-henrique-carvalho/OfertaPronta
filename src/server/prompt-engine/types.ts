import type {
  BusinessSegment,
  CardAspectRatio,
  CardIntent,
} from "@/features/promotions/data/offer-brief.schema";

export const DEFAULT_GEMINI_PROMPT_MODEL = "gemini-3.8-flash";
export const DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS = 8000;

export type EditIntentMode = "SURGICAL" | "RECOMPOSE";

export interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface PromptEngineInput {
  businessSegment: BusinessSegment;
  targetAspectRatio?: CardAspectRatio;
  businessName: string;
  offerTitle: string;
  promoPrice?: string | null;
  originalPrice?: string | null;
  callToAction?: string | null;
  whatsapp?: string | null;
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  baseCardImageDataUrl?: string | null;
  stylePresetId?: string | null;
  customStyleInstructions?: string | null;
  logoImageDataUrl?: string | null;
  cardIntent?: CardIntent | null;
  customIntentText?: string | null;
}

export interface PromptPlannerResponseCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: {
        mimeType?: string;
        data?: string;
      };
    }>;
  };
}

export interface PromptPlannerGenerateResponse {
  text?: string;
  candidates?: PromptPlannerResponseCandidate[];
}

export interface PromptPlannerClient {
  models: {
    generateContent(params: {
      model: string;
      contents: Array<string | InlineDataPart>;
      config?: Record<string, unknown>;
    }): Promise<PromptPlannerGenerateResponse>;
  };
}

export interface DynamicCompositionBrief {
  subjectAnatomy: string;
  safeTypographyZone: string;
  antiOcclusionStrategy: string;
  layoutAdaptation: string;
  source: "ai-dynamic" | "deterministic-fallback";
}

export interface DynamicPromptCompileOptions {
  client?: PromptPlannerClient;
  model?: string;
  timeoutMs?: number;
  enableDynamicPlanner?: boolean;
}

export interface DetectEditIntentInput {
  customStyleInstructions?: string | null;
  presetChanged?: boolean;
  hasReferenceOverride?: boolean;
}

export interface ResolveRegenerationInstructionsOptions {
  presetChanged?: boolean;
  newStylePresetId?: string | null;
  colorPalette?: string | null;
}
