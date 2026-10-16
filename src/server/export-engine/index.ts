/**
 * ExportEngine - Módulo Profundo Server-Only para Processamento e Exportação de Imagens.
 *
 * Responsável por:
 * - Aplicação de marca d'água de proteção para prévias gratuitas.
 * - Formatação determinística no formato Feed (1080x1350).
 * - Derivação de formato Story (1080x1920) com barras harmônicas desfocadas.
 */

export {
  applyWatermark,
  formatFeedCard,
  formatStoryCard,
  type WatermarkOptions,
  type WatermarkResult,
} from "./image-processor";
