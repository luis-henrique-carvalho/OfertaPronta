import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  CAMPAIGN_PLAN_IDS,
  campaignPlanIdSchema,
  formatPlanPrice,
  buildPriceParts,
  getCampaignPlanById,
  getCampaignPlan,
  getDefaultCampaignPlan,
  listCampaignPlans,
} from "./campaign-catalog";
import * as checkoutCampaignCatalog from "../features/checkout/data/campaign-catalog";

describe("CampaignCatalog", () => {
  const originalEnvValue = process.env.CAMPAIGN_SINGLE_PRICE_CENTS;

  beforeEach(() => {
    delete process.env.CAMPAIGN_SINGLE_PRICE_CENTS;
  });

  afterEach(() => {
    if (originalEnvValue !== undefined) {
      process.env.CAMPAIGN_SINGLE_PRICE_CENTS = originalEnvValue;
    } else {
      delete process.env.CAMPAIGN_SINGLE_PRICE_CENTS;
    }
  });

  describe("CAMPAIGN_PLAN_IDS and schema", () => {
    it("exports canonical plan IDs array and validates with zod", () => {
      expect(CAMPAIGN_PLAN_IDS).toEqual([
        "single_campaign",
        "pack_5_campaigns",
        "pack_10_campaigns",
      ]);

      expect(campaignPlanIdSchema.safeParse("single_campaign").success).toBe(
        true,
      );
      expect(campaignPlanIdSchema.safeParse("pack_5_campaigns").success).toBe(
        true,
      );
      expect(campaignPlanIdSchema.safeParse("pack_10_campaigns").success).toBe(
        true,
      );
      expect(campaignPlanIdSchema.safeParse("unknown_plan").success).toBe(
        false,
      );
    });
  });

  describe("getDefaultCampaignPlan", () => {
    it("returns single_campaign with canonical defaults", () => {
      const plan = getDefaultCampaignPlan();

      expect(plan.id).toBe("single_campaign");
      expect(plan.name).toBe("Campanha Avulsa");
      expect(plan.shortLabel).toBe("avulso");
      expect(plan.description).toBe(
        "1 card publicitário entregue nos dois formatos: Feed (1080×1350) e Story (1080×1920).",
      );
      expect(plan.formatsLabel).toBe("Feed (1080×1350) + Story (1080×1920)");
      expect(plan.campaignsCount).toBe(1);
      expect(plan.defaultAmountCents).toBe(990);
      expect(plan.amountCents).toBe(990);
      expect(plan.formattedPrice).toBe("R$ 9,90");
      expect(plan.priceParts).toEqual({
        currencySymbol: "R$",
        integerPart: "9",
        decimalPart: "90",
        formattedDecimal: "9,90",
      });
      expect(plan.freePreviewGenerations).toBe(1);
      expect(plan.maxPostPaymentRegenerations).toBe(3);
      expect(plan.isActiveInMvp).toBe(true);
    });
  });

  describe("getCampaignPlan", () => {
    it("defaults to single_campaign when called without arguments", () => {
      const plan = getCampaignPlan();
      expect(plan.id).toBe("single_campaign");
      expect(plan.amountCents).toBe(990);
    });

    it("resolves specific plan when planId is provided", () => {
      const plan = getCampaignPlan("pack_5_campaigns");
      expect(plan.id).toBe("pack_5_campaigns");
      expect(plan.amountCents).toBe(2990);
      expect(plan.isActiveInMvp).toBe(false);
    });
  });

  describe("getCampaignPlanById", () => {
    it("returns pack_5_campaigns with correct pricing and inactive MVP status", () => {
      const plan = getCampaignPlanById("pack_5_campaigns");

      expect(plan.id).toBe("pack_5_campaigns");
      expect(plan.name).toBe("Pacote 5 Campanhas");
      expect(plan.shortLabel).toBe("pacote 5 campanhas");
      expect(plan.description).toBe(
        "Pacote com 5 campanhas completas nos formatos Feed (1080×1350) e Story (1080×1920).",
      );
      expect(plan.formatsLabel).toBe("Feed (1080×1350) + Story (1080×1920)");
      expect(plan.campaignsCount).toBe(5);
      expect(plan.defaultAmountCents).toBe(2990);
      expect(plan.amountCents).toBe(2990);
      expect(plan.formattedPrice).toBe("R$ 29,90");
      expect(plan.priceParts).toEqual({
        currencySymbol: "R$",
        integerPart: "29",
        decimalPart: "90",
        formattedDecimal: "29,90",
      });
      expect(plan.freePreviewGenerations).toBe(1);
      expect(plan.maxPostPaymentRegenerations).toBe(3);
      expect(plan.isActiveInMvp).toBe(false);
    });

    it("returns pack_10_campaigns with correct pricing and inactive MVP status", () => {
      const plan = getCampaignPlanById("pack_10_campaigns");

      expect(plan.id).toBe("pack_10_campaigns");
      expect(plan.name).toBe("Pacote 10 Campanhas");
      expect(plan.shortLabel).toBe("pacote 10 campanhas");
      expect(plan.description).toBe(
        "Pacote com 10 campanhas completas nos formatos Feed (1080×1350) e Story (1080×1920).",
      );
      expect(plan.formatsLabel).toBe("Feed (1080×1350) + Story (1080×1920)");
      expect(plan.campaignsCount).toBe(10);
      expect(plan.defaultAmountCents).toBe(4990);
      expect(plan.amountCents).toBe(4990);
      expect(plan.formattedPrice).toBe("R$ 49,90");
      expect(plan.priceParts).toEqual({
        currencySymbol: "R$",
        integerPart: "49",
        decimalPart: "90",
        formattedDecimal: "49,90",
      });
      expect(plan.freePreviewGenerations).toBe(1);
      expect(plan.maxPostPaymentRegenerations).toBe(3);
      expect(plan.isActiveInMvp).toBe(false);
    });

    it("throws a descriptive error when planId is unknown or invalid", () => {
      expect(() => getCampaignPlanById("invalid_plan")).toThrowError(
        "Plano de campanha inválido ou desconhecido: invalid_plan",
      );
      expect(() => getCampaignPlanById("")).toThrowError(
        "Plano de campanha inválido ou desconhecido: ",
      );
    });

    it("applies price override from explicit env object for single_campaign", () => {
      const planNumber = getCampaignPlanById("single_campaign", {
        CAMPAIGN_SINGLE_PRICE_CENTS: 1490,
      });
      expect(planNumber.amountCents).toBe(1490);
      expect(planNumber.defaultAmountCents).toBe(990);
      expect(planNumber.formattedPrice).toBe("R$ 14,90");
      expect(planNumber.priceParts).toEqual({
        currencySymbol: "R$",
        integerPart: "14",
        decimalPart: "90",
        formattedDecimal: "14,90",
      });

      const planString = getCampaignPlanById("single_campaign", {
        CAMPAIGN_SINGLE_PRICE_CENTS: "1990",
      });
      expect(planString.amountCents).toBe(1990);
      expect(planString.formattedPrice).toBe("R$ 19,90");
      expect(planString.priceParts.integerPart).toBe("19");
      expect(planString.priceParts.decimalPart).toBe("90");
    });

    it("applies price override from process.env when env parameter is omitted", () => {
      process.env.CAMPAIGN_SINGLE_PRICE_CENTS = "1490";
      const plan = getDefaultCampaignPlan();
      expect(plan.amountCents).toBe(1490);
      expect(plan.formattedPrice).toBe("R$ 14,90");
      expect(plan.priceParts.integerPart).toBe("14");
    });

    it("ignores invalid override values and falls back safely to default 990 cents", () => {
      const planNegative = getCampaignPlanById("single_campaign", {
        CAMPAIGN_SINGLE_PRICE_CENTS: -500,
      });
      expect(planNegative.amountCents).toBe(990);

      const planZero = getCampaignPlanById("single_campaign", {
        CAMPAIGN_SINGLE_PRICE_CENTS: 0,
      });
      expect(planZero.amountCents).toBe(990);

      const planInvalidString = getCampaignPlanById("single_campaign", {
        CAMPAIGN_SINGLE_PRICE_CENTS: "invalid",
      });
      expect(planInvalidString.amountCents).toBe(990);
    });

    it("does not apply single_campaign override to package plans", () => {
      const plan5 = getCampaignPlanById("pack_5_campaigns", {
        CAMPAIGN_SINGLE_PRICE_CENTS: 1490,
      });
      expect(plan5.amountCents).toBe(2990);

      const plan10 = getCampaignPlanById("pack_10_campaigns", {
        CAMPAIGN_SINGLE_PRICE_CENTS: 1490,
      });
      expect(plan10.amountCents).toBe(4990);
    });
  });

  describe("listCampaignPlans", () => {
    it("returns all 3 plans with accurate properties", () => {
      const plans = listCampaignPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.id)).toEqual([
        "single_campaign",
        "pack_5_campaigns",
        "pack_10_campaigns",
      ]);
    });

    it("reflects environment override in listCampaignPlans", () => {
      const plans = listCampaignPlans({ CAMPAIGN_SINGLE_PRICE_CENTS: 1490 });
      expect(plans[0].amountCents).toBe(1490);
      expect(plans[1].amountCents).toBe(2990);
      expect(plans[2].amountCents).toBe(4990);
    });
  });

  describe("buildPriceParts", () => {
    it("correctly breaks down cents into parts", () => {
      expect(buildPriceParts(990)).toEqual({
        currencySymbol: "R$",
        integerPart: "9",
        decimalPart: "90",
        formattedDecimal: "9,90",
      });

      expect(buildPriceParts(0)).toEqual({
        currencySymbol: "R$",
        integerPart: "0",
        decimalPart: "00",
        formattedDecimal: "0,00",
      });

      expect(buildPriceParts(125050)).toEqual({
        currencySymbol: "R$",
        integerPart: "1.250",
        decimalPart: "50",
        formattedDecimal: "1.250,50",
      });
    });
  });

  describe("formatPlanPrice", () => {
    it("delegates to formatBRL", () => {
      expect(formatPlanPrice(990)).toBe("R$ 9,90");
      expect(formatPlanPrice(2990)).toBe("R$ 29,90");
    });
  });

  describe("checkout feature re-export", () => {
    it("re-exports entire campaign catalog surface", () => {
      expect(checkoutCampaignCatalog.CAMPAIGN_PLAN_IDS).toEqual(
        CAMPAIGN_PLAN_IDS,
      );
      expect(checkoutCampaignCatalog.getDefaultCampaignPlan()).toEqual(
        getDefaultCampaignPlan(),
      );
      expect(typeof checkoutCampaignCatalog.getCampaignPlanById).toBe(
        "function",
      );
    });
  });
});
