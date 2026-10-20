import { formatBRL } from "@/lib/utils";

export { formatBRL };

/**
 * Utilitários puros de máscara, formatação e parsing de moeda BRL (Real Brasileiro).
 *
 * Implementa máscara right-to-left por centavos (padrão de apps bancários e Pix),
 * garantindo compatibilidade com digitação rápida, teclados numéricos móveis e colagem inteligente.
 */

/**
 * Aplica máscara de moeda BRL em tempo real a partir de qualquer string ou número de entrada.
 * Utiliza o fluxo sequencial de centavos (centavo shift) amplamente adotado no Brasil.
 *
 * Exemplos:
 * "" -> ""
 * "8" -> "R$ 0,08"
 * "89" -> "R$ 0,89"
 * "899" -> "R$ 8,99"
 * "8990" -> "R$ 89,90"
 * "89,90" -> "R$ 89,90"
 * "R$ 89,90" -> "R$ 89,90"
 * "125000" -> "R$ 1.250,00"
 */
export function maskCurrency(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (!str) return "";

  const digits = str.replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits.slice(0, 10), 10);
  if (isNaN(cents) || cents === 0) return "";

  return formatBRL(cents);
}

/**
 * Interpreta texto colado no campo monetário de forma inteligente.
 * Se o usuário colar um número inteiro sem separador decimal (ex: "89" ou "150"),
 * converte para o valor em reais ("R$ 89,00").
 * Se colar com decimais ou símbolo ("89,90", "89.90", "R$ 89,90"), formata com precisão.
 */
export function parsePastedCurrency(pasted: string): string {
  const trimmed = pasted.trim();
  if (!trimmed) return "";

  // Se não contiver separador decimal (, ou .), interpreta como reais inteiros
  if (!trimmed.includes(",") && !trimmed.includes(".")) {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    const intVal = parseInt(digits.slice(0, 10), 10);
    if (isNaN(intVal) || intVal === 0) return "";
    return formatBRL(intVal * 100);
  }

  return maskCurrency(trimmed);
}

/**
 * Converte uma string formatada em moeda BRL de volta para o valor inteiro em centavos.
 * Exemplo: "R$ 89,90" -> 8990, "" -> 0
 */
export function parseCurrencyToCents(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;
  const cents = parseInt(digits.slice(0, 10), 10);
  return isNaN(cents) ? 0 : cents;
}
