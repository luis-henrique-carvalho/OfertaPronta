# 02: AdCardGenerator Deep Module & Gemini Multimodal Synthesis

**Spec:** [`docs/specs/epico-2-ai-generation-export.md`](../../specs/epico-2-ai-generation-export.md)

**What to build:**
Criar o módulo profundo `AdCardGenerator` no servidor (`src/features/promotions/server/services/ai-card-generator.service.ts`) integrando com o SDK `@google/genai` (Gemini Multimodal). O módulo sintetiza o briefing da oferta textual com os insumos visuais opcionais enviados pelo usuário (foto do produto e/ou imagem de referência) em um Card Publicitário completo de proporção 4:5.

**Blocked by:** [`docs/tickets/epico-2-ai-generation-export/01-export-engine-watermark-and-formatting.md`](./01-export-engine-watermark-and-formatting.md)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Instalação do SDK:**
  - `@google/genai` deve estar instalado no projeto via `pnpm add @google/genai`.

- [ ] **Módulo Profundo `AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`):**
  - Implementar a função exportada:
    ```typescript
    export async function generateAdCardImage(
      input: GenerateAdCardInput,
      client?: GoogleGenAIClient,
    ): Promise<GenerateAdCardResult>;
    ```
  - Interface `GenerateAdCardInput` recebe:
    - `businessSegment` (um dos 6 segmentos do catálogo)
    - `businessName`, `offerTitle`, `promoPrice`
    - `originalPrice`, `callToAction`, `whatsapp` (opcionais)
    - `productImageDataUrl`, `referenceImageDataUrl`, `stylePresetId`, `customStyleInstructions` (opcionais)
  - Retorna `GenerateAdCardResult`:
    - `rawImageBuffer: Buffer`
    - `mimeType: string`

- [ ] **Construção de Prompt Especializado por Segmento:**
  - **Given** um briefing de oferta válido,
  - **When** o prompt de síntese multimodal for construído,
  - **Then** deve incluir:
    - O contexto comercial específico do segmento (ex: encarte vibrante para supermercado, elegância para salão/barbearia, apetitosidade para gastronomia).
    - Regras estritas de hierarquia visual: título da oferta em destaque, preço promocional legível e de alto contraste, e nome do estabelecimento.
    - Instrução explícita de proporção de anúncio 4:5 (resolução mestre 1080×1350).

- [ ] **Fusão Multimodal de Insumos Visuais (`inlineData`):**
  - **Given** rascunhos com diferentes combinações de insumos (apenas produto, apenas referência, ambos ou nenhum),
  - **When** enviados ao Gemini:
    - Se houver `productImageDataUrl`: extrai o payload base64 e o envia como parte `inlineData`, com instrução para preservar o produto real na composição central.
    - Se houver `referenceImageDataUrl`: extrai o payload base64 e o envia como parte `inlineData`, com instrução para adotar a atmosfera de cores e estilo visual da referência.
    - Se não houver fotos: utiliza as diretrizes do `stylePresetId` e `customStyleInstructions` para compor o card do zero.

- [ ] **Configuração da Chamada à API Gemini:**
  - Chama o modelo multimodal (`gemini-3.1-flash-image` ou configurado em `server-env.ts`) utilizando `ai.models.generateContent`:
    ```typescript
    {
      model: "gemini-3.1-flash-image",
      contents: promptParts,
      config: {
        responseModalities: ["image"],
        responseFormat: {
          image: {
            aspectRatio: "4:5",
            imageSize: "2K",
          },
        },
      },
    }
    ```
  - Extrai os bytes de imagem de `response.candidates[0].content.parts[...].inlineData.data` e converte para `Buffer`.

- [ ] **Tratamento de Exceções & Falhas:**
  - Captura erros de rede, timeout, rate limit (HTTP 429) ou bloqueios de segurança (safety filters) do Gemini e encapsula em uma classe de erro de domínio (`AdCardGenerationError`) com código e mensagem amigável em português.

- [ ] **Testes de Unidade (TDD com Fake Client):**
  - Implementar suíte de testes em `src/features/promotions/server/services/ai-card-generator.service.test.ts`.
  - Injetar cliente Gemini fake in-memory para simular:
    - Geração com sucesso para cada segmento comercial.
    - Fusão de imagem do produto e referência.
    - Tratamento de resposta sem imagem ou com erro de segurança.
