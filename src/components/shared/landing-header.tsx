import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Store, ArrowRight } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Store className="size-5" />
          </div>
          <Typography variant="h4" className="font-extrabold tracking-tight">
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge
            variant="secondary"
            className="hidden sm:inline-flex gap-1.5 px-2.5 py-1 text-xs"
          >
            {/* shadcn-ignore: live status indicator */}
            <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
            Sem cadastro
          </Badge>
          <Button size="sm" asChild className="rounded-full font-semibold">
            <a href="/criar">
              Gerar prévia grátis
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
