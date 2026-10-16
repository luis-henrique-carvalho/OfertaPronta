import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Loader2, Circle } from "lucide-react";
import type { GenerationStage } from "../hooks/use-offer-brief-draft";

export interface ContextualAiLoaderProps {
  open: boolean;
  stage: GenerationStage;
}

interface StepConfig {
  id: GenerationStage;
  title: string;
  order: number;
}

const STEPS: StepConfig[] = [
  { id: "briefing", title: "Briefing & Insumos", order: 1 },
  { id: "composing", title: "Cenário & Iluminação", order: 2 },
  { id: "watermarking", title: "Textos & Proteção", order: 3 },
];

const STAGE_MESSAGES: Record<GenerationStage, string> = {
  briefing: "Interpretando seu briefing e insumos visuais...",
  composing: "Compondo o cenário e iluminação comercial com IA...",
  watermarking: "Integrando textos e aplicando proteção de prévia...",
};

const STAGE_PROGRESS: Record<GenerationStage, number> = {
  briefing: 28,
  composing: 65,
  watermarking: 92,
};

export function ContextualAiLoader({ open, stage }: ContextualAiLoaderProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.id === stage);
  const activeMessage = STAGE_MESSAGES[stage];
  const progressPercent = STAGE_PROGRESS[stage];

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md border-border bg-card/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-2xl [&>button]:hidden overscroll-contain"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2 text-center items-center">
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>Inteligência Artificial Multimodal</span>
          </Badge>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-center">
            Criando seu Card Publicitário
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground text-center">
            Nossa IA está gerando o card em alta resolução. Isso leva de 4 a 10
            segundos.
          </DialogDescription>
        </DialogHeader>

        {/* Glow visual central */}
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          {/* shadcn-ignore: decorativo */}
          <div className="relative flex size-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
            <Sparkles className="size-10 text-primary animate-pulse" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          </div>

          <Typography
            variant="p"
            className="text-center font-bold text-sm sm:text-base text-foreground max-w-xs min-h-[44px] flex items-center justify-center"
          >
            {activeMessage}
          </Typography>
        </div>

        {/* Barra de Progresso Progressiva */}
        <div className="flex flex-col gap-2 pt-1">
          <Progress value={progressPercent} className="h-2 w-full" />
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Processando</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Linha do tempo das 3 micro-etapas */}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className="flex items-center gap-2.5 text-xs transition-colors duration-200"
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                )}

                <span
                  className={
                    isCurrent
                      ? "font-bold text-foreground"
                      : isCompleted
                        ? "text-muted-foreground line-through decoration-muted-foreground/40"
                        : "text-muted-foreground/60"
                  }
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
