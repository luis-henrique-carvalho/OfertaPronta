import { z } from "zod";
import { formatBRL } from "./utils";

export const CAMPAIGN_PLAN_IDS = [
  "single_campaign",
  "pack_5_campaigns",
  "pack_10_campaigns",
] as const;

export const campaignPlanIdSchema = z.enum(CAMPAIGN_PLAN_IDS);
export type CampaignPlanId = z.infer<typeof campaignPlanIdSchema>;

export interface CampaignPriceParts {
  currencySymbol: "R$";
  integerPart: string;
  decimalPart: string;
  formattedDecimal: string;
}

export interface CampaignPlan {
  id: CampaignPlanId;
  name: string;
  shortLabel: string;
  description: string;
  formatsLabel: string;
  campaignsCount: number;
  defaultAmountCents: number;
  amountCents: number;
  formattedPrice: string;
  priceParts: CampaignPriceParts;
  freePreviewGenerations: number;
  maxPostPaymentRegenerations: number;
  isActiveInMvp: boolean;
}

export interface CampaignCatalogEnv {
  CAMPAIGN_SINGLE_PRICE_CENTS?: string | number | undefined;
  [key: string]: unknown;
}

interface BaseCampaignPlanData {
  id: CampaignPlanId;
  name: string;
  shortLabel: string;
  description: string;
  formatsLabel: string;
  campaignsCount: number;
  defaultAmountCents: number;
  freePreviewGenerations: number;
  maxPostPaymentRegenerations: number;
  isActiveInMvp: boolean;
}

const CANONICAL_PLANS: Record<CampaignPlanId, BaseCampaignPlanData> = {
  single_campaign: {
    id: "single_campaign",
    name: "Campanha Avulsa",
    shortLabel: "avulso",
    description:
      "1 card publicitário entregue nos dois formatos: Feed (1080×1350) e Story (1080×1920).",
    formatsLabel: "Feed (1080×1350) + Story (1080×1920)",
    campaignsCount: 1,
    defaultAmountCents: 990,
    freePreviewGenerations: 1,
    maxPostPaymentRegenerations: 3,
    isActiveInMvp: true,
  },
  pack_5_campaigns: {
    id: "pack_5_campaigns",
    name: "Pacote 5 Campanhas",
    shortLabel: "pacote 5 campanhas",
    description:
      "Pacote com 5 campanhas completas nos formatos Feed (1080×1350) e Story (1080×1920).",
    formatsLabel: "Feed (1080×1350) + Story (1080×1920)",
    campaignsCount: 5,
    defaultAmountCents: 2990,
    freePreviewGenerations: 1,
    maxPostPaymentRegenerations: 3,
    isActiveInMvp: false,
  },
  pack_10_campaigns: {
    id: "pack_10_campaigns",
    name: "Pacote 10 Campanhas",
    shortLabel: "pacote 10 campanhas",
    description:
      "Pacote com 10 campanhas completas nos formatos Feed (1080×1350) e Story (1080×1920).",
    formatsLabel: "Feed (1080×1350) + Story (1080×1920)",
    campaignsCount: 10,
    defaultAmountCents: 4990,
    freePreviewGenerations: 1,
    maxPostPaymentRegenerations: 3,
    isActiveInMvp: false,
  },
};

export function formatPlanPrice(amountCents: number): string {
  return formatBRL(amountCents);
}

export function buildPriceParts(amountCents: number): CampaignPriceParts {
  const absCents = Math.abs(amountCents);
  const wholeUnits = Math.floor(absCents / 100);
  const centsUnit = absCents % 100;
  const integerPart = new Intl.NumberFormat("pt-BR")
    .format(wholeUnits)
    .replace(/\u00a0/g, " ");
  const decimalPart = centsUnit.toString().padStart(2, "0");
  const formattedDecimal = `${integerPart},${decimalPart}`;

  return {
    currencySymbol: "R$",
    integerPart,
    decimalPart,
    formattedDecimal,
  };
}

export function getCampaignPlanById(
  planId: string,
  env?: CampaignCatalogEnv,
): CampaignPlan {
  const parsed = campaignPlanIdSchema.safeParse(planId);
  if (!parsed.success) {
    throw new Error(
      `Plano de campanha inválido ou desconhecido: ${String(planId)}`,
    );
  }

  const validId = parsed.data;
  const base = CANONICAL_PLANS[validId];

  const runtimeEnv =
    env ??
    (typeof process !== "undefined" && process.env
      ? (process.env as CampaignCatalogEnv)
      : undefined);

  let amountCents = base.defaultAmountCents;
  if (
    validId === "single_campaign" &&
    runtimeEnv?.CAMPAIGN_SINGLE_PRICE_CENTS != null
  ) {
    const raw = runtimeEnv.CAMPAIGN_SINGLE_PRICE_CENTS;
    const parsedOverride = typeof raw === "number" ? raw : Number(raw);
    if (Number.isInteger(parsedOverride) && parsedOverride > 0) {
      amountCents = parsedOverride;
    }
  }

  const formattedPrice = formatPlanPrice(amountCents);
  const priceParts = buildPriceParts(amountCents);

  return {
    ...base,
    amountCents,
    formattedPrice,
    priceParts,
  };
}

export function getCampaignPlan(
  planId: CampaignPlanId = "single_campaign",
  env?: CampaignCatalogEnv,
): CampaignPlan {
  return getCampaignPlanById(planId, env);
}

export function getDefaultCampaignPlan(env?: CampaignCatalogEnv): CampaignPlan {
  return getCampaignPlan("single_campaign", env);
}

export function listCampaignPlans(
  env?: CampaignCatalogEnv,
): readonly CampaignPlan[] {
  return Object.freeze(
    CAMPAIGN_PLAN_IDS.map((id) => getCampaignPlanById(id, env)),
  );
}

export interface CobrandingPriceCalculation {
  originalAmountCents: number;
  discountAmountCents: number;
  amountCents: number;
  discountPercent: number;
  formattedOriginalPrice: string;
  formattedDiscountedPrice: string;
  formattedSavings: string;
}

export function calculateCobrandingPrice(
  baseAmountCents: number,
  discountPercent: number = 30,
): CobrandingPriceCalculation {
  const safeDiscountPercent = Math.max(
    1,
    Math.min(90, Math.round(discountPercent)),
  );
  const discountAmountCents = Math.round(
    baseAmountCents * (safeDiscountPercent / 100),
  );
  const amountCents = Math.max(100, baseAmountCents - discountAmountCents);

  return {
    originalAmountCents: baseAmountCents,
    discountAmountCents,
    amountCents,
    discountPercent: safeDiscountPercent,
    formattedOriginalPrice: formatBRL(baseAmountCents),
    formattedDiscountedPrice: formatBRL(amountCents),
    formattedSavings: formatBRL(discountAmountCents),
  };
}
