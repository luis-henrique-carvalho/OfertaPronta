# 02: Prompting Multimodal Gemini com Logotipo, Objetivos e Preço Opcional

**Spec:** [`docs/specs/epico-6-redesign-criacao-micro-passos.md`](../../specs/epico-6-redesign-criacao-micro-passos.md)

**What to build:**
Evolução do módulo profundo `AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`) para suportar a injeção multimodal do logotipo da loja, diretrizes específicas para cada um dos 6 objetivos de anúncio (`cardIntent`) e controle estrito sobre a ausência de preço em cards institucionais e de avisos.

**Blocked by:** `01: Schemas de Banco, Zod e Snapshot Congelado com Preço Condicional`

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Interface Pública Atualizada**:
  - `GenerateAdCardInput` recebe `logoImageDataUrl?: string | null`, `cardIntent?: CardIntent | null`, e `customIntentText?: string | null`.
- [x] **Logotipo Multimodal**:
  - Quando `logoImageDataUrl` for fornecido, a imagem em base64 é incluída em `parts` como `InlineDataPart`.
  - O prompt de texto instrui o modelo a posicionar o logotipo no topo, canto superior ou rodapé mantendo a fidelidade, integridade e legibilidade da marca sem distorções.
- [x] **Diretriz de Objetivo do Anúncio (`cardIntent`)**:
  - Para `promo`: foca em apelo promocional e alto contraste no preço.
  - Para `new-arrival`: foca em apresentação sofisticada de nova coleção ou lançamento ("Novidade!", "Chegou!").
  - Para `special-date`: foca em ambientação temática da data comemorativa anunciada.
  - Para `announcement`: foca em impacto de inauguração/evento e destaque da data/horário.
  - Para `schedule`: foca em legibilidade do comunicado de horário de atendimento/feriado.
  - Para `custom`: injeta o `customIntentText` fornecido pelo comerciante como foco da peça.
- [x] **Tratamento de Ausência de Preço**:
  - Se `promoPrice` for vazio ou indefinido, o prompt instrui expressamente: _"ESTE É UM CARD INSTITUCIONAL / INFORMATIVO: Não exiba nenhum preço ou valor monetário na arte gráfica. É expressamente proibido inserir 'R$ 0,00' ou valores inventados."_
  - Não renderiza valores nulos ou artificiais como "R$ 0,00".
- [x] **Segmento Moda & Roupas (`fashion`)**:
  - Mapeamento em `SEGMENT_ART_DIRECTIVES` para `fashion` com visual de boutique, vitrine elegante e iluminação suave de estúdio de moda.
- [x] **Suíte de Testes Automatizados**:
  - Testes unitários em `ai-card-generator.service.test.ts` cobrindo chamadas com logo, diferentes intents e geração sem preço.
