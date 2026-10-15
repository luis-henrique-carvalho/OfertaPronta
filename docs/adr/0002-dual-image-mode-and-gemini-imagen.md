# ADR 0002: Modo Dual de Imagem e Geração Gastronômica via Google Gemini Imagen API

- **Status:** Aceito
- **Data:** 2026-10-15
- **Decisores:** Luis Carvalho & Antigravity Assistant
- **Contexto:** OfertaPronta — Criação de artes promocionais para delivery sem atrito

---

## Contexto

A proposta original do MVP exigia que o pequeno comerciante enviasse a foto real do seu próprio prato ou, na ausência dela, utilizasse um layout puramente tipográfico. Essa regra visava evitar propaganda enganosa e alucinações tipográficas comuns em modelos generativos de imagem.

No entanto, a validação de produto revelou um ponto crítico de abandono de funil (*drop-off*): a grande maioria dos pequenos comerciantes de bairro (hamburguerias caseiras, pizzarias e deliverys iniciantes) não possui fotografias profissionais com iluminação de estúdio e fundo isolado. A exigência de upload obrigatório de fotos de alta qualidade ou a restrição a layouts puramente tipográficos reduzia severamente a percepção de valor e a taxa de conversão para compra (R$ 9,90).

Por outro lado, delegar a arte inteira para um modelo de difusão de imagem (gerar o post completo com textos e preços via prompt) é inviável, pois modelos generativos alucinam textos em português, erram valores monetários e não garantem legibilidade vetorial em formatos oficiais do Instagram (Feed 1080×1350 e Story 1080×1920).

---

## Decisão

Adotamos o **Modo Dual de Imagem** com **Composição Híbrida** integrando a **Google Gemini Imagen API** (`imagen-3.0-generate-002`):

1. **Modo Dual no Formulário (Upload ou IA com 1 Clique):**
   - O comerciante tem a liberdade de fazer upload da sua foto/logotipo real OU clicar em *"Gerar foto profissional com IA"* informando apenas o nome do prato e detalhes opcionais.

2. **Composição Híbrida (Foto IA + Tipografia Vetorial SVG):**
   - O Gemini Imagen gera exclusivamente a fotografia do prato/produto culinário em proporção 1:1 (quadrada), com iluminação comercial gastronômica.
   - O motor isomórfico (`TemplateEngine`) sobrepõe tipografia vetorial nítida, selos de preço autoritativos (R$ 9,90), WhatsApp e logotipo sobre a foto, eliminando qualquer risco de alucinação de texto.

3. **Prompt Gastronômico Inteligente Invisível:**
   - O usuário não precisa aprender engenharia de prompt. O módulo `AiImageGenerator` injeta automaticamente parâmetros estéticos de *commercial food photography* (luz suave de estúdio, close-up apetitoso, profundidade de campo, 8k) baseados no nicho e no nome do prato.

4. **Política Rígida de Cotas e Proteção de Custos:**
   - **Prévia Gratuita:** O usuário tem direito a **1 geração de IA com marca d'água** para visualizar a arte antes de pagar.
   - **Pós-Pagamento Pix:** Após a confirmação do pagamento, o usuário ganha o direito de realizar até **3 regenerações por pedido** caso queira ajustar o prato, protegendo os custos operacionais da aplicação.

---

## Consequências

### Positivas
- **Aumento Expressivo de Conversão de Topo de Funil:** Elimina a barreira de entrada para comerciantes que não têm fotos prontas de seus produtos.
- **Fidelidade e Legibilidade Garantidas:** Textos, telefones e preços continuam vetoriais e 100% legíveis, unindo o melhor da IA fotográfica com a precisão do motor SVG/Resvg.
- **Previsibilidade Financeira:** A cota estrita (1 na prévia, até 3 pós-pagamento) impede abusos e mantém a margem de lucro saudável no valor de R$ 9,90 por campanha.

### Negativas / Trade-offs
- **Dependência Externa:** Introduz a dependência da chave de API `GEMINI_API_KEY` e latência de geração de 5 a 10 segundos no momento da requisição da IA.
- **Isolamento de Testes:** Exige fakes in-memory / mocks no módulo `AiImageGenerator` para garantir que a suíte de testes Vitest continue rodando em milissegundos sem custos de API.
