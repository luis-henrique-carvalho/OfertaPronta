import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { MessageSquare, Check, Save } from "lucide-react";

export interface OrderWhatsappRecoveryCardProps {
  initialWhatsapp?: string | null;
  onSaveWhatsapp: (whatsapp: string) => Promise<unknown> | void;
  isSaving?: boolean;
}

export function OrderWhatsappRecoveryCard({
  initialWhatsapp,
  onSaveWhatsapp,
  isSaving = false,
}: OrderWhatsappRecoveryCardProps) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp || "");
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    const cleaned = whatsapp.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setErrorMsg("Informe DDD + número (mínimo 10 dígitos)");
      return;
    }
    setErrorMsg(null);
    try {
      await onSaveWhatsapp(cleaned);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      setErrorMsg("Erro ao salvar contato. Tente novamente.");
    }
  };

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <MessageSquare className="size-4" />
          <Typography
            variant="muted"
            className="text-xs font-bold text-primary"
          >
            Garantia de Entrega
          </Typography>
        </div>
        <CardTitle className="text-base font-bold">
          Receber link de download no WhatsApp
        </CardTitle>
        <CardDescription className="text-xs">
          Opcional: Caso precise fechar a janela, enviamos o link definitivo do
          card pronto diretamente para seu WhatsApp.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5">
        <div className="flex gap-2">
          <Input
            type="tel"
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={(e) => {
              setWhatsapp(e.target.value);
              setIsSaved(false);
            }}
            className="h-10 text-xs bg-background"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !whatsapp.trim()}
            className="h-10 px-3.5 text-xs font-bold shrink-0"
          >
            {isSaved ? (
              <>
                <Check
                  className="size-3.5 text-emerald-500"
                  data-icon="inline-start"
                />
                <span>Salvo</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" data-icon="inline-start" />
                <span>{isSaving ? "Salvando..." : "Salvar"}</span>
              </>
            )}
          </Button>
        </div>

        {errorMsg && (
          <Typography variant="muted" className="text-xs text-destructive">
            {errorMsg}
          </Typography>
        )}

        {isSaved && !errorMsg && (
          <Typography
            variant="muted"
            className="text-xs text-primary font-medium"
          >
            Contato de recuperação salvo com sucesso!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
