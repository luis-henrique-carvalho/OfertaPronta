import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2 } from "lucide-react";
import {
  PROTOTYPE_CATALOG,
  type PrototypeSegment,
} from "../prototype-catalog-data";

interface Step1SegmentProps {
  segment: PrototypeSegment;
  onSelectSegment: (segment: PrototypeSegment) => void;
}

export function VariantAStep1Segment({
  segment,
  onSelectSegment,
}: Step1SegmentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <Typography
          variant="h3"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          Qual é o seu comércio?
        </Typography>
        <Typography variant="muted" className="text-xs sm:text-sm">
          A IA vai criar o card perfeito para o seu tipo de loja.
        </Typography>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {Object.values(PROTOTYPE_CATALOG).map((item) => {
          const Icon = item.icon;
          const isSelected = segment === item.id;
          return (
            <Button
              key={item.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelectSegment(item.id)}
              className={`h-auto min-h-[68px] flex flex-col items-start justify-center p-3 rounded-2xl border transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/50 text-foreground"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Icon className="size-5 shrink-0" />
                {isSelected && <CheckCircle2 className="size-4 shrink-0" />}
              </div>
              <span className="mt-1.5 text-xs sm:text-sm font-bold leading-tight">
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
