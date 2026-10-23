# ADR 0002: Geração Completa de Cards Publicitários via IA Multimodal com Fusão de Produto e Referência

- **Status:** Aceito (Substitui a versão anterior de Modo Dual restrito a fotos gastronômicas)
- **Data:** 2026-10-15
- **Decisores:** Luis Carvalho & Antigravity Assistant
- **Contexto:** OfertaPronta — Motor Central de Criação de Cards Publicitários por IA para Microempresários

---

## Contexto

Na concepção anterior da documentação, o sistema estava restrito ao setor de alimentação e tratava a inteligência artificial apenas como um recurso secundário para gerar fotos isoladas de pratos (1:1), enquanto o card em si era montado por templates SVG estáticos e pré-fabricados. Além disso, o envio de foto própria e o uso de IA eram tratados como opções mutuamente exclusivas.

Essa abordagem contradiz a visão central do produto por três razões fundamentais:

1. **Público Multisegmento:** O produto atende microempresários de múltiplos ramos (donos de supermercado, cabeleireiros, barbearias, pizzarias, hamburguerias, restaurantes e comércio local), cujas necessidades visuais não cabem em três templates engessados de comida.
2. **O Card Final é Criado por IA:** O diferencial competitivo do OfertaPronta é que a própria IA projeta e gera o **Card Publicitário (`Ad Card`) completo** — incluindo composição gráfica, cenário, iluminação comercial e integração tipográfica da oferta e dos preços.
3. **Insumos Combináveis (Produto + Referência + Briefing):** O microempresário frequentemente possui a foto simples do seu produto (ex.: item na prateleira do mercado, corte de cabelo ou lanche) e/ou uma imagem de referência de um anúncio que achou atraente, desejando que a IA combine ambos para gerar um card publicitário profissional.

---

## Decisão

Adotamos a **Geração Completa de Cards Publicitários via IA Multimodal** utilizando os modelos de imagem da família Google Gemini (`gemini-nano-banana-2.1` / `gemini-3-pro-image` via SDK oficial `@google/genai`):

1. **Entradas Multimodais Flexíveis e Combináveis:**
   - **Briefing da Oferta (`Offer Brief`):** Obrigatório (segmento comercial, nome do negócio, produto/serviço, preço promocional, chamada e contato).
   - **Imagem do Produto (`Product Image`):** Opcional. Se enviada, a IA preserva a identidade do produto/serviço real e o ambienta profissionalmente no card.
   - **Imagem de Referência (`Reference Image`):** Opcional. Se enviada, a IA extrai a direção de arte (paleta, distribuição visual, energia gráfica) como inspiração para compor o novo card.
   - **Estilo Visual (`Style Preset`):** Caso o usuário não envie nem foto do produto nem referência, ele seleciona um estilo visual do seu segmento (ou descreve livremente) e a IA gera o Card Publicitário completo do zero.

2. **O Card Publicitário Completo é Gerado pela IA:**
   - O módulo profundo `AdCardGenerator` (`src/features/promotions/server/ai-card-generator.ts`) constrói a instrução multimodal estruturada combinando o `Offer Brief` com as imagens de entrada (`Product Image` e `Reference Image`) e invoca o modelo Gemini (`gemini-nano-banana-2.1` por padrão, com suporte a fusão de múltiplas imagens de referência).
   - A IA gera a arte publicitária completa já com a hierarquia visual da promoção, preços, chamada para ação e ambientação nas proporções de Feed (1080×1350 / 4:5) e Story (1080×1920 / 9:16).

3. **Proteção de Prévia com Marca d'Água e Cotas de Custo:**
   - **Prévia Gratuita:** Permite **1 geração de Card Publicitário por IA** aplicada com marca d'água protetora no servidor antes de exibir no cliente.
   - **Pós-Pagamento Pix (R$ 9,90):** Libera imediatamente os PNGs em alta resolução sem marca d'água e concede direito a até **3 regenerações/ajustes por IA** no mesmo pedido para refinar detalhes sem comprometer a margem financeira.

---

## Consequências

### Positivas

- **Alinhamento Total com o Core do Produto:** Entrega exatamente a proposta de valor de criar cards publicitários sob medida com IA para qualquer microempresário (supermercado, salão, restaurante, etc.).
- **Fusão Criativa Real (Produto + Referência):** Permite ao comerciante transformar uma foto simples de celular + uma referência de design em uma peça publicitária de nível de agência.
- **Arquitetura Mais Simples (YAGNI):** Elimina a necessidade de desenhar e manter dezenas de layouts SVG manuais para cada segmento de mercado.

### Negativas / Trade-offs

- **Controle de Custo e Latência de Inferência:** A geração multimodal leva de 4 a 10 segundos e consome tokens de imagem da API Gemini, exigindo controle rigoroso de cotas por sessão/pedido e aplicação de marca d'água server-side nas prévias.
