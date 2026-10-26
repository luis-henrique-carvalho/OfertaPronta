import { ArrowLeft, Store, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export interface CheckoutHeaderProps {
  onNavigateBack?: () => void;
}

export function CheckoutHeader({ onNavigateBack }: CheckoutHeaderProps) {
  const legal = getCompanyLegalProfile();

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onNavigateBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            className="size-9 rounded-lg"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-3.5" />
          </div>
          <Typography variant="h4" className="text-sm font-bold">
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <a
          href={legal.supportWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ajuda via WhatsApp"
        >
          <MessageCircle className="size-3.5 fill-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
          <span>Ajuda WhatsApp</span>
        </a>
      </Button>
    </header>
  );
}
