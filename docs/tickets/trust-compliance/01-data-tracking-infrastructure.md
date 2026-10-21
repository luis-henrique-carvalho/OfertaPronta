# 01: Infraestrutura de Dados Legais e Tracking de Conversão (Meta Pixel & Google Ads)

**Spec:** [`docs/specs/trust-compliance.md`](../../specs/trust-compliance.md)

**What to build:**
Criar a infraestrutura de backend/configuração e os utilitários de cliente para dados cadastrais legais e tracking de conversão de anúncios:
1. Atualização do `src/config/client-env.ts` para receber variáveis opcionais tipadas com Zod: `VITE_PUBLIC_LEGAL_NAME`, `VITE_PUBLIC_LEGAL_CNPJ`, `VITE_PUBLIC_CONTACT_EMAIL`, `VITE_PUBLIC_SUPPORT_WHATSAPP`, `VITE_PUBLIC_META_PIXEL_ID`, `VITE_PUBLIC_GOOGLE_ADS_ID`.
2. Criação do módulo `src/lib/legal-company.ts` com o perfil cadastral padronizado, fallbacks de contingência (Razão Social: "OfertaPronta Tecnologia Ltda", CNPJ: "00.000.000/0001-00", e-mail: "contato@ofertapronta.com.br") e gerador de link direto do WhatsApp com mensagem pré-formatada codificada em URI.
3. Criação do módulo `src/lib/tracking.ts` com inicialização defensiva de scripts (Meta Pixel e Google Ads gtag) e métodos tipados `trackPageView`, `trackInitiateCheckout`, e `trackPurchase` com proteção anti-duplicação (idempotência por orderId).
4. Integração reativa dos eventos nos fluxos de checkout e pedido:
   - `src/features/checkout/views/checkout-view.tsx` ou rota `checkout.$orderId.tsx`: disparar `trackInitiateCheckout(orderId, amountCents)` ao carregar cobrança Pix.
   - `src/features/delivery/views/order-delivery-view.tsx` ou rota `pedido.$orderId.tsx`: disparar `trackPurchase(orderId, amountCents, txId)` quando status for `PAID`.
5. Testes unitários com cobertura abrangente para `legal-company.test.ts` e `tracking.test.ts`.

**Blocked by:** None (can start immediately)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Scenario 1: Fallback determinístico de perfil legal**
  - **GIVEN** que nenhuma variável de ambiente customizada de dados legais foi informada,
  - **WHEN** a função `getCompanyLegalProfile()` for executada,
  - **THEN** deve retornar Razão Social "OfertaPronta Tecnologia Ltda", CNPJ "00.000.000/0001-00", e-mail "contato@ofertapronta.com.br" e o link do WhatsApp formatado com a mensagem pré-definida.

- [ ] **Scenario 2: URL de suporte do WhatsApp com mensagem contextualizada**
  - **GIVEN** um número de telefone e uma mensagem padrão ou customizada,
  - **WHEN** a função de geração de link do WhatsApp for chamada,
  - **THEN** deve retornar uma URL no formato `https://wa.me/<numero>?text=<mensagem_url_encoded>`, sanitizando caracteres não numéricos do telefone.

- [ ] **Scenario 3: Resiliência do módulo de tracking na ausência de IDs ou no SSR**
  - **GIVEN** um ambiente sem IDs configurados (`VITE_PUBLIC_META_PIXEL_ID` e `VITE_PUBLIC_GOOGLE_ADS_ID` vazios) ou execução em ambiente servidor/Node,
  - **WHEN** os métodos `trackPageView`, `trackInitiateCheckout` ou `trackPurchase` forem disparados,
  - **THEN** as funções devem executar sem disparar exceções (no-op seguro) e sem poluir o console.

- [ ] **Scenario 4: Disparo correto e idempotente de Purchase**
  - **GIVEN** um pedido pago com sucesso (`status === 'PAID'`),
  - **WHEN** a tela de entrega do pedido for carregada pela primeira vez,
  - **THEN** o evento `trackPurchase` deve ser despachado com `orderId` e valor em centavos;
  - **AND** caso o usuário recarregue a página, o evento não deve ser re-disparado em duplicidade na mesma sessão do navegador.
