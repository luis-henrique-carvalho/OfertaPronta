# 01: Rota Raiz, Header Plano, Hero com Palco Chanfrado (`fragment-on-shaped-stage`) e Showcase Interativo (`showcase-object-on-a-disc`)

**Spec:** [`docs/specs/landing-page-taste-redesign.md`](../../specs/landing-page-taste-redesign.md)

**What to build:** Refatoração da estrutura da página inicial (`src/routes/index.tsx`), cabeçalho plano (`src/components/shared/landing-header.tsx`), Hero com palco chanfrado e simulador interativo ao vivo (`src/components/shared/landing-hero-section.tsx`) e Showcase interativo de segmentos com imagens reais do catálogo (`src/components/shared/landing-segments-section.tsx`), seguindo estritamente a direção `one-motif` do `design-taste-frontend`.

**Blocked by:** `None (can start immediately)`

**Status:** `Done`

## Acceptance Criteria (BDD)

- [x] **Given** a rota `/` (`src/routes/index.tsx`), **When** renderizada, **Then** não deve conter `<Separator />` nem divisórias de 1px; o ritmo vertical entre seções é dado exclusivamente por espaçamento generoso (`120px–240px` no desktop) e alternância de superfície (`bg-background` `#fff8f3` vs `bg-card-subtle` `#faf2ec`).
- [x] **Given** o `LandingHeader` (`src/components/shared/landing-header.tsx`), **When** renderizado em mobile ou desktop, **Then** exibe o wordmark `OfertaPronta` com ícone geométrico chanfrado à esquerda, links planos de navegação e o CTA `Gerar prévia grátis` (`href="/criar"`), sem `border-b`, sem `backdrop-blur`, sem `shadow-*` e sem `animate-pulse`.
- [x] **Given** o `LandingHeroSection` (`src/components/shared/landing-hero-section.tsx`), **When** o visitante acessa a primeira dobra, **Then** vê à esquerda (colunas 1–6) o `h1` principal, a frase de apoio, o botão único `Gerar meu card grátis em 90 segundos` (`href="/criar"`, zero menção a `R$ 9,90` ou `Pix`), os 3 selos de confiança (`Gere a prévia gratuitamente`, `Sem cadastro demorado`, `Pronto para Feed & Story`) e a nota `Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local` posicionada sem configurar *eyebrow pill* acima do `h1`.
- [x] **Given** o palco chanfrado à direita/base no `LandingHeroSection` (colunas 5–12 com `clip-path` chanfrado no canto superior esquerdo), **When** o visitante interage com o fragmento vivo (`data-ui="hero-live-fragment"`), **Then** pode alternar com o polegar/clique entre ofertas reais dos segmentos (`SHOWCASE_SEED_CATALOG`) e formatos (`Feed 4:5` vs `Story 9:16`), atualizando a imagem real do card e a etiqueta chanfrada de preço em tempo real.
- [x] **Given** o `LandingSegmentsSection` (`src/components/shared/landing-segments-section.tsx`, `#segmentos`), **When** o visitante aponta ou clica em qualquer um dos 6 ramos (`Supermercados`, `Salões & Barbearias`, `Pizzarias`, `Hamburguerias`, `Restaurantes`, `Comércio Local`), **Then** o item selecionado fica em tinta cheia (`100%`), os demais a `25%` de opacidade, e o card real correspondente do `SHOWCASE_SEED_CATALOG` é exibido sobre a forma geométrica chanfrada à direita, mantendo todos os 6 títulos e descrições de balcão presentes no DOM para acessibilidade e testes.
- [x] **Given** os arquivos alterados neste ticket, **When** auditados por `node /home/luis/.agents/skills/design-taste-frontend/scripts/lint.mjs` e `./.agents/scripts/verify.sh --shadcn`, **Then** retornam **0 FAIL** e preservam 100% dos testes correspondentes em `src/components/shared/landing-sections.test.tsx`.
