# Relatório de Pesquisa: Diagnóstico de Qualidade Visual e Engenharia de Prompt para Geração de Cards Publicitários por IA (Custo Zero)

- **Data:** 2026-10-20
- **Escopo:** `AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`), `StylePreset` (`src/features/promotions/data/style-presets-catalog.ts`, `src/features/promotions/data/creation-catalog.ts`) e SDK `@google/genai` (v2.30.0)
- **Restrição Operacional:** **Custo Zero Adicional de Inferência** (manter `gemini-nano-banana-2.1` e 1 única chamada por geração).

---

## 1. Fontes Primárias Investigadas

1. **Documentação Oficial da Google Gemini API (via MCP `gemini-api-docs`):**
   - `gemini-api-guides/generate-content/image-generation.md` (Chunks 2, 63, 64, 65, 66, 67, 78, 87) — _Nano Banana image generation & Prompting guide and strategies_.
   - `gemini-api-reference/generate-content.md#imageconfig` (Chunk 219) — Especificação oficial do objeto `ImageConfig` (`aspectRatio`, `imageSize`).
   - `gemini-api-guides/pricing.md` — Tabelas de tokens por resolução (`1K` = 1120 tokens).
2. **Código-Fonte e Tipagens Locais do SDK `@google/genai` (v2.30.0):**
   - `node_modules/@google/genai/dist/genai.d.ts` (linhas 6242–6244, 8596–8620) — Definição de `GenerateContentConfig.imageConfig`.
   - `node_modules/@google/genai/dist/index.mjs` (linhas 5019–5045, 19214–19218) — Serializador `imageConfigToMldev` da Gemini Developer API.
3. **Código-Fonte do Repositório OfertaPronta:**
   - `src/features/promotions/server/services/ai-card-generator.service.ts`
   - `src/features/promotions/data/style-presets-catalog.ts`
   - `src/features/promotions/data/creation-catalog.ts`
   - `src/server/export-engine/image-processor.ts`

---

## 2. As 3 Causas Raiz da Baixa Qualidade e Aspecto Genérico

### Causa Raiz 1: Bug Silencioso de Serialização na SDK `@google/genai` (`responseFormat` vs. `imageConfig`)

Em `src/features/promotions/server/services/ai-card-generator.service.ts` (linhas 184–192), o módulo invoca o SDK passando:

```typescript
config: {
  responseModalities: ["image"],
  responseFormat: {
    image: {
      aspectRatio: geminiAspectRatio,
      imageSize: "2K",
    },
  },
}
```

**Evidência Primária no Código do SDK (`node_modules/@google/genai/dist/index.mjs:5019`):**
O serializador `generateContentConfigToMldev` do SDK `@google/genai` v2.30.0 **não lê `responseFormat.image`**. Ele serializa exclusivamente a propriedade `config.imageConfig` através de `imageConfigToMldev`:

```javascript
function imageConfigToMldev(fromObject, _rootObject) {
  const toObject = {};
  const fromAspectRatio = getValueByPath(fromObject, ["aspectRatio"]);
  if (fromAspectRatio != null) {
    setValueByPath(toObject, ["aspectRatio"], fromAspectRatio);
  }
  const fromImageSize = getValueByPath(fromObject, ["imageSize"]);
  if (fromImageSize != null) {
    setValueByPath(toObject, ["imageSize"], fromImageSize);
  }
  return toObject;
}
```

**Consequência Prática:**

- Os parâmetros `aspectRatio` (`"4:5"` ou `"9:16"`) **estavam sendo 100% descartados pelo SDK antes da requisição HTTP sair do servidor Node.js**.
- Sem `imageConfig.aspectRatio`, a API do Gemini gera por padrão uma imagem quadrada (`1:1`, 1024×1024) quando não há imagem de entrada, ou clona a proporção da foto crua do produto enviada pelo comerciante.
- Em seguida, `formatFeedCard` no `ExportEngine` (`src/server/export-engine/image-processor.ts:85`) executava `sharp(imageBuffer).resize(1080, 1350, { fit: "cover", position: "center" })`, **decepando ~20% das laterais esquerda e direita da imagem gerada** (cortando textos, preços e logos) e esticando pixels!

---

### Causa Raiz 2: Violação do Princípio Fundamental do Guia Oficial de Prompting do Gemini

Na documentação oficial (`gemini-api-guides/generate-content/image-generation.md`, Chunk 63 — _Prompting guide and strategies_), a Google destaca:

> **"Describe the scene, don't just list keywords.**
> The model's core strength is its deep language understanding. A narrative, descriptive paragraph will almost always produce a better, more coherent image than a list of disconnected words."

Além disso, na seção _Best practices_ (Chunk 66), a documentação especifica 5 regras diretas:

1. **Be hyper-specific:** Descrever materiais, texturas, formas e detalhes físicos em vez de adjetivos vagos.
2. **Control the camera:** Informar ângulo de câmera (`elevated 45-degree tabletop shot`, `eye-level studio portrait`), lente (`85mm f/2.8 commercial macro lens`), profundidade de campo (`soft bokeh`) e iluminação física (`three-point softbox setup with 45-degree key light and rim kicker light`).
3. **Accurate text in images (Chunk 64):** Descrever explicitamente a família e peso tipográfico (ex.: _"clean, extra-bold condensed geometric sans-serif in uppercase"_ ou _"high-contrast editorial Didone serif"_), o acabamento e o container onde o texto se assenta.
4. **Use step-by-step instructions (Chunk 66):** Construir cenas complexas em camadas sequenciais (_"First, create a background... Then, in the foreground, add... Finally, place..."_).
5. **Use semantic negative prompts (Chunk 66):** Evitar negações como _"sem bordas brancas sobressalentes ou marcas d'água artificiais"_ (que ativam os tokens "bordas brancas" e "marca d'água" na atenção do modelo) e substituir por descrições afirmativas (_"full-bleed edge-to-edge graphic composition extending seamlessly to all four canvas borders"_).

**Diagnóstico do Prompt Atual (`ai-card-generator.service.ts:449-542`):**
O prompt atual consiste em uma lista fragmentada de mais de 20 tópicos (`- Estilo Visual...`, `- Clima...`, `1. TÍTULO...`) usando termos vagos (_"tipografia publicitária moderna, legível e nítida"_, _"iluminação atraente e realista"_), sem descrição narrativa da cena, sem especificações ópticas de câmera/iluminação e com prompt negativo explícito na linha 512.

---

### Causa Raiz 3: Descarte de 60% dos Metadados de Design do `StylePreset` na Costura

No catálogo `src/features/promotions/data/style-presets-catalog.ts`, cada um dos 28 `CuratedStylePreset` contém metadados ricos de design gráfico que alimentam a miniatura exibida ao microempresário na interface:

- `mockup.layoutVariant`: `"retail-burst"` | `"fresh-organic"` | `"dark-luxury"` | `"rustic-wood"` | `"clean-minimal"` | `"neon-urban"`
- `mockup.bgColor`, `mockup.textColor`, `mockup.accentColor` (códigos HEX exatos)
- `mockup.badgeText` (ex.: `"OFERTA QUENTE"`, `"DESTAQUE"`, `"SUPER COMBO"`)
- `mockup.footerHeadline` e `mockup.footerSubline`
- `paletteSwatches` (trio de cores HEX)
- `commercialGuide.appearance` e `commercialGuide.customerVibe`

Porém, a função `resolveArtDirectionDirective` (`style-presets-catalog.ts:951-971`) extrai **apenas** os 4 campos textuais de `preset.artDirection` (`palette`, `composition`, `lighting`, `atmosphere`) e **descarta completamente `preset.mockup` e `preset.commercialGuide`**.
Adicionalmente, `creation-catalog.ts` mantém uma segunda lista paralela de estilos com outro enum (`layoutType: "bold-offer" | "clean-frame" | "dark-premium" | "vibrant-pop"`), gerando deriva entre a miniatura escolhida no assistente e o prompt enviado ao modelo.

---

## 3. Alavancas de Melhoria com Custo Zero Adicional

Todas as intervenções abaixo mantêm **exatamente o mesmo modelo (`gemini-nano-banana-2.1`)**, **1 única inferência por geração** e **resolução base (`1K` = 1120 tokens)**:

### 3.1. Correção da Configuração `imageConfig` no SDK

Substituir `responseFormat` por `imageConfig` em `ai-card-generator.service.ts`:

```typescript
config: {
  responseModalities: ["IMAGE"],
  imageConfig: {
    aspectRatio: geminiAspectRatio, // "4:5" (928x1152) ou "9:16" (768x1376)
    imageSize: "1K", // Tier base de 1120 tokens — zero aumento de custo
  },
}
```

_Nota técnica:_ Quando o Gemini gera nativamente em `4:5` (`928×1152`), a razão de aspecto é `0.8055` (diferença de apenas `0.0055` para `0.8000` de `1080×1350`), caindo no caminho de redimensionamento sem corte (`Math.abs(inputRatio - feedRatio) < 0.02`) do `ExportEngine`!

### 3.2. Blueprints Geométricos por `LayoutVariant`

Traduzir cada `LayoutVariant` (`retail-burst`, `fresh-organic`, `dark-luxury`, `rustic-wood`, `clean-minimal`, `neon-urban`) em instruções espaciais e tipográficas concretas:

| `LayoutVariant` | Arquitetura Espacial (Grid)                                                                                                                 | Família Tipográfica Descritiva                                                                       | Estilo de Badge de Preço                                                                      | Setup Fotográfico & Iluminação                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `retail-burst`  | Cabeçalho vibrante em faixa superior; produto hero ocupando 55% centrais; selo explosivo no canto inferior direito; barra sólida de rodapé. | Sans-serif geométrica condensada ultra-bold em caixa alta com contorno de contraste.                 | Selo estrelado/circular de alto impacto com borda dupla em `accentColor`.                     | Lente 50mm f/4 comercial, iluminação frontal de estúdio brilhante e saturada, sombras nítidas.               |
| `fresh-organic` | Fundo claro natural; moldura suave orgânica; produto banhado por luz matinal no centro; pill badge arredondado para o preço.                | Sans-serif humanista arredondada combinada com subtítulo orgânico leve.                              | Pill/cápsula arredondada em tom folha/terracota com tipografia limpa.                         | Lente 85mm f/2.8 macro, luz solar matinal difusa lateral, gotículas de frescor e bokeh suave.                |
| `dark-luxury`   | Composição editorial escura com amplo respiro; moldura fina metálica; sujeito central iluminado por rim light; tipografia minimalista.      | Serifada editorial de alto contraste (estilo Didone/Bodoni) para títulos + sans-serif fina espaçada. | Bloco retangular minimalista com filete dourado/metálico (`accentColor`) sem poluição visual. | Lente 85mm f/1.8 retrato/estúdio, iluminação chiaroscuro de 3 pontos com rim light dourada.                  |
| `rustic-wood`   | Cenário gastronômico rústico em 45°; superfície de madeira/pedra; vapor e texturas artesanais; faixa superior rústica e selo circular.      | Slab-serif robusta de inspiração artesanal combinada com numerais bold.                              | Selo circular tipo carimbo artesanal ou etiqueta em `accentColor` com alto contraste.         | Lente 85mm f/2.8 macro gastronômica em ângulo de 45°, luz quente lateral de forno a lenha (3200K).           |
| `clean-minimal` | Estética lookbook/revista com amplo espaço negativo (35% livre); enquadramento limpo; tipografia alinhada em grade suíça.                   | Sans-serif grotesca moderna (peso médio no título, peso black nos numerais) com kerning amplo.       | Tag geométrica retangular limpa e discreta ancorada na base lateral do produto.               | Lente 50mm f/2.8 editorial, luz difusa de janela de estúdio fotográfico, sombras suaves em superfície fosca. |
| `neon-urban`    | Atmosfera noturna urbana; contrastes neon nas bordas do produto; tipografia inclinada dinâmica; badge geométrico angular.                   | Display sans-serif condensada itálica/angular de impacto urbano.                                     | Placa geométrica inclinada com brilho externo sutil em `accentColor`.                         | Lente 35mm f/2.0 close-up dinâmico, iluminação cruzada com key light quente e rim light neon colorida.       |

### 3.3. Construção do Prompt Passo a Passo em 4 Camadas (Step-by-Step Narrative)

Em vez de listas de bullets desconectados, estruturar o prompt em 4 etapas narrativas progressivas:

1. **Camada 1 — Cena, Fundo e Sangria Total (Full-Bleed Backdrop):** Descreve o ambiente, a cor de fundo (`mockup.bgColor`) e a extensão contínua até as 4 bordas sem margens externas.
2. **Camada 2 — Sujeito Hero e Física Fotográfica:** Descreve o produto/serviço (preservando a `Product Image` anexa quando fornecida), ângulo, lente, iluminação de estúdio e sombras de contato físicas.
3. **Camada 3 — Arquitetura Gráfica e Hierarquia Tipográfica:** Posiciona o nome da loja (`businessName`), o selo de topo (`mockup.badgeText`) e o título da oferta (`offerTitle`) com estilo de fonte explícito e respeito estrito à Safe Zone (especialmente os 15% livres no topo e base para `9:16`).
4. **Camada 4 — Ancoragem de Preço e Rodapé Comercial:** Descreve exatamente o container de preço em `mockup.accentColor`, a relação visual entre preço antigo tachado e preço promocional gigante, e a barra de rodapé com CTA e WhatsApp.
