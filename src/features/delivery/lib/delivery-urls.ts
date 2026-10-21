import { clientEnv } from "../../../config/client-env";

/**
 * Converte um caminho relativo ou URL de pedido em uma URL absoluta completa com protocolo e domínio.
 * Se já for uma URL absoluta (http:// ou https://), retorna inalterada.
 * Caso contrário, utiliza window.location.origin (se disponível no navegador) ou VITE_PUBLIC_APP_URL como fallback.
 */
export function toAbsoluteOrderUrl(urlOrPath: string): string {
  if (!urlOrPath) return "";

  // Se já for uma URL absoluta completa, mantém
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;

  // Se estiver no browser, window.location.origin é a fonte da verdade mais precisa (reflete a URL atual da aba)
  if (
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.origin === "string" &&
    window.location.origin
  ) {
    return `${window.location.origin}${cleanPath}`;
  }

  // Fallback para clientEnv ou localhost padrão
  const base = (
    clientEnv.VITE_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${cleanPath}`;
}
