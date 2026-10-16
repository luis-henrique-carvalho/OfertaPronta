import { useRef, type ChangeEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  AlertCircle,
} from "lucide-react";

export interface MediaUploadersCardProps {
  productImageDataUrl?: string;
  referenceImageDataUrl?: string;
  activeImageError?: string | null;
  onProductImageChange: (dataUrl: string | undefined) => void;
  onReferenceImageChange: (dataUrl: string | undefined) => void;
  onFileUpload: (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void,
  ) => void;
}

export function MediaUploadersCard({
  productImageDataUrl,
  referenceImageDataUrl,
  activeImageError,
  onProductImageChange,
  onReferenceImageChange,
  onFileUpload,
}: MediaUploadersCardProps) {
  const productInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1 text-xs shrink-0">
            <Sparkles className="size-3 text-primary" />
            Insumos Visuais para a IA
          </Badge>
          <Typography variant="muted" className="text-xs font-medium">
            Opcionais & Combináveis
          </Typography>
        </div>
        <CardTitle className="pt-2 text-xl font-bold">
          Fotos e Referências Visuais
        </CardTitle>
        <CardDescription>
          Envie a foto do seu produto e/ou uma arte de referência que você
          goste. Se não enviar fotos, a IA criará o card 100% do zero com base
          no estilo escolhido.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {activeImageError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm font-medium">
            <AlertCircle className="size-4 shrink-0" />
            <span>{activeImageError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 1. Uploader: Foto do Produto */}
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Typography
                variant="muted"
                className="text-xs font-bold text-foreground flex items-center gap-1.5"
              >
                <ImageIcon className="size-3.5 text-primary" />
                Foto do Produto / Serviço
              </Typography>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Opcional
              </Badge>
            </div>
            <Typography variant="muted" className="text-xs">
              A foto real do seu prato, carne, corte ou produto (até 4MB).
            </Typography>

            {/* shadcn-ignore: hidden native file input controlled via accessible button */}
            <input
              ref={productInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFileUpload(e, onProductImageChange)}
            />

            {productImageDataUrl ? (
              <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={productImageDataUrl}
                  alt="Foto do produto selecionada"
                  className="size-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onProductImageChange(undefined)}
                  className="absolute top-2 right-2 size-8 p-0 rounded-full shadow-md"
                  title="Remover foto do produto"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => productInputRef.current?.click()}
                className="mt-2 flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-dashed border-border bg-background hover:border-primary/50 hover:bg-muted/30"
              >
                <Upload className="size-5 text-muted-foreground" />
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-foreground"
                >
                  Tirar foto ou enviar arquivo
                </Typography>
                <Typography variant="muted" className="text-[10px]">
                  JPG, PNG ou WebP até 4MB
                </Typography>
              </Button>
            )}
          </div>

          {/* 2. Uploader: Imagem de Referência */}
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Typography
                variant="muted"
                className="text-xs font-bold text-foreground flex items-center gap-1.5"
              >
                <Sparkles className="size-3.5 text-secondary" />
                Imagem de Referência
              </Typography>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Opcional
              </Badge>
            </div>
            <Typography variant="muted" className="text-xs">
              Um print ou card de referência cujo estilo visual ou composição
              você queira imitar.
            </Typography>

            {/* shadcn-ignore: hidden native file input controlled via accessible button */}
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFileUpload(e, onReferenceImageChange)}
            />

            {referenceImageDataUrl ? (
              <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={referenceImageDataUrl}
                  alt="Imagem de referência selecionada"
                  className="size-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onReferenceImageChange(undefined)}
                  className="absolute top-2 right-2 size-8 p-0 rounded-full shadow-md"
                  title="Remover imagem de referência"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => referenceInputRef.current?.click()}
                className="mt-2 flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-dashed border-border bg-background hover:border-secondary/50 hover:bg-muted/30"
              >
                <Upload className="size-5 text-muted-foreground" />
                <Typography
                  variant="muted"
                  className="text-xs font-semibold text-foreground"
                >
                  Enviar arte de referência
                </Typography>
                <Typography variant="muted" className="text-[10px]">
                  JPG, PNG ou WebP até 4MB
                </Typography>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
