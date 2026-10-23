import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setCookie } from "@tanstack/react-start/server";
import {
  generatePreviewInputSchema,
  type GeneratePreviewInput,
  generatePreviewOutputSchema,
  type GeneratePreviewOutput,
  getPreviewQuotaOutputSchema,
  type GetPreviewQuotaOutput,
} from "../../data/offer-brief.schema";
import {
  executeGeneratePreview,
  type GeneratePreviewResponse,
  type GeneratePreviewDependencies,
} from "../services/preview-generator.service";
import { resolveVisitorIdentity } from "../services/visitor-identity";
import { getQuotaStatus } from "../services/free-preview-quota.service";
import { serverEnv } from "../../../../config/server-env";

export {
  generatePreviewInputSchema,
  generatePreviewOutputSchema,
  getPreviewQuotaOutputSchema,
};

export type {
  GeneratePreviewInput,
  GeneratePreviewOutput,
  GeneratePreviewResponse,
  GeneratePreviewDependencies,
  GetPreviewQuotaOutput,
};

function getRequestContextSafe(): { headers: Headers } {
  try {
    const headers = getRequestHeaders();
    return { headers };
  } catch {
    return { headers: new Headers() };
  }
}

/**
 * Server Function RPC TanStack Start: expõe a geração de prévia protegida
 * com reserva atômica de cota gratuita, isolamento Server-Only e validação Zod no boundary.
 */
export const generatePreviewFn = createServerFn({ method: "POST" })
  .validator((input: unknown): GeneratePreviewInput =>
    generatePreviewInputSchema.parse(input),
  )
  .handler(
    async ({
      data,
    }: {
      data: GeneratePreviewInput;
    }): Promise<GeneratePreviewOutput> => {
      const { headers } = getRequestContextSafe();
      const identity = resolveVisitorIdentity({
        headers,
        secret: serverEnv.FREE_PREVIEW_SECRET,
        previousSecret: serverEnv.FREE_PREVIEW_SECRET_PREVIOUS,
        trustedProxy: serverEnv.TRUSTED_PROXY,
      });

      if (identity.cookieToSet) {
        try {
          setCookie(identity.cookieToSet.name, identity.cookieToSet.value, {
            httpOnly: identity.cookieToSet.httpOnly,
            secure: identity.cookieToSet.secure,
            sameSite: identity.cookieToSet.sameSite,
            path: identity.cookieToSet.path,
            maxAge: identity.cookieToSet.maxAge,
          });
        } catch {
          // Ignorado quando fora do contexto HTTP ativo (ex: testes unitários)
        }
      }

      const result = await executeGeneratePreview(data, {
        identity: {
          visitorId: identity.visitorId,
          ipHash: identity.ipHash,
        },
      });

      return generatePreviewOutputSchema.parse(result);
    },
  );

/**
 * Server Function RPC TanStack Start: consulta a cota de prévia gratuita
 * disponível para o visitante/IP atual (remaining e blockedReason).
 */
export const getPreviewQuotaFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<GetPreviewQuotaOutput> => {
    const { headers } = getRequestContextSafe();
    const identity = resolveVisitorIdentity({
      headers,
      secret: serverEnv.FREE_PREVIEW_SECRET,
      previousSecret: serverEnv.FREE_PREVIEW_SECRET_PREVIOUS,
      trustedProxy: serverEnv.TRUSTED_PROXY,
    });

    if (identity.cookieToSet) {
      try {
        setCookie(identity.cookieToSet.name, identity.cookieToSet.value, {
          httpOnly: identity.cookieToSet.httpOnly,
          secure: identity.cookieToSet.secure,
          sameSite: identity.cookieToSet.sameSite,
          path: identity.cookieToSet.path,
          maxAge: identity.cookieToSet.maxAge,
        });
      } catch {
        // Ignorado quando fora do contexto HTTP ativo
      }
    }

    const status = await getQuotaStatus({
      visitorId: identity.visitorId,
      ipHash: identity.ipHash,
    });

    return getPreviewQuotaOutputSchema.parse(status);
  },
);
