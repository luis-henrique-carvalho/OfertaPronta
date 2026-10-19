import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Camera, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { PhotoOptionCard } from "./photo-option-card";

interface Step3PhotoProps {
  productImage: string | null;
  logoImage: string | null;
  referenceImage: string | null;
  onProductImageChange: (image: string | null) => void;
  onLogoImageChange: (image: string | null) => void;
  onReferenceImageChange: (image: string | null) => void;
  onSkipAllImages: () => void;
}

export function VariantAStep3Photo({
  productImage,
  logoImage,
  referenceImage,
  onProductImageChange,
  onLogoImageChange,
  onReferenceImageChange,
  onSkipAllImages,
}: Step3PhotoProps) {
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const hasAnyImage = Boolean(productImage || logoImage || referenceImage);

  return (
    <div className="flex flex-col gap-3.5">
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

      {/* Inputs ocultos de arquivo */}
      {/* shadcn-ignore: hidden native file input controlled via accessible button */}
      <input
        ref={productInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, onProductImageChange)}
        aria-label="Upload de foto do produto"
      />
      {/* shadcn-ignore: hidden native file input controlled via accessible button */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, onLogoImageChange)}
        aria-label="Upload de logo da loja"
      />
      {/* shadcn-ignore: hidden native file input controlled via accessible button */}
      <input
        ref={referenceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, onReferenceImageChange)}
        aria-label="Upload de print de referência"
      />

      {/* 1. FOTO DO PRODUTO (Principal) */}
      <PhotoOptionCard
        icon={<Camera className="size-5" />}
        iconBgClass="bg-primary/10 text-primary"
        title="1. Foto do Produto ou Local"
        description="Foto da roupa, prato, bebida ou ambiente da loja."
        image={productImage}
        imageAlt="Produto"
        buttonLabel="Enviar Foto"
        buttonClass="shrink-0 rounded-xl border-primary/40 text-xs font-bold text-primary hover:bg-primary/5"
        onUploadClick={() => productInputRef.current?.click()}
        onRemoveClick={() => onProductImageChange(null)}
      />

      {/* 2. PRINT DE REFERÊNCIA (Copiar formato/estilo) */}
      <PhotoOptionCard
        icon={<Copy className="size-5" />}
        iconBgClass="bg-amber-500/10 text-amber-600"
        title="2. Print de Card para Copiar Estilo"
        description="Gostou de um post no Instagram? Mande o print e a IA faz parecido!"
        image={referenceImage}
        imageAlt="Referência"
        buttonLabel="Enviar Print"
        buttonClass="shrink-0 rounded-xl border-amber-500/40 text-xs font-bold text-amber-700 hover:bg-amber-500/5"
        onUploadClick={() => referenceInputRef.current?.click()}
        onRemoveClick={() => onReferenceImageChange(null)}
      />

      {/* 3. LOGO DA LOJA (Assinatura da marca) */}
      <PhotoOptionCard
        icon={<ShieldCheck className="size-5" />}
        iconBgClass="bg-blue-500/10 text-blue-600"
        title="3. Sua Logo"
        badgeText="Opcional"
        description="Para colocar a marca da sua loja no card."
        image={logoImage}
        imageAlt="Logo"
        isContainPreview
        buttonLabel="Enviar Logo"
        buttonClass="shrink-0 rounded-xl border-border text-xs font-semibold text-foreground hover:bg-muted/50"
        onUploadClick={() => logoInputRef.current?.click()}
        onRemoveClick={() => onLogoImageChange(null)}
      />

      {/* Botão rápido para quem não quer enviar nenhuma imagem */}
      {!hasAnyImage && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSkipAllImages}
          className="mt-1 h-11 w-full rounded-xl border border-dashed border-border bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <Sparkles className="size-4 mr-1.5 text-amber-500" />
          Não tenho imagens agora — Deixar a IA criar tudo
        </Button>
      )}
    </div>
  );
}
