/**
 * Utilitários puros de máscara, formatação e parsing de moeda BRL (Real Brasileiro).
 *
 * Implementa máscara right-to-left por centavos (padrão de apps bancários e Pix),
 * garantindo compatibilidade com digitação rápida, teclados numéricos móveis e colagem inteligente.
 */

/**
 * Converte valor numérico em centavos para a representação monetária padrão BRL.
 * Exemplo: 990 -> "R$ 9,90", 125050 -> "R$ 1.250,50"
 */
export function formatBRL(cents: number): string {
  if (isNaN(cents) || cents < 0) return "R$ 0,00";
  const value = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

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

  // Extrai apenas dígitos
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";

  // Limita a 10 dígitos (até R$ 99.999.999,99) para evitar overflow numérico
  const safeDigits = digits.slice(0, 10);
  const cents = parseInt(safeDigits, 10);

  if (isNaN(cents) || cents === 0) {
    return "";
  }

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

  // Se não contiver separador decimal (, ou .), interpreta como valor inteiro em reais
  // Ex: "89", "R$ 89", "150", "R$ 150" -> R$ 89,00
  if (!trimmed.includes(",") && !trimmed.includes(".")) {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    const intVal = parseInt(digits.slice(0, 10), 10);
    if (isNaN(intVal) || intVal === 0) return "";
    return formatBRL(intVal * 100);
  }

  // Se já contém vírgula ou ponto decimal, aplica a máscara padrão
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

/**
 * Converte uma string formatada em moeda BRL de volta para float em reais.
 * Exemplo: "R$ 89,90" -> 89.9
 */
export function parseCurrencyToNumber(
  value: string | number | null | undefined,
): number {
  return parseCurrencyToCents(value) / 100;
}
