import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PROTOTYPE_CATALOG,
  type PrototypeSegment,
  type CardIntent,
} from "./prototype-catalog-data";
import { ArrowLeft, ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { VariantAStep1Segment } from "./variant-a/step1-segment";
import { VariantAStep2Offer } from "./variant-a/step2-offer";
import { VariantAStep3Photo } from "./variant-a/step3-photo";
import { VariantAStep4Style } from "./variant-a/step4-style";

export function VariantA() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [segment, setSegment] = useState<PrototypeSegment>("fashion");
  const [intent, setIntent] = useState<CardIntent>("promo");
  const [customIntentText, setCustomIntentText] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] =
    useState<string>("fashion-boutique");
  const [customStyleNote, setCustomStyleNote] = useState("");

  const currentSegmentData = PROTOTYPE_CATALOG[segment];

  const isStep2Valid =
    businessName.trim().length > 0 &&
    title.trim().length > 0 &&
    (intent !== "custom" || customIntentText.trim().length > 0);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col justify-between pb-24">
      {/* Mini Barra de Progresso Mobile */}
      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-2">
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="size-3.5" />
            Passo {step} de 4
          </span>
          <span className="text-foreground">
            {step === 1 && "1. Ramo"}
            {step === 2 && "2. O Anúncio"}
            {step === 3 && "3. Suas Imagens"}
            {step === 4 && "4. Visual do Card"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5 pb-6">
        {step === 1 && (
          <VariantAStep1Segment
            segment={segment}
            onSelectSegment={(s) => {
              setSegment(s);
              setSelectedStyle(PROTOTYPE_CATALOG[s].styles[0].id);
            }}
          />
        )}

        {step === 2 && (
          <VariantAStep2Offer
            currentSegmentData={currentSegmentData}
            intent={intent}
            customIntentText={customIntentText}
            businessName={businessName}
            title={title}
            price={price}
            onIntentChange={setIntent}
            onCustomIntentTextChange={setCustomIntentText}
            onBusinessNameChange={setBusinessName}
            onTitleChange={setTitle}
            onPriceChange={setPrice}
          />
        )}

        {step === 3 && (
          <VariantAStep3Photo
            productImage={productImage}
            logoImage={logoImage}
            referenceImage={referenceImage}
            onProductImageChange={setProductImage}
            onLogoImageChange={setLogoImage}
            onReferenceImageChange={setReferenceImage}
            onSkipAllImages={() => {
              setProductImage(null);
              setLogoImage(null);
              setReferenceImage(null);
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <VariantAStep4Style
            currentSegmentData={currentSegmentData}
            selectedStyle={selectedStyle}
            businessName={businessName}
            title={title}
            price={price}
            productImage={productImage}
            referenceImage={referenceImage}
            customStyleNote={customStyleNote}
            onSelectStyle={setSelectedStyle}
            onCustomStyleNoteChange={setCustomStyleNote}
          />
        )}
      </div>

      {/* ================= BARRA FIXA INFERIOR ================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-3.5 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="h-12 w-1/3 rounded-xl border-border font-semibold text-xs sm:text-sm"
            >
              <ArrowLeft className="size-4 mr-1" />
              Voltar
            </Button>
          )}

          <Button
            type="button"
            size="lg"
            disabled={step === 2 && !isStep2Valid}
            onClick={() => {
              if (step < 4) {
                setStep((s) => (s + 1) as 2 | 3 | 4);
              } else {
                alert(
                  `✨ Simulação do Protótipo A (Refinado):\n\n• Loja: ${businessName || currentSegmentData.defaultPlaceholders.businessName}\n• Objetivo: ${intent === "custom" ? customIntentText : intent}\n• Mensagem: ${title}\n• Preço: ${price || "Sem preço"}\n• Foto do Produto: ${productImage ? "Sim" : "Não"}\n• Print de Referência: ${referenceImage ? "Sim (copiar formato)" : "Não"}\n• Logo da Loja: ${logoImage ? "Sim" : "Não"}\n• Estilo Visual: ${selectedStyle}\n• Detalhe de Cor: ${customStyleNote || "Padrão"}`,
                );
              }
            }}
            className={`h-12 rounded-xl bg-primary text-sm sm:text-base font-bold shadow-md hover:bg-primary/90 transition-all ${
              step === 1 ? "w-full" : "w-2/3"
            }`}
          >
            {step < 4 ? (
              <>
                <span>Continuar</span>
                <ArrowRight className="size-4 ml-1.5" />
              </>
            ) : (
              <>
                <Wand2 className="size-4 mr-1.5" />
                <span>Gerar Meu Card</span>
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
