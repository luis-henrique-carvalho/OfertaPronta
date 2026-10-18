import { useState, useRef, type ChangeEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import type { BusinessSegment } from "../data/offer-brief.schema";
import {
  getSegmentPresets,
  type CuratedStylePreset,
} from "../data/style-presets-catalog";
import { StylePresetCardItem } from "./style-preset-card-item";
import { CustomReferenceTabContent } from "./custom-reference-tab-content";
import { CustomStyleInstructionsCollapsible } from "./custom-style-instructions-collapsible";

export interface StylePresetGalleryProps {
  segment: BusinessSegment;
  stylePresetId?: string | null;
  referenceImageDataUrl?: string | null;
  customStyleInstructions?: string;
  imageError?: string | null;
  onStylePresetChange: (presetId: string | undefined) => void;
  onReferenceImageChange: (dataUrl: string | undefined) => void;
  onCustomStyleInstructionsChange: (instructions: string) => void;
  onFileUpload: (
    e: ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string | undefined) => void,
  ) => void;
}

export function StylePresetGallery({
  segment,
  stylePresetId,
  referenceImageDataUrl,
  customStyleInstructions = "",
  imageError,
  onStylePresetChange,
  onReferenceImageChange,
  onCustomStyleInstructionsChange,
  onFileUpload,
}: StylePresetGalleryProps) {
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>(
    referenceImageDataUrl ? "custom-reference" : "presets",
  );
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(
    Boolean(customStyleInstructions?.trim()),
  );

  const presets = getSegmentPresets(segment);

  const handleSelectPreset = (presetId: string) => {
    onStylePresetChange(presetId);
    if (referenceImageDataUrl) {
      onReferenceImageChange(undefined);
    }
  };

  const handleReferenceUploadSuccess = (dataUrl: string | undefined) => {
    onReferenceImageChange(dataUrl);
    if (dataUrl) {
      onStylePresetChange(undefined);
    }
  };

  return (
    <Card
      data-testid="style-preset-gallery-card"
      className="border-border bg-card shadow-xs"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 text-xs shrink-0 font-medium"
          >
            <Palette className="size-3.5 text-primary" />
            Direção de Arte e Estilo
          </Badge>
          <Badge
            variant="outline"
            className="text-[11px] px-2 py-0.5 text-muted-foreground"
          >
            Escolha 1 Toque
          </Badge>
        </div>
        <CardTitle className="pt-2 text-lg font-bold sm:text-xl">
          Visual e Atmosfera do Card
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Escolha um estilo visual curado para seu nicho ou envie sua própria
          arte de referência para inspirar a IA.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/60 rounded-xl">
            <TabsTrigger
              value="presets"
              data-testid="tab-presets"
              className="min-h-[44px] py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              Estilos Prontos (Galeria)
            </TabsTrigger>
            <TabsTrigger
              value="custom-reference"
              data-testid="tab-custom-reference"
              className="min-h-[44px] py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              Enviar Arte Própria
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="presets"
            data-testid="tab-content-presets"
            className="pt-3 outline-none"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {presets.map((preset: CuratedStylePreset) => (
                <StylePresetCardItem
                  key={preset.id}
                  preset={preset}
                  isSelected={stylePresetId === preset.id}
                  onSelectPreset={handleSelectPreset}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="custom-reference"
            data-testid="tab-content-custom-reference"
            className="pt-3 outline-none"
          >
            <CustomReferenceTabContent
              referenceImageDataUrl={referenceImageDataUrl}
              imageError={imageError}
              referenceInputRef={referenceInputRef}
              onReferenceImageChange={onReferenceImageChange}
              onFileUpload={onFileUpload}
              onReferenceUploadSuccess={handleReferenceUploadSuccess}
            />
          </TabsContent>
        </Tabs>

        <CustomStyleInstructionsCollapsible
          customStyleInstructions={customStyleInstructions}
          isInstructionsOpen={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
          onCustomStyleInstructionsChange={onCustomStyleInstructionsChange}
        />
      </CardContent>
    </Card>
  );
}
