# Spec: Trust & Compliance (LGPD, Termos de Uso, Dados Legais e Tracking de Conversão)

- **Slug**: `trust-compliance`
- **Status**: `ready-for-agent`

## Problem Statement

Atualmente, o OfertaPronta possui uma landing page e um fluxo de criação, pagamento e entrega robustos, porém:

1. **Transparência e Credibilidade Legal:** O rodapé é mínimo e não exibe dados cadastrais formais (Razão Social, CNPJ, e-mail de contato e link de suporte), o que pode gerar desconfiança em microempresários acostumados a golpes via Pix na internet.
2. **Conformidade Regulatória (LGPD e CDC):** Não existem rotas dedicadas e transparentes de Termos de Uso e Política de Privacidade que esclareçam expressamente os direitos do consumidor, a ausência de assinatura ou cobrança recorrente (produto avulso a R$ 9,90), as regras de regeneração por IA (limite de 3 tentativas em até 30 minutos) e o ciclo de vida dos arquivos gerados (retenção segura de 7 dias com links assinados).
3. **Privacidade e Consentimento de Cookies:** Não há banner de consentimento de cookies em conformidade com a LGPD para visitantes no primeiro acesso mobile/desktop.
4. **Métricas de Aquisição e ROI de Anúncios:** Não existe uma camada centralizada e tipada para disparar eventos de conversão (Meta Pixel e Google Ads: `PageView`, `InitiateCheckout`, `Purchase`) quando o usuário navega, gera o Pix ou confirma o pagamento, limitando a mensuração de tráfego pago.
5. **Canal de Atendimento de Suporte Ágil:** Clientes com dúvidas no momento do checkout ou pós-pagamento não possuem um botão flutuante e acessível para tirar dúvidas no WhatsApp oficial de suporte com mensagem pré-formatada contextualizada.

---

## Solution

Criar uma solução integrada de **Confiança, Legalidade e Rastreamento (`Trust & Compliance`)** mobile-first, composta por:

1. **Configuração Unificada de Identidade Legal e Suporte (`compliance-config`):**
   - Centralizar na configuração pública do cliente (`client-env.ts` / catálogo tipado `legal-company.ts`) as informações cadastrais e de suporte:
     - `legalName` (Razão Social, padrão: _"OfertaPronta Tecnologia Ltda"_ ou configurável via `VITE_PUBLIC_LEGAL_NAME`)
     - `tradeName` (Nome Fantasia: _"OfertaPronta"_)
     - `cnpj` (padrão: _"00.000.000/0001-00"_ ou `VITE_PUBLIC_LEGAL_CNPJ`)
     - `contactEmail` (padrão: _"contato@ofertapronta.com.br"_ ou `VITE_PUBLIC_CONTACT_EMAIL`)
     - `supportWhatsapp` (número com DDI/DDD: `VITE_PUBLIC_SUPPORT_WHATSAPP` ou fallback de demonstração `5511999999999`)
     - `whatsappDefaultMessage` (_"Olá! Preciso de ajuda com meu pedido no OfertaPronta."_)
     - `tracking`: `VITE_PUBLIC_META_PIXEL_ID` e `VITE_PUBLIC_GOOGLE_ADS_ID`.

2. **Páginas Institucionais Legais Dedicadas:**
   - Rota `/termos` (`src/routes/termos.tsx`): Regras de serviço claras, transparentes e redigidas em linguagem acessível ao microempresário:
     - Pagamento avulso de R$ 9,90 (sem assinatura, sem renovação automática ou pegadinhas).
     - Entregáveis: 2 cards em alta resolução (Feed 1080×1350 e Story 1080×1920).
     - Política de Regeneração: até 3 regenerações guiadas com IA dentro da janela de 30 minutos pós-compra.
     - Guarda de arquivos: 7 dias de retenção segura para download.
     - Responsabilidade do usuário pelo conteúdo promocional e direitos de imagem.
   - Rota `/privacidade` (`src/routes/privacidade.tsx`): Transparência LGPD:
     - Dados coletados: informações da promoção, número de WhatsApp para recuperação e comprovantes Pix.
     - Não exigência de login ou senha.
     - Armazenamento temporário seguro e direito de exclusão conforme LGPD.
     - Uso de cookies estritamente necessários e métricas agregadas de anúncios.

3. **Rodapé Enriquecido (`LandingFooter`) e Botão Flutuante de Suporte (`FloatingWhatsappSupport`):**
   - Atualizar `src/components/shared/landing-footer.tsx` para exibir a identidade visual, dados cadastrais (Razão Social, CNPJ, Contato), links rápidos para `/termos` e `/privacidade`, e botão direto de WhatsApp.
   - Criar componente acessível `FloatingWhatsappSupport` (posicionado com segurança em `bottom-4 right-4` no mobile e desktop, respeitando barras de ação fixas do assistente de criação).

4. **Banner de Consentimento LGPD (`CookieConsentBanner`):**
   - Notificação mobile-first não obstrutiva no rodapé da viewport para usuários novos.
   - Persistência imediata da preferência em `localStorage` (`ofertapronta_cookie_consent = 'accepted'`).
   - Se já aceito, não volta a renderizar.

5. **Infraestrutura Isomórfica de Tracking de Conversão (`analytics-tracker`):**
   - Módulo leve `src/lib/tracking.ts` com disparador seguro:
     - `trackPageView(path: string)`
     - `trackInitiateCheckout(orderId: string, amountCents: number)`
     - `trackPurchase(orderId: string, amountCents: number, txId?: string)`
   - Carregamento assíncrono condicional dos scripts do Meta Pixel e Google Ads (gtag) apenas se os IDs estiverem preenchidos no ambiente, com fallback seguro in-memory (no-op) em desenvolvimento/testes para evitar erros de renderização ou quebras de hydration.
   - Integração reativa automática:
     - Disparo de `InitiateCheckout` na tela `checkout.$orderId.tsx`.
     - Disparo de `Purchase` na tela `pedido.$orderId.tsx` quando `status === 'PAID'`.

---

## User Stories

1. As a **microempresário navegando na landing page**, I want to **visualizar os dados cadastrais da empresa (Razão Social, CNPJ e canal de contato) no rodapé**, so that **eu tenha certeza de que a plataforma é uma empresa idônea antes de gerar meu Pix**.
2. As a **microempresário com dúvidas antes ou depois de comprar**, I want to **clicar em um botão de WhatsApp flutuante ou no rodapé com mensagem pré-formatada**, so that **eu possa conversar diretamente com o suporte sem precisar digitar o contexto do zero**.
3. As a **visitante acessando o site pela primeira vez**, I want to **visualizar um aviso claro e simples sobre cookies e privacidade com um botão 'Entendi'**, so that **eu tenha controle e conhecimento do uso de cookies conforme a LGPD**.
4. As a **comprador que aceitou o banner de cookies**, I want to **não ver mais o banner nas próximas visitas do mesmo navegador**, so that **minha navegação seja limpa e sem distrações**.
5. As a **usuário interessado nas regras do serviço**, I want to **acessar a página /termos a partir do rodapé ou do checkout**, so that **eu confirme que o pagamento de R$ 9,90 é avulso, sem cobrança recorrente, e entenda o limite de 3 regenerações por IA e 7 dias de download**.
6. As a **usuário preocupado com seus dados promocionais e fotos enviadas**, I want to **acessar a página /privacidade**, so that **eu veja com clareza quais dados são coletados, como são guardados e como a plataforma cumpre a LGPD**.
7. As a **gestor de tráfego / administrador do OfertaPronta**, I want that **os eventos de PageView, InitiateCheckout e Purchase sejam enviados automaticamente ao Meta Pixel e Google Ads quando os IDs estiverem configurados**, so that **eu possa mensurar o custo por aquisição e otimizar campanhas de tráfego pago**.
8. As a **desenvolvedor rodando a aplicação em testes ou sem IDs de tracking configurados**, I want that **o módulo de tracking opere silenciosamente sem erros de console ou falhas de hidratação**, so that **a estabilidade da aplicação seja 100% preservada**.

---

## Implementation Decisions

### 1. Dados Legais e Configuração Centralizada

- Criar `src/lib/legal-company.ts` com tipagem Zod e fallbacks determinísticos:
  ```ts
  export interface CompanyLegalProfile {
    legalName: string;
    tradeName: string;
    cnpj: string;
    contactEmail: string;
    supportWhatsapp: string;
    supportWhatsappUrl: string;
    addressCityState: string;
  }
  ```
- O helper `getCompanyLegalProfile()` obtém valores via `clientEnv` ou fallbacks seguros ("OfertaPronta Tecnologia Ltda", "00.000.000/0001-00", etc.).
- Atualizar `client-env.ts` para registrar opcionais tipados:
  - `VITE_PUBLIC_LEGAL_NAME`
  - `VITE_PUBLIC_LEGAL_CNPJ`
  - `VITE_PUBLIC_CONTACT_EMAIL`
  - `VITE_PUBLIC_SUPPORT_WHATSAPP`
  - `VITE_PUBLIC_META_PIXEL_ID`
  - `VITE_PUBLIC_GOOGLE_ADS_ID`

### 2. Módulo de Tracking e Analytics (`src/lib/tracking.ts`)

- Módulo profundo com interface pública concisa:
  - `initTrackingScripts(): void`
  - `trackPageView(pageUrl?: string): void`
  - `trackInitiateCheckout(orderId: string, amountCents: number): void`
  - `trackPurchase(orderId: string, amountCents: number, txId?: string): void`
- Suporte a Meta Pixel (`window.fbq`) e Google Ads / Gtag (`window.gtag`).
- Defesas estritas:
  - Verificação de execução no browser (`typeof window !== 'undefined'`).
  - Verificação de presença dos IDs antes de tentar injetar scripts de terceiros.
  - Idempotência no disparo de `trackPurchase` (usando `sessionStorage` ou flag local por `orderId` para evitar duplicidade de compra se o usuário der refresh na tela `pedido.$orderId`).

### 3. Rotas Institucionais Legais

- Criar `src/routes/termos.tsx` e `src/routes/privacidade.tsx` utilizando componentes semânticos do `shadcn/ui` (`Typography`, `Card`, `Separator`, `Button`) e layout consistente com `LandingHeader` e `LandingFooter`.
- Textos redigidos de forma jurídica sólida e comercialmente transparente para o modelo do OfertaPronta.

### 4. Componentes de UI Mobile-First

- `src/components/shared/cookie-consent-banner.tsx`:
  - Fixed banner no rodapé (com z-index adequado, animação suave e botão "Entendi" acessível).
  - Escuta `localStorage.getItem("ofertapronta_cookie_consent")`.
- `src/components/shared/floating-whatsapp-support.tsx`:
  - Botão flutuante acessível (ícone WhatsApp/MessageSquare, tooltip, link `target="_blank"` com `rel="noopener noreferrer"`).
  - Ocultado se a rota atual exigir foco total (ex.: no assistente de criação móvel, para não sobrepor o footer de ação fixo).
- `src/components/shared/landing-footer.tsx`:
  - Refatorado para incluir CNPJ, Razão Social, E-mail, links para `/termos` e `/privacidade`, mantendo estética limpa e sem ruído visual.

---

## Testing Decisions

1. **Unidade / Módulos:**
   - Testar `src/lib/legal-company.test.ts`: verificar se fallback padrão funciona e se a geração de URL do WhatsApp formata corretamente o número e o texto codificado URI.
   - Testar `src/lib/tracking.test.ts`: verificar chamadas seguras para `trackPageView`, `trackInitiateCheckout` e `trackPurchase` tanto com scripts mockados em `window` quanto em ambiente sem tracking (zero throws).
2. **Componentes e Acessibilidade:**
   - Testar `cookie-consent-banner.test.tsx`: garantir que o banner é renderizado inicialmente, que ao clicar em "Entendi" grava no `localStorage` e some da tela.
   - Testar `floating-whatsapp-support.test.tsx`: verificar link para WhatsApp correto com texto contextual.
   - Testar `landing-footer.test.tsx`: verificar presença dos links para `/termos`, `/privacidade`, CNPJ e dados cadastrais.
3. **Páginas e Rotas:**
   - Testes de renderização para as rotas `/termos` e `/privacidade` garantindo que os termos do modelo avulso de R$ 9,90, 3 regenerações e retenção de 7 dias estão presentes no documento.

---

## Out of Scope

- Plataforma de consentimento avançada multinível estilo OneTrust/Cookiebot (YAGNI; o modelo atual não vende dados nem usa rastreamento intrusivo).
- Sistema de tickets/chat ao vivo integrado (o WhatsApp oficial atende 100% da demanda do microempresário).
- Checkout de pagamentos recorrentes ou gestão de assinaturas (o modelo é 100% transacional avulso R$ 9,90 via Pix).
- Painel de administração de edição de termos de uso no banco de dados (conteúdo estático versionado no código atende com máxima performance e zero complexidade).
