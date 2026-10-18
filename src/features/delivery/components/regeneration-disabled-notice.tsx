import { Typography } from "@/components/ui/typography";
import { Lock } from "lucide-react";

export interface RegenerationDisabledNoticeProps {
  remainingRegenerations: number;
  maxRegenerations: number;
}

export function RegenerationDisabledNotice({
  remainingRegenerations,
  maxRegenerations,
}: RegenerationDisabledNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" />
      </div>
      <Typography variant="h4" className="text-sm font-bold">
        {remainingRegenerations === 0
          ? "Limite de Ajustes Atingido"
          : "Janela de Ajustes com IA Encerrada"}
      </Typography>
      <Typography
        variant="muted"
        className="max-w-xs text-xs text-muted-foreground"
      >
        {remainingRegenerations === 0
          ? `Você utilizou todos os ${maxRegenerations} ajustes inclusos no pedido. Suas artes em alta resolução continuam permanentemente liberadas para download.`
          : "A janela de 30 minutos para ajustes com IA foi encerrada. Seus arquivos em alta resolução continuam salvos e disponíveis permanentemente."}
      </Typography>
    </div>
  );
}
