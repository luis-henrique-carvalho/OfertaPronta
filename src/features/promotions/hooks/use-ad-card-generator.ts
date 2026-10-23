import { useState, useCallback } from "react";
import type {
  DraftClientDto,
  BlockedReason,
  GeneratePreviewOutput,
} from "../data/offer-brief.schema";
import { generatePreviewFn as defaultGeneratePreviewFn } from "../server/functions/generator.functions";

export type GenerationStage = "briefing" | "composing" | "watermarking";

export interface GenerationError {
  code: string;
  message: string;
}

export type GeneratePreviewFunction = (args: {
  data: { draftId: string };
}) => Promise<GeneratePreviewOutput>;

export interface UseAdCardGeneratorOptions {
  generatePreviewFn?: GeneratePreviewFunction;
  onSuccess?: (draft: DraftClientDto) => void;
  onLimitReached?: (
    reason: BlockedReason,
    lastDraft: DraftClientDto | null,
  ) => void;
  onError?: (error: GenerationError) => void;
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

/**
 * Hook dedicado para geração de Card Publicitário via IA Multimodal e tratamento
 * discriminado de resposta (OK | LIMIT_REACHED | ERROR).
 */
export function useAdCardGenerator(options: UseAdCardGeneratorOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage>("briefing");
  const [error, setError] = useState<GenerationError | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitReason, setLimitReason] = useState<BlockedReason | null>(null);
  const [lastDraft, setLastDraft] = useState<DraftClientDto | null>(null);
  const [currentDraft, setCurrentDraft] = useState<DraftClientDto | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateCard = useCallback(
    async (draftId: string): Promise<GeneratePreviewOutput> => {
      setIsGenerating(true);
      setError(null);
      setStage("briefing");
      const clearTimers = startStageProgressTimers(setStage);

      try {
        const genFn = options.generatePreviewFn ?? defaultGeneratePreviewFn;
        let response: GeneratePreviewOutput;

        try {
          const raw = await genFn({ data: { draftId } });
          response = raw;
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : "Instabilidade temporária na geração por IA. Por favor, tente novamente.";
          response = {
            status: "ERROR",
            code: "AI_GENERATION_FAILED",
            message: msg,
          };
        }

        if (response.status === "OK") {
          setCurrentDraft(response.draft);
          setLastDraft(response.draft);
          setIsLimitReached(false);
          setLimitReason(null);
          setError(null);
          options.onSuccess?.(response.draft);
          return response;
        }

        if (response.status === "LIMIT_REACHED") {
          setIsLimitReached(true);
          setLimitReason(response.reason);
          setLastDraft(response.lastDraft);
          setError(null); // LIMIT_REACHED não é tratado como erro genérico
          options.onLimitReached?.(response.reason, response.lastDraft);
          return response;
        }

        // status === "ERROR"
        const errObj: GenerationError = {
          code: response.code,
          message: response.message,
        };
        setError(errObj);
        setIsLimitReached(false);
        options.onError?.(errObj);
        return response;
      } finally {
        clearTimers();
        setIsGenerating(false);
      }
    },
    [options],
  );

  return {
    isGenerating,
    stage,
    error,
    isLimitReached,
    limitReason,
    lastDraft,
    currentDraft,
    generateCard,
    clearError,
  };
}
