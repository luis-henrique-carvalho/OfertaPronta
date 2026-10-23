import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ShieldCheck, PlusCircle } from "lucide-react";

export interface QuickPanelExpiredCardProps {
  id?: string;
  remainingRegenerations: number;
  maxRegenerations: number;
  onNavigateHome?: () => void;
  className?: string;
}

export function QuickPanelExpiredCard({
  id,
  remainingRegenerations,
  maxRegenerations,
  onNavigateHome,
  className,
}: QuickPanelExpiredCardProps) {
  const handleCreateNew = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (typeof window !== "undefined") {
      window.location.href = "/criar";
    }
  };

  return (
    <Card
      id={id}
      className={`w-full border-border bg-card shadow-sm ${className ?? ""}`}
    >
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-4 ring-emerald-500/10">
          <ShieldCheck className="size-6" />
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="h3" className="text-base font-bold sm:text-lg">
            Suas artes estão prontas e salvas!
          </Typography>
          <Typography
            variant="muted"
            className="max-w-xs text-xs text-muted-foreground sm:max-w-sm"
          >
            {remainingRegenerations === 0
              ? `Você aproveitou todos os ${maxRegenerations} ajustes inclusos no pedido. Seus arquivos em alta resolução continuam salvos e liberados para download quando quiser.`
              : "A janela de 30 minutos para ajustes com IA foi concluída. Suas artes em alta resolução continuam salvas no link permanente do seu pedido."}
          </Typography>
        </div>

        <div className="w-full max-w-xs pt-2">
          <Button
            type="button"
            size="lg"
            className="w-full gap-2 font-bold shadow-sm"
            onClick={handleCreateNew}
          >
            <PlusCircle className="size-4" data-icon="inline-start" />
            <span>Criar Nova Oferta</span>
          </Button>
          <Typography
            variant="muted"
            className="mt-1.5 text-center text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
          >
            +2 prévias grátis liberadas para sua próxima arte
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}
