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
import { Upload, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react";

export interface ProductImageUploaderCardProps {
  productImageDataUrl?: string;
  imageError?: string | null;
  onProductImageChange: (dataUrl: string | undefined) => void;
  onFileUpload: (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void,
  ) => void;
}

export function ProductImageUploaderCard({
  productImageDataUrl,
  imageError,
  onProductImageChange,
  onFileUpload,
}: ProductImageUploaderCardProps) {
  const productInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card
      data-testid="product-image-uploader-card"
      className="border-border bg-card shadow-xs"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 text-xs shrink-0 font-medium"
          >
            <ImageIcon className="size-3.5 text-primary" />
            Foto do Produto / Serviço
          </Badge>
          <Badge
            variant="outline"
            className="text-[11px] px-2 py-0.5 text-muted-foreground"
          >
            Opcional
          </Badge>
        </div>
        <CardTitle className="pt-2 text-lg font-bold sm:text-xl">
          Foto Real da Sua Oferta
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Envie uma foto real do seu prato, carne, corte, produto ou ambiente. A
          IA integrará sua imagem harmonicamente na composição do card final.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        {imageError && (
          <div
            role="alert"
            data-testid="product-image-error"
            className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm"
          >
            <AlertCircle className="size-4 shrink-0" />
            <Typography
              variant="muted"
              as="span"
              className="text-destructive font-medium text-xs sm:text-sm"
            >
              {imageError}
            </Typography>
          </div>
        )}

        {/* shadcn-ignore: hidden native file input controlled via accessible button */}
        <input
          ref={productInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFileUpload(e, onProductImageChange)}
          data-testid="product-image-file-input"
          aria-label="Upload de foto do produto"
        />

        {productImageDataUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-xs">
            <img
              src={productImageDataUrl}
              alt="Foto do produto selecionada"
              data-testid="product-image-preview"
              className="size-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onProductImageChange(undefined)}
                data-testid="remove-product-image-button"
                className="size-11 min-w-[44px] min-h-[44px] rounded-full shadow-md"
                aria-label="Remover foto do produto"
                title="Remover foto do produto"
              >
                <Trash2 className="size-5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => productInputRef.current?.click()}
            data-testid="upload-product-image-button"
            className="flex min-h-[110px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            aria-label="Tirar foto ou enviar arquivo do produto"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-5" />
            </div>
            <div className="flex flex-col items-center text-center">
              <Typography
                variant="muted"
                as="span"
                className="text-xs font-semibold text-foreground sm:text-sm"
              >
                Tirar foto ou escolher arquivo
              </Typography>
              <Typography
                variant="muted"
                as="span"
                className="text-[11px] text-muted-foreground"
              >
                JPG, PNG ou WebP até 4MB
              </Typography>
            </div>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
