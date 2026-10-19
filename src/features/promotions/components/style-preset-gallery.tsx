import { useState, useRef, type ChangeEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      <CardHeader className="pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Palette className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Visual & Atmosfera do Card
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Escolha um estilo curado para seu nicho ou envie sua própria arte
              de inspiração.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/70 border border-border/40 rounded-xl">
            <TabsTrigger
              value="presets"
              data-testid="tab-presets"
              className="min-h-[44px] py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              Estilos Prontos (Galeria)
            </TabsTrigger>
            <TabsTrigger
              value="custom-reference"
              data-testid="tab-custom-reference"
              className="min-h-[44px] py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            >
              Enviar Arte Própria
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="presets"
            data-testid="tab-content-presets"
            className="pt-3 outline-none"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
