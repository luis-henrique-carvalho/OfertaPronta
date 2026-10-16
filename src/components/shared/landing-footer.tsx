import { Typography } from "@/components/ui/typography";
import { Store } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card py-8 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <Typography
            variant="muted"
            className="text-sm font-bold text-foreground"
          >
            OfertaPronta
          </Typography>
        </div>
        <Typography variant="muted" className="text-xs">
          © 2026 OfertaPronta. Feito para microempresários de supermercados,
          salões, barbearias, pizzarias, hamburguerias, restaurantes e comércio
          local.
        </Typography>
      </div>
    </footer>
  );
}
