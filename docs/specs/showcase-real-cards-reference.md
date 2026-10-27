# Spec: Cards Publicitários Reais de IA na Vitrine & Ação "Usar como Referência"

- **Slug**: `showcase-real-cards-reference`
- **Status**: `ready-for-agent`

---

## Problem Statement

No fluxo de criação de cards publicitários do OfertaPronta (`/criar`), o Passo 4 (`Step4StyleAndPalette`) oferece a "Vitrine de Artes Prontas para Inspirar" (`ShowcaseGalleryDialog`), prometendo ao comerciante: _"Cards publicitários reais criados pela IA"_.

Entretanto, a experiência atual apresenta três problemas críticos de conversão, confiança e inteligência multimodal:

1. **Quebra de Expectativa e Falta de Veracidade Visual:** As imagens exibidas na vitrine de inspiração atualmente são fotos brutas de banco de imagens genérico (Unsplash), como fotos isoladas de gôndolas de supermercado ou legumes crus, em vez de cards publicitários diagramados com manchetes, ofertas, preços e estética real gerada pelo motor multimodal do Gemini. Isso confunde o microempresário, que não consegue visualizar como seu card final ficará estruturado.
2. **Desperdício do Insumo Visual no Prompt Multimodal:** Ao tocar no botão de ação da vitrine (atualmente rotulado como "Usar este Estilo"), a aplicação extrai e grava unicamente o identificador textual (`stylePresetId`). A imagem em si do card de alta resolução exibido não é aproveitada nem enviada aos estágios do `PromptEngine` ou à API multimodal do Gemini como imagem de referência (`referenceImageDataUrl`). Como consequência, o modelo de IA não absorve a iluminação, composição espacial, enquadramento e direção de arte do exemplo que encantou o usuário.
3. **Perda de Dados e Falha Silenciosa de Ingestão de URLs no Backend:** Na camada de serviços de backend (`drafts.service.ts` e `preview-generator.service.ts`), a ingestão de assets de rascunho assume que imagens de entrada são Data URLs Base64. Quando uma URL pública (como a imagem do card da vitrine hospedada em bucket Cloudflare R2 ou CDN) é enviada, o resolvedor de assets não realiza o upload nem preserva a URL externa para consumo no gerador, resultando em referências nulas e perda silenciosa da referência estética.

---

## Solution

Transformar a Vitrine do Passo 4 em uma experiência de inspiração autêntica e conversão acelerada, conectando o catálogo de cards de IA reais ao motor multimodal do Gemini através da ação unificada **"Usar como Referência"**:

1. **Catálogo Curado com Cards Publicitários Reais de IA:**
   - Substituição total das fotos de banco de imagens (`images.unsplash.com`) do catálogo de semente (`SHOWCASE_SEED_CATALOG`) e da tabela `showcase_cards` por cards publicitários autênticos gerados por IA para todos os ramos de atividade (`supermarket`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`, `fashion`).
   - Cards hospedados em Cloudflare R2 com URLs públicas de CDN (com fallback resiliente e determinístico em memória/mock para execuções offline e testes rápidos).
2. **Ação Unificada "Usar como Referência" em 1 Toque:**
   - No diálogo modal `ShowcaseGalleryDialog`, o botão de ação passa a ser **"Usar como Referência"** (com ícone `Sparkles`).
   - Ao ser acionado, o rascunho é atualizado simultaneamente com:
     - O estilo textual associado (`stylePresetId = card.stylePresetId`);
     - A imagem do card como referência visual estética (`referenceImageDataUrl = card.imageUrl`).
3. **Feedback Visual e Transparência no Passo 4 (`Step4StyleAndPalette`):**
   - Ao selecionar um card da vitrine, a interface do Passo 4 exibe um banner/cartão de destaque contextual: **"Referência da Vitrine Ativa"** exibindo miniatura da arte selecionada, título do estilo e a confirmação de que a IA usará a arte para guiar iluminação, enquadramento e cores.
   - O estilo correspondente no grid de mini-posts é automaticamente selecionado e destacado.
   - Ação rápida para "Trocar na Vitrine" ou "Remover Referência".
   - Caso o comerciante já tenha enviado uma Foto de Produto no Passo 3, o sistema mantém a foto do produto intacta e opera em **Multimodalidade Dupla** (Produto Real + Referência Estética da Vitrine). Caso já possuísse um print anterior, atualiza com toast amigável.
4. **Resolvedor Isomórfico de Assets de Referência no Backend:**
   - Atualização do `drafts.service.ts` e do `preview-generator.service.ts` (`resolveDraftVisualInputs`) para suportar tanto Data URLs Base64 quanto URLs públicas HTTPS (Cloudflare R2 / CDN).
   - Conversão segura e com timeout de URLs externas em partes multimodais válidas (`InlineDataPart`) para o `PromptEngine` e o `AdCardGenerator`, garantindo que a IA receba o contexto visual completo.

---

## User Stories

### Vitrine & Descoberta Visual (Passo 4)

1. Como microempresário navegando no Passo 4 do assistente de criação, quero abrir a Vitrine de Exemplos e ver cards publicitários completos reais gerados por IA no meu nicho (com preços, selos e tipografia integrada), para ter segurança visual sobre o resultado final antes de gerar minha arte.
2. Como comerciante de pizzaria ou lanchonete sem referências visuais prévias, quero tocar no botão "Usar como Referência" em um card da vitrine, para que meu rascunho receba imediatamente aquela direção de arte e aquela imagem como guia visual para a IA.
3. Como usuária de salão de beleza que selecionou um card da vitrine, quero ver um banner claro no Passo 4 indicando que a referência está ativa com a miniatura do card escolhido, para ter certeza de qual arte servirá de modelo para o meu anúncio.
4. Como comerciante que mudou de ideia após escolher um card da vitrine, quero poder remover a referência ou escolher outro card com 1 toque, voltando ao catálogo de estilos padrão sem fricção.
5. Como microempresário acessando pelo celular (viewport 390px), quero navegar pela vitrine em um modal fluido com botões de toque generosos (≥ 44px) e imagens com proporção adequada, para escolher referências confortavelmente no smartphone.

### Multimodalidade Dupla & Combinação de Insumos

6. Como comerciante que enviou a foto do meu produto no Passo 3 e escolheu um card de inspiração na vitrine no Passo 4, quero que a IA utilize a foto do meu produto real no cenário E use a arte da vitrine como referência de luz e estilo, criando uma peça única e personalizada.
7. Como comerciante que já havia enviado um print no Passo 3 e decide escolher um card da vitrine no Passo 4, quero ser avisado via toast de que o card da vitrine substituiu a referência anterior, mantendo meu rascunho consistente.
8. Como comerciante que personalizou notas de paleta ou texto, quero que a seleção de uma referência mantenha ou sincronize harmonicamente o estilo visual sem apagar meu briefing comercial.

### Backend, Armazenamento & Motor de Prompt

9. Como motor de IA (`PromptEngine` e `AdCardGenerator`), quero receber a imagem da vitrine como uma parte multimodal `InlineDataPart` devidamente rotulada como `[IMAGEM DE REFERÊNCIA ESTÉTICA]`, para reproduzir com fidelidade a atmosfera, sombras, texturas e proporções do exemplo aprovado.
10. Como serviço de rascunhos (`drafts.service.ts`), quero receber e persistir tanto URLs públicas de CDN (R2) quanto Data URLs Base64 no campo `referenceImageDataUrl` / `referenceAssetKey`, garantindo que referências da vitrine não sejam perdidas ou zeradas ao salvar o rascunho.
11. Como gerador de prévias (`preview-generator.service.ts`), quero que a função `resolveDraftVisualInputs` resolva URLs externas baixando os bytes com timeout estrito (5s) ou acessando o `StorageService` em memória nos testes, prevenindo timeouts de geração e falhas silenciosas.
12. Como engenheiro de software rodando a suíte de testes Vitest (`pnpm vitest run`), quero que todos os testes unitários e de integração de vitrine e injeção de prompt executem em menos de 2 segundos, utilizando drivers e fakes em memória sem chamadas externas de rede.

---

## Implementation Decisions

### 1. Atualização do Catálogo de Semente (`SHOWCASE_SEED_CATALOG`)

- **Local:** `src/features/promotions/data/showcase-catalog.ts`
- **Substituição de Imagens:** Eliminação de todas as referências ao Unsplash (`images.unsplash.com`). Todos os 18+ itens do catálogo passam a apontar para cards publicitários reais de IA:
  - URLs canônicas em Cloudflare R2: `https://pub-ofertapronta.r2.dev/showcase/{segment}/{stylePresetId}-{slug}.png` (ou rota estática pública equivalente da plataforma).
  - Cada item contém metadados ricos: `businessName`, `promoPrice`, `originalPrice`, `highlights` e `cardIntent`.
  - Exportação de constante auxiliar de teste (`MOCK_SHOWCASE_IMAGE_DATA_URL`) com buffer base64 determinístico para execução isolada em ambiente de teste/CI.

### 2. Contrato da Ação "Usar como Referência" no Frontend

- **Componente `ShowcaseGalleryDialog`:**
  - Alteração da propriedade de callback para suportar estilo e imagem:
    ```typescript
    export interface ShowcaseGalleryDialogProps {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      segment: string;
      segmentLabel?: string;
      activeStyleId?: string | null;
      activeReferenceUrl?: string | null;
      onSelectReference: (card: ShowcaseCardItem) => void;
      cards?: ShowcaseCardItem[];
    }
    ```
  - Botão de cada card atualizado para `Usar como Referência` (ícone `Sparkles`) e `Referência Ativa` (ícone `CheckCircle2`) quando `card.imageUrl === activeReferenceUrl || (card.stylePresetId === activeStyleId && activeReferenceUrl)`.

- **Componente `Step4StyleAndPalette`:**
  - Inclusão de suporte à referência ativa da vitrine:
    - Se `referenceImageDataUrl` existir e coincidir com uma imagem da vitrine ou print do usuário: exibe o card de referência ativa com a imagem, título do estilo, badge de status e botão para remover/trocar.
    - O grid de mini-posts preserva a seleção do `stylePresetId`.

- **Hook `useOfferBriefDraft`:**
  - Adição do método de conveniência:
    ```typescript
    setReferenceFromShowcase: (card: { stylePresetId: string; imageUrl: string }) => void;
    clearReferenceImage: () => void;
    ```
  - Atualiza atomicamente os campos `referenceImageDataUrl: card.imageUrl` e `stylePresetId: card.stylePresetId`.

### 3. Ingestão e Resolução de Assets no Backend (`Storage & Preview Generator`)

- **`drafts.service.ts` (`resolveDraftAsset`):**
  - Ajuste na regra de salvamento:
    - Se `inputDataUrl` for uma URL HTTPS (começa com `http://` ou `https://`):
      - Não descartar nem atribuir chave fictícia sem upload.
      - Gravar `reference_image_data_url = inputDataUrl` diretamente no banco de dados para rascunhos rápidos sem custo de re-upload duplicado no R2.
- **`preview-generator.service.ts` (`resolveDraftVisualInputs`):**
  - Quando `draft.referenceImageDataUrl` começar com `http://` ou `https://`:
    - Se o driver de storage for `memory` (testes/desenvolvimento offline), decodifica um buffer sintético determinístico sem chamada de rede.
    - Se for ambiente de produção/R2: realiza `fetch` com timeout de 5s e converte o buffer recebido para `data:${contentType};base64,...`.
    - Isso garante que o `PromptEngine` sempre receba um `InlineDataPart` válido no `parseDataUrl`.
- **`src/server/prompt-engine/prompt-engine.ts`:**
  - Manter o comportamento onde `referenceImageDataUrl` é adicionado aos `parts` do Gemini com a diretiva:
    `[IMAGEM DE REFERÊNCIA ESTÉTICA: Absorver iluminação, paleta de cores e estilo visual]`.
  - Garantir que a presença simultânea de `productImageDataUrl` (Foto do Produto) e `referenceImageDataUrl` (Card da Vitrine) resulte em ambas as partes injetadas com suas respectivas diretivas funcionais.

---

## Testing Decisions

1. **Superfície Pública e Testes de Contrato (Sem Mocks Frágeis de Terceiros):**
   - Testar o comportamento observável através das Server Functions (`saveDraftFn`, `generatePreviewFn`, `getShowcaseCardsFn`) e dos componentes visuais do TanStack Start.
   - Utilizar o `InMemoryStorageDriver` para testes de storage e fakes de buffer para testes de resolução visual.
2. **Suíte de Testes de Backend (`showcase.service.test.ts` e `preview-generator.service.test.ts`):**
   - Validar que `getShowcaseCards` retorna cards com URLs de alta qualidade sem links do Unsplash.
   - Validar que salvar um rascunho com URL HTTPS da vitrine preserva o asset e não resulta em valores nulos.
   - Validar que `resolveDraftVisualInputs` converte URLs HTTPS em Data URLs Base64 consumíveis pelo Gemini.
   - Validar que a injeção multimodal dupla (produto + referência da vitrine) inclui ambas as imagens nas partes do prompt.
3. **Suíte de Testes de Frontend (`step4-style-and-palette.test.tsx` e `showcase-gallery-dialog.test.tsx`):**
   - Validar que o botão "Usar como Referência" dispara o callback com o card completo (estilo + imagem).
   - Validar que o card selecionado exibe o estado "Referência Ativa" e reflete a miniatura no Passo 4.
   - Validar que a ação de remover referência restaura o estado padrão do formulário.
   - Garantir conformidade total com o linter `./.agents/scripts/check_shadcn_usage.py` e tap targets mínimos de 44px.

---

## Out of Scope

- **Geração de novos cards de vitrine em tempo de execução pelo usuário:** A vitrine permanece sendo um catálogo curado pela plataforma, sem permitir que visitantes submetam artes públicas sem moderação prévia (conforme LGPD e proteção de marca).
- **Upload manual de múltiplos arquivos de referência simultâneos:** O rascunho aceita no máximo 1 card de referência ativa (seja da vitrine ou upload do comerciante).
- **Edição visual/recorte da imagem de referência no navegador:** A imagem da vitrine é consumida integralmente pelo Gemini sem necessidade de ferramenta de crop no frontend (YAGNI).

---

## Further Notes

- Alinhado com o **Épico 8** do `docs/roadmap.md` (_Vitrine de Inspirações da Comunidade & Histórico de Criações_).
- Complementa a arquitetura de armazenamento descrita em `docs/specs/cloudflare-r2-storage.md`.
- Respeita os termos canônicos de `GLOSSARY.md` (`Ad Card`, `Draft`, `Style Preset`, `Reference Image`, `Business Segment`).
- Em estrita conformidade com as diretrizes do `AGENTS.md` (mobile-first, zero `any`, Deep Modules com replace-don't-layer).
