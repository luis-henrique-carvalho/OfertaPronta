# Ticket 01 — Backend Stream: Autoria Integral do Prompt Final pelo Gemini 3.8 Flash (`src/server/prompt-engine`)

- **Status:** DONE
- **Stream:** Backend & Prompt Engine
- **Blocked by:** None
- **Target Worktree:** `/home/luis/repositories/OfertaPronta/.worktrees/gemini38-master-prompt-author`

## Objetivo

Refatorar o módulo profundo `src/server/prompt-engine/` para que o `gemini-3.8-flash` assuma 100% da autoria do prompt final de Direção de Arte enviado ao `gemini-nano-banana-2.1` em todos os 7 segmentos comerciais da aplicação, eliminando a colagem contraditória de 9.000 caracteres na geração dinâmica, corrigindo o travamento espacial de pixels na regeneração `RECOMPOSE` e preservando retrocompatibilidade com a suíte de testes existente.

## Arquivos em Escopo

- `src/config/server-env.ts`
- `src/server/prompt-engine/types.ts`
- `src/server/prompt-engine/dynamic-planner.ts`
- `src/server/prompt-engine/prompt-compiler.ts`
- `src/server/prompt-engine/art-direction-blueprints.ts`
- `src/server/prompt-engine/edit-prompt-compiler.ts`
- `src/server/prompt-engine/prompt-engine.test.ts`
- `src/features/promotions/server/services/ai-card-generator.service.test.ts`

## Critérios de Aceite (BDD)

1. **Autoria Integral do Prompt Final pelo `gemini-3.8-flash`**:
   - **Dado** um `PromptEngineInput` de qualquer segmento (`burger-shop`, `pizzeria`, `restaurant`, `supermarket`, `fashion`, `beauty-salon`, `local-retail`) e um cliente `gemini-3.8-flash` ativo,
   - **Quando** `compileDynamicCardPrompt(input, { client })` ou `buildMultimodalPromptPartsAsync(input, { client })` for executado,
   - **Então** o `gemini-3.8-flash` deve ser invocado com `maxOutputTokens: 4096`, `temperature: 0.4`, `thinkingConfig: { thinkingLevel: "low" }` e timeout padrão `DEFAULT_MASTER_PROMPT_TIMEOUT_MS` (`25000` ms, respeitando `options?.timeoutMs` se informado),
   - **E** o prompt de sistema enviado ao `gemini-3.8-flash` deve instruí-lo a redigir diretamente o prompt visual completo (3 a 5 parágrafos densos em português) com:
     - Cena única tridimensional contínua (full-bleed, proibindo divisão 50/50 chapada por linha reta);
     - Detalhamento sensorial / _food & product styling_ hiper-realista adaptado ao `offerTitle` e à essência do preset selecionado (sem despejar códigos HEX de UI como fundo chapado);
     - Tipografia publicitária expressiva multi-estilo (emblema/insígnia para o nome da loja no topo, título com contraste entre fonte display condensada robusta e _lettering brush script_ / caligráfico dinâmico nas palavras-chave em cor de destaque, linha de _micro-copy_ com 3 atributos separados por `•`, e selo de CTA com acabamento de pincelada _grunge brush stroke_ / carimbo artesanal);
     - Ancoragem de preço em destaque quando `promoPrice` existir, ou proibição estrita de preços/R$ mantendo 100% do impacto promocional quando `promoPrice` for vazio;
     - Preservação do isolamento Zero-HEX no modo `isReferenceDrivenMode(input)`.
   - **E** quando o `gemini-3.8-flash` retornar o prompt narrativo completo (`authoredMasterPrompt`), `compileDynamicCardPrompt` deve retornar esse prompt autoral diretamente (acompanhado apenas de `ZERO_TEXT_OCCLUSION_DIRECTIVE` e `SAFE ZONE OBRIGATÓRIA` para Story se aplicável), sem empilhar os 8 blocos repetitivos do template estático.

2. **Retrocompatibilidade com Mocks JSON e Fallback Determinístico**:
   - **Dado** que um teste unitário existente mocke `client.models.generateContent` retornando um JSON com `subjectAnatomy` / `compositionArchetype` (ou que a chamada ao `gemini-3.8-flash` falhe/sofra timeout),
   - **Quando** `planDynamicCompositionBrief` ou `compileDynamicCardPrompt` for chamado,
   - **Então** deve continuar suportando o parse de JSON legado e o fallback determinístico gracioso sem quebrar nenhum teste existente.

3. **Destravamento Real de Pixels no Modo `RECOMPOSE` (Regeneração Pós-Compra)**:
   - **Dado** um pedido de ajuste pós-compra classificado como `RECOMPOSE` (ex.: _"Dar mais destaque para a foto do produto no centro"_),
   - **Quando** `buildMultimodalPromptPartsAsync` ou `buildMultimodalPromptParts` montar as partes multimodais,
   - **Então** quando não houver `productImageDataUrl` ou quando o modo for `RECOMPOSE` para reestruturar/centralizar o layout, NÃO deve anexar `baseCardImageDataUrl` como `inlineData` que trave os pixels na divisão lateral anterior (preservando `logoImageDataUrl`, `productImageDataUrl` e `referenceImageDataUrl` originais se existirem), permitindo que o `gemini-nano-banana-2.1` gere a nova composição centralizada livremente.
   - **E** em modo `SURGICAL`, `baseCardImageDataUrl` DEVE continuar sendo anexado normalmente para preservação estrita.

4. **Ativação por Padrão no `serverEnv`**:
   - `GEMINI_DYNAMIC_PLANNER_ENABLED` em `src/config/server-env.ts` deve ter `.default(true)`.

## Comandos de Verificação TDD Cirúrgico (No Builder)

```bash
pnpm vitest run src/server/prompt-engine/prompt-engine.test.ts src/features/promotions/server/services/ai-card-generator.service.test.ts src/config/server-env.test.ts
pnpm typecheck
```
