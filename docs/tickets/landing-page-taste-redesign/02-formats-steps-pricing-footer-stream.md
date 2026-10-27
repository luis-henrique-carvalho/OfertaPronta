# Ticket 02: Stream 2 — Formats, Steps, Pricing & Footer Chapters + Tests (Zero Card Images)

- **Status**: Done
- **Blocked by**: None
- **Stream**: Frontend Stream 02
- **Files Owned**:
  - `src/components/shared/landing-formats-section.tsx`
  - `src/components/shared/landing-steps-section.tsx`
  - `src/components/shared/landing-pricing-section.tsx`
  - `src/components/shared/landing-footer.tsx`
  - `src/components/shared/landing-sections.test.tsx`

## Objetivo
Implementar os Capítulos 3 (`LandingFormatsSection` em `#f0ff1c`), 4 (`LandingStepsSection` em `#f6f6f6` com 3 blocos coloridos e fragmentos `data-ui`), 5 (`LandingPricingSection` em `#fe7141`) e 6 (`LandingFooter` em `#000000`), além de atualizar `landing-sections.test.tsx` para validar a ausência total de imagens de cards criados (`<img>`).

## Critérios de Aceite (BDD)
1. **Capítulo 3 — Formatos (`LandingFormatsSection`) em Amarelo Ácido (`#f0ff1c`) Sem `<img>`**:
   - Fundo full-bleed `bg-[#f0ff1c] text-[#000000] py-16 lg:py-24` e wrapper `mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12`.
   - `<h2>` curto (`"Dois formatos prontos juntos."`) em `<= 2 linhas` + Statement `<Typography as="p">` `"Uma única criação entrega o post do Feed e a tela cheia do Story"` (`<= 28px`) + Tag `"2 Formatos Prontos de Uma Vez"` abaixo do parágrafo.
   - Dois diagramas arquiteturais ricos em HTML/CSS/SVG (`data-ui="format-feed-blueprint"` e `data-ui="format-story-blueprint"`, cada um com `min-h-[320px]`) demonstrando a anatomia real do post `1080 × 1350 px (4:5)` e do Story `1080 × 1920 px (9:16)` com a zona livre inferior da figurinha de link do WhatsApp, **sem usar nenhuma tag `<img>`**.
2. **Capítulo 4 — Como Funciona (`LandingStepsSection`) com 3 Fragmentos `data-ui`**:
   - Fundo full-bleed `bg-[#f6f6f6] text-[#000000] py-16 lg:py-24` e wrapper `mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12`.
   - `<h2>` curto (`"Três passos direto no celular."`) + Statement `<Typography as="p">` `"Da sua ideia para o WhatsApp dos clientes em 3 passos"` (`<= 28px`) + Tag `"Simples do Início ao Fim"` abaixo do parágrafo.
   - 3 colunas em blocos planos (`bg-[#d1ddd3]`, `bg-[#f0ff1c]`, `bg-[#fe7141]`), cada uma com um fragmento `data-ui` (`min-h-[210px]`) ilustrando a interface de cada etapa (1. Briefing rápido, 2. Composição IA em 90s, 3. Download Feed + Story), zero números `01/02/03` e zero jargões técnicos.
3. **Capítulo 5 — Preço (`LandingPricingSection`) em Laranja Pôster (`#fe7141`) Sem Texto Coberto**:
   - Fundo full-bleed `bg-[#fe7141] text-[#000000] py-16 lg:py-24` e wrapper `mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12`.
   - `<h2>` curto (`"Preço único por campanha."`) + Statement `<Typography as="p">` `"Visual de agência por uma fração do que você gasta hoje"` (`<= 28px`) + Tag `"Risco Zero: Teste Antes de Pagar"` abaixo do parágrafo comparativo.
   - Bloco direito `bg-[#ffffff] text-[#000000] p-6 sm:p-10 lg:p-12` com selo `Feed + Story` em linha separada (sem sobrepor `"9,90"` — `[covered-text]` = 0), algarismos monumentais `R$ 9,90`, 4 benefícios e botão CTA `bg-[#000000] text-[#f0ff1c]`.
4. **Capítulo 6 — Rodapé (`LandingFooter`) em Preto Profundo (`#000000`) Sem Texto `< 13px`**:
   - Fundo full-bleed `bg-[#000000] text-[#f4f4f4] py-16 lg:py-24` e wrapper `mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12`.
   - Todos os textos (incluindo CNPJ e faixa CDC) em `text-[13px]` ou `text-sm` (`>= 13px`, zero `text-xs`).
5. **Testes Unitários (`landing-sections.test.tsx`)**:
   - Validar a alternância `aspect-[9/16]` / `aspect-[4/5]` via `getByTestId("hero-live-canvas")` e incluir teste garantindo `querySelectorAll("img").length === 0` em todas as seções da landing page.
