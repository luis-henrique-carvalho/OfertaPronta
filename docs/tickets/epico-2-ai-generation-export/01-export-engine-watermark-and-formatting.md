# 01: ExportEngine & Sharp Server-Side Watermark Processing

**Spec:** [`docs/specs/epico-2-ai-generation-export.md`](../../specs/epico-2-ai-generation-export.md)

**What to build:**
Criar o módulo profundo `ExportEngine` no servidor utilizando `Sharp` para processar e proteger imagens de Cards Publicitários. O módulo deve aplicar de forma indelével uma marca d'água diagonal semitransparente ("PRÉVIA OFERTAPRONTA • LIBERAÇÃO PÓS-PIX") nas prévias gratuitas em proporção Feed (1080×1350) e ser capaz de derivar o formato Story (1080×1920) através de extensão adaptativa com ambientação de fundo harmônica.

**Blocked by:** `None (can start immediately)`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Instalação de Dependências:**
  - `sharp` e `@types/sharp` devem estar instalados no projeto via `pnpm add sharp` e `pnpm add -D @types/sharp`.

- [ ] **Módulo Profundo `ExportEngine` (`src/server/export-engine/`):**
  - Implementar `src/server/export-engine/image-processor.ts` e exportar a interface pública concisa em `src/server/export-engine/index.ts`.
  - A interface deve expor funções para:
    - `applyWatermark(imageBuffer: Buffer, options?: WatermarkOptions): Promise<{ watermarkedBuffer: Buffer; dataUrl: string; width: number; height: number }>`
    - `formatFeedCard(imageBuffer: Buffer): Promise<Buffer>` (garante dimensões exatas de 1080×1350)
    - `formatStoryCard(imageBuffer: Buffer): Promise<Buffer>` (deriva dimensões 1080×1920 com fundo adaptativo)

- [ ] **Aplicação Determinística de Marca d'Água:**
  - **Given** um buffer de imagem bruta (ex.: 1080×1350 ou resolução proporcional 4:5),
  - **When** `applyWatermark` for executado,
  - **Then** deve retornar uma imagem com composição SVG contendo:
    - Rotação diagonal de aproximadamente `-32deg`.
    - Texto principal legível: `PRÉVIA OFERTAPRONTA`.
    - Subtexto de aviso: `ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX`.
    - Opacidade semitransparente (sem cobrir totalmente a arte, mas impedindo o uso comercial sem pagamento).
    - Data URL no formato `data:image/webp;base64,...` ou `data:image/jpeg;base64,...`.

- [ ] **Adaptação para Story (1080×1920):**
  - **Given** uma arte de Feed 1080×1350,
  - **When** `formatStoryCard` for executado,
  - **Then** deve gerar uma imagem com dimensões exatas 1080×1920 sem distorcer o conteúdo central, preenchendo as margens superior e inferior com fundo harmônico desfocado da própria arte.

- [ ] **Testes de Unidade (TDD nos Limites da Interface):**
  - Implementar suíte de testes em `src/server/export-engine/export-engine.test.ts` utilizando buffers de teste válidos criados em memória via Sharp.
  - Verificar dimensões retornadas (1080×1350 e 1080×1920), presença da marca d'água e integridade do buffer gerado.
