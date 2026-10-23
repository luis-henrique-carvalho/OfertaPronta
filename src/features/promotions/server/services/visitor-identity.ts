import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export const OP_VID_COOKIE_NAME = "op_vid";
export const OP_VID_MAX_AGE_SECONDS = 31536000; // 1 year (365 days)

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Assina o ID do visitante com HMAC-SHA256 usando o prefixo "vid:".
 */
export function signVisitorId(visitorId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`vid:${visitorId}`)
    .digest("base64url");
}

/**
 * Verifica se a assinatura do cookie é válida com timingSafeEqual.
 * Aceita segredo anterior opcional para rotação suave.
 */
export function verifyVisitorId(
  visitorId: string,
  signature: string,
  secret: string,
  previousSecret?: string,
): boolean {
  if (!visitorId || !signature || !secret) {
    return false;
  }

  const expectedCurrent = signVisitorId(visitorId, secret);
  if (safeCompare(signature, expectedCurrent)) {
    return true;
  }

  if (previousSecret) {
    const expectedPrevious = signVisitorId(visitorId, previousSecret);
    if (safeCompare(signature, expectedPrevious)) {
      return true;
    }
  }

  return false;
}

/**
 * Formata o valor bruto do cookie op_vid: "<uuid>.<signature>".
 */
export function formatVisitorCookieValue(
  visitorId: string,
  secret: string,
): string {
  const signature = signVisitorId(visitorId, secret);
  return `${visitorId}.${signature}`;
}

/**
 * Valida e analisa o valor bruto do cookie op_vid.
 */
export function parseVisitorCookie(
  rawCookieValue: string | undefined | null,
  secret: string,
  previousSecret?: string,
): { visitorId: string; isNew: boolean } | null {
  if (!rawCookieValue || typeof rawCookieValue !== "string") {
    return null;
  }

  const firstDot = rawCookieValue.indexOf(".");
  if (firstDot <= 0) {
    return null;
  }

  const visitorId = rawCookieValue.slice(0, firstDot);
  const signature = rawCookieValue.slice(firstDot + 1);

  if (!UUID_V4_REGEX.test(visitorId)) {
    return null;
  }

  const isValid = verifyVisitorId(visitorId, signature, secret, previousSecret);

  if (!isValid) {
    return null;
  }

  return { visitorId, isNew: false };
}

/**
 * Normaliza o endereço IP: IPv4 inalterado; IPv6 truncado para prefixo /64.
 */
export function normalizeIp(rawIp: string): string {
  const trimmed = rawIp.trim().toLowerCase();
  if (!trimmed || trimmed === "unknown") {
    return "unknown";
  }

  if (!trimmed.includes(":")) {
    return trimmed; // IPv4
  }

  // IPv4 mapeado para IPv6 (ex: ::ffff:192.0.2.1)
  if (trimmed.startsWith("::ffff:") && trimmed.includes(".")) {
    return trimmed.slice(7);
  }

  // Expansão padrão de IPv6 para padronizar /64
  const parts = trimmed.split("::");
  let segments: string[] = [];

  if (parts.length === 2) {
    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const missing = 8 - (left.length + right.length);
    const middle = Array(Math.max(0, missing)).fill("0");
    segments = [...left, ...middle, ...right];
  } else {
    segments = trimmed.split(":");
  }

  // Preenche cada grupo com 4 dígitos hex e pega os primeiros 4 blocos (64 bits)
  const prefix = segments
    .slice(0, 4)
    .map((s) => s.padStart(4, "0"))
    .join(":");

  return `${prefix}::/64`;
}

function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  if ("get" in headers && typeof headers.get === "function") {
    return headers.get(name);
  }

  const record = headers as Record<string, string | string[] | undefined>;
  const lowerName = name.toLowerCase();

  for (const [key, val] of Object.entries(record)) {
    if (key.toLowerCase() === lowerName) {
      if (Array.isArray(val)) {
        return val[0] ?? null;
      }
      return val ?? null;
    }
  }

  return null;
}

/**
 * Resolve o IP do cliente a partir dos cabeçalhos HTTP com proteção anti-spoofing.
 * Prioridade:
 * 1. cf-connecting-ip (Cloudflare sempre sobrescreve com o IP real)
 * 2. x-forwarded-for (primeiro IP da lista) SOMENTE se trustedProxy === true
 * 3. x-real-ip
 * 4. Fallback: "unknown" (nunca isenta; conta no balde de IP)
 */
export function resolveClientIp(
  headers: Headers | Record<string, string | string[] | undefined>,
  trustedProxy: boolean = false,
): string {
  const cfIp = getHeaderValue(headers, "cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  if (trustedProxy) {
    const forwarded = getHeaderValue(headers, "x-forwarded-for");
    if (forwarded && forwarded.trim().length > 0) {
      const firstIp = forwarded.split(",")[0]?.trim();
      if (firstIp && firstIp.length > 0) {
        return firstIp;
      }
    }
  }

  const realIp = getHeaderValue(headers, "x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Gera o hash HMAC-SHA256 hex do IP usando o prefixo "ip:".
 * O IP cru NUNCA é persistido nem logado.
 */
export function hashIp(ip: string, secret: string): string {
  const normalized = normalizeIp(ip);
  return createHmac("sha256", secret).update(`ip:${normalized}`).digest("hex");
}

export interface VisitorCookieData {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export interface VisitorIdentityResult {
  visitorId: string;
  ipHash: string;
  isNewVisitor: boolean;
  cookieToSet: VisitorCookieData | null;
}

function extractCookie(
  headers: Headers | Record<string, string | string[] | undefined>,
  cookieName: string,
): string | null {
  const cookieHeader = getHeaderValue(headers, "cookie");
  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [name, ...valParts] = pair.trim().split("=");
    if (name === cookieName) {
      return valParts.join("=");
    }
  }

  return null;
}

/**
 * Orquestra a resolução da identidade do visitante:
 * - Valida cookie op_vid existente ou emite um novo
 * - Resolve e calcula hash do IP
 * - Retorna metadados para persistência e Set-Cookie
 */
export function resolveVisitorIdentity(params: {
  headers: Headers | Record<string, string | string[] | undefined>;
  secret: string;
  previousSecret?: string;
  trustedProxy?: boolean;
  isProduction?: boolean;
}): VisitorIdentityResult {
  const {
    headers,
    secret,
    previousSecret,
    trustedProxy = false,
    isProduction = process.env.NODE_ENV === "production",
  } = params;

  const rawCookie = extractCookie(headers, OP_VID_COOKIE_NAME);
  const parsed = parseVisitorCookie(rawCookie, secret, previousSecret);

  let visitorId: string;
  let isNewVisitor: boolean;
  let cookieToSet: VisitorCookieData | null = null;

  if (parsed) {
    visitorId = parsed.visitorId;
    isNewVisitor = false;
  } else {
    visitorId = randomUUID();
    isNewVisitor = true;
    const cookieValue = formatVisitorCookieValue(visitorId, secret);

    cookieToSet = {
      name: OP_VID_COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: OP_VID_MAX_AGE_SECONDS,
    };
  }

  const clientIp = resolveClientIp(headers, trustedProxy);
  const ipHash = hashIp(clientIp, secret);

  return {
    visitorId,
    ipHash,
    isNewVisitor,
    cookieToSet,
  };
}
