import { z } from "zod";
import type {
  BusinessSegment,
  CardAspectRatio,
  CardIntent,
} from "@/features/promotions/data/offer-brief.schema";

export const DEFAULT_GEMINI_PROMPT_MODEL = "gemini-3.8-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-nano-banana-2.1";
export const DEFAULT_PROMPT_ENGINE_TIMEOUT_MS = 45000;
export const REFERENCE_STYLE_PRESET_ID = "reference-image";

export const editStrategySchema = z.enum(["IN_PLACE_EDIT", "RECOMPOSE_LAYOUT"]);

export type EditStrategy = z.infer<typeof editStrategySchema>;

export const editPlanSchema = z.object({
  editStrategy: editStrategySchema,
  masterPrompt: z.string().min(20),
});

export type EditPlan = z.infer<typeof editPlanSchema>;

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
  regenerationPrompt?: string | null;
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

export interface PromptEngineOptions {
  client?: PromptPlannerClient;
  model?: string;
  timeoutMs?: number;
  enableDynamicPlanner?: boolean;
}

export interface PromptEngineCompileResult {
  masterPrompt: string;
  editStrategy?: EditStrategy;
  parts: Array<string | InlineDataPart>;
  source: "ai-art-director" | "deterministic-fallback";
}

export interface ResolveRegenerationInstructionsOptions {
  presetChanged?: boolean;
  newStylePresetId?: string | null;
  colorPalette?: string | null;
}
