export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  code?: string | number;
  [key: string]: unknown;
}

const SENSITIVE_KEY_PATTERNS = [
  "authorization",
  "x-webhook-secret",
  "webhooksecret",
  "webhook_secret",
  "secret",
  "token",
  "pushinpaytoken",
  "pushin_pay_token",
  "geminiapikey",
  "gemini_api_key",
  "apikey",
  "api_key",
  "password",
  "senha",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return SENSITIVE_KEY_PATTERNS.some((pattern) => {
    const cleanPattern = pattern.toLowerCase().replace(/[-_]/g, "");
    return normalized.includes(cleanPattern);
  });
}

/**
 * Mascara recursivamente chaves sensíveis em objetos, listas e strings.
 */
export function redactSecrets<T>(val: T, seen = new WeakSet()): T {
  if (val === null || val === undefined || typeof val !== "object") {
    return val;
  }
  if (typeof val === "function") {
    return val;
  }
  if (seen.has(val as object)) {
    return "[Circular]" as unknown as T;
  }
  seen.add(val as object);

  if (Array.isArray(val)) {
    return val.map((item) => redactSecrets(item, seen)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val)) {
    if (isSensitiveKey(k)) {
      if (typeof v === "string" && /^bearer\s+/i.test(v)) {
        result[k] = "Bearer ***";
      } else {
        result[k] = "***";
      }
    } else {
      result[k] = redactSecrets(v, seen);
    }
  }
  return result as T;
}

/**
 * Serializa instâncias de Error com stack trace, código de erro e cause.
 */
export function serializeError(err: unknown, seen = new WeakSet()): unknown {
  if (!err || typeof err !== "object") {
    return err;
  }

  if (err instanceof Error) {
    const serialized: SerializedError = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };

    if ("code" in err && (err as { code?: unknown }).code !== undefined) {
      serialized.code = (err as { code: string | number }).code;
    }

    if (err.cause !== undefined) {
      serialized.cause = serializeError(err.cause, seen);
    }

    return serialized;
  }

  return redactSecrets(err, seen);
}

export interface FormatLogEntryInput {
  timestamp: Date;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  module: string;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

export interface FormatOptions {
  isProduction?: boolean;
  colors?: boolean;
}

const ANSI_COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

/**
 * Formata a entrada de log em JSON em linha única (produção) ou texto legível colorizado (desenvolvimento/testes).
 */
export function formatLogEntry(
  entry: FormatLogEntryInput,
  options?: FormatOptions,
): string {
  const isProduction =
    options?.isProduction ?? process.env.NODE_ENV === "production";
  const useColors = options?.colors ?? !isProduction;

  const sanitizedContext = entry.context
    ? (redactSecrets(entry.context) as Record<string, unknown>)
    : undefined;
  const serializedError = entry.error ? serializeError(entry.error) : undefined;

  if (isProduction) {
    const payload: Record<string, unknown> = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      module: entry.module,
      message: entry.message,
    };

    if (entry.requestId) {
      payload.requestId = entry.requestId;
    }

    if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
      payload.context = sanitizedContext;
    }

    if (serializedError) {
      payload.error = serializedError;
    }

    return JSON.stringify(payload);
  }

  // Formatação legível (desenvolvimento / teste)
  const time = entry.timestamp.toTimeString().split(" ")[0] || "00:00:00";
  const ms = String(entry.timestamp.getMilliseconds()).padStart(3, "0");
  const timeStr = `[${time}.${ms}]`;

  let levelStr: string = entry.level.padEnd(5);
  let moduleStr: string = `[${entry.module}]`;
  let reqStr: string = entry.requestId ? `(${entry.requestId})` : "";
  let contextStr = "";

  if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
    contextStr = ` ${JSON.stringify(sanitizedContext)}`;
  }

  let errorStr = "";
  if (serializedError) {
    if (
      serializedError instanceof Error ||
      (typeof serializedError === "object" &&
        serializedError !== null &&
        "stack" in serializedError)
    ) {
      errorStr = `\n${String((serializedError as { stack?: string }).stack || (serializedError as { message?: string }).message)}`;
    } else {
      errorStr = `\n${JSON.stringify(serializedError, null, 2)}`;
    }
  }

  if (useColors) {
    let color = ANSI_COLORS.green;
    if (entry.level === "DEBUG") color = ANSI_COLORS.cyan;
    if (entry.level === "WARN") color = ANSI_COLORS.yellow;
    if (entry.level === "ERROR") color = ANSI_COLORS.red;

    levelStr = `${color}${levelStr}${ANSI_COLORS.reset}`;
    moduleStr = `${ANSI_COLORS.magenta}${moduleStr}${ANSI_COLORS.reset}`;
    if (reqStr) {
      reqStr = `${ANSI_COLORS.dim}${reqStr}${ANSI_COLORS.reset}`;
    }
    if (contextStr) {
      contextStr = `${ANSI_COLORS.dim}${contextStr}${ANSI_COLORS.reset}`;
    }
  }

  const parts = [timeStr, levelStr, moduleStr];
  if (reqStr) parts.push(reqStr);
  parts.push(entry.message + contextStr + errorStr);

  return parts.join(" ");
}
