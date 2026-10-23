# Design System Oficial — OfertaPronta (Clean Gourmet Light)

**Status:** Aprovado  
**Origem:** Stitch MCP (`projects/5829296879951758760`)  
**Design System Asset ID:** `assets/b726512b2c98469a8358b6622ace4ef0`

---

## Telas Geradas & Assets Locais

1. **Landing Page Mobile:**
   - **Stitch Screen ID:** `0b7c3e9d3c74449f9d0fba9799ed193c`
   - **Imagem PNG:** [`docs/stitch-designs/clean-gourmet-light/landing-page-mobile.png`](file:///home/luis/repositories/OfertaPronta/docs/stitch-designs/clean-gourmet-light/landing-page-mobile.png)
   - **Código HTML:** [`docs/stitch-designs/clean-gourmet-light/landing-page-mobile.html`](file:///home/luis/repositories/OfertaPronta/docs/stitch-designs/clean-gourmet-light/landing-page-mobile.html)

2. **Landing Page Desktop:**
   - **Stitch Screen ID:** `4571473f7b09432294f1d8b66d3f90e8`
   - **Imagem PNG:** [`docs/stitch-designs/clean-gourmet-light/landing-page-desktop.png`](file:///home/luis/repositories/OfertaPronta/docs/stitch-designs/clean-gourmet-light/landing-page-desktop.png)
   - **Código HTML:** [`docs/stitch-designs/clean-gourmet-light/landing-page-desktop.html`](file:///home/luis/repositories/OfertaPronta/docs/stitch-designs/clean-gourmet-light/landing-page-desktop.html)

---

## 1. Visão Geral & Estética

O **Clean Gourmet Light** combina a clareza e autoridade de um aplicativo mobile moderno com o aconchego sensorial de bistrôs e culinária artesanal:

- **Tema:** Light Mode Acolhedor (fundo creme/pergaminho suave, eliminando o cansaço visual do branco puro).
- **Proposta Visual:** Minimalismo gastronômico que deixa os banners promocionais e fotos de produtos brilharem sem competição visual.
- **Micro-interações:** Suaves e táteis, com bordas finas e sombras quentes difusas.

---

## 2. Paleta de Cores (Tokens CSS / Tailwind)

| Token Semântico    | Hex Code              | Aplicação / Função                                            |
| ------------------ | --------------------- | ------------------------------------------------------------- |
| `bg-background`    | `#FFF8F3`             | Fundo principal da aplicação (Parchment Cream)                |
| `bg-card`          | `#FFFFFF`             | Superfície dos cards de promoção, formulários e mockups       |
| `bg-card-subtle`   | `#FAF2EC`             | Fundo secundário para agrupamentos e seções internas          |
| `border-subtle`    | `#E8E1DB`             | Micro-bordas delicadas de 1px                                 |
| `primary`          | `#C62828` / `#A20513` | Cor de destaque primária (Ripe Cherry / Apetite & Conversão)  |
| `primary-hover`    | `#93000E`             | Estado ativo/hover do CTA principal                           |
| `secondary`        | `#4E7D63` / `#39684F` | Verde Sálvia (Confirmação Pix, garantias e badges de frescor) |
| `secondary-subtle` | `#EAF4EE`             | Fundo de badges Pix e chips de sucesso                        |
| `text-primary`     | `#1E1B17`             | Tipografia principal (Roasted Espresso)                       |
| `text-muted`       | `#68625A` / `#5B403D` | Textos secundários, legendas e metadados                      |

---

## 3. Tipografia

- **Família Tipográfica Oficial:** `Plus Jakarta Sans`
- **Headlines / Títulos:** Sólidos e legíveis, com espaçamento ligeiramente comprimido (`tracking-tight`) para transmitir autoridade e modernidade.
- **Corpo & Formulários:** Entrelinhas confortáveis (`leading-relaxed`), excelente legibilidade em telas de celulares de 360px a 430px e em desktops.

---

## 4. Elevação, Sombras e Formas

- **Sombras:** Difusas e quentes, evitando sombras pretas duras:
  - `shadow-gourmet`: `0 4px 16px -2px rgba(43, 40, 36, 0.04), 0 1px 3px 0 rgba(43, 40, 36, 0.02)`
- **Raio de Borda (Corner Radius):**
  - Botões de Ação e Pills: `rounded-full` (toque tátil e amigável)
  - Cards e Modais: `rounded-2xl` (16px)
  - Inputs e Seletores: `rounded-xl` (12px)
