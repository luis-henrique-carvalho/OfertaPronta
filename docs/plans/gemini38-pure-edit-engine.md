# Plano Técnico: Autoria Pura de Edição pelo Gemini 3.8 Flash & Preservação Multimodal da Imagem Base

## Contexto & Diagnóstico

1. No fluxo pós-compra de regeneração de cards (`PostPaymentRegenerationService`), o `edit-prompt-compiler.ts` ainda mantinha templates legados de texto hardcoded (`buildSurgicalPromptTemplate` e `buildRecomposePromptTemplate`) e regex rígida (`RECOMPOSE_INTENT_REGEX`).
2. O timeout de edição no `dynamic-planner.ts` estava configurado em apenas 8 segundos (`DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS = 8000`), fazendo com que qualquer chamada de edição ao `gemini-3.8-flash` sofresse timeout prematuro e caísse no fallback estático.
3. Ao cair no fallback em modo `RECOMPOSE`, a função `buildBaseCardMultimodalParts` possuía uma trava `if (!isRecompose && input.baseCardImageDataUrl)` que **suprimia a imagem base**, enviando 0 imagens para o modelo `gemini-nano-banana-2.1`. Isso fazia com que a IA recriasse um produto, modelo e layout 100% diferentes do zero.

## Decisões Técnicas

1. **Autoria Soberana de Edição pelo Gemini 3.8 Flash**:
   - `gemini-3.8-flash` atua como Diretor de Arte na edição, recebendo a imagem base do card aprovado e o pedido em linguagem natural do usuário.
   - Ele redige o Master Prompt final de ajuste em português, instruindo a preservação absoluta do produto e sujeito da imagem base.
2. **Preservação Multimodal da Imagem Base em Qualquer Modo**:
   - `baseCardImageDataUrl` DEVE ser sempre anexado como parte multimodal para o gerador de imagem, tanto em ajustes pontuais quanto em reposicionamentos de layout (`centro`, `foco`, etc.).
3. **Elevação de Timeout de Edição**:
   - `DEFAULT_DYNAMIC_PLANNER_TIMEOUT_MS` atualizado para 25.000ms (`DEFAULT_MASTER_PROMPT_TIMEOUT_MS`).
4. **Remoção de Bloat em `edit-prompt-compiler.ts`**:
   - Eliminar os templates fixos hardcoded, mantendo uma função concisa de fallback direto e o helper `resolveRegenerationStyleInstructions`.
