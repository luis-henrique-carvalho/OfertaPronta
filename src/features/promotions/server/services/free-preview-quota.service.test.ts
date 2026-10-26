import { describe, it, expect, afterEach } from "vitest";
import { and, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../../../../server/db";
import { freePreviewLedger } from "../../../../server/db/schema/free-preview";
import {
  reservePreview,
  settlePreview,
  getQuotaStatus,
  findLastPreviewDraftId,
  getSaoPauloDayStart,
  resetVisitorQuotaOnPayment,
} from "./free-preview-quota.service";

async function activeCountFrom(day: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(freePreviewLedger)
    .where(
      and(
        gte(freePreviewLedger.reservedAt, getSaoPauloDayStart(day)),
        inArray(freePreviewLedger.status, ["CONSUMED", "RESERVED"]),
      ),
    );
  return row?.total ?? 0;
}

/** Remove apenas as linhas futuras criadas pelos testes de teto global (não vazam para outros testes). */
async function cleanupGlobalBudgetRows(): Promise<void> {
  await db
    .delete(freePreviewLedger)
    .where(
      or(
        like(freePreviewLedger.visitorId, "visitor-global-%"),
        like(freePreviewLedger.visitorId, "shared-visitor-%"),
      ),
    );
}

describe("FreePreviewQuota Deep Domain Service", () => {
  afterEach(cleanupGlobalBudgetRows);

  describe("Visitor Quota (limit 2 per 24 hours)", () => {
    it("allows 2 reservations and blocks the 3rd with reason 'visitor'", async () => {
      const visitorId = `visitor-quota-${crypto.randomUUID()}`;
      const ipHash = `ip-hash-${crypto.randomUUID()}`;

      const first = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-1-${crypto.randomUUID()}`,
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        await settlePreview(first.reservationId, "CONSUMED");
      }

      const second = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-2-${crypto.randomUUID()}`,
      });
      expect(second.ok).toBe(true);
      if (second.ok) {
        await settlePreview(second.reservationId, "CONSUMED");
      }

      const third = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-3-${crypto.randomUUID()}`,
      });
      expect(third).toEqual({
        ok: false,
        reason: "visitor",
      });
    });

    it("resets visitor quota after 24 hours (rolling window)", async () => {
      const visitorId = `visitor-window-${crypto.randomUUID()}`;
      const ipHash = `ip-window-${crypto.randomUUID()}`;
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
      const testDay = new Date(
        Date.now() +
          (1000 + Math.floor(Math.random() * 50000)) * 24 * 60 * 60 * 1000,
      );
      // Teto relativo: o ledger compartilhado pode ter linhas futuras de outras execuções
      const customBudget = (await activeCountFrom(testDay)) + 3;

      for (let i = 1; i <= 3; i++) {
        const res = await reservePreview({
          visitorId: `visitor-global-${crypto.randomUUID()}-${i}`,
          ipHash: `ip-global-${crypto.randomUUID()}-${i}`,
          draftId: `draft-global-${crypto.randomUUID()}-${i}`,
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
        visitorId: `visitor-global-overflow-${crypto.randomUUID()}`,
        ipHash: `ip-global-overflow-${crypto.randomUUID()}`,
        draftId: `draft-global-overflow-${crypto.randomUUID()}`,
        now: testDay,
        dailyBudget: customBudget,
      });
      expect(overflow).toEqual({
        ok: false,
        reason: "global",
      });
    });

    it("prefers global block reason before ip or visitor block", async () => {
      const testDay = new Date(
        Date.now() +
          (51000 + Math.floor(Math.random() * 50000)) * 24 * 60 * 60 * 1000,
      );
      const customBudget = (await activeCountFrom(testDay)) + 1;
      const sharedVisitor = `shared-visitor-${crypto.randomUUID()}`;
      const sharedIp = `shared-ip-${crypto.randomUUID()}`;

      const first = await reservePreview({
        visitorId: sharedVisitor,
        ipHash: sharedIp,
        draftId: `draft-1-${crypto.randomUUID()}`,
        now: testDay,
        dailyBudget: customBudget,
      });
      expect(first.ok).toBe(true);
      if (first.ok) {
        await settlePreview(first.reservationId, "CONSUMED", testDay);
      }

      // Tenta novamente com o mesmo visitante e IP: global estoura primeiro
      const blocked = await reservePreview({
        visitorId: sharedVisitor,
        ipHash: sharedIp,
        draftId: `draft-2-${crypto.randomUUID()}`,
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
      const visitorId = `visitor-fail-${crypto.randomUUID()}`;
      const ipHash = `ip-fail-${crypto.randomUUID()}`;

      // 1. Reserva falha
      const res1 = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-fail-1-${crypto.randomUUID()}`,
      });
      expect(res1.ok).toBe(true);
      if (res1.ok) {
        await settlePreview(res1.reservationId, "FAILED");
      }

      // 2. Reserva falha
      const res2 = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-fail-2-${crypto.randomUUID()}`,
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
      const visitorId = `visitor-orphan-${crypto.randomUUID()}`;
      const ipHash = `ip-orphan-${crypto.randomUUID()}`;
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const now = new Date();

      // Duas reservas órfãs (nunca receberam settle) há 10 minutos
      await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-orphan-1-${crypto.randomUUID()}`,
        now: tenMinutesAgo,
      });
      await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-orphan-2-${crypto.randomUUID()}`,
        now: tenMinutesAgo,
      });

      // Agora, com 10 min passados, as reservas órfãs expiraram preguiçosamente
      const current = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-orphan-fresh-${crypto.randomUUID()}`,
        now,
      });
      expect(current.ok).toBe(true);
    });
  });

  describe("Concurrency & Atomic Locks", () => {
    it("handles concurrent reservation attempts with exactly remaining spots winning", async () => {
      const visitorId = `visitor-race-${crypto.randomUUID()}`;
      const ipHash = `ip-race-${crypto.randomUUID()}`;

      // 1 cota consumida previamente
      const pre = await reservePreview({
        visitorId,
        ipHash,
        draftId: `draft-pre-${crypto.randomUUID()}`,
      });
      if (pre.ok) await settlePreview(pre.reservationId, "CONSUMED");

      // Resta apenas 1 vaga para o visitante. Dispara 3 reservas concorrentes:
      const results = await Promise.all([
        reservePreview({
          visitorId,
          ipHash,
          draftId: `draft-c1-${crypto.randomUUID()}`,
        }),
        reservePreview({
          visitorId,
          ipHash,
          draftId: `draft-c2-${crypto.randomUUID()}`,
        }),
        reservePreview({
          visitorId,
          ipHash,
          draftId: `draft-c3-${crypto.randomUUID()}`,
        }),
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
        visitorId: `visitor-no-previews-${crypto.randomUUID()}`,
      });
      expect(last).toBeNull();
    });

    it("returns the most recently settled CONSUMED draftId for the visitor", async () => {
      const visitorId = `visitor-last-draft-${crypto.randomUUID()}`;
      const ipHash = `ip-last-draft-${crypto.randomUUID()}`;
      const draft1 = `draft-first-${crypto.randomUUID()}`;
      const draft2 = `draft-second-${crypto.randomUUID()}`;
      const t1 = new Date(Date.now() - 60000);
      const t2 = new Date();

      const r1 = await reservePreview({
        visitorId,
        ipHash,
        draftId: draft1,
        now: t1,
      });
      if (r1.ok) await settlePreview(r1.reservationId, "CONSUMED", t1);

      const r2 = await reservePreview({
        visitorId,
        ipHash,
        draftId: draft2,
        now: t2,
      });
      if (r2.ok) await settlePreview(r2.reservationId, "CONSUMED", t2);

      const last = await findLastPreviewDraftId({ visitorId });
      expect(last).toBe(draft2);
    });
  });

  describe("resetVisitorQuotaOnPayment (Restoration of Quota on Payment)", () => {
    it("transitions CONSUMED previews to RESET_BY_PURCHASE and restores visitor quota to 2", async () => {
      const visitorId = `visitor-reset-${crypto.randomUUID()}`;
      const ipHash = `ip-reset-${crypto.randomUUID()}`;
      const draft1 = `draft-1-${crypto.randomUUID()}`;
      const draft2 = `draft-2-${crypto.randomUUID()}`;

      // Consome 2 prévias
      const r1 = await reservePreview({ visitorId, ipHash, draftId: draft1 });
      expect(r1.ok).toBe(true);
      if (r1.ok) await settlePreview(r1.reservationId, "CONSUMED");

      const r2 = await reservePreview({ visitorId, ipHash, draftId: draft2 });
      expect(r2.ok).toBe(true);
      if (r2.ok) await settlePreview(r2.reservationId, "CONSUMED");

      // Verifica cota esgotada
      const beforeStatus = await getQuotaStatus({ visitorId, ipHash });
      expect(beforeStatus.remaining).toBe(0);
      expect(beforeStatus.blockedReason).toBe("visitor");

      // Visitante compra o draft2 (pedido associado ao draft2 atinge PAID)
      const resetResult = await resetVisitorQuotaOnPayment({ draftId: draft2 });
      expect(resetResult.resetCount).toBe(2);
      expect(resetResult.visitorId).toBe(visitorId);

      // Status das linhas no banco
      const rows = await db
        .select()
        .from(freePreviewLedger)
        .where(eq(freePreviewLedger.visitorId, visitorId));
      expect(rows.length).toBe(2);
      for (const row of rows) {
        expect(row.status).toBe("RESET_BY_PURCHASE");
        expect(row.settledAt).toBeDefined();
      }

      // getQuotaStatus agora deve retornar 2 prévias restantes sem bloqueio
      const afterStatus = await getQuotaStatus({ visitorId, ipHash });
      expect(afterStatus.remaining).toBe(2);
      expect(afterStatus.blockedReason).toBeNull();
    });

    it("transitions active RESERVED preview to RESET_BY_PURCHASE as well", async () => {
      const visitorId = `visitor-reserved-reset-${crypto.randomUUID()}`;
      const ipHash = `ip-reserved-reset-${crypto.randomUUID()}`;
      const draftId = `draft-reserved-${crypto.randomUUID()}`;

      const r = await reservePreview({ visitorId, ipHash, draftId });
      expect(r.ok).toBe(true);

      const resetResult = await resetVisitorQuotaOnPayment({ draftId });
      expect(resetResult.resetCount).toBe(1);
      expect(resetResult.visitorId).toBe(visitorId);

      const rows = await db
        .select()
        .from(freePreviewLedger)
        .where(eq(freePreviewLedger.visitorId, visitorId));
      expect(rows[0]?.status).toBe("RESET_BY_PURCHASE");
    });

    it("returns resetCount 0 and visitorId null when draftId is not in ledger", async () => {
      const nonExistentDraftId = `draft-ghost-${crypto.randomUUID()}`;
      const resetResult = await resetVisitorQuotaOnPayment({
        draftId: nonExistentDraftId,
      });

      expect(resetResult).toEqual({
        resetCount: 0,
        visitorId: null,
      });
    });

    it("only resets purchasing visitor when two visitors share the same IP", async () => {
      const sharedIp = `ip-shared-${crypto.randomUUID()}`;
      const visitorA = `visitor-A-${crypto.randomUUID()}`;
      const visitorB = `visitor-B-${crypto.randomUUID()}`;
      const draftA = `draft-A-${crypto.randomUUID()}`;
      const draftB = `draft-B-${crypto.randomUUID()}`;

      // Visitante A consome 2 prévias
      const rA1 = await reservePreview({
        visitorId: visitorA,
        ipHash: sharedIp,
        draftId: draftA,
      });
      if (rA1.ok) await settlePreview(rA1.reservationId, "CONSUMED");

      // Visitante B consome 1 prévia
      const rB1 = await reservePreview({
        visitorId: visitorB,
        ipHash: sharedIp,
        draftId: draftB,
      });
      if (rB1.ok) await settlePreview(rB1.reservationId, "CONSUMED");

      // Visitante A paga seu pedido (draftA)
      const resetResult = await resetVisitorQuotaOnPayment({ draftId: draftA });
      expect(resetResult.resetCount).toBe(1);
      expect(resetResult.visitorId).toBe(visitorA);

      // Linhas do visitante B não foram alteradas
      const rowsB = await db
        .select()
        .from(freePreviewLedger)
        .where(eq(freePreviewLedger.visitorId, visitorB));
      expect(rowsB.length).toBe(1);
      expect(rowsB[0]?.status).toBe("CONSUMED");

      // Visitante A tem 2 liberadas
      const statusA = await getQuotaStatus({
        visitorId: visitorA,
        ipHash: sharedIp,
      });
      expect(statusA.remaining).toBe(2);

      // Visitante B ainda tem 1 consumida (1 restante)
      const statusB = await getQuotaStatus({
        visitorId: visitorB,
        ipHash: sharedIp,
      });
      expect(statusB.remaining).toBe(1);
    });

    it("is strictly idempotent on duplicate reset calls", async () => {
      const visitorId = `visitor-idem-${crypto.randomUUID()}`;
      const ipHash = `ip-idem-${crypto.randomUUID()}`;
      const draftId = `draft-idem-${crypto.randomUUID()}`;

      const r = await reservePreview({ visitorId, ipHash, draftId });
      if (r.ok) await settlePreview(r.reservationId, "CONSUMED");

      // Primeiro reset
      const first = await resetVisitorQuotaOnPayment({ draftId });
      expect(first.resetCount).toBe(1);
      expect(first.visitorId).toBe(visitorId);

      // Segundo reset (webhook repetido ou polling)
      const second = await resetVisitorQuotaOnPayment({ draftId });
      expect(second.resetCount).toBe(0);
      expect(second.visitorId).toBe(visitorId);
    });

    it("resets visitor quota directly by visitorId without prior draft in ledger", async () => {
      const visitorId = `visitor-direct-${crypto.randomUUID()}`;
      const ipHash = `ip-direct-${crypto.randomUUID()}`;
      const draft1 = `draft-d1-${crypto.randomUUID()}`;
      const draft2 = `draft-d2-${crypto.randomUUID()}`;

      // Visitante consome 2 prévias no ledger
      const r1 = await reservePreview({ visitorId, ipHash, draftId: draft1 });
      if (r1.ok) await settlePreview(r1.reservationId, "CONSUMED");

      const r2 = await reservePreview({ visitorId, ipHash, draftId: draft2 });
      if (r2.ok) await settlePreview(r2.reservationId, "CONSUMED");

      // Cota do visitante está esgotada
      const quotaBefore = await getQuotaStatus({ visitorId, ipHash });
      expect(quotaBefore.remaining).toBe(0);
      expect(quotaBefore.blockedReason).toBe("visitor");

      // Pagamento efetuado informando apenas visitorId (ex: compra direta sem prévia no Passo 4)
      const resetResult = await resetVisitorQuotaOnPayment({ visitorId });
      expect(resetResult.resetCount).toBe(2);
      expect(resetResult.visitorId).toBe(visitorId);

      // Cota do visitante foi integralmente restaurada
      const quotaAfter = await getQuotaStatus({ visitorId, ipHash });
      expect(quotaAfter.remaining).toBe(2);
      expect(quotaAfter.blockedReason).toBeNull();
    });

    it("returns resetCount 0 and visitorId null when neither visitorId nor draftId is provided", async () => {
      const resetResult = await resetVisitorQuotaOnPayment({});
      expect(resetResult.resetCount).toBe(0);
      expect(resetResult.visitorId).toBeNull();
    });
  });
});
