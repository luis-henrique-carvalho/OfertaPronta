# PRD — OfertaPronta

**Versão:** 2.0  
**Status:** MVP — Alinhado ao Core de Geração de Cards Publicitários por IA  
**Data:** 15/10/2026

## 1. Visão do produto

O **OfertaPronta** é uma plataforma web mobile-first que permite a **microempresários de diversos segmentos** criar **cards publicitários profissionais gerados por Inteligência Artificial** em poucos passos, sem precisar de conhecimento de design ou cadastro prévio.

**Proposta de valor:** *"Seu card publicitário criado por IA e pronto para postar, sem precisar saber design."*

O microempresário informa os dados da sua oferta (**Briefing da Oferta**), envia opcionalmente a **Imagem do Produto/Serviço** e/ou uma **Imagem de Referência** (ou escolhe um **Estilo Visual**), e a Inteligência Artificial gera o **Card Publicitário (`Ad Card`) completo**. Ele visualiza a prévia gratuita com marca d'água, realiza o pagamento avulso via Pix (R$ 9,90) e recebe os cards finais em alta resolução prontos para publicar no Instagram e WhatsApp.

### Público-alvo (Microempresários Multisegmento)

Pequenos comerciantes e prestadores de serviço locais:

- **Supermercados, Mercadinhos, Açougues e Hortifrútis** (encartes e ofertas do dia).
- **Cabeleireiros, Salões de Beleza, Barbearias e Estética** (promoções de serviços e combos).
- **Pizzarias, Hamburguerias, Restaurantes, Açaíterias e Delivery** (ofertas gastronômicas).
- **Comércio e Serviços Locais em geral** (lojas de bairro, pet shops, oficinas, farmácias).

## 2. Objetivos do MVP

1. Permitir criar **Cards Publicitários por IA** sem cadastro obrigatório.
2. Suportar múltiplos segmentos de microempresários desde o primeiro acesso.
3. Permitir combinar **Briefing da Oferta** + **Imagem do Produto (opcional)** + **Imagem de Referência (opcional)** para que a IA crie o card completo.
4. Disponibilizar prévia gratuita gerada por IA protegida por marca d'água.
5. Permitir pagamento avulso e instantâneo com Pix (R$ 9,90).
6. Entregar automaticamente os arquivos finais em PNG de alta resolução após confirmação do pagamento, com direito a regenerações/ajustes por IA.

**Meta de experiência:** permitir que o microempresário preencha o briefing e visualize seu primeiro Card Publicitário gerado por IA em até 90 segundos.

## 3. Fluxo principal

**Etapa 1 — Informar Briefing da Oferta (`Offer Brief`)**

O microempresário informa:

- **Segmento Comercial** (ex.: Supermercado, Cabeleireiro/Barbearia, Pizzaria, Hamburgueria, Restaurante, Outros).
- **Nome do estabelecimento**.
- **Produto, serviço ou promoção anunciada** (ex.: *"Corte + Barba"*, *"Picanha Bovina kg"*, *"Combo Smash Duplo"*).
- **Preço promocional** e **Preço original** (opcional).
- **Chamada para ação** e **WhatsApp / Endereço comercial** (opcional).
- **Logotipo** (opcional).

**Etapa 2 — Enviar Insumos Visuais (Flexível) & Gerar com IA**

O microempresário pode alimentar a IA de quatro formas:

1. **Imagem do Produto + Imagem de Referência:** Envia a foto real do seu produto/serviço e um card de referência visual que ele gostou.
2. **Apenas Imagem do Produto:** Envia a foto do seu produto e escolhe um Estilo Visual sugerido para o seu segmento.
3. **Apenas Imagem de Referência:** Envia uma referência visual e deixa a IA criar toda a cena e os elementos a partir do briefing.
4. **Sem Imagens (100% IA a partir do Briefing):** Escolhe um **Estilo Visual (`Style Preset`)** ou descreve como deseja o anúncio, e a IA cria o Card Publicitário completo do zero.

**Etapa 3 — Visualizar Prévia (`Watermark`)**

A IA gera o **Card Publicitário completo** (fundo, ambientação do produto, estilo visual e textos/preços integrados). O sistema apresenta a prévia protegida com marca d'água.

**Etapa 4 — Comprar (`Order` & `Payment Charge`)**

O usuário aprova a prévia, visualiza o QR Code e o código Pix Copia e Cola (R$ 9,90) e realiza o pagamento.

**Etapa 5 — Receber e Ajustar (`Export`)**

Após confirmação do webhook Pix, os arquivos finais são liberados sem marca d'água em alta resolução nos formatos **Feed (1080×1350)** e **Story (1080×1920)**, com direito a até **3 regenerações/ajustes por IA** para refinar o card caso deseje.

## 4. Monetização

**Preço inicial do MVP: R$ 9,90 por campanha.**

Uma **Campanha (`Campaign`)** inclui o Card Publicitário gerado por IA nos dois formatos principais de divulgação:

- **Instagram Feed:** 1080 × 1350 (proporção 4:5).
- **Instagram Story / Status WhatsApp:** 1080 × 1920 (proporção 9:16).

Pacotes previstos para uma segunda fase:

| Produto | Preço proposto |
|---|---:|
| 1 campanha (Feed + Story) | R$ 9,90 |
| 5 campanhas | R$ 29,90 |
| 10 campanhas | R$ 49,90 |

## 5. Escopo funcional

| Requisito | Prioridade |
|---|---|
| Criar campanha sem login | P0 |
| Formulário de Briefing da Oferta multisegmento validado com Zod | P0 |
| Upload opcional de Imagem do Produto (`Product Image`) | P0 |
| Upload opcional de Imagem de Referência (`Reference Image`) + Catálogo de Estilos (`Style Preset`) | P0 |
| Motor de Geração de Card Publicitário completo por IA Multimodal (Gemini) | P0 |
| Prévia gratuita do Card Publicitário com Marca d'Água | P0 |
| Checkout Pix Dinâmico (R$ 9,90) | P0 |
| Confirmação via webhook idempotente com validação HMAC | P0 |
| Exportação PNG em alta resolução sem marca d'água (Feed 1080×1350 + Story 1080×1920) | P0 |
| Até 3 regenerações/ajustes com IA pós-pagamento | P0 |
| Download protegido por link assinado (7 dias) | P0 |
| Analytics de conversão do funil | P1 |
| Recuperação de pedidos na sessão | P1 |
| Pacotes de créditos e histórico | P2 |

## 6. Regras de negócio

- **O Card Publicitário é gerado integralmente por IA Multimodal:** A IA compõe o cenário, integra a foto do produto (quando enviada), segue a direção de arte da imagem de referência (quando enviada) e renderiza os textos e preços promocionais diretamente na arte publicitária.
- **Flexibilidade de Imagens de Entrada:** O microempresário pode enviar tanto a foto do produto quanto uma imagem de referência, apenas uma delas, ou nenhuma (usando um estilo visual ou descrição).
- **Preços Autoritativos no Backend:** O valor cobrado pela campanha (R$ 9,90) é determinado exclusivamente pelo servidor e gravado em um `Frozen Snapshot` ao emitir o pedido.
- **Política de Cotas de Geração por IA (Proteção de Margem):**
  - **Na Prévia Gratuita:** O microempresário tem direito a **1 geração gratuita por IA** (exibida com marca d'água) para validar a qualidade antes de pagar.
  - **Pós-Pagamento Confirmado:** O microempresário recebe os arquivos sem marca d'água e ganha o direito a até **3 regenerações/ajustes por IA** dentro do mesmo pedido (em até 30 minutos após a compra).
- **Liberação Condicionada ao Pagamento:** Os arquivos em alta resolução sem marca d'água só são entregues após confirmação criptográfica (HMAC) do webhook Pix.
- **Disponibilidade de Download:** Os links finais permanecem ativos por pelo menos 7 dias através de URLs assinadas.

## 7. Arquitetura técnica

- **Framework Full-Stack:** TanStack Start (React 19 + TanStack Router + Vite/Nitro), TypeScript estrito, Tailwind CSS v4 e shadcn/ui.
- **Persistência:** PostgreSQL e Drizzle ORM.
- **Motor Central de IA (`AdCardGenerator`):** Modelos multimodais de geração e edição de imagem da Google Gemini (`gemini-nano-banana-2.1` e `gemini-3-pro-image` via SDK `@google/genai`), capazes de fundir múltiplas imagens de referência (Produto + Referência de Estilo) e instruções de texto para gerar o Card Publicitário completo.
- **Processamento de Imagem, Marca d'Água e Formatos (`ExportEngine`):** `Sharp` + `@resvg/resvg-js` no servidor para redimensionamento de alta fidelidade (1080×1350 e 1080×1920), aplicação determinística de marca d'água vetorial na prévia gratuita e exportação limpa pós-pagamento.
- **Armazenamento:** S3 compatível / Cloudinary com URLs privadas assinadas.
- **Pagamentos (`PixCheckout`):** Integração Pix dinâmico via Woovi/OpenPix com validação HMAC e idempotência transacional.

## 8. Modelo de dados

Entidades principais:

- `drafts`: briefing da oferta (`businessSegment`, `businessName`, `offerTitle`, `promoPrice`, `originalPrice`, `callToAction`, `whatsapp`, `stylePreset`, `customInstructions`), URLs das imagens de insumo (`productImageUrl`, `referenceImageUrl`, `logoUrl`) e prévia gerada com marca d'água.
- `campaigns`: dados consolidados da campanha e referência aos cards gerados pela IA.
- `orders`: pedidos, status de pagamento, contador de regenerações de IA utilizadas e `Frozen Snapshot`.
- `payment_charges`: cobranças Pix dinâmicas e histórico de conciliação.
- `exports`: arquivos PNG finais sem marca d'água (Feed 1080×1350 e Story 1080×1920).

## 9. Segurança e privacidade

O sistema deverá:

- Validar todas as entradas e uploads no servidor via Zod.
- Nunca expor a imagem gerada sem marca d'água antes da confirmação do pagamento Pix.
- Confirmar a autenticidade dos webhooks Pix via HMAC.
- Garantir idempotência estrita no processamento de webhooks.
- Proteger a cota de chamadas à API Gemini contra abuso automatizado (rate limiting e controle de cota por rascunho/pedido).
- Atender aos requisitos aplicáveis da LGPD.

## 10. Critérios de aceite do MVP

O MVP estará pronto quando:

1. Um microempresário de qualquer segmento (supermercado, salão, restaurante, etc.) conseguir preencher o briefing sem criar conta.
2. O usuário puder enviar opcionalmente a Imagem do Produto, a Imagem de Referência, ambas ou nenhuma.
3. A IA gerar o Card Publicitário completo integrando os insumos enviados e os dados da promoção.
4. A prévia gratuita exibir o card gerado protegido por marca d'água.
5. O checkout Pix de R$ 9,90 funcionar perfeitamente em dispositivos móveis.
6. O webhook autenticado liberar imediatamente os PNGs finais em alta resolução (1080×1350 e 1080×1920) sem marca d'água.
7. O comprador puder solicitar até 3 regenerações/ajustes por IA pós-pagamento.

## 11. Roadmap

**Fase 1 — Core Loop de Geração por IA e Pix (MVP)**
Briefing multisegmento, upload de Produto + Referência, geração do Card Publicitário via Gemini Multimodal, prévia com marca d'água, checkout Pix e entrega dos PNGs finais.

**Fase 2 — Refinamento Conversacional e Recuperação**
Ajustes guiados pós-compra (até 3 regenerações por IA), galeria expandida de referências por segmento e recuperação automática de pedidos.

**Fase 3 — Escala e Recorrência**
Pacotes de créditos (5 e 10 campanhas), kit de marca salvo (logo e cores favoritas do estabelecimento) e geração de encartes com múltiplos produtos.