import { eq, and, or, gt, gte, desc, sql } from "drizzle-orm";
import { db, type AppDatabase } from "../../../../server/db";
import { freePreviewLedger } from "../../../../server/db/schema/free-preview";
import { serverEnv } from "../../../../config/server-env";
import { createServerLogger } from "../../../../server/logger";

const log = createServerLogger("promotions.free-preview-quota");

export type BlockedReason = "visitor" | "ip" | "global";

export const VISITOR_MAX_FREE_PREVIEWS = 2;
export const IP_MAX_FREE_PREVIEWS = 6;
export const RESERVATION_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos
export const WINDOW_24H_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface ReservePreviewInput {
  visitorId: string;
  ipHash: string;
  draftId: string;
  now?: Date;
  dailyBudget?: number;
}

export type ReservePreviewResult =
  { ok: true; reservationId: string } | { ok: false; reason: BlockedReason };

export interface GetQuotaStatusInput {
  visitorId: string;
  ipHash: string;
  now?: Date;
  dailyBudget?: number;
}

export interface QuotaStatusResult {
  remaining: number;
  blockedReason: BlockedReason | null;
}

/**
 * Calcula o início do dia civil (00:00 BRT) em America/Sao_Paulo para o timestamp fornecido.
 */
export function getSaoPauloDayStart(now: Date): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  // Brasil está permanentemente em UTC-03:00 (sem horário de verão)
  const isoInTz = `${year}-${month}-${day}T00:00:00.000-03:00`;
  return new Date(isoInTz);
}

type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

interface CheckQuotaLimitsParams {
  visitorId: string;
  ipHash: string;
  budget: number;
  dayStart: Date;
  window24hStart: Date;
  reservationExpiryCutoff: Date;
}

async function checkQuotaLimits(
  tx: Tx,
  params: CheckQuotaLimitsParams,
): Promise<BlockedReason | null> {
  const activeCondition = or(
    eq(freePreviewLedger.status, "CONSUMED"),
    and(
      eq(freePreviewLedger.status, "RESERVED"),
      gt(freePreviewLedger.reservedAt, params.reservationExpiryCutoff),
    ),
  );

  const [globalRow] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(freePreviewLedger)
    .where(
      and(gte(freePreviewLedger.reservedAt, params.dayStart), activeCondition),
    );

  const globalCount = globalRow?.count ?? 0;
  if (globalCount >= params.budget) {
    log.warn("Cota global diária de prévias atingida", {
      globalCount,
      budget: params.budget,
    });
    return "global";
  }

  const [ipRow] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(freePreviewLedger)
    .where(
      and(
        eq(freePreviewLedger.ipHash, params.ipHash),
        gt(freePreviewLedger.reservedAt, params.window24hStart),
        activeCondition,
      ),
    );

  const ipCount = ipRow?.count ?? 0;
  if (ipCount >= IP_MAX_FREE_PREVIEWS) {
    log.warn("Cota de IP de prévias atingida", {
      ipCount,
      max: IP_MAX_FREE_PREVIEWS,
    });
    return "ip";
  }

  const [visitorRow] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(freePreviewLedger)
    .where(
      and(
        eq(freePreviewLedger.visitorId, params.visitorId),
        gt(freePreviewLedger.reservedAt, params.window24hStart),
        activeCondition,
      ),
    );

  const visitorCount = visitorRow?.count ?? 0;
  if (visitorCount >= VISITOR_MAX_FREE_PREVIEWS) {
    log.warn("Cota de visitante de prévias atingida", {
      visitorId: params.visitorId,
      visitorCount,
      max: VISITOR_MAX_FREE_PREVIEWS,
    });
    return "visitor";
  }

  return null;
}

/**
 * Módulo profundo FreePreviewQuota:
 * Orquestra de forma atômica e transacional a reserva de cota de prévia gratuita
 * com verificação estrita na ordem: GLOBAL -> IP -> VISITANTE.
 * Utiliza lock consultivo PostgreSQL (pg_advisory_xact_lock) para prevenção absoluta de race conditions.
 */
export async function reservePreview(
  input: ReservePreviewInput,
  database: AppDatabase = db,
): Promise<ReservePreviewResult> {
  const now = input.now ?? new Date();
  const budget =
    input.dailyBudget ?? serverEnv.FREE_PREVIEW_DAILY_BUDGET ?? 300;
  const dayStart = getSaoPauloDayStart(now);
  const window24hStart = new Date(now.getTime() - WINDOW_24H_MS);
  const reservationExpiryCutoff = new Date(
    now.getTime() - RESERVATION_EXPIRATION_MS,
  );

  return database.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('free_preview_quota'))`,
    );

    const blockedReason = await checkQuotaLimits(tx, {
      visitorId: input.visitorId,
      ipHash: input.ipHash,
      budget,
      dayStart,
      window24hStart,
      reservationExpiryCutoff,
    });

    if (blockedReason) {
      return { ok: false, reason: blockedReason };
    }

    const reservationId = crypto.randomUUID();
    await tx.insert(freePreviewLedger).values({
      id: reservationId,
      visitorId: input.visitorId,
      ipHash: input.ipHash,
      draftId: input.draftId,
      status: "RESERVED",
      reservedAt: now,
      settledAt: null,
    });

    log.info("Reserva de prévia gratuita concedida", {
      reservationId,
      visitorId: input.visitorId,
      draftId: input.draftId,
    });

    return { ok: true, reservationId };
  });
}

/**
 * Liquida uma reserva como CONSUMED (sucesso na síntese e marca d'água)
 * ou FAILED (erro de IA/export).
 * Idempotente: atualiza exclusivamente se o status atual for 'RESERVED'.
 */
export async function settlePreview(
  reservationId: string,
  outcome: "CONSUMED" | "FAILED",
  now: Date = new Date(),
  database: AppDatabase = db,
): Promise<void> {
  const result = await database
    .update(freePreviewLedger)
    .set({
      status: outcome,
      settledAt: now,
    })
    .where(
      and(
        eq(freePreviewLedger.id, reservationId),
        eq(freePreviewLedger.status, "RESERVED"),
      ),
    )
    .returning();

  if (result.length > 0) {
    log.info("Reserva de prévia liquidada com sucesso", {
      reservationId,
      outcome,
    });
  } else {
    log.debug("Settle ignorado: reserva já liquidada ou inexistente", {
      reservationId,
      outcome,
    });
  }
}

/**
 * Consulta o status atual de cota e vagas restantes para um visitante e IP.
 */
export async function getQuotaStatus(
  input: GetQuotaStatusInput,
  database: AppDatabase = db,
): Promise<QuotaStatusResult> {
  const now = input.now ?? new Date();
  const budget =
    input.dailyBudget ?? serverEnv.FREE_PREVIEW_DAILY_BUDGET ?? 300;
  const dayStart = getSaoPauloDayStart(now);
  const window24hStart = new Date(now.getTime() - WINDOW_24H_MS);
  const reservationExpiryCutoff = new Date(
    now.getTime() - RESERVATION_EXPIRATION_MS,
  );

  const activeCondition = or(
    eq(freePreviewLedger.status, "CONSUMED"),
    and(
      eq(freePreviewLedger.status, "RESERVED"),
      gt(freePreviewLedger.reservedAt, reservationExpiryCutoff),
    ),
  );

  const [globalRow, ipRow, visitorRow] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)::int` })
      .from(freePreviewLedger)
      .where(and(gte(freePreviewLedger.reservedAt, dayStart), activeCondition)),
    database
      .select({ count: sql<number>`count(*)::int` })
      .from(freePreviewLedger)
      .where(
        and(
          eq(freePreviewLedger.ipHash, input.ipHash),
          gt(freePreviewLedger.reservedAt, window24hStart),
          activeCondition,
        ),
      ),
    database
      .select({ count: sql<number>`count(*)::int` })
      .from(freePreviewLedger)
      .where(
        and(
          eq(freePreviewLedger.visitorId, input.visitorId),
          gt(freePreviewLedger.reservedAt, window24hStart),
          activeCondition,
        ),
      ),
  ]);

  const globalCount = globalRow[0]?.count ?? 0;
  const ipCount = ipRow[0]?.count ?? 0;
  const visitorCount = visitorRow[0]?.count ?? 0;

  if (globalCount >= budget) {
    return { remaining: 0, blockedReason: "global" };
  }
  if (ipCount >= IP_MAX_FREE_PREVIEWS) {
    return { remaining: 0, blockedReason: "ip" };
  }
  if (visitorCount >= VISITOR_MAX_FREE_PREVIEWS) {
    return { remaining: 0, blockedReason: "visitor" };
  }

  const remainingVisitor = Math.max(
    0,
    VISITOR_MAX_FREE_PREVIEWS - visitorCount,
  );
  const remainingIp = Math.max(0, IP_MAX_FREE_PREVIEWS - ipCount);
  const remaining = Math.min(remainingVisitor, remainingIp);

  return {
    remaining,
    blockedReason: null,
  };
}

/**
 * Localiza o draftId da prévia consumida mais recente para o visitante.
 */
export async function findLastPreviewDraftId(
  input: { visitorId: string },
  database: AppDatabase = db,
): Promise<string | null> {
  const rows = await database
    .select({ draftId: freePreviewLedger.draftId })
    .from(freePreviewLedger)
    .where(
      and(
        eq(freePreviewLedger.visitorId, input.visitorId),
        eq(freePreviewLedger.status, "CONSUMED"),
      ),
    )
    .orderBy(desc(freePreviewLedger.reservedAt))
    .limit(1);

  return rows[0]?.draftId ?? null;
}
