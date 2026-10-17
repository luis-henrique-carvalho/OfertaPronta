import { getCurrentRequestStore } from "./async-context";
import { formatLogEntry } from "./formatters";

export interface LogContext {
  requestId?: string;
  module?: string;
  orderId?: string;
  draftId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  child(defaultContext: LogContext): Logger;
}

export interface LoggerOptions {
  writer?: (
    level: "DEBUG" | "INFO" | "WARN" | "ERROR",
    formattedMessage: string,
  ) => void;
  isProduction?: boolean;
}

const defaultWriter = (
  level: "DEBUG" | "INFO" | "WARN" | "ERROR",
  line: string,
): void => {
  if (level === "ERROR" || level === "WARN") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
};

class ServerLogger implements Logger {
  constructor(
    private readonly moduleName: string,
    private readonly defaultContext: LogContext = {},
    private readonly options: LoggerOptions = {},
  ) {}

  private write(
    level: "DEBUG" | "INFO" | "WARN" | "ERROR",
    message: string,
    error?: unknown,
    callContext?: LogContext,
  ): void {
    const store = getCurrentRequestStore();
    const requestId =
      callContext?.requestId ??
      this.defaultContext.requestId ??
      store?.requestId;

    const mergedContext: Record<string, unknown> = {
      ...this.defaultContext,
      ...callContext,
    };

    // Remove campos de controle redundantes do context interno
    delete mergedContext.requestId;
    delete mergedContext.module;

    const formatted = formatLogEntry(
      {
        timestamp: new Date(),
        level,
        module: this.moduleName,
        message,
        requestId,
        context:
          Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
        error,
      },
      {
        isProduction: this.options.isProduction,
      },
    );

    const writer = this.options.writer ?? defaultWriter;
    writer(level, formatted);
  }

  debug(message: string, context?: LogContext): void {
    this.write("DEBUG", message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.write("INFO", message, undefined, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("WARN", message, undefined, context);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    this.write("ERROR", message, error, context);
  }

  child(defaultContext: LogContext): Logger {
    return new ServerLogger(
      this.moduleName,
      { ...this.defaultContext, ...defaultContext },
      this.options,
    );
  }
}

/**
 * Cria uma instância de logger tipada e estruturada para um módulo de servidor específico.
 */
export function createServerLogger(
  moduleName: string,
  options?: LoggerOptions,
): Logger {
  return new ServerLogger(moduleName, {}, options);
}

/**
 * Instância singleton raiz para logs gerais do servidor.
 */
export const logger: Logger = createServerLogger("app");
