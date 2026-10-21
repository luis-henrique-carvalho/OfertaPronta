# 02: Interfaces de Legalidade, Termos de Uso, Banner LGPD e Suporte WhatsApp

**Spec:** [`docs/specs/trust-compliance.md`](../../specs/trust-compliance.md)

**What to build:**
Criar a experiência visual e componentes de compliance, confiança e suporte mobile-first:
1. **Banner de Consentimento LGPD (`src/components/shared/cookie-consent-banner.tsx`):**
   - Banner fixo na parte inferior da tela para usuários novos.
   - Texto objetivo: *"Usamos cookies para melhorar sua experiência e métricas de anúncios."*
   - Botão de ação *"Entendi"* que grava no `localStorage` (`ofertapronta_cookie_consent: "accepted"`) e oculta o banner com transição fluida.
   - Montagem via shell raiz (`src/routes/__root.tsx`) de forma segura com `useEffect` para evitar mismatches de SSR.
2. **Botão Flutuante de Suporte WhatsApp (`src/components/shared/floating-whatsapp-support.tsx`):**
   - Botão flutuante posicionado no canto inferior direito (`bottom-4 right-4`), acessível via teclado e leitor de tela (com aria-label).
   - Abre o WhatsApp de suporte em nova aba com `target="_blank"` e `rel="noopener noreferrer"`.
   - Lógica de auto-ocultação em páginas com footer de ação fixo na parte inferior (ex.: assistente de criação `/criar` no mobile).
3. **Página de Termos de Uso (`src/routes/termos.tsx`):**
   - Rota estática responsiva com tipografia do shadcn/ui.
   - Cláusulas essenciais: compra avulsa de R$ 9,90 sem assinatura, 2 formatos inclusos (Feed 1080×1350 e Story 1080×1920), até 3 regenerações por IA em 30 min pós-compra, e guarda de 7 dias dos arquivos.
4. **Página de Política de Privacidade (`src/routes/privacidade.tsx`):**
   - Rota estática responsiva com compromisso de privacidade LGPD: dados coletados para geração do card e recuperação via WhatsApp, finalidade de cobrança Pix, retenção de 7 dias dos arquivos, e ausência de venda de dados a terceiros.
5. **Atualização do Rodapé Institucional (`src/components/shared/landing-footer.tsx`):**
   - Exibição limpa de Razão Social, CNPJ formatado, e-mail de contato e links funcionais para `/termos` e `/privacidade`.
   - Link direto para o WhatsApp de suporte.
6. **Testes de Integração e UI:**
   - Testar o comportamento do banner LGPD (gravação e ocultação no `localStorage`).
   - Testar a presença dos elementos no rodapé e nas rotas `/termos` e `/privacidade`.

**Blocked by:** `01-data-tracking-infrastructure.md`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Scenario 1: Consentimento de Cookies LGPD no primeiro acesso**
  - **GIVEN** que o visitante entra no site sem ter aceito os cookies previamente,
  - **WHEN** a página terminar de carregar no cliente,
  - **THEN** o `CookieConsentBanner` deve estar visível com o texto explicativo e o botão "Entendi";
  - **AND** ao clicar no botão "Entendi", o banner deve desaparecer e a chave `ofertapronta_cookie_consent` deve ser gravada como `"accepted"` no `localStorage`.

- [ ] **Scenario 2: Persistência do consentimento em visitas subsequentes**
  - **GIVEN** que o usuário já aceitou o banner de cookies em uma visita anterior,
  - **WHEN** carregar qualquer página da aplicação,
  - **THEN** o `CookieConsentBanner` não deve ser renderizado.

- [ ] **Scenario 3: Acesso e conteúdo claro nos Termos de Uso e Política de Privacidade**
  - **GIVEN** um usuário navegando na rota `/termos` ou `/privacidade`,
  - **WHEN** o documento for renderizado,
  - **THEN** deve apresentar os cabeçalhos semânticos e textos claros sobre a compra avulsa de R$ 9,90, o limite de 3 regenerações, a guarda de 7 dias e os direitos de privacidade LGPD;
  - **AND** o usuário deve conseguir retornar à página inicial através da navegação do cabeçalho.

- [ ] **Scenario 4: Rodapé institucional completo e dados legais visíveis**
  - **GIVEN** o componente `LandingFooter` na landing page ou no fechamento de páginas institucionais,
  - **WHEN** for inspecionado no DOM,
  - **THEN** deve exibir o CNPJ, Razão Social, link para `/termos`, link para `/privacidade` e link para atendimento via WhatsApp ou e-mail.

- [ ] **Scenario 5: Botão de Suporte WhatsApp Mobile-Friendly**
  - **GIVEN** qualquer página padrão da aplicação,
  - **WHEN** o usuário clica no botão flutuante de suporte,
  - **THEN** deve abrir uma nova guia para a URL oficial do WhatsApp com a mensagem contextualizada.
