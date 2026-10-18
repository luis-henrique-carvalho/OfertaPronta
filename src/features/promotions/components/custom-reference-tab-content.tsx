import type { ChangeEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Upload, Trash2, Sparkles, AlertCircle } from "lucide-react";

export interface CustomReferenceTabContentProps {
  referenceImageDataUrl?: string | null;
  imageError?: string | null;
  referenceInputRef: RefObject<HTMLInputElement | null>;
  onReferenceImageChange: (dataUrl: string | undefined) => void;
  onFileUpload: (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void,
  ) => void;
  onReferenceUploadSuccess: (dataUrl: string | undefined) => void;
}

export function CustomReferenceTabContent({
  referenceImageDataUrl,
  imageError,
  referenceInputRef,
  onReferenceImageChange,
  onFileUpload,
  onReferenceUploadSuccess,
}: CustomReferenceTabContentProps) {
  return (
    <div className="flex flex-col gap-3">
      {imageError && (
        <div
          role="alert"
          data-testid="reference-image-error"
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
        ref={referenceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFileUpload(e, onReferenceUploadSuccess)}
        data-testid="reference-image-file-input"
        aria-label="Upload de arte de referência própria"
      />

      {referenceImageDataUrl ? (
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-xs">
            <img
              src={referenceImageDataUrl}
              alt="Imagem de referência personalizada"
              data-testid="reference-image-preview"
              className="size-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onReferenceImageChange(undefined)}
                data-testid="remove-reference-image-button"
                className="size-11 min-w-[44px] min-h-[44px] rounded-full shadow-md"
                aria-label="Remover arte de referência"
                title="Remover arte de referência"
              >
                <Trash2 className="size-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <Typography
                variant="muted"
                as="span"
                className="font-semibold text-foreground text-xs"
              >
                Arte de Referência Própria Ativa
              </Typography>
              <Typography
                variant="muted"
                as="span"
                className="text-muted-foreground text-[11px]"
              >
                A IA reproduzirá os códigos visuais, tipografia e arranjo desta
                imagem em vez de usar os presets da galeria.
              </Typography>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => referenceInputRef.current?.click()}
            data-testid="upload-reference-image-button"
            className="flex min-h-[130px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            aria-label="Enviar arte de referência própria"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Upload className="size-5" />
            </div>
            <div className="flex flex-col items-center text-center">
              <Typography
                variant="muted"
                as="span"
                className="text-xs font-semibold text-foreground sm:text-sm"
              >
                Enviar arte ou print de referência
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <Typography variant="muted" as="span" className="text-[11px]">
              A IA se inspirará no layout, cores e atmosfera desta arte para
              criar seu anúncio.
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}
