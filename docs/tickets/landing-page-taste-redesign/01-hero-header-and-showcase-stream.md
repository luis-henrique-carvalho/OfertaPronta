# Ticket 01: Stream 1 — Root Typography, Theme Tokens, Header, Hero & Showcase Chapters (Zero Card Images)

- **Status**: Done
- **Blocked by**: None
- **Stream**: Frontend Stream 01
- **Files Owned**:
  - `src/routes/__root.tsx`
  - `src/styles/index.css`
  - `src/routes/index.tsx`
  - `src/components/shared/landing-header.tsx`
  - `src/components/shared/landing-hero-section.tsx`
  - `src/components/shared/landing-segments-section.tsx`

## Objetivo
Implementar a tipografia `Epilogue`, a paleta `report-blocks`, a camada de motion `.taste-enter` e os Capítulos 1 (`LandingHeader` + `LandingHeroSection`) e 2 (`LandingSegmentsSection`) seguindo `docs/plans/landing-page-taste-redesign.md` **sem utilizar nenhuma imagem de card criado (`<img>`)**.

## Critérios de Aceite (BDD)
1. **Fonte `Epilogue` e Tokens `report-blocks`**:
   - `src/routes/__root.tsx` carrega `Epilogue:wght@400;500;700;800;900` do Google Fonts.
   - `src/styles/index.css` define `--font-sans: "Epilogue", sans-serif`, cores sólidas de alto contraste (`--background: #ffffff`, `--foreground: #000000`, `--card-subtle: #f6f6f6`, `--primary: #fe7141`, `--primary-foreground: #000000`) e `@keyframes taste-rise` com `.taste-enter` e `.taste-delay-1..4` dentro de `@media (prefers-reduced-motion: no-preference)`.
2. **Simetria de Margens (`[off-centre]` = 0)**:
   - `LandingHeader`, `LandingHeroSection` e `LandingSegmentsSection` usam exatamente o mesmo wrapper interno `mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12`.
3. **Hero (`LandingHeroSection`) Sem `<img>` e Com `<h1>` de 2 Linhas**:
   - `<h1>` curto (`"Cartazes prontos em 90 segundos."`) em `clamp(36px, 5vw, 72px)` (`<= 2 linhas` em 1440px, 768px e 390px).
   - Statement `<Typography as="p">` imediatamente abaixo com `"Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência."` (`text-[20px] sm:text-[26px] lg:text-[30px] font-bold leading-[1.15]`).
   - Texto `"Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local"` posicionado **abaixo** do parágrafo de apoio (NUNCA acima do `<h1>` para não disparar `[eyebrow]`).
   - Simulador Interativo (`data-ui="hero-live-fragment"`, `data-testid="hero-live-fragment"`) renderiza um **Pôster Tipográfico Ao Vivo 100% em HTML/CSS/SVG (`data-testid="hero-live-canvas"`)** sem nenhuma tag `<img>`, alternando entre `Açougue`, `Pizzaria`, `Barbearia` e `Hamburgueria` e trocando a classe `aspect-[4/5]` / `aspect-[9/16]` nos botões `hero-live-format-feed` e `hero-live-format-story`.
4. **Segmentos (`LandingSegmentsSection`) em Capítulo Verde Sálvia (`#d1ddd3`) Sem `<img>`**:
   - Fundo full-bleed `bg-[#d1ddd3] text-[#000000]`.
   - `<h2>` `"Pronto para o ritmo do seu balcão"` (`<= 2 linhas` em todas as larguras).
   - Tag `"Feito para a Rotina do Comércio"` posicionada abaixo do parágrafo descritivo (nunca acima do `<h2>`).
   - Os 6 segmentos e suas descrições de balcão permanecem visíveis no DOM (`>= 14px`, zero `text-xs`) e clicá-los atualiza o **Painel de Anatomia do Cartaz (`data-ui="segment-specimen"`)** com tipografia, cores e ilustração vetorial SVG de 3 camadas do ramo escolhido (zero `<img>`).
