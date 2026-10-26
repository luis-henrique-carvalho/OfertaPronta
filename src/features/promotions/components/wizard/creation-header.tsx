import { Store, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export function CreationHeader() {
  const legal = getCompanyLegalProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <Typography
            variant="h4"
            className="text-base font-extrabold tracking-tight"
          >
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </a>

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
      </div>
    </header>
  );
}
