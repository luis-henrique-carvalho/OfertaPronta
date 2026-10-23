# Ticket 01: Backend Stream — Clean-Slate `prompt-engine-v2`, Modelos via `.env` e Edição Conversacional Inteligente

- **Slug**: `prompt-engine-v2`
- **Stream**: `01-backend-stream` (Único Macro-Ticket — 100% Backend)
- **Agente Executor**: `backend-builder`
- **Blocked by**: None
- **Plano Técnico de Referência**: [docs/plans/prompt-engine-v2.md](file:///home/luis/repositories/OfertaPronta/.worktrees/prompt-engine-v2/docs/plans/prompt-engine-v2.md)
- **Worktree de Execução**: `/home/luis/repositories/OfertaPronta/.worktrees/prompt-engine-v2`

---

## 1. Objetivo e Escopo

Refazer o módulo profundo `src/server/prompt-engine/` do zero (`prompt-engine-v2`), removendo 100% dos arquivos legados fragmentados (`art-direction-blueprints.ts`, `dynamic-planner.ts`, `edit-prompt-compiler.ts`, `prompt-compiler.ts`), configurando a seleção de modelos de Estágio 1 (`GEMINI_PROMPT_MODEL`) e Estágio 2 (`GEMINI_IMAGE_MODEL`) via variáveis de ambiente (`src/config/server-env.ts` e `.env.example`), implementando o **Diretor de Arte Publicitário Universal** (baseado nos 4 Pilares Universais + Golden Few-Shot Example, sem segmentos hardcoded e sem regexes) e a **Edição Conversacional Inteligente** (`editStrategy: "IN_PLACE_EDIT" | "RECOMPOSE_LAYOUT"`) com desbloqueio de pixels quando `editStrategy === "RECOMPOSE_LAYOUT"`.

---

## 2. Arquivos no Escopo do Builder

### Deletar (`rm` / `git rm`)

- `src/server/prompt-engine/art-direction-blueprints.ts`
- `src/server/prompt-engine/dynamic-planner.ts`
- `src/server/prompt-engine/edit-prompt-compiler.ts`
- `src/server/prompt-engine/prompt-compiler.ts`

### Criar / Reescrever

- `src/server/prompt-engine/types.ts`
- `src/server/prompt-engine/system-instructions.ts`
- `src/server/prompt-engine/prompt-engine.ts`
- `src/server/prompt-engine/index.ts`
- `src/server/prompt-engine/prompt-engine.test.ts`

### Modificar

- `src/config/server-env.ts`
- `src/config/server-env.test.ts`
- `.env.example`
- `src/features/promotions/server/services/ai-card-generator.service.ts`
- `src/features/promotions/server/services/ai-card-generator.service.test.ts`
- `src/features/delivery/server/services/post-payment-regeneration.service.ts`

---

## 3. Especificação Técnica Detalhada

### 3.1. Variáveis de Ambiente (`src/config/server-env.ts` & `.env.example`)

1. Em `src/config/server-env.ts`, garantir no `serverEnvSchema`:
   - `GEMINI_PROMPT_MODEL: z.string().min(1).default("gemini-3.8-flash")`
   - `GEMINI_IMAGE_MODEL: z.string().min(1).default("gemini-nano-banana-2.1")`
2. Em `src/config/server-env.test.ts`, adicionar asserções verificando os defaults (`gemini-3.8-flash` e `gemini-nano-banana-2.1`) e o override customizado via `parseServerEnv({ GEMINI_PROMPT_MODEL: "gemini-3.8-pro", GEMINI_IMAGE_MODEL: "gemini-3-pro-image" })`.
3. Em `.env.example`, documentar `GEMINI_PROMPT_MODEL="gemini-3.8-flash"` e `GEMINI_IMAGE_MODEL="gemini-nano-banana-2.1"`.

### 3.2. System Instructions Universais (`src/server/prompt-engine/system-instructions.ts`)

1. **Zero Segmentos Hardcoded e Zero Regex**: Não criar mapas por segmento (`SEGMENT_ART_DIRECTIVES` ou `segment-archetypes.ts`) nem expressões regulares de classificação (`RECOMPOSE_INTENT_REGEX`).
2. **`GOLDEN_FEW_SHOT_MASTER_PROMPT`**: Exportar a constante contendo exatamente os 4 parágrafos validados no protótipo:
   - Parágrafo 1: `"Fotografia publicitária gastronômica comercial para social media em proporção vertical 4:5, sem divisão estanque de tela, apresentando uma cena única tridimensional contínua e imersiva de steakhouse artesanal..."`
   - Parágrafo 2: `"No primeiro plano à esquerda, repousa uma porção transbordante de batatas rústicas douradas cortadas à mão..."`
   - Parágrafo 3: `"Integrado ao quadrante superior esquerdo, sobre a área escura sem interferir no produto, posiciona-se o conjunto gráfico e tipográfico publicitário artesanal e refinado..."`
   - Parágrafo 4: `"Abaixo do título da oferta, alinha-se uma linha elegante de micro-copy com os atributos sensoriais em caixa alta e espaçamento arejado: \"ARTESANAL • SUCULENTO • CROCANTE\"..."`
3. **`UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION`**:
   - Ensinar explicitamente os **4 Pilares Universais de Direção de Arte Publicitária**:
     1. **Zoneamento Espacial Assimétrico (Split Composition & Zero Colisão)**: Posicionar o Hero Subject em uma zona de destaque (ex: centro-direito/inferior-direito ou faixa dividida) e reservar deliberadamente uma zona limpa de baixa frequência visual (`bokeh` desfocado ou fundo escuro/tonal) para o bloco tipográfico em primeiro plano (zero colisão entre texto e detalhes complexos do produto). Para proporção `9:16` (Story), preservar 15% no topo e 15% na base livres de textos importantes para a interface do Instagram/WhatsApp.
     2. **Densidade Sensorial, Materiais Físicos e Óptica de Estúdio**: Deduzir organicamente do briefing superfícies táteis autênticas, micro-elementos de cena, temperatura de iluminação (ex: rim light 3200K, bokeh) e lente (ex: 85mm f/2.0). Integrar organicamente `[FOTO DO PRODUTO REAL]`, `[IMAGEM DE REFERÊNCIA ESTÉTICA]` e `[LOGOTIPO OFICIAL]` quando anexados.
     3. **Hierarquia Tipográfica Multi-Nível**: Estruturar de 3 a 4 níveis visuais (Selo/Logo de Marca no topo -> Headline em tipografia mista de alto contraste com palavra-chave em destaque -> Subtítulo ou linha sensorial de 3 palavras separadas por bullet `•` -> Badge de preço de alto impacto + faixa/banner de rodapé com CTA/endereço/WhatsApp), preservando 100% dos textos em português verbatim. Se não houver preço informado, jamais inventar preços ou exibir `"R$ 0,00"`.
     4. **Saída Visual Pura (Zero Diluição de Prompt)**: Responder exclusivamente com a descrição visual de estúdio em **4 parágrafos densos em português**, sem títulos markdown, sem meta-regras e sem listas negativas.
   - Incluir o `GOLDEN_FEW_SHOT_MASTER_PROMPT` como exemplo padrão de excelência.
4. **`CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION`**:
   - Instruir o modelo a avaliar o pedido de edição/regeneração e retornar estritamente um JSON:
     `{ "editStrategy": "IN_PLACE_EDIT" | "RECOMPOSE_LAYOUT", "masterPrompt": "<4 parágrafos densos em português>" }`.
   - Definir claramente quando usar `"IN_PLACE_EDIT"` (ajustes pontuais de cor, texto, preço, iluminação mantendo a composição atual) vs `"RECOMPOSE_LAYOUT"` (mudança de layout, reposicionamento de produto/texto, divisão espacial, troca de estrutura).
   - Incluir a **Regra Inegociável Canvas vs. Layout Interno**: pedidos como `"quero um layout horizontal"`, `"dividir na horizontal"` ou mudanças estruturais dentro de um card Feed (`4:5`) ou Story (`9:16`) referem-se exclusivamente ao **arranjo interno horizontal dos elementos** (faixas horizontais superior/inferior ou divisão lado a lado dentro do canvas vertical), NUNCA a mudar o aspect ratio para widescreen `16:9`.

### 3.3. Módulo Profundo (`src/server/prompt-engine/prompt-engine.ts`)

1. **`compileAdCardPrompt(input: PromptEngineInput, options?: PromptEngineOptions): Promise<PromptEngineCompileResult>`**:
   - Identifica se está em **Modo Edição Conversacional** (`Boolean(input.baseCardImageDataUrl)`).
   - Se `options?.client` estiver presente e `options?.enableDynamicPlanner !== false`:
     - **Modo Criação**: chama `options.client.models.generateContent` com `model: options?.model ?? serverEnv.GEMINI_PROMPT_MODEL`, `config: { systemInstruction: UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION, temperature: 0.7 }` e `contents` contendo o briefing estruturado + imagens anexas (`[LOGOTIPO OFICIAL]`, `[FOTO DO PRODUTO REAL]`, `[IMAGEM DE REFERÊNCIA ESTÉTICA]`).
     - **Modo Edição**: chama `options.client.models.generateContent` com `model: options?.model ?? serverEnv.GEMINI_PROMPT_MODEL`, `config: { systemInstruction: CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION, responseMimeType: "application/json", temperature: 0.4 }` e `contents` contendo o briefing de edição + `[IMAGEM BASE DO CARD]` + demais insumos anexos. Faz parse do JSON (removendo eventuais cercas markdown ` ```json `) e valida com `editPlanSchema.safeParse()`.
   - Se `options?.client` não for fornecido, se `enableDynamicPlanner === false`, ou se a chamada ao Estágio 1 falhar/der timeout:
     - Usa `buildFallbackMasterPrompt(input)` (que gera 4 parágrafos densos de descrição visual em português sem meta-regras nem listas negativas) e, no modo edição, define `editStrategy: "IN_PLACE_EDIT"`.
   - **Montagem das Partes Multimodais para o Estágio 2 (`parts`)**:
     - `parts[0]` é `masterPrompt` (exclusivamente os 4 parágrafos visuais em português, sem concatenar `ZERO_TEXT_OCCLUSION_DIRECTIVE` ou headers de meta-regras).
     - Se `input.baseCardImageDataUrl` estiver presente **E** `editStrategy !== "RECOMPOSE_LAYOUT"`, anexa `inlineData` + `"[IMAGEM BASE DO CARD]"`.
     - Se `editStrategy === "RECOMPOSE_LAYOUT"`, **NÃO anexa** `[IMAGEM BASE DO CARD]` em `parts` (desbloqueio de pixels!), mantendo apenas `[LOGOTIPO OFICIAL]`, `[FOTO DO PRODUTO REAL]` e `[IMAGEM DE REFERÊNCIA ESTÉTICA]`.
     - Anexa `[LOGOTIPO OFICIAL]`, `[FOTO DO PRODUTO REAL]` e `[IMAGEM DE REFERÊNCIA ESTÉTICA]` (quando presentes e com Data URL válida).
2. **`buildMultimodalPromptPartsAsync(input, options)`**:
   - Retorna `(await compileAdCardPrompt(input, options)).parts`.
3. **`buildFallbackMasterPrompt(input)`** e alias `buildPromptText = buildFallbackMasterPrompt`:
   - Retorna os 4 parágrafos densos em português (incorporando proporção `4:5` ou `9:16` com margem livre de 15% no topo/base em Story, `businessName`, `offerTitle`, `promoPrice`/`originalPrice` ou aviso de peça institucional sem preço quando `promoPrice` vazio, `callToAction`, `whatsapp`, e menção às imagens anexas `[LOGOTIPO OFICIAL]`, `[FOTO DO PRODUTO REAL]`, `[IMAGEM DE REFERÊNCIA ESTÉTICA]`).
4. **`resolveRegenerationStyleInstructions`**:
   - Mantém o contrato usado por `post-payment-regeneration.service.ts` para formatar instruções de regeneração sem acumular rodadas anteriores.
5. **`isReferenceDrivenMode(input)`** e **`parseDataUrl(dataUrl)`**:
   - Utilitários puros exportados pelo módulo.

### 3.4. Integração com `ai-card-generator.service.ts` e `post-payment-regeneration.service.ts`

1. Em `src/features/promotions/server/services/ai-card-generator.service.ts`:
   - Ler o modelo de imagem dinamicamente de `serverEnv.GEMINI_IMAGE_MODEL` (mantendo `export const GEMINI_IMAGE_MODEL = serverEnv.GEMINI_IMAGE_MODEL;` para compatibilidade).
   - Chamar `compileAdCardPrompt` / `buildMultimodalPromptPartsAsync` do `@/server/prompt-engine`.
   - Limpar re-exports de constantes legadas deletadas (`SEGMENT_ART_DIRECTIVES`, `ZERO_TEXT_OCCLUSION_DIRECTIVE`, `buildSurgicalEditPromptText`, `buildAdaptiveEditPromptText`, `buildReferenceDrivenArtDirective`).
2. Em `src/features/delivery/server/services/post-payment-regeneration.service.ts`:
   - Incluir `regenerationPrompt: currentAdjustment || undefined` no `generateInput` montado em `prepareRegenerationContext`.

---

## 4. Critérios de Aceite (BDD)

- **Cenário 1: Geração de Prompt no Estágio 1 com os 4 Pilares Universais + Golden Few-Shot**
  - **Dado** um `PromptEngineInput` de criação (sem `baseCardImageDataUrl`) e um `PromptPlannerClient` configurado,
  - **Quando** `compileAdCardPrompt(input, { client })` for executado,
  - **Então** o Estágio 1 deve ser chamado usando `serverEnv.GEMINI_PROMPT_MODEL` (`"gemini-3.8-flash"`) e `UNIVERSAL_ART_DIRECTOR_SYSTEM_INSTRUCTION` (contendo os 4 Pilares Universais e o Golden Few-Shot Example),
  - **E** `result.parts[0]` enviado ao Estágio 2 deve ser exclusivamente o `masterPrompt` visual puro (sem meta-regras `--- REGRA INEGOCIÁVEL... ---` concatenadas).

- **Cenário 2: Edição Conversacional `IN_PLACE_EDIT` preserva `[IMAGEM BASE DO CARD]`**
  - **Dado** um `PromptEngineInput` contendo `baseCardImageDataUrl`, `productImageDataUrl` e `regenerationPrompt: "Mude a cor do texto principal para amarelo ouro"`,
  - **Quando** o Estágio 1 retornar `{ "editStrategy": "IN_PLACE_EDIT", "masterPrompt": "..." }`,
  - **Então** `result.editStrategy` deve ser `"IN_PLACE_EDIT"`,
  - **E** `result.parts` deve conter `[IMAGEM BASE DO CARD]` além de `[FOTO DO PRODUTO REAL]`.

- **Cenário 3: Edição Conversacional `RECOMPOSE_LAYOUT` desbloqueia pixels omitindo `[IMAGEM BASE DO CARD]`**
  - **Dado** um `PromptEngineInput` contendo `baseCardImageDataUrl`, `productImageDataUrl`, `logoImageDataUrl` e `regenerationPrompt: "Quero dividir o layout na horizontal com o produto embaixo e o texto em cima"`,
  - **Quando** o Estágio 1 retornar `{ "editStrategy": "RECOMPOSE_LAYOUT", "masterPrompt": "..." }`,
  - **Então** `result.editStrategy` deve ser `"RECOMPOSE_LAYOUT"`,
  - **E** `result.parts` **NÃO DEVE** conter `[IMAGEM BASE DO CARD]` (nem os bytes de `baseCardImageDataUrl`), mantendo apenas `masterPrompt`, `[LOGOTIPO OFICIAL]` e `[FOTO DO PRODUTO REAL]`.

- **Cenário 4: Regra Canvas vs. Layout Interno no System Instruction de Edição**
  - **Dado** o `CONVERSATIONAL_EDIT_SYSTEM_INSTRUCTION`,
  - **Quando** inspecionado nos testes unitários,
  - **Então** deve instruir explicitamente que pedidos como `"layout horizontal"` ou `"dividir na horizontal"` em cards `4:5` (Feed) ou `9:16` (Story) referem-se ao arranjo interno horizontal dos elementos dentro do canvas vertical, proibindo alterar o aspect ratio para widescreen `16:9`.

- **Cenário 5: Seleção de Modelos via `.env` (`GEMINI_PROMPT_MODEL` e `GEMINI_IMAGE_MODEL`)**
  - **Dado** `serverEnvSchema` em `src/config/server-env.ts`,
  - **Quando** `parseServerEnv({})` for chamado,
  - **Então** `GEMINI_PROMPT_MODEL` deve ser `"gemini-3.8-flash"` e `GEMINI_IMAGE_MODEL` deve ser `"gemini-nano-banana-2.1"`,
  - **E** `generateAdCardImage` em `ai-card-generator.service.ts` deve enviar a requisição do Estágio 2 para o modelo configurado em `serverEnv.GEMINI_IMAGE_MODEL`.

---

## 5. Comandos de Verificação (TDD Cirúrgico no Builder)

Execute **exclusivamente** os testes dos arquivos alterados e o typecheck estrito (proibido rodar `pnpm test` global ou `pnpm build` no builder):

```bash
pnpm vitest run src/config/server-env.test.ts src/server/prompt-engine/prompt-engine.test.ts src/features/promotions/server/services/ai-card-generator.service.test.ts src/features/delivery/server/services/post-payment-regeneration.service.test.ts
pnpm typecheck
```
