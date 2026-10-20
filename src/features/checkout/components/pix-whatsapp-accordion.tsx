import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { MessageSquare, Check, Save } from "lucide-react";

export interface PixWhatsappAccordionProps {
  initialWhatsapp?: string | null;
  onSaveWhatsapp: (whatsapp: string) => Promise<unknown> | void;
  isSavingWhatsapp?: boolean;
}

export function PixWhatsappAccordion({
  initialWhatsapp,
  onSaveWhatsapp,
  isSavingWhatsapp = false,
}: PixWhatsappAccordionProps) {
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
    <Accordion
      type="single"
      collapsible
      className="w-full border-t border-border/50 pt-1"
    >
      <AccordionItem value="whatsapp" className="border-none">
        <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline hover:text-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-primary" />
            <span>Receber link também no WhatsApp (opcional)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-1">
          <div className="flex flex-col gap-2">
            <Typography
              variant="muted"
              className="text-[11px] text-muted-foreground"
            >
              Enviaremos o link direto da página de download para seu número
              assim que o Pix for confirmado.
            </Typography>
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
                disabled={isSavingWhatsapp || !whatsapp.trim()}
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
                    <span>{isSavingWhatsapp ? "Salvando..." : "Salvar"}</span>
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
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
