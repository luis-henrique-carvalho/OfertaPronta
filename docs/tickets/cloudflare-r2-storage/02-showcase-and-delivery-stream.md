# 02: Showcase & Delivery Stream — Showcase Service, Vitrine de Exemplos no Passo 4 e Compatibilidade de UI

**Spec:** [`docs/specs/cloudflare-r2-storage.md`](../../specs/cloudflare-r2-storage.md)

**What to build:**
Construir o serviço de vitrine de cards publicitários (`ShowcaseService`), o catálogo resiliente de semente com exemplos curados para todos os segmentos comerciais (`SHOWCASE_SEED_CATALOG`), a Server Function tipada de consulta de vitrine, o componente acessível de exibição da vitrine no Passo 4 (`ShowcaseGalleryDialog` em `Step4StyleAndPalette`) com aplicação de estilo em 1 toque, e assegurar compatibilidade visual completa nas interfaces de prévia, checkout e entrega para URLs de CDN Cloudflare R2 e Base64 legados.

**Blocked by:** [`docs/tickets/cloudflare-r2-storage/01-backend-storage-stream.md`](01-backend-storage-stream.md)

**Status:** `ready-for-agent`

---

## Acceptance Criteria (BDD)

### 1. Catálogo de Semente & Showcase Service

- [ ] **Dado** a inicialização da aplicação ou consultas no ambiente de testes, **quando** o banco não contiver registros na tabela `showcase_cards`, **então** o `ShowcaseService` deve recorrer deterministicamente ao catálogo estático `src/features/promotions/data/showcase-catalog.ts`, retornando exemplos curados para o segmento consultado sem falhar ou retornar lista vazia.
- [ ] **Dado** uma chamada à Server Function `getShowcaseCards({ data: { segment, stylePresetId } })`, **quando** validada pelo Zod, **então** deve retornar uma lista ordenada de cards de vitrine com `id`, `businessSegment`, `stylePresetId`, `cardIntent`, `title`, `imageUrl`, `aspectRatio` e `metadata` anonimizados.
- [ ] **Dado** os requisitos de privacidade e LGPD, **quando** cards forem servidos pela vitrine, **então** nenhum dado sensível de cliente real (telefones, logotipos proprietários ou briefings privados de pedidos) deve ser exposto publicamente sem anonimização prévia.

### 2. Experiência de Vitrine no Passo 4 (`Step4StyleAndPalette`)

- [ ] **Dado** um microempresário no Passo 4 do assistente de criação (`/criar`), **quando** a tela carregar, **então** deve ser exibido um botão/gatilho acessível _"Ver Exemplos Reais Criados por IA"_ com badge visual destacado, sem poluir ou atrasar o grid principal de estilos rápidos.
- [ ] **Dado** o acionamento do botão da vitrine, **quando** o modal `ShowcaseGalleryDialog` abrir, **então** deve renderizar a galeria de cards publicitários reais filtrados pelo segmento comercial ativo (ex.: Supermercado, Salão/Beleza, Pizzaria, Hamburgueria, Restaurante, Varejo).
- [ ] **Dado** a navegação no modal da vitrine, **quando** o comerciante tocar no botão _"Usar este Estilo"_ de um card de exemplo, **então** o formulário deve atualizar o `stylePresetId` ativo, fechar o modal e destacar visualmente o estilo correspondente no grid com feedback tátil/visual imediato.
- [ ] **Dado** um usuário navegando via teclado ou tecnologia assistiva, **quando** interagir com o modal da vitrine, **então** o foco deve ser retido adequadamente, permitindo fechamento com `Escape` e garantindo conformidade com os primitivos shadcn/ui (Radix UI) e tap targets mínimos de 44px.

### 3. Compatibilidade Visual e Ergonomia Mobile

- [ ] **Dado** um Card Publicitário cuja imagem venha do Cloudflare R2 (URL HTTPS pública de CDN) ou de um registro legado (Data URL Base64), **quando** renderizado no `AdCardCheckoutShowcase`, no visualizador de prévia ou na tela de entrega (`OrderDeliveryView`), **então** a imagem deve ser exibida perfeitamente mantendo a proporção correta (4:5 Feed ou 9:16 Story) sem estouro horizontal ou erros de hidratação.
- [ ] **Dado** a verificação de conformidade visual do projeto, **quando** executado `./.agents/scripts/verify.sh --shadcn`, **então** zero violações de elementos HTML nativos desestilizados ou tipografia incorreta devem ser encontradas.

### 4. Qualidade e Testes de Integração

- [ ] **Dado** a suíte de testes de UI e funções de vitrine, **quando** executado `pnpm vitest run src/features/promotions/server/services/showcase.service.test.ts` e `pnpm vitest run src/features/promotions/components/wizard/step4-style-and-palette.test.tsx`, **então** todos os cenários BDD devem passar em menos de 2 segundos.
- [ ] **Dado** a checagem de tipos estrita do TypeScript, **quando** executado `pnpm typecheck`, **então** o projeto deve compilar com zero erros.
