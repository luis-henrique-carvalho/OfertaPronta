# Spec: Motor de Prompt Dinâmico Híbrido e Centralização de Prompts (`PromptEngine`)

- **Slug**: `hybrid-dynamic-prompt-engine`
- **Status**: `ready-for-agent`

## Problem Statement

O microempresário (`Merchant`) que utiliza o OfertaPronta enfrenta hoje três problemas críticos na qualidade visual dos Cards Publicitários (`Ad Cards`) gerados e na capacidade de ajustá-los após o pagamento:

1. **Lógica de Prompts Espalhada e Difícil de Calibrar**:
   - As regras de engenharia de prompt, templates de camadas, heurísticas de direção de arte e instruções de edição estão fragmentadas em três locais distintos da codebase: [`src/features/promotions/server/services/ai-card-generator.service.ts`](../../src/features/promotions/server/services/ai-card-generator.service.ts), [`src/features/promotions/data/style-presets-catalog.ts`](../../src/features/promotions/data/style-presets-catalog.ts) e [`src/features/delivery/server/services/post-payment-regeneration.service.ts`](../../src/features/delivery/server/services/post-payment-regeneration.service.ts).
   - Essa dispersão dificulta a evolução contínua dos prompts e mistura orquestração de API/binários com regras de direção de arte.

2. **Cards Truncados, Repetitivos e Oclusão de Texto atrás de Personagens (`Text-Behind-Subject Bug`)**:
   - O compilador estático atual gera blocos extensos (~500 palavras) que repetem até 4 vezes os mesmos metadados do `Offer Brief`, forçam sempre a mesma geometria rígida ("cabeçalho no topo + sujeito central ocupando 55% + selo + rodapé") e injetam `SEGMENT_ART_DIRECTIVES` fixas que colidem com a paleta do `StylePreset` escolhido.
   - Quando o comerciante envia uma foto de personagem/modelo humano ou produto vertical (ex.: foto de pessoa na inauguração de loja de moda/salão) combinada com um título longo (ex.: `"INAUGURAÇÃO LOJA ALAGOINHAS"`), o template estático não adapta o layout à anatomia da imagem e não impõe prioridade absoluta de camada frontal (`z-index`) para a tipografia. Como resultado, a cabeça ou o corpo do personagem fica na frente do texto principal, encobrindo letras e tornando o título ilegível.

3. **Edição Pós-Pagamento Travada (`Surgical Lock Bug`)**:
   - Na regeneração pós-pagamento (`buildSurgicalEditPromptText`), o prompt ordena incondicionalmente: _"Mantenha 100% da estrutura, faixas e posições da IMAGEM BASE rigorosamente inalterados"_.
   - Quando o comerciante pede explicitamente uma correção espacial (ex.: _"não coloque o texto atrás do personagem"_, _"mude o texto de lugar"_) ou seleciona outro `StylePreset` no painel de regeneração, a IA obedece à trava de congelamento de posições da imagem base e ignora a solicitação do usuário.

## Solution

Extrair e centralizar 100% da inteligência de prompts em um **Módulo Profundo desacoplado (`src/server/prompt-engine/`)** que opera como um **Motor de Prompt Dinâmico Híbrido em 2 Etapas**, aliado a um **Classificador Adaptativo de Edição Pós-Compra**:

1. **Centralização Completa em `src/server/prompt-engine/`**:
   - Todos os templates de geração inicial, direção de arte por segmento/preset, modo orientado à imagem de referência (`Reference-Driven`), regras de proporção (`Feed 4:5` e `Story 9:16`), montagem de partes multimodais e instruções de edição/regeneração passam a viver exclusivamente em `src/server/prompt-engine/`.
   - [`ai-card-generator.service.ts`](../../src/features/promotions/server/services/ai-card-generator.service.ts) e [`post-payment-regeneration.service.ts`](../../src/features/delivery/server/services/post-payment-regeneration.service.ts) delegam toda a construção de prompts ao novo módulo, mantendo apenas suas responsabilidades de orquestração e persistência.

2. **Motor de Prompt Dinâmico Híbrido (Etapa 1: IA Diretora de Arte + Etapa 2: Guardrails Determinísticos + Fallback)**:
   - **Etapa 1 — Planejamento Visual Dinâmico (`DynamicArtDirector`)**: Uma etapa leve de geração de texto/visão com IA (usando o modelo canônico `gemini-3.8-flash`, `DEFAULT_GEMINI_PROMPT_MODEL = "gemini-3.8-flash"`, configurável via `GEMINI_PROMPT_MODEL`) analisa os dados do `Offer Brief`, o `StylePreset` selecionado e as imagens enviadas (`Product Image` / `Reference Image`). Ela identifica o formato real do sujeito (ex.: pessoa/personagem vertical, produto isolado, prato horizontal ou card sem foto) e o comprimento do título, desenhando um plano de composição sob medida (definindo assimetria, enquadramento do sujeito e zonas de respiro limpas para o texto).
   - **Etapa 2 — Compilação com Guardrails Inegociáveis (`PromptCompiler`)**: Funde o plano criativo dinâmico da Etapa 1 com regras determinísticas estritas:
     - **Invariante de Zero Oclusão Tipográfica (`Zero Text Occlusion`)**: Regra explícita determinando que todos os textos (título, nome do produto/evento, preço e CTA) DEVEM estar sempre em **1º plano absoluto (`foreground layer / top z-index`)** ou posicionados em zonas negativas 100% livres, sendo terminantemente proibido posicionar letras atrás de cabeças, rostos, corpos de personagens ou produtos (`NO text-behind-person / NO occluded typography`).
     - **Concisão e Eliminação de Conflitos**: Remoção das repetições quadruplicadas de dados e eliminação do conflito entre `SEGMENT_ART_DIRECTIVES` e a paleta HEX do preset/referência.
     - **Fidelidade Ortográfica PT-BR, Safe Zone Story (15%) e Proteção Institucional**: Manutenção integral da grafia exata dos textos do briefing e proibição de `"R$ 0,00"` quando não houver preço promocional.
   - **Fallback Determinístico Transparente**: Caso a Etapa 1 exceda o timeout (~4.5s), sofra erro de rede ou o client injetado não retorne texto (como nos fakes de teste de imagem), o motor cai instantaneamente para o compilador determinístico aprimorado (já enxuto e com proteção anti-oclusão de personagem), sem bloquear nem atrasar a geração do Card Publicitário.

3. **Edição Pós-Pagamento Adaptativa por Intenção (`SURGICAL` vs. `RECOMPOSE`)**:
   - Na edição/regeneração (`baseCardImageDataUrl` presente), o `PromptEngine` classifica a intenção do ajuste:
     - **Modo `RECOMPOSE` (Reposicionamento Espacial / Mudança de Layout ou Estilo)**: Ativado automaticamente quando `customStyleInstructions` contém verbos/termos espaciais ou estruturais (ex.: _"atrás"_, _"frente"_, _"personagem"_, _"escondido"_, _"cobrindo"_, _"cortado"_, _"posição"_, _"mover"_, _"cima"_, _"baixo"_, _"lado"_, _"layout"_, _"fundo"_, _"trocar estilo"_) ou quando o usuário altera o `stylePresetId` na regeneração. Neste modo, a trava de congelamento estrutural da imagem base é removida, instruindo a IA a **reorganizar livremente a posição dos textos e elementos** para atender ao pedido do comerciante (garantindo texto 100% visível em 1º plano) enquanto preserva a identidade do produto/personagem e a ortografia dos dados.
     - **Modo `SURGICAL` (Ajuste Fino)**: Ativado para pequenos ajustes pontuais (ex.: corrigir cor de detalhe ou brilho) mantendo a composição base, porém sempre subordinado à prioridade máxima da instrução do usuário e à regra de zero oclusão de texto.

## User Stories

1. Como um **Microempresário (`Merchant`)**, quero que a IA planeje dinamicamente a composição do meu Card Publicitário com base no meu briefing, estilo e foto enviada, para que os cards não fiquem todos engessados na mesma estrutura repetitiva.
2. Como um **Microempresário (`Merchant`)** que envia uma foto contendo uma pessoa/personagem ou produto vertical junto com um título longo (ex.: `"INAUGURAÇÃO LOJA ALAGOINHAS"`), quero que o texto principal nunca fique escondido atrás do personagem ou cortado, garantindo 100% de legibilidade imediata no Feed e no Story.
3. Como um **Microempresário (`Merchant`)** na tela de entrega pós-pagamento (`/pedido/$orderId`), quero pedir ajustes de posição ou layout (ex.: _"não coloque o texto atrás do personagem"_, _"coloque o título mais para baixo"_) e ver a IA realmente reposicionar os elementos sem ficar travada na estrutura defeituosa da imagem anterior.
4. Como um **Microempresário (`Merchant`)** na tela de entrega pós-pagamento (`/pedido/$orderId`), quero trocar o Estilo Visual (`StylePreset`) em uma das minhas 3 regenerações e receber um card com a nova direção de arte e paleta aplicadas de verdade, sem que o prompt de edição force a manutenção das cores e faixas antigas.
5. Como um **Microempresário (`Merchant`)**, quero que a geração do meu card continue rápida e confiável mesmo se a etapa de planejamento dinâmico de prompt oscilar, através de um fallback automático transparente que entrega o card dentro do SLA esperado.
6. Como um **Desenvolvedor / Engenheiro de Prompt do OfertaPronta**, quero que 100% dos templates, blueprints de direção de arte, regras de anti-oclusão e instruções de edição estejam centralizados em `src/server/prompt-engine/`, para que eu possa calibrar e testar a qualidade dos prompts em um único lugar sem caçar strings espalhadas pela codebase.

## Implementation Decisions

1. **Novo Módulo Profundo Centralizado (`src/server/prompt-engine/`)**:
   - Estrutura interna coesa e desacoplada:
     - `src/server/prompt-engine/index.ts`: Fachada pública única exportando contratos e funções do motor de prompt.
     - `src/server/prompt-engine/types.ts`: Tipos de entrada/saída (`PromptEngineInput`, `CompiledPromptPlan`, `DynamicCompositionBrief`, `EditIntentMode`, `PromptPlannerClient`).
     - `src/server/prompt-engine/art-direction-blueprints.ts`: Blueprints ópticos, espaciais e cromáticos por `LayoutVariant`, `BusinessSegment` e `CardIntent`, além da resolução de `StylePreset` e modo `Reference-Driven`.
     - `src/server/prompt-engine/dynamic-planner.ts`: Etapa 1 do pipeline híbrido — invoca o modelo de linguagem/visão leve para sintetizar um `DynamicCompositionBrief` conciso adaptado ao sujeito da foto e extensão dos textos, com timeout controlado e fallback seguro.
     - `src/server/prompt-engine/prompt-compiler.ts`: Etapa 2 do pipeline híbrido — compila o prompt final enxuto e estruturado para geração inicial (`compileInitialCardPrompt`) combinando o `DynamicCompositionBrief` (ou fallback determinístico) com os guardrails de Zero Oclusão Tipográfica (`FOREGROUND TEXT PRIORITY`), ortografia PT-BR, Safe Zone Story 15% e montagem das partes multimodais (`buildMultimodalPromptParts`).
     - `src/server/prompt-engine/edit-prompt-compiler.ts`: Classificador de intenção de edição (`detectEditIntentMode`: `'SURGICAL' | 'RECOMPOSE'`) e compilador de instruções de edição/regeneração (`buildAdaptiveEditPromptText` e `resolveRegenerationStyleInstructions`).

2. **Invariante de Anti-Oclusão Tipográfica (`Zero Text Occlusion`)**:
   - Tanto no planejador dinâmico quanto no compilador determinístico e de edição, deve constar diretriz imperativa:
     - **Prioridade de Camada (`Z-Index / Layering`)**: Todo texto, título, headline, badge e preço DEVE ser renderizado na camada frontal superior (`100% foreground layer, NEVER behind subject/person/character`).
     - **Adaptação Espacial ao Sujeito**: Quando houver foto de pessoa/personagem ou produto vertical alto, posicionar o bloco tipográfico em área de respiro desobstruída (ou em faixa/container de alto contraste no topo/base em 1º plano), proibindo efeito _magazine depth_ que esconda letras atrás da cabeça ou corpo do sujeito.

3. **Classificador de Intenção de Edição (`SURGICAL` vs. `RECOMPOSE`)**:
   - `detectEditIntentMode({ customStyleInstructions, presetChanged, hasReferenceOverride })`:
     - Retorna `'RECOMPOSE'` sempre que `presetChanged === true`, `hasReferenceOverride === true` ou quando `customStyleInstructions` contiver indicadores de mudança espacial, estrutural, desobstrução de texto ou troca de estilo/fundo (ex.: regex case-insensitive cobrindo `atrás|atras|frente|personagem|escondid|cobrind|cobert|cortad|sobrepon|sobrepos|posiç|posic|mover|mova|mude o lugar|mudar de lugar|baixo|cima|topo|rodapé|rodape|lado|esquerda|direita|layout|estrutura|estilo|fundo|cenário|cenario|reorganizar|afastar|separar|visível|visivel|legível|legivel`).
     - Retorna `'SURGICAL'` quando o pedido for apenas ajuste fino de texto, preço ou detalhe cromático sem solicitação de mudança posicional/estrutural.
   - No modo `'RECOMPOSE'`, o prompt de edição **não** inclui a frase _"Mantenha 100% da estrutura, faixas e posições da IMAGEM BASE rigorosamente inalterados"_; em vez disso, instrui a IA a **descartar o posicionamento problemático da imagem base**, corrigir imediatamente a sobreposição/layout solicitado pelo comerciante e colocar todos os textos em 1º plano 100% legível.

4. **Integração Limpa e Retrocompatibilidade**:
   - `src/features/promotions/server/services/ai-card-generator.service.ts` delega `buildPromptText`, `buildSurgicalEditPromptText`, `buildMultimodalPromptParts` e `isReferenceDrivenMode` para `src/server/prompt-engine/` (re-exportando-os para não quebrar testes ou chamadores existentes).
   - `generateAdCardImage` invoca o `PromptEngine` (executando a Etapa 1 dinâmica quando aplicável + Etapa 2 de compilação) antes de disparar a geração da imagem no modelo `gemini-nano-banana-2.1` (`GEMINI_IMAGE_MODEL`).
   - `src/features/delivery/server/services/post-payment-regeneration.service.ts` utiliza `resolveRegenerationStyleInstructions` do `PromptEngine`, informando se o comerciante trocou o `stylePresetId` em relação ao snapshot original do pedido para acionar automaticamente o modo `'RECOMPOSE'`.
   - `src/features/promotions/data/style-presets-catalog.ts` mantém `resolveArtDirectionDirective` sincronizada com os blueprints centralizados sem vazamento de código server-only para o bundle client.

5. **Zero Impacto em Banco de Dados e Contratos HTTP/RPC**:
   - Nenhuma alteração em schemas Drizzle (`src/server/db/schema/`) nem necessidade de migrações SQL.
   - As assinaturas das Server Functions (`generatePreviewPairFn`, `regenerateOrderCardsFn`) e rotas permanecem 100% inalteradas.

## Testing Decisions

- **A Interface Pública é a Superfície de Teste**:
  1. **Suíte Dedicada do Módulo Profundo (`src/server/prompt-engine/prompt-engine.test.ts`)**:
     - Testar a compilação inicial híbrida (com fake client retornando plano dinâmico da Etapa 1) e verificar que o plano criativo é incorporado ao prompt final sem perder os guardrails obrigatórios (textos em PT-BR, preço ou proibição de `"R$ 0,00"`, Safe Zone 15% para Story).
     - Testar o fallback determinístico automático quando a Etapa 1 lança erro, expira timeout ou não retorna texto.
     - Testar a presença explícita das diretrizes de **Zero Oclusão Tipográfica** (proibição de texto atrás do personagem/produto e exigência de 1º plano absoluto para textos).
     - Testar `detectEditIntentMode` e `buildAdaptiveEditPromptText`:
       - Pedidos como _"não colocar o texto atrás do personagem"_, _"mover o título para baixo"_ ou troca de `stylePresetId` devem ativar `'RECOMPOSE'`, removendo a trava de posição fixa e exigindo reposicionamento desobstruído.
       - Pedidos simples como _"corrigir o preço para R$ 19,90"_ devem ativar `'SURGICAL'`, preservando a estrutura com prioridade para a alteração solicitada.
  2. **Suítes de Integração dos Serviços Consumidores**:
     - `src/features/promotions/server/services/ai-card-generator.service.test.ts`: Validar que `generateAdCardImage` funciona ponta a ponta tanto com o planejador dinâmico quanto em fallback, preservando o contrato `imageConfig: { aspectRatio, imageSize: "1K" }` e a montagem multimodal.
     - `src/features/delivery/server/services/post-payment-regeneration.service.test.ts`: Validar que a regeneração pós-pagamento propaga mudanças de preset e instruções espaciais destravadas para o gerador de imagem.

## Out of Scope

- Mudança no fluxo visual do Wizard de Criação (`/criar`) ou no layout da página de Entrega (`/pedido/$orderId`).
- Alteração no modelo de precificação (R$ 9,90) ou no limite de cotas de IA (1 geração gratuita com marca d'água na prévia + até 3 regenerações pós-pagamento Pix).
- Criação de novas tabelas ou colunas no PostgreSQL.

## Further Notes

- Respeita estritamente os invariantes de **Deep Modules** e **Isolamento Client/Server** definidos em `AGENTS.md`.
- Se algum módulo isomórfico do catálogo (`style-presets-catalog.ts`) precisar compartilhar constantes puras de direção de arte sem importar dependências Node.js/SDK, os blueprints puros de texto podem ser importados com segurança sem introduzir vazamento de segredos ou pacotes server-only no cliente.
