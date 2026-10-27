# Spec: Redesign Completo da Landing Page (tasteskill v2 — One Motif)

- **Slug**: `landing-page-taste-redesign`
- **Status**: `ready-for-agent`

## Problem Statement

A Landing Page atual do **OfertaPronta** (`src/routes/index.tsx` e `src/components/shared/landing-*.tsx`) apresenta os sintomas clássicos de páginas geradas por templates ("AI-made slop"): títulos centralizados genéricos precedidos por pílulas/badges de *eyebrow*, grades repetitivas de cards com ícones em caixas coloridas, divisórias finas de 1px (`<Separator />`, `border-t`, `border-y`), sombras em elementos em repouso (`shadow-sm`, `shadow-md`), barra superior com `backdrop-blur`, micro-labels em `uppercase tracking-wider` e numeração decorativa nos passos (`1`, `2`, `3`). Embora funcional e alinhada às regras de copy/CRO, sua direção de arte carece de identidade autoral associada ao universo do varejo brasileiro (o cartaz de oferta e a etiqueta de preço chanfrada de balcão).

## Solution

Refazer integralmente a composição visual da Landing Page aplicando a skill **`design-taste-frontend` (`tasteskill v2`)** e a direção artística sorteada em `.taste-skill/direction.json` (**`one-motif`**), preservando 100% das invariantes de CRO (Seção 10 do `AGENTS.md`), acessibilidade mobile-first (shadcn/ui sem tags HTML interativas cruas) e compatibilidade com a suíte de testes existente (`landing-sections.test.tsx` e `landing-footer.test.tsx`).

### A Ideia Central (`The Idea`) e o Motivo Único (`One Motif`)
> Nesta página, **a etiqueta de oferta com canto chanfrado do varejo popular brasileiro** torna-se **a forma geométrica única (`clip-path` chanfrado em 45°) que governa o palco do Hero, as máscaras dos cartazes no Showcase, os botões primários e os blocos crescentes de evolução**.

- **Paleta Mantida (`--keep palette,type`)**:
  - Ground principal: `#fff8f3` (`bg-background`)
  - Superfície em degrau de tom (sem bordas ou sombras): `#faf2ec` (`bg-card-subtle`) e `#ffffff` (`bg-card`)
  - Tinta principal (Full Ink): `#1e1b17` (`text-foreground`)
  - Tinta secundária (Soft Ink): `#68625a` (`text-muted-foreground`)
  - Acento primário (Cereja Madura): `#c62828` (`bg-primary` / `text-primary`)
  - Acento secundário (Verde Sálvia): `#4e7d63` (`bg-secondary` / `text-secondary`)

### Arquitetura das Seções (Blueprints de `.taste-skill/direction.json`)

1. **Navegação (`LandingHeader`)**:
   - Barra plana sólida em `bg-background` sem `border-b`, sem `backdrop-blur` e sem `shadow-sm` ou `animate-pulse`.
   - Wordmark `OfertaPronta` à esquerda com símbolo geométrico chanfrado plano, links de navegação planos (#segmentos, #formatos, #passos, #criar) à direita e o botão de ação `Gerar prévia grátis` apontando para `/criar`.

2. **Hero (`fragment-on-shaped-stage` + `One Live Thing` em `LandingHeroSection`)**:
   - **Layout Split Assimétrico**:
     - Colunas 1–6 (esquerda): Headline principal alinhada à esquerda, frase de apoio (máx. 40ch), CTA primário retangular/chanfrado plano (`Gerar meu card grátis em 90 segundos` -> `/criar`) e notas de confiança em linha plana (`Gere a prévia gratuitamente`, `Sem cadastro demorado`, `Pronto para Feed & Story`), além da menção contextual de segmentos (`Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local`) integrada sem formato de *eyebrow pill* acima do H1.
     - Colunas 5–12 (direita/base): Palco plano saturado (`bg-primary` `#c62828`) com o canto superior esquerdo recortado pelo motivo chanfrado (`clip-path: polygon(72px 0, 100% 0, 100% 100%, 0 100%, 0 72px)`).
   - **One Live Thing (`data-ui`)**:
     - Dentro do palco chanfrado, a 56px das bordas no desktop (16px no mobile), repousa um fragmento real e interativo do produto marcado com `data-ui="hero-live-fragment"`: o **Simulador Ao Vivo de Balcão**.
     - O visitante pode alternar instantaneamente com o polegar entre ofertas reais (ex.: *Mercado / Alcatra*, *Pizzaria / Terça em Dobro*, *Salão / Corte & Barba*, *Hamburgueria / Smash Duplo*) ou alternar o formato (*Feed 4:5* vs *Story 9:16*) e ver o card real (`SHOWCASE_SEED_CATALOG`) + etiqueta chanfrada de preço atualizarem na hora sobre o palco.

3. **Showcase de Segmentos (`showcase-object-on-a-disc` + `index-preview` em `LandingSegmentsSection`, `#segmentos`)**:
   - **Blueprint**: Em vez de 6 cartões repetitivos com ícones, a seção apresenta à esquerda a lista tipográfica interativa dos 6 ramos comerciais (`Supermercados`, `Salões & Barbearias`, `Pizzarias`, `Hamburguerias`, `Restaurantes`, `Comércio Local`) em escala display (`clamp(28px, 2.9vw, 44px)`). O item ativo aparece em tinta cheia (`text-foreground`) e os demais a 25% de opacidade (`opacity-25`).
   - **Palco Geométrico & Imagem Real**: À direita (no mobile, acima/integrado com navegação horizontal ou empilhada acessível), a forma geométrica chanfrada em cor de superfície/acento exibe a fotografia real do card correspondente do `SHOWCASE_SEED_CATALOG` (hospedado no Cloudflare R2), rompendo o topo da forma em 78% da altura com transição suave (`transition-opacity duration-300`).
   - **Preservação de DOM e SEO/Testes**: Todos os 6 títulos e suas respectivas frases de balcão (ex.: *"Dia do hortifrúti, ofertas do açougue..."*) permanecem renderizados e acessíveis no DOM para leitores de tela, mobile e suíte de testes.

4. **Formatos (`LandingFormatsSection`, `#formatos`)**:
   - **Comparativo em Escala Real**: Dois blocos planos em degrau de superfície (`bg-card-subtle`), sem `border`, sem `border-dashed` e sem `shadow-sm`.
   - Exibe lado a lado a proporção real **4:5 (`1080 × 1350 px`)** ("Post para Feed e Grupos") e **9:16 (`1080 × 1920 px`)** ("Story e Status com Espaço para Link"), ilustrando com imagem real do catálogo e marcação gráfica plana da zona segura inferior para a figurinha de link do WhatsApp.

5. **Como Funciona (`how-it-works-tiles-that-grow` em `LandingStepsSection`, `#passos`)**:
   - **Ordem pelo Tamanho (Zero `01 / 02 / 03`)**: Três blocos planos (`tiles`) alinhados pela base (`items-end`) com gap de `10px` no grid de 12 colunas que crescem progressivamente em altura e largura:
     - Estágio 1 (colunas 1–3, `min-h-[30vh]` no desktop / `min-h-[34vw]` no mobile): `"Descreva sua promoção"` — mostra o insumo bruto (briefing e foto simples de celular).
     - Estágio 2 (colunas 4–7, `min-h-[44vh]` no desktop / `min-h-[46vw]` no mobile): `"A IA monta o card na hora"` — mostra a composição gráfica em formação com luz de estúdio e etiqueta chanfrada.
     - Estágio 3 (colunas 8–12, `min-h-[60vh]` no desktop / `min-h-[62vw]` no mobile): `"Baixe em alta definição e poste"` — mostra o par finalizado Feed + Story pronto para WhatsApp e Instagram.
   - Os títulos e descrições de cada estágio ficam posicionados abaixo de cada bloco, alinhados à esquerda, sem números decorativos (`1`, `2`, `3` ou `01`, `02`, `03`).

6. **Preço (`pricing-price-as-display-figure` em `LandingPricingSection`, `#criar`)**:
   - **Um Plano, Sem Card Emoldurado**: Layout split em 12 colunas com pelo menos `80svh` de altura, centralizado verticalmente, sobre superfície plana (sem `<Card>` com borda/sombra).
   - **Colunas 1–4**: Título (`Visual de agência por uma fração do que você gasta hoje`), ancoragem comparativa contra agência (`R$ 150`) e Canva (`2 horas da sua noite`) e reversão de risco (`Risco Zero: Teste Antes de Pagar`).
   - **Colunas 6–12**: O preço `R$ 9,90` (`defaultPlan.priceParts`) composto como figura tipográfica monumental em `clamp(120px, 16vw, 220px)`, `leading-[0.85]`, `tracking-[-0.04em]`, com o símbolo `R$` na metade da escala alinhado ao topo (cap line) e `/ por campanha aprovada (Feed + Story)` na linha de base. Um selo/fragmento chanfrado sobrepõe 10–15% do canto superior direito dos numerais.
   - Abaixo dos numerais, alinhados à margem esquerda da coluna 6: as 4 linhas planas do que está incluso (sem ícones repetitivos em caixas), seguidas pelo botão retangular/chanfrado `Gerar minha prévia grátis agora` (`/criar`) e a nota de segurança.

7. **Rodapé (`footer-mark-built-from-shapes` em `LandingFooter`)**:
   - **Construção em Blocos Geométricos**: Sobre um campo de cor plano (`bg-card-subtle`), a marca `OFERTAPRONTA` fecha a página construída através de 12 blocos retangulares/chanfrados sólidos com alturas variadas (60%–100% da faixa de `22svh`–`34svh`) e frestas de `4px`, alinhados pela base.
   - 56px abaixo: grid de 12 colunas com links planos (`Termos de Uso` em `/termos`, `Política de Privacidade` em `/privacidade`) e canais de atendimento (`Suporte WhatsApp` e e-mail) + descrição institucional e faixa legal do CDC (`getCompanyLegalProfile()`), sem `border-t`, sem `<Separator />` e sem micro-labels `uppercase tracking-wider`.

## User Stories

1. Como um **microempresário visitando a Landing Page pelo celular (390px)**, eu quero entender em menos de 5 segundos o que o OfertaPronta faz e experimentar o simulador ao vivo no Hero com o polegar, para que eu veja imediatamente a qualidade dos cartazes do meu ramo antes de clicar em gerar minha prévia grátis.
2. Como um **dono de comércio local (Mercado, Salão, Pizzaria, Hamburgueria, Restaurante ou Loja)**, eu quero tocar ou apontar para o meu segmento na lista de Showcase (`#segmentos`) e ver um card publicitário real do meu ramo sobre o palco chanfrado, para ter certeza de que a IA conhece a estética do meu balcão.
3. Como um **usuário de WhatsApp e Instagram**, eu quero visualizar a diferença real de proporção entre o Feed (1080×1350) e o Story (1080×1920 com zona segura para link) na seção `#formatos`, para saber que minha promoção não ficará cortada nem com o preço tampado.
4. Como um **comerciante sem tempo para design**, eu quero compreender o fluxo de criação através de 3 blocos visuais que crescem em escala (`#passos`), sem jargões técnicos e sem poluição visual, para sentir confiança na rapidez de 90 segundos.
5. Como um **comprador consciente de custos**, eu quero ver o preço único de `R$ 9,90` apresentado com clareza monumental na seção `#criar`, ancorado contra os R$ 150 de uma agência e protegido pela garantia de que só pago após aprovar a prévia gratuita.
6. Como um **consumidor amparado pelo CDC**, eu quero encontrar facilmente no rodapé a Razão Social, CNPJ, cidade/UF, links de Termos de Uso (`/termos`), Política de Privacidade (`/privacidade`) e botão direto de Suporte WhatsApp.

## Implementation Decisions

1. **Conformidade Estrita com `lint.mjs` e `inspect.mjs` (`design-taste-frontend`)**:
   - **Zero `shadow-*`** em elementos em repouso em todos os arquivos de `src/routes/index.tsx` e `src/components/shared/landing-*.tsx`.
   - **Zero `border-t`, `border-b`, `border-y`, `<Separator />`, `divide-x/y` ou caixas delineadas de 1px** fora do fragmento `[data-ui]`. A separação entre seções é feita exclusivamente por ritmo espacial (`py-20 lg:py-36`, 120–240px no desktop) e mudança de tom de superfície (`bg-background` `#fff8f3` vs `bg-card-subtle` `#faf2ec`).
   - **Zero `backdrop-blur`** e **zero `animate-pulse` / `transition-all`** (usar apenas `transition-transform`, `transition-opacity` ou `transition-colors`).
   - **Zero eyebrows** (nenhuma pílula ou label pequeno imediatamente acima de tags `h1` ou `h2`). Os textos contextuais exigidos pelos testes (como *"Feito para Donos de Mercado..."*, *"Feito para a Rotina do Comércio"*, *"2 Formatos Prontos de Uma Vez"*, *"Simples do Início ao Fim"*, *"Risco Zero: Teste Antes de Pagar"*) devem ser posicionados **abaixo** do título principal/subtítulo como linha editorial de apoio ou nota lateral no grid, nunca como eyebrow acima de `h1`/`h2`, e sem classes `uppercase tracking-wider text-xs`.
   - **Zero numeração de índice (`01`, `02`, `03` ou `1`, `2`, `3`)** em `LandingStepsSection`.
   - **Headlines em até 2 linhas**: Ajustar `max-w` e escala fluida (`clamp(...)`) nos títulos `h1` e `h2` para evitar quebras em 3+ linhas nos viewports auditados (1440px, 768px e 390px), ou usar `<p>` com escala de statement quando apropriado, mantendo exatamente um `<h1>` na página inteira (no Hero).

2. **Piso de Imagens Reais (`SHOWCASE_SEED_CATALOG`)**:
   - O `inspect.mjs` exige pelo menos 4 imagens reais na página. A Landing Page utilizará diretamente as URLs reais do `SHOWCASE_SEED_CATALOG` (`src/features/promotions/data/showcase-catalog.ts`) no fragmento ao vivo do Hero, no Showcase de Segmentos, no comparativo de Formatos e nos 3 estágios de Como Funciona.

3. **Invariantes de CRO e Desacoplamento de Catálogo (Seção 10 do `AGENTS.md`)**:
   - `LandingHeader`, `LandingHeroSection` e `LandingStepsSection` **NÃO** podem importar `getDefaultCampaignPlan()` nem mencionar `R$ 9,90` ou `Pix`.
   - Apenas `LandingPricingSection` importa `getDefaultCampaignPlan()`.
   - Apenas `LandingFooter` importa `getCompanyLegalProfile()`.

4. **Governança de Primitivos `shadcn/ui`**:
   - Todo elemento interativo (`Button`, etc.) e tipográfico (`Typography`) continua utilizando os primitivos de `@/components/ui/` para passar 100% no linter `./.agents/scripts/check_shadcn_usage.py`.

## Testing Decisions

1. **Fronteira Pública de Testes (Unit & Integration)**:
   - `src/components/shared/landing-sections.test.tsx`: Deve continuar passando integralmente (100% green), validando todas as strings de copy, CTAs sem atrito de preço no topo de funil, ausência de jargões técnicos nos passos, ancoragem de preço e benefícios. Novos testes devem validar a interatividade do `One Live Thing` (`[data-ui]`) no Hero e a seleção de segmentos no Showcase.
   - `src/components/shared/landing-footer.test.tsx`: Deve continuar passando integralmente, validando Razão Social, CNPJ, e-mail, links `/termos` e `/privacidade` e link externo de WhatsApp.
2. **Gates Obrigatórios de Qualidade Visual e Código**:
   - `node /home/luis/.agents/skills/design-taste-frontend/scripts/lint.mjs src/routes/index.tsx src/components/shared/landing-*.tsx` -> **0 FAIL**.
   - `./.agents/scripts/verify.sh --shadcn` e `pnpm typecheck` -> **0 erros**.

## Out of Scope

- Alterações no fluxo do Wizard (`/criar`), Checkout Pix (`/checkout/$orderId`) ou Entrega (`/pedido/$orderId`).
- Alterações em schemas de banco de dados, Server Functions ou serviços de backend.
- Adição de novas bibliotecas externas de animação no `package.json`.

## Further Notes

- Direção de arte completa documentada em `.taste-skill/direction.json` (seed `1184189397`, direção `one-motif`).
