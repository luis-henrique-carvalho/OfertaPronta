# ADR 0003: Catálogo Modular Canônico de Estilos e Compilador Narrativo em 4 Camadas para AdCardGenerator

- **Status:** Aceito
- **Data:** 2026-10-20
- **Decisores:** Luis Carvalho & Antigravity Assistant
- **Contexto:** OfertaPronta — Qualidade Visual de Design dos Cards Publicitários e Escalabilidade Desacoplada de Segmentos e Estilos

---

## Contexto

Após os primeiros testes de geração com o modelo `gemini-nano-banana-2.1`, identificou-se que os cards publicitários gerados estavam saindo visualmente genéricos, com iluminação amadora e composição dispersa. Uma investigação profunda contra os documentos oficiais da Google Gemini API e o código-fonte revelou três causas-raiz arquiteturais:

1. **Serialização Oculta no SDK `@google/genai` (v2.30.0):**
   O serviço passava parâmetros de imagem em `config.responseFormat = { image: { aspectRatio, imageSize: "2K" } }`. No entanto, o serializador interno `imageConfigToMldev` do SDK ignora `responseFormat` e busca exclusivamente `config.imageConfig`. Isso fazia a API ignorar o aspect ratio 4:5/9:16 e gerar por padrão 1:1 quadrado. O `ExportEngine` (Sharp) era forçado a fazer `cover`, decepando ~20% das laterais dos cards (cortando preços, títulos e logotipos).
2. **Engenharia de Prompt Rasa e Não-Espacial:**
   O prompt compilava uma lista de bullets com adjetivos abstratos (*"moderna, nítida e legível"*), sem declarar física óptica comercial (lentes 85mm/50mm, iluminação 3-point softbox, sombras de contato reais) nem traduzir o `LayoutVariant` (`retail-burst`, `fresh-organic`, `dark-luxury`, etc.) em coordenadas espaciais e famílias tipográficas descritivas.
3. **Catálogos Duplicados e Desacoplados (Baixa Localidade):**
   Existiam dois catálogos paralelos e dessincronizados: `creation-catalog.ts` (Wizard de UI) e `style-presets-catalog.ts` (Backend). Adicionar um novo segmento ou estilo exigia editar múltiplos arquivos e componentes em pontos diferentes do repositório, correndo risco de deriva de IDs (ex.: `market-red` vs `supermarket-retail-red`).

---

## Decisão

Adotamos uma refatoração orientada a **Deep Modules** com as seguintes definições fundamentais:

1. **Invariante de Custo Zero Adicional de Inferência:**
   - Mantido estritamente o modelo `gemini-nano-banana-2.1` com `imageSize: "1K"` (1120 tokens por imagem, ~$0,067).
   - Exatamente 1 chamada de inferência por card (zero aumento de chamadas à API).
   - O ganho de qualidade é obtido exclusivamente por engenharia de prompt narrativa em 4 camadas e correção da geometria nativa de aspect ratio.

2. **Correção da Costura do SDK `@google/genai`:**
   - Ajustada a chamada para enviar `imageConfig: { aspectRatio: geminiAspectRatio, imageSize: "1K" }`.
   - Mapeamento determinístico de formatos: Feed (`4:5` -> `"4:5"`) e Story (`9:16` -> `"9:16"`). A imagem é gerada pelo modelo diretamente na proporção correta, eliminando o corte lateral agressivo pelo Sharp.

3. **Arquitetura Modular `SegmentRegistry` (`src/features/promotions/data/segments/`):**
   - Criação de uma pasta modular com `types.ts`, `registry.ts`, `index.ts` e `definitions/<slug>.segment.ts` para cada um dos 7 segmentos de negócio (`supermarket`, `fashion`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`).
   - Cada definição isola: metadados do segmento, opções de layout, presets de estilo com mockups e diretrizes de arte espacial.
   - Para adicionar um novo segmento no futuro (ex.: *Pet Shop*, *Farmácia*), cria-se apenas **1 arquivo** em `definitions/` e registra-se no `SegmentRegistry`. Zero alterações em componentes visuais, wizards ou compiladores de prompt.
   - `style-presets-catalog.ts`, `creation-catalog.ts` e `offer-brief.schema.ts` tornaram-se fachadas canônicas transparentes que derivam diretamente do registry, garantindo 100% de sincronia e zero breaking changes.

4. **Compilador Narrativo em 4 Camadas no `AdCardGenerator`:**
   Substituição dos bullets rasos por uma especificação espacial estruturada:
   - **Camada 1 (Fundo Full-Bleed & Atmosfera):** Composição edge-to-edge positiva, sem molduras externas, aplicando HEX e saturação do preset selecionado.
   - **Camada 2 (Sujeito Hero & Óptica Fotográfica):** Lentes comerciais (85mm macro / 50mm studio), iluminação 3-point softbox, sombras de contato hiper-realistas e preservação inegociável da foto do produto quando enviada.
   - **Camada 3 (Geometria de Grid & Tipografia Descritiva):** Tradução do `layoutVariant` em posicionamento geométrico rigoroso, famílias tipográficas descritivas (ex.: geométrica condensada ultra-bold vs serifada editorial) e respeito à Safe Zone obrigatória de 15% para Story 9:16.
   - **Camada 4 (Ancoragem de Preço / Mensagem Institucional & Rodapé):** Destaque numérico volumétrico com container contrastante e proteção estrita contra preços inventados em cards institucionais.

---

## Consequências

### Positivas
- **Aumento Drástico na Qualidade do Design:** O modelo agora recebe instruções fotográficas físicas, hierarquia tipográfica clara e enquadramento nativo 4:5 e 9:16, gerando peças visuais de nível de agência sem custo extra.
- **Fim do Recorte Acidental de Preços/Textos:** A imagem já nasce na proporção correta na API, preservando a área útil e os textos nas bordas sem decepamento pelo Sharp.
- **Escalabilidade e Extensibilidade Máximas:** Adicionar novos nichos e estilos tornou-se uma operação O(1) isolada num único arquivo de definição, sem risco de regressão nos fluxos existentes.
- **Zero Breaking Changes:** Todas as interfaces públicas de Server Functions, schemas Zod e testes existentes continuam passando com 100% de conformidade (467/467 testes verdes).

### Trade-offs
- Aumentou ligeiramente o tamanho do prompt textual (cerca de 300-400 tokens adicionais de texto), o que tem impacto financeiro insignificante (< $0,0001 por chamada) comparado ao custo fixo de imagem (1120 tokens).
