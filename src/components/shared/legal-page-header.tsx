import { Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export function LegalPageHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Store className="size-5" />
          </div>
          <Typography variant="h4" className="font-extrabold tracking-tight">
            Oferta<span className="text-primary">Pronta</span>
          </Typography>
        </a>

        <Button variant="outline" size="sm" asChild>
          <a href="/">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Voltar ao início
          </a>
        </Button>
      </div>
    </header>
  );
}
