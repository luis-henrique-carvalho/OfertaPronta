import { Button } from "@/components/ui/button";
import type { BusinessSegment } from "../data/offer-brief.schema";
import { SegmentSelector } from "./segment-selector";
import { ArrowRight } from "lucide-react";

export interface WizardStep1SegmentProps {
  businessSegment: BusinessSegment;
  onSegmentChange: (segment: BusinessSegment) => void;
  onNextStep: () => void;
}

export function WizardStep1Segment({
  businessSegment,
  onSegmentChange,
  onNextStep,
}: WizardStep1SegmentProps) {
  return (
    <div className="flex flex-col gap-6">
      <SegmentSelector value={businessSegment} onChange={onSegmentChange} />

      <Button
        type="button"
        size="lg"
        onClick={onNextStep}
        className="h-13 w-full rounded-xl bg-primary text-base font-bold shadow-md hover:bg-primary/90"
      >
        Avançar para dados da oferta
        <ArrowRight className="size-5 ml-1" />
      </Button>
    </div>
  );
}
