import { createFileRoute } from '@tanstack/react-router'
import { OfferBriefWizard } from '@/features/promotions/components/offer-brief-wizard'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Store } from 'lucide-react'

export const Route = createFileRoute('/criar')({
  component: CriarPageComponent,
})

function CriarPageComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Header Mobile-First */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </div>
            <Typography variant="h4" className="text-base font-extrabold tracking-tight">
              Oferta<span className="text-primary">Pronta</span>
            </Typography>
          </a>

          <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 text-[11px] font-semibold">
            <Sparkles className="size-3 text-primary" />
            IA Multimodal
          </Badge>
        </div>
      </header>

      {/* Main Wizard Flow */}
      <main className="flex-1">
        <OfferBriefWizard />
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-border bg-card py-6 px-4 text-center">
        <Typography variant="muted" className="text-xs text-muted-foreground">
          © 2026 OfertaPronta • Card Publicitário nos formatos Feed (4:5) e Story (9:16)
        </Typography>
      </footer>
    </div>
  )
}
