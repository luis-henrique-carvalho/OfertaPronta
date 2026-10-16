# Spec: Motor de Geração de Card Publicitário por IA Multimodal & ExportEngine

- **Slug**: `epico-2-ai-generation-export`
- **Status**: `ready-for-agent`

---

## Problem Statement

Microempresários de diversos segmentos (supermercados, cabeleireiros, barbearias, pizzarias, hamburguerias, restaurantes e lojas locais) não possuem habilidades em softwares de design nem orçamento para contratar agências publicitárias para cada promoção do dia a dia. Ao mesmo tempo, templates estáticos pré-fabricados parecem genéricos, amadores e descontextualizados.

O microempresário precisa que uma Inteligência Artificial profissional compreenda o seu briefing comercial (nome da loja, item anunciado, preços e contato), combine harmonicamente com a foto real do seu produto e/ou uma referência estética que ele admira, e produza em segundos um **Card Publicitário (`Ad Card`) completo**, profissional e pronto para postar nas redes sociais.

Por outro lado, o modelo de negócio da plataforma requer viabilidade econômica:
1. Uma **prévia gratuita** deve permitir ao microempresário atestar a qualidade visual do card antes de pagar.
2. Essa prévia deve ser protegida de forma indelével por uma **marca d'água** server-side para evitar o uso comercial sem pagamento.
3. A cota gratuita deve ser estritamente controlada (**exatamente 1 geração gratuita por rascunho**) para evitar custos abusivos de GPU/API antes da confirmação do Pix (R$ 9,90).
4. A entrega final precisa fornecer os dois formatos oficiais do Instagram e WhatsApp: **Feed (1080×1350 / 4:5)** e **Story (1080×1920 / 9:16)**.

---

## Solution

O Épico 2 implementa o motor central de geração e processamento do OfertaPronta, composto por dois módulos profundos no servidor e uma experiência mobile-first interativa:

1. **`AdCardGenerator` (Deep Module via `@google/genai`):**
   - Recebe o Briefing da Oferta consolidado no Rascunho (`Draft`) e os insumos visuais em Data URL (Imagem do Produto, Imagem de Referência ou Estilo Visual).
   - Monta uma instrução multimodal estruturada com diretrizes de direção de arte específicas para cada um dos 6 segmentos comerciais (`Business Segment`).
   - Invoca o modelo visual multimodal da Google (`gemini-3.1-flash-image` / `gemini-3-pro-image`), sintetizando uma peça publicitária de alto impacto visual em proporção 4:5 (1080×1350), integrando cenário, produto, ambientação de cores e tipografia promocional.

2. **`ExportEngine` (Deep Module via `Sharp`):**
   - Responsável pelo processamento determinístico de imagens no backend.
   - Aplica a marca d'água diagonal semitransparente (`PRÉVIA OFERTAPRONTA • LIBERAÇÃO PÓS-PIX`) via composição SVG sobre a imagem mestre.
   - Deriva o formato Story (1080×1920 / 9:16) a partir da arte mestre através de extensão adaptativa com ambientação de fundo harmônica (blur estético / preenchimento tonal), economizando 50% de cota de inferência de IA.
   - Converte o resultado em formato otimizado para web e salva o Data URL seguro no banco de dados (`drafts.preview_card_image_url`).

3. **Controle Estrito de Cotas & Transição de Estados:**
   - Permite **exatamente 1 geração gratuita de IA por rascunho** (`ai_generation_count < 1`).
   - Tentativas subsequentes de regeração no mesmo rascunho sem pagamento são bloqueadas com mensagem clara, preservando a prévia já existente e convidando o usuário ao pagamento Pix de R$ 9,90 (onde terá direito a até 3 regenerações).
   - Falhas transitórias da IA (timeout, erro 429 ou bloqueio de segurança) não consomem a cota do usuário e oferecem tentativa imediata.

4. **Experiência do Usuário (UX Mobile-First):**
   - Loading contextual de 4 a 10 segundos com micro-feedbacks progressivos ("Interpretando briefing...", "Compondo cenário com IA...", "Aplicando proteção de prévia...").
   - Transição fluida para a tela de prévia, exibindo o card real gerado por IA com alternador instantâneo entre Feed (1080×1350) e Story (1080×1920).

---

## User Stories

### Happy Paths

1. **Como microempresário de supermercado**, quero preencher minha oferta de carne ou hortifrúti com foto do produto e clicar em "Gerar Prévia com IA", para ver em segundos um card publicitário realista com o preço destacado e ambientação profissional de encarte.
2. **Como cabeleireira ou barbeiro**, quero enviar uma foto do corte ou serviço junto a uma imagem de referência estética elegante, para que a IA gere um card publicitário moderno combinando meu estilo com as cores da referência.
3. **Como dono de hamburgueria ou pizzaria sem foto própria**, quero escolher o estilo visual "Destaque Gourmet" e deixar a IA compor o card completo a partir do briefing, para ter um anúncio apetitoso mesmo sem ter câmera profissional.
4. **Como microempresário visualizando a prévia**, quero alternar entre a visualização de Feed (4:5) e Story (9:16), para conferir como a arte ficará em cada canal antes de realizar o pagamento Pix.
5. **Como microempresário**, quero ver uma marca d'água diagonal nítida na prévia gratuita, compreendendo que a versão em alta resolução sem marca d'água será liberada assim que eu pagar o Pix de R$ 9,90.

### Edge Cases & Regras de Negócio

6. **Como microempresário que já gerou 1 prévia gratuita**, se eu voltar à etapa anterior, alterar um texto e clicar novamente em "Gerar Prévia com IA", quero ser avisado de forma transparente e amigável que a cota gratuita daquele rascunho foi atingida, mantendo minha prévia atual disponível e me convidando a finalizar o Pix de R$ 9,90 para liberar novas regenerações.
7. **Como sistema**, quando uma chamada à API do Gemini falhar por timeout ou erro 429 (rate limit), não devo incrementar o contador `ai_generation_count`, garantindo que o usuário não perca seu direito à prévia gratuita por falha técnica de infraestrutura.
8. **Como microempresário cuja geração falhou por instabilidade transitória**, quero visualizar uma mensagem amigável em português com um botão "Tentar Novamente", para poder tentar gerar minha prévia mais uma vez sem perder meus dados preenchidos.
9. **Como sistema de proteção contra abuso**, quero que a marca d'água seja gravada diretamente nos pixels do buffer da imagem no servidor via `Sharp`, garantindo que nenhuma imagem limpa de prévia trafegue pelo navegador do cliente antes da confirmação do pagamento.
10. **Como microempresário em conexão móvel 3G/4G**, quero visualizar mensagens progressivas de progresso durante os 4 a 10 segundos de síntese da IA, para ter certeza de que o sistema está trabalhando e não travar a tela.

---

## Implementation Decisions

### 1. Módulos Profundos e Localidade de Código

- **`ExportEngine` (`src/server/export-engine/`):**
  - Módulo profundo server-only para processamento e exportação de imagens com `Sharp`.
  - Interface pública única:
    ```typescript
    export interface WatermarkOptions {
      watermarkText?: string;
      subText?: string;
    }

    export interface ExportEngineService {
      applyWatermark(
        imageBuffer: Buffer,
        options?: WatermarkOptions,
      ): Promise<{
        watermarkedBuffer: Buffer;
        dataUrl: string;
        width: number;
        height: number;
      }>;

      formatFeedCard(imageBuffer: Buffer): Promise<Buffer>;

      formatStoryCard(imageBuffer: Buffer): Promise<Buffer>;
    }
    ```
  - Visual da marca d'água: Composição SVG com rotação de `-32deg`, texto principal `PRÉVIA OFERTAPRONTA` em caixa alta com opacidade semitransparente (0.28) e subtexto `ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX` (opacidade 0.22), distribuído de forma central e repetida, inviabilizando cortes simples sem degradar a visualização da oferta.
  - Formato Story derivado: Para não dobrar o consumo de cota e o tempo de resposta da IA, a arte mestre 4:5 é convertida para 9:16 (1080×1920) pelo Sharp, aplicando um fundo estético estendido com desfoque gaussiano suave da própria imagem ou gradiente complementar harmônico.

- **`AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`):**
  - Módulo profundo server-only encapsulando o SDK `@google/genai`.
  - Modelo padrão: `gemini-3.1-flash-image` (com suporte a `gemini-3-pro-image`).
  - Interface pública:
    ```typescript
    export interface GenerateAdCardInput {
      businessSegment: BusinessSegment;
      businessName: string;
      offerTitle: string;
      promoPrice: string;
      originalPrice?: string | null;
      callToAction?: string | null;
      whatsapp?: string | null;
      productImageDataUrl?: string | null;
      referenceImageDataUrl?: string | null;
      stylePresetId?: string | null;
      customStyleInstructions?: string | null;
    }

    export interface GenerateAdCardResult {
      rawImageBuffer: Buffer;
      mimeType: string;
    }

    export async function generateAdCardImage(
      input: GenerateAdCardInput,
      client?: GoogleGenAIClient,
    ): Promise<GenerateAdCardResult>;
    ```
  - Construção do Prompt: Injeta instruções explícitas de legibilidade publicitária, posicionamento claro de preço em destaque, título da oferta, nome comercial e proporção 4:5.
  - Multi-input fusion: As imagens `productImageDataUrl` e `referenceImageDataUrl` têm seu prefixo data URL removido e são enviadas como partes de conteúdo `inlineData` `{ mimeType, data: base64 }`.

### 2. Fronteira RPC TanStack Start (`generator.functions.ts`)

- **`generatePreviewFn`:**
  - `createServerFn({ method: "POST" })` protegido com validação de entrada Zod:
    ```typescript
    export const generatePreviewInputSchema = z.object({
      draftId: z.string().min(1, "draftId é obrigatório"),
    });
    ```
  - Máquina de estados e verificação atômica de cota:
    1. Busca o rascunho via `getOfferDraft(draftId)`. Se não encontrar, lança `NOT_FOUND`.
    2. Valida se `draft.aiGenerationCount >= 1`:
       - Se já houver gerado: retorna erro controlado `{ success: false, code: "AI_QUOTA_EXCEEDED", message: "Limite de 1 prévia gratuita por rascunho atingido. Conclua o pagamento Pix para liberar os arquivos e ter direito a 3 regenerações.", previewUrl: draft.previewCardImageUrl }`.
    3. Chama `generateAdCardImage(draft)`.
    4. Passa o buffer gerado pelo `ExportEngine.applyWatermark()`.
    5. Atualiza o banco via Drizzle (`drafts`):
       - `previewCardImageUrl`: Data URL da imagem protegida com marca d'água.
       - `aiGenerationCount`: incrementa de 0 para 1.
       - `updatedAt`: `new Date()`.
    6. Retorna `{ success: true, previewUrl, aiGenerationCount: 1 }`.
  - Tratamento de Erro: Se a chamada Gemini lançar exceção, captura, registra o erro no servidor e retorna `{ success: false, code: "AI_GENERATION_FAILED", message: "Erro temporário ao gerar arte com IA. Nenhuma cota foi consumida. Tente novamente." }`. O banco não é alterado.

### 3. Experiência de Usuário e Componentes UI

- No componente `OfferBriefWizard` (Passo 2 para Passo 3):
  - Ao clicar em "Gerar Prévia com IA", salva o rascunho via `saveDraftFn` e aciona `generatePreviewFn`.
  - Exibe overlay / card de carregamento com animação e textos progressivos (intervalos de 2.5s) para dar feedback vivo durante os 4-10 segundos de inferência.
  - Ao completar com sucesso, avança para o Passo 3 exibindo a imagem real gerada por IA no `LiveCardPreview` (e `CardArtCanvas`), com watermark server-side já estampado na imagem.
  - Se `code === "AI_QUOTA_EXCEEDED"`, avança para o Passo 3 exibindo a prévia existente e exibe banner informativo com destaque para o botão de checkout Pix de R$ 9,90.
  - Se `code === "AI_GENERATION_FAILED"`, permanece no formulário e exibe banner de erro com botão de retry.

---

## Testing Decisions

1. **Testes Baseados em Limites da Interface Pública (TDD Red-Green):**
   - **`ExportEngine`:** Testes em `src/server/export-engine/export-engine.test.ts`. Testa o redimensionamento para 1080×1350, a presença de marca d'água via composição Sharp e a geração de Story 1080×1920 utilizando buffers de teste válidos em memória (sem dependências externas de rede).
   - **`AdCardGenerator`:** Testes em `src/features/promotions/server/services/ai-card-generator.service.test.ts`. Testa a montagem do prompt para diferentes segmentos, fusão de imagens em base64 e tratamento de erros injetando um cliente Gemini fake/in-memory (*replace-don't-layer*).
   - **`generatePreviewFn` & Quota Service:** Testes em `src/features/promotions/server/functions/generator.functions.test.ts`. Testa o fluxo completo:
     - Rascunho com `aiGenerationCount = 0` gera prévia com sucesso e incrementa cota para 1.
     - Rascunho com `aiGenerationCount = 1` é bloqueado com código `AI_QUOTA_EXCEEDED` sem chamar a IA.
     - Falha simulada da IA mantém `aiGenerationCount = 0`.
2. **Testes de Integração de UI / Hook:**
   - Teste de renderização do estado de loading e exibição da prévia no componente `OfferBriefWizard` e `LiveCardPreview`.

---

## Out of Scope

- **Checkout Pix e Webhook de Confirmação:** O fluxo transacional Pix (R$ 9,90), emissão de QR Code e conciliação HMAC pertencem ao **Épico 3**.
- **Regenerações Pós-Pagamento (até 3 ajustes):** As 3 regenerações por IA condicionadas ao status de pagamento confirmado pertencem ao **Épico 4 (Delivery & Refinamento Pós-Compra)**.
- **Upload para S3 Real / CDN de Produção:** No Épico 2, as prévias de card são manipuladas como Data URLs de alta fidelidade e buffers em memória (YAGNI). O adapter de S3 com links assinados de 7 dias será ativado na entrega dos arquivos finais limpos.
- **Edição Manual de Camadas SVG:** O OfertaPronta não é um editor manual de arrastar elementos; o card é gerado integralmente pela IA multimodal a partir do briefing.

---

## Further Notes

- Alinhado com o [PRD.md](../../PRD.md) (versão 2.0).
- Alinhado com o [GLOSSARY.md](../../GLOSSARY.md) (`Merchant`, `Business Segment`, `Ad Card`, `Offer Brief`, `Product Image`, `Reference Image`, `Style Preset`, `Draft`, `Watermark`).
- Alinhado com a [ADR 0002](../../docs/adr/0002-dual-image-mode-and-gemini-imagen.md) (Geração Completa de Cards Publicitários via IA Multimodal Gemini).
- Conformidade estrita com o [AGENTS.md](../../AGENTS.md) (Deep Modules, Server-only isolation, Zod validation nas bordas e zero any).
