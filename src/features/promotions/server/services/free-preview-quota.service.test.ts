import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../../server/db";
import { freePreviewLedger } from "../../../../server/db/schema/free-preview";
import {
  reservePreview,
  settlePreview,
  getQuotaStatus,
  findLastPreviewDraftId,
} from "./free-preview-quota.service";

describe("FreePreviewQuota Deep Domain Service", () => {
  beforeEach(async () => {
    // Limpa a tabela de ledger antes de cada teste
    await db.delete(freePreviewLedger);
  });

  describe("Visitor Quota (limit 2 per 24 hours)", () => {
    it("allows 2 reservations and blocks the 3rd with reason 'visitor'", async () => {
      const visitorId = "visitor-quota-1";
      const ipHash = "ip-hash-shared-1";

      const first = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-1",
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        await settlePreview(first.reservationId, "CONSUMED");
      }

      const second = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-2",
      });
      expect(second.ok).toBe(true);
      if (second.ok) {
        await settlePreview(second.reservationId, "CONSUMED");
      }

      const third = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-3",
      });
      expect(third).toEqual({
        ok: false,
        reason: "visitor",
      });
    });

    it("resets visitor quota after 24 hours (rolling window)", async () => {
      const visitorId = "visitor-window-test";
      const ipHash = "ip-hash-window-test";
      const past = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const now = new Date();

      // Consome 2 cotas há 25h
      const res1 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-old-1",
        now: past,
      });
      if (res1.ok) await settlePreview(res1.reservationId, "CONSUMED", past);

      const res2 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-old-2",
        now: past,
      });
      if (res2.ok) await settlePreview(res2.reservationId, "CONSUMED", past);

      // Agora, 25h depois, deve estar liberado novamente
      const current = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-new-1",
        now,
      });
      expect(current.ok).toBe(true);
    });
  });

  describe("IP Quota (limit 6 per 24 hours)", () => {
    it("allows 6 reservations from different visitors on same IP and blocks the 7th with reason 'ip'", async () => {
      const runId = crypto.randomUUID();
      const ipHash = `ip-hash-multi-${runId}`;

      // 6 visitantes diferentes no mesmo IP
      for (let i = 1; i <= 6; i++) {
        const res = await reservePreview({
          visitorId: `visitor-${runId}-${i}`,
          ipHash,
          draftId: `draft-${runId}-${i}`,
          dailyBudget: 1000,
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          await settlePreview(res.reservationId, "CONSUMED");
        }
      }

      // 7º visitante no mesmo IP deve ser bloqueado por IP
      const seventh = await reservePreview({
        visitorId: `visitor-${runId}-7`,
        ipHash,
        draftId: `draft-${runId}-7`,
        dailyBudget: 1000,
      });
      expect(seventh).toEqual({
        ok: false,
        reason: "ip",
      });
    });
  });

  describe("Global Daily Budget Ceiling", () => {
    it("blocks with reason 'global' when global daily budget is reached", async () => {
      const customBudget = 3;
      const testDay = new Date("2026-05-10T12:00:00Z");

      for (let i = 1; i <= customBudget; i++) {
        const res = await reservePreview({
          visitorId: `visitor-global-${i}`,
          ipHash: `ip-global-${i}`,
          draftId: `draft-global-${i}`,
          now: testDay,
          dailyBudget: customBudget,
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          await settlePreview(res.reservationId, "CONSUMED", testDay);
        }
      }

      // 4ª tentativa deve estourar o teto global
      const overflow = await reservePreview({
        visitorId: "visitor-global-overflow",
        ipHash: "ip-global-overflow",
        draftId: "draft-global-overflow",
        now: testDay,
        dailyBudget: customBudget,
      });
      expect(overflow).toEqual({
        ok: false,
        reason: "global",
      });
    });

    it("prefers global block reason before ip or visitor block", async () => {
      const customBudget = 1;
      const testDay = new Date("2026-05-11T12:00:00Z");

      const first = await reservePreview({
        visitorId: "shared-visitor",
        ipHash: "shared-ip",
        draftId: "draft-1",
        now: testDay,
        dailyBudget: customBudget,
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        await settlePreview(first.reservationId, "CONSUMED", testDay);
      }

      // Tenta novamente com o mesmo visitante e IP: global estoura primeiro
      const blocked = await reservePreview({
        visitorId: "shared-visitor",
        ipHash: "shared-ip",
        draftId: "draft-2",
        now: testDay,
        dailyBudget: customBudget,
      });
      expect(blocked).toEqual({
        ok: false,
        reason: "global",
      });
    });
  });

  describe("Failed reservations and lazy expiration", () => {
    it("does not count FAILED reservations against quotas", async () => {
      const visitorId = "visitor-fail-test";
      const ipHash = "ip-fail-test";

      // 1. Reserva falha
      const res1 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-fail-1",
      });
      expect(res1.ok).toBe(true);
      if (res1.ok) {
        await settlePreview(res1.reservationId, "FAILED");
      }

      // 2. Reserva falha
      const res2 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-fail-2",
      });
      expect(res2.ok).toBe(true);
      if (res2.ok) {
        await settlePreview(res2.reservationId, "FAILED");
      }

      // Como as duas falharam, o visitante ainda tem cota cheia de 2
      const status = await getQuotaStatus({ visitorId, ipHash });
      expect(status.remaining).toBe(2);
      expect(status.blockedReason).toBeNull();
    });

    it("ignores orphan RESERVED lines older than 5 minutes (lazy expiration)", async () => {
      const visitorId = "visitor-orphan";
      const ipHash = "ip-orphan";
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const now = new Date();

      // Duas reservas órfãs (nunca receberam settle) há 10 minutos
      await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-orphan-1",
        now: tenMinutesAgo,
      });
      await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-orphan-2",
        now: tenMinutesAgo,
      });

      // Agora, com 10 min passados, as reservas órfãs expiraram preguiçosamente
      const current = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-orphan-fresh",
        now,
      });
      expect(current.ok).toBe(true);
    });
  });

  describe("Concurrency & Atomic Locks", () => {
    it("handles concurrent reservation attempts with exactly remaining spots winning", async () => {
      const visitorId = "visitor-race";
      const ipHash = "ip-race";

      // 1 cota consumida previamente
      const pre = await reservePreview({
        visitorId,
        ipHash,
        draftId: "draft-pre",
      });
      if (pre.ok) await settlePreview(pre.reservationId, "CONSUMED");

      // Resta apenas 1 vaga para o visitante. Dispara 3 reservas concorrentes:
      const results = await Promise.all([
        reservePreview({ visitorId, ipHash, draftId: "draft-c1" }),
        reservePreview({ visitorId, ipHash, draftId: "draft-c2" }),
        reservePreview({ visitorId, ipHash, draftId: "draft-c3" }),
      ]);

      const successCount = results.filter((r) => r.ok).length;
      const blockedCount = results.filter((r) => !r.ok).length;

      expect(successCount).toBe(1);
      expect(blockedCount).toBe(2);
    });
  });

  describe("findLastPreviewDraftId", () => {
    it("returns null when visitor has no consumed previews", async () => {
      const last = await findLastPreviewDraftId({
        visitorId: "visitor-no-previews",
      });
      expect(last).toBeNull();
    });

    it("returns the most recently settled CONSUMED draftId for the visitor", async () => {
      const visitorId = "visitor-last-draft";
      const ipHash = "ip-last-draft";
      const t1 = new Date(Date.now() - 60000);
      const t2 = new Date();

      const r1 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "first-draft-id",
        now: t1,
      });
      if (r1.ok) await settlePreview(r1.reservationId, "CONSUMED", t1);

      const r2 = await reservePreview({
        visitorId,
        ipHash,
        draftId: "second-draft-id",
        now: t2,
      });
      if (r2.ok) await settlePreview(r2.reservationId, "CONSUMED", t2);

      const last = await findLastPreviewDraftId({ visitorId });
      expect(last).toBe("second-draft-id");
    });
  });
});
