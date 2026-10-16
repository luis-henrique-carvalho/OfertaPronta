import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Store } from "lucide-react";
import type { SegmentCatalogItem } from "../data/offer-brief.schema";

export interface OfferDetailsFormCardProps {
  currentCatalog: SegmentCatalogItem;
  businessName: string;
  offerTitle: string;
  promoPrice: string;
  originalPrice?: string | null;
  callToAction?: string | null;
  whatsapp?: string | null;
  validationErrors: Record<string, string | undefined>;
  onBusinessNameChange: (val: string) => void;
  onOfferTitleChange: (val: string) => void;
  onPromoPriceChange: (val: string) => void;
  onOriginalPriceChange: (val: string) => void;
  onCallToActionChange: (val: string) => void;
  onWhatsappChange: (val: string) => void;
}

export function OfferDetailsFormCard({
  currentCatalog,
  businessName,
  offerTitle,
  promoPrice,
  originalPrice,
  callToAction,
  whatsapp,
  validationErrors,
  onBusinessNameChange,
  onOfferTitleChange,
  onPromoPriceChange,
  onOriginalPriceChange,
  onCallToActionChange,
  onWhatsappChange,
}: OfferDetailsFormCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className="gap-1 text-xs shrink-0">
            <Store className="size-3 text-primary" />
            {currentCatalog.label}
          </Badge>
          <Typography variant="muted" className="text-xs font-semibold">
            Passo 2 de 3
          </Typography>
        </div>
        <CardTitle className="pt-2 text-xl font-bold">
          Dados da sua Promoção
        </CardTitle>
        <CardDescription>
          Informe o nome do seu negócio, produto e preços que a IA integrará no
          Card.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <Field data-invalid={!!validationErrors.businessName}>
          <FieldLabel htmlFor="business-name">Nome do seu Negócio</FieldLabel>
          <Input
            id="business-name"
            placeholder={currentCatalog.placeholders.businessName}
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            aria-invalid={!!validationErrors.businessName}
          />
          {validationErrors.businessName ? (
            <FieldError>{validationErrors.businessName}</FieldError>
          ) : (
            <FieldDescription>
              Aparecerá no topo do Card Publicitário.
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!validationErrors.offerTitle}>
          <FieldLabel htmlFor="offer-title">
            Título da Oferta / Produto
          </FieldLabel>
          <Input
            id="offer-title"
            placeholder={currentCatalog.placeholders.offerTitle}
            value={offerTitle}
            onChange={(e) => onOfferTitleChange(e.target.value)}
            aria-invalid={!!validationErrors.offerTitle}
          />
          {validationErrors.offerTitle ? (
            <FieldError>{validationErrors.offerTitle}</FieldError>
          ) : (
            <FieldDescription>
              O produto ou serviço em promoção principal.
            </FieldDescription>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!validationErrors.promoPrice}>
            <FieldLabel htmlFor="promo-price">Preço com Desconto *</FieldLabel>
            <Input
              id="promo-price"
              placeholder={currentCatalog.placeholders.promoPrice}
              value={promoPrice}
              onChange={(e) => onPromoPriceChange(e.target.value)}
              aria-invalid={!!validationErrors.promoPrice}
            />
            {validationErrors.promoPrice && (
              <FieldError>{validationErrors.promoPrice}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="original-price">
              Preço Original (opcional)
            </FieldLabel>
            <Input
              id="original-price"
              placeholder={currentCatalog.placeholders.originalPrice}
              value={originalPrice || ""}
              onChange={(e) => onOriginalPriceChange(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="cta">Texto de Ação (CTA)</FieldLabel>
            <Input
              id="cta"
              placeholder={currentCatalog.placeholders.callToAction}
              value={callToAction || ""}
              onChange={(e) => onCallToActionChange(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="whatsapp">
              WhatsApp / Contato (opcional)
            </FieldLabel>
            <Input
              id="whatsapp"
              placeholder="(11) 99999-9999"
              value={whatsapp || ""}
              onChange={(e) => onWhatsappChange(e.target.value)}
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
