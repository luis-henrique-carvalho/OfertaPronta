// shadcn-ignore: componente container orquestrador que compõe SegmentSuggestionsCard, MediaUploadersCard e StylePresetsCard
import { useState, type ChangeEvent } from "react";
import type { BusinessSegment } from "../data/offer-brief.schema";
import { SEGMENT_CATALOG } from "../data/offer-brief.schema";
import { SegmentSuggestionsCard } from "./segment-suggestions-card";
import { StylePresetsCard } from "./style-presets-card";
import { MediaUploadersCard } from "./media-uploaders-card";

interface FlexibleVisualInputsProps {
  segment: BusinessSegment;
  productImageDataUrl?: string;
  referenceImageDataUrl?: string;
  stylePresetId?: string;
  customStyleInstructions?: string;
  imageError?: string | null;
  onProductImageChange: (dataUrl: string | undefined) => void;
  onReferenceImageChange: (dataUrl: string | undefined) => void;
  onStylePresetChange: (presetId: string | undefined) => void;
  onCustomStyleInstructionsChange: (instructions: string) => void;
  onApplyExample: (example: {
    title: string;
    promoPrice: string;
    originalPrice?: string;
    stylePresetId: string;
  }) => void;
}

export function FlexibleVisualInputs({
  segment,
  productImageDataUrl,
  referenceImageDataUrl,
  stylePresetId,
  customStyleInstructions = "",
  imageError: externalImageError,
  onProductImageChange,
  onReferenceImageChange,
  onStylePresetChange,
  onCustomStyleInstructionsChange,
  onApplyExample,
}: FlexibleVisualInputsProps) {
  const [internalImageError, setInternalImageError] = useState<string | null>(
    null,
  );

  const activeImageError = externalImageError ?? internalImageError;
  const catalogItem = SEGMENT_CATALOG[segment];

  const handleFileUpload = (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void,
  ) => {
    setInternalImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setInternalImageError(
        "Formato inválido. Selecione uma imagem JPEG, PNG ou WebP.",
      );
      e.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setInternalImageError("A imagem selecionada ultrapassa o limite de 4MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSuccess(reader.result);
      }
    };
    reader.onerror = () => {
      setInternalImageError("Erro ao processar imagem. Tente novamente.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-6">
      <SegmentSuggestionsCard
        catalogItem={catalogItem}
        onApplyExample={onApplyExample}
      />

      <MediaUploadersCard
        productImageDataUrl={productImageDataUrl}
        referenceImageDataUrl={referenceImageDataUrl}
        activeImageError={activeImageError}
        onProductImageChange={onProductImageChange}
        onReferenceImageChange={onReferenceImageChange}
        onFileUpload={handleFileUpload}
      />

      <StylePresetsCard
        catalogItem={catalogItem}
        stylePresetId={stylePresetId}
        customStyleInstructions={customStyleInstructions}
        onStylePresetChange={onStylePresetChange}
        onCustomStyleInstructionsChange={onCustomStyleInstructionsChange}
      />
    </div>
  );
}
