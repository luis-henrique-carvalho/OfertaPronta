import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Typography } from "@/components/ui/typography";
import { Sparkles } from "lucide-react";

export interface AdCardMockupPlaceholderProps {
  offerTitle: string;
  businessName?: string | null;
  displayPrice?: string | null;
  isStory?: boolean;
}

export function AdCardMockupPlaceholder({
  offerTitle,
  businessName,
  displayPrice,
  isStory = false,
}: AdCardMockupPlaceholderProps) {
  return (
    // shadcn-ignore: layout de moldura estrutural do aspect-ratio
    <AspectRatio ratio={isStory ? 9 / 16 : 4 / 5}>
      <div
        data-testid="card-mockup-placeholder"
        className="relative flex size-full flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white"
      >
        {/* Glow decorativo suave */}
        <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-emerald-500/15 blur-2xl" />

        {/* Topo do Mockup: Nome do estabelecimento */}
        <div className="relative z-10 flex items-center justify-between">
          {businessName ? (
            <Typography
              as="span"
              variant="muted"
              data-testid="mockup-business-name"
              className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-md"
            >
              {businessName}
            </Typography>
          ) : (
            <div />
          )}
          <Typography
            as="span"
            variant="muted"
            className="text-[10px] font-medium uppercase tracking-wider text-white/50"
          >
            {isStory ? "Story 9:16" : "Feed 4:5"}
          </Typography>
        </div>

        {/* Centro: Título da Oferta, Preço e Selo de IA */}
        <div className="relative z-10 my-auto flex flex-col items-center gap-3 text-center">
          <Typography
            variant="h4"
            as="h4"
            data-testid="mockup-offer-title"
            className="line-clamp-3 text-lg font-black tracking-tight text-white drop-shadow-md sm:text-xl"
          >
            {offerTitle}
          </Typography>

          {/* Preço promocional em destaque */}
          {displayPrice && (
            <div
              data-testid="mockup-promo-price"
              className="inline-flex items-center rounded-xl bg-amber-400 px-3.5 py-1.5 font-black text-slate-950 shadow-lg text-base sm:text-lg"
            >
              {displayPrice}
            </div>
          )}

          {/* Selo com vidro/blur: Sparkles + Arte gerada por IA após o Pix */}
          <div
            data-testid="mockup-ai-badge"
            className="mt-1 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 shadow-md backdrop-blur-md"
          >
            <Sparkles className="size-3.5 text-amber-300 shrink-0" />
            <Typography
              as="span"
              variant="muted"
              className="text-xs font-bold text-white drop-shadow-sm"
            >
              Arte gerada por IA após o Pix
            </Typography>
          </div>
        </div>

        {/* Rodapé do Mockup: Formatos inclusos */}
        <div className="relative z-10 flex items-center justify-center text-center">
          <Typography
            as="span"
            variant="muted"
            className="text-[10px] font-medium text-white/60"
          >
            Feed 1080×1350 + Story 1080×1920 em alta resolução
          </Typography>
        </div>
      </div>
    </AspectRatio>
  );
}
