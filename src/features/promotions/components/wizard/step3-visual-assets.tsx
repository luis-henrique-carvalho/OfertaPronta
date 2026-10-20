import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Camera, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoOptionCard } from "./photo-option-card";

export interface Step3VisualAssetsProps {
  productImageDataUrl?: string | null;
  referenceImageDataUrl?: string | null;
  logoImageDataUrl?: string | null;
  onProductImageChange: (dataUrl?: string) => void;
  onReferenceImageChange: (dataUrl?: string) => void;
  onLogoImageChange: (dataUrl?: string) => void;
  onSkipAllImages: () => void;
  className?: string;
}

export function Step3VisualAssets({
  productImageDataUrl,
  referenceImageDataUrl,
  logoImageDataUrl,
  onProductImageChange,
  onReferenceImageChange,
  onLogoImageChange,
  onSkipAllImages,
  className,
}: Step3VisualAssetsProps) {
  const hasAnyImage = Boolean(
    productImageDataUrl || referenceImageDataUrl || logoImageDataUrl,
  );

  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      <div className="space-y-1">
        <Typography
          variant="h3"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          Quer enviar alguma imagem?
        </Typography>
        <Typography variant="muted" className="text-xs sm:text-sm">
          Tudo aqui é opcional. Envie apenas o que você tiver em mãos.
        </Typography>
      </div>

      {/* 1. FOTO DO PRODUTO (Principal) */}
      <PhotoOptionCard
        icon={<Camera className="size-5" />}
        iconBgClass="bg-primary/10 text-primary"
        title="1. Foto do Produto ou Local"
        description="Foto da roupa, prato, bebida ou ambiente da loja."
        imageDataUrl={productImageDataUrl}
        imageAlt="Produto"
        buttonLabel="Enviar Foto"
        buttonClass="shrink-0 rounded-xl border-primary/40 text-xs font-bold text-primary hover:bg-primary/5 min-h-[44px]"
        fit="cover"
        testId="photo-card-product"
        onImageChange={(val) => onProductImageChange(val ?? undefined)}
        onRemoveClick={() => onProductImageChange(undefined)}
      />

      {/* 2. PRINT DE REFERÊNCIA (Copiar formato/estilo) */}
      <PhotoOptionCard
        icon={<Copy className="size-5" />}
        iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        title="2. Print de Card para Copiar Estilo"
        description="Gostou de um post no Instagram? Mande o print e a IA faz parecido!"
        imageDataUrl={referenceImageDataUrl}
        imageAlt="Referência"
        buttonLabel="Enviar Print"
        buttonClass="shrink-0 rounded-xl border-amber-500/40 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/5 min-h-[44px]"
        fit="cover"
        testId="photo-card-reference"
        onImageChange={(val) => onReferenceImageChange(val ?? undefined)}
        onRemoveClick={() => onReferenceImageChange(undefined)}
      />

      {/* 3. LOGO DA LOJA (Assinatura da marca) */}
      <PhotoOptionCard
        icon={<ShieldCheck className="size-5" />}
        iconBgClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        title="3. Sua Logo"
        badgeText="Opcional"
        description="Para colocar a marca da sua loja no card."
        imageDataUrl={logoImageDataUrl}
        imageAlt="Logo"
        fit="contain"
        isContainPreview
        buttonLabel="Enviar Logo"
        buttonClass="shrink-0 rounded-xl border-border text-xs font-semibold text-foreground hover:bg-muted/50 min-h-[44px]"
        testId="photo-card-logo"
        onImageChange={(val) => onLogoImageChange(val ?? undefined)}
        onRemoveClick={() => onLogoImageChange(undefined)}
      />

      {/* Botão rápido para quem não quer enviar nenhuma imagem */}
      {!hasAnyImage && (
        <Button
          type="button"
          variant="ghost"
          data-testid="btn-skip-all-images"
          onClick={onSkipAllImages}
          className="mt-1 h-12 min-h-[44px] w-full rounded-xl border border-dashed border-border bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <Sparkles className="size-4 mr-1.5 text-amber-500 shrink-0" />
          Não tenho imagens agora — Deixar a IA criar tudo
        </Button>
      )}
    </div>
  );
}
