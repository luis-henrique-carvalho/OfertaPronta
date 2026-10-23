# Pesquisa Técnica & Financeira: Provedores Pix para o Épico 3 (OfertaPronta)

**Status:** Concluído  
**Data:** 16 de Outubro de 2026  
**Contexto:** Épico 3 — Checkout Pix Dinâmico & Confirmação em Tempo Real (`PixCheckout`)  
**Modelo de Negócio:** R$ 9,90 por campanha de Card Publicitário (Feed + Story)

---

## 1. Resumo Executivo & Diagnóstico

O OfertaPronta opera com um ticket unitário de **R$ 9,90** por venda avulsa. Em modelos de micro-transação com margem apertada (devido ao custo de GPU/API multimodal do Google Gemini), **a estrutura de cobrança do gateway de pagamento (taxa percentual vs. taxa fixa em reais) é o fator financeiro mais determinante**.

- **Mercado Pago** desponta como a opção de **menor custo financeiro e menor complexidade operacional**: taxa de **0,99%** sem taxa mínima pesada (~**R$ 0,10** por venda), liberação imediata do saldo, autenticação padrão por token (sem necessidade de certificados digitais mTLS) e suporte nativo a webhook com assinatura HMAC-SHA256 (`x-signature`).
- **AbacatePay** destaca-se pela **melhor experiência de desenvolvimento (DX)** do ecossistema brasileiro (valores nativos em centavos, SDK Node/TS oficial, `llms.txt` para IA, sem certificados mTLS e sem exigir CPF obrigatoriamente para Pix imediato). No entanto, adota uma **taxa fixa de R$ 0,80 por Pix**, o que representa **8,08%** do faturamento bruto no nosso ticket de R$ 9,90 (mais custo de R$ 0,80 a R$ 2,50 por saque).
- **Woovi (OpenPix)** (citada preliminarmente na arquitetura) tem excelente DX e permite emitir cobranças imediatas sem exigir CPF do pagador (menor fricção de UX), porém adota piso mínimo de R$ 0,50 ou plano fixo de **R$ 0,85 por Pix**, o que corrói **8,58%** do faturamento bruto a cada venda de R$ 9,90.
- **Efí Bank (Gerencianet)** possui taxa percentual excelente de **1,19%** (~R$ 0,12), mas impõe a barreira técnica de **mTLS com certificado digital (.p12/.pem)** obrigatório em todas as requisições, elevando a complexidade de deploy em ambientes como Vercel/Docker/Serverless.
- **Asaas** cobra **R$ 1,99 por transação** (ou R$ 0,99 promocional temporário), o que consumiria **20,1%** do ticket do OfertaPronta, tornando-o inviável para este produto.
- **Pushin Pay** cobra taxa fixa de **R$ 0,35** (~3,5%), com API REST direta e sem mTLS, sendo muito usada na comunidade de micro-SaaS, porém sem a governança e capilaridade do Mercado Pago.
- **Stripe Brasil** cobra **1,19%**, porém opera com liquidação em **T+2** (2 dias úteis para repasse) e disponibilização gradual/restrita para Pix local.

---

## 2. Comparativo de Tarifas para o Ticket de R$ 9,90

A tabela abaixo simula o impacto financeiro de cada provedor em 1 venda (R$ 9,90) e no marco de 1.000 vendas (R$ 9.900,00):

| Provedor                       | Modelo de Taxa Pix                      | Custo por Venda (R$ 9,90) | % do Faturamento Bruto | Custo Total em 1.000 Vendas (R$ 9.900) | Liquidação (Saque)                     |
| ------------------------------ | --------------------------------------- | ------------------------- | ---------------------- | -------------------------------------- | -------------------------------------- |
| **Mercado Pago**               | **0,99%**                               | **R$ 0,10**               | **0,99%**              | **R$ 99,00**                           | **Imediato (D+0, Grátis)**             |
| **Efí Bank (Gerencianet)**     | 1,19% (mín. R$ 0,01)                    | R$ 0,12                   | 1,19%                  | R$ 118,80                              | Imediato (D+0)                         |
| **Banco Inter Empresas (API)** | ~0,90% a 0,99% (mín. R$ 0,10)           | R$ 0,10                   | ~1,00%                 | R$ 100,00                              | Imediato (D+0)                         |
| **Pushin Pay**                 | R$ 0,35 fixo                            | R$ 0,35                   | 3,53%                  | R$ 350,00                              | Imediato (D+0)                         |
| **AbacatePay**                 | **R$ 0,80 fixo**                        | **R$ 0,80**               | **8,08%**              | **R$ 800,00**                          | **Imediato (R$ 0,80 a R$ 2,50/saque)** |
| **Woovi (OpenPix)**            | R$ 0,85 fixo (ou 0,80% c/ piso R$ 0,50) | R$ 0,50 a R$ 0,85         | **5,05% a 8,58%**      | **R$ 500 a R$ 850**                    | Imediato (D+0)                         |
| **Stripe Brasil**              | 1,19%                                   | R$ 0,12                   | 1,19%                  | R$ 118,80                              | **D+2 úteis**                          |
| **Asaas**                      | R$ 1,99 fixo                            | R$ 1,99                   | **20,10%**             | **R$ 1.990,00**                        | D+1 / Imediato                         |

> **Impacto no Lucro:** Optar por Mercado Pago em vez de AbacatePay ou Woovi economiza entre **R$ 700 e R$ 750 a cada 1.000 transações**, valor que cobre diretamente o custo de API do Gemini para centenas de gerações de cards.

---

## 3. Análise Detalhada dos Principais Provedores

### 3.1. Mercado Pago (Checkout Transparente / Payments API)

- **Avaliação Geral:** **Altamente Recomendado (Nota 9.5/10)**
- **Documentação Oficial:** [Mercado Pago Developers — Integrar Pix](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix)
- **Como Funciona:**
  - O backend faz `POST https://api.mercadopago.com/v1/payments` enviando `transaction_amount: 9.90`, `payment_method_id: "pix"`, e os dados do pagador (`payer`).
  - A resposta retorna o `point_of_interaction.transaction_data.qr_code` (Pix Copia e Cola) e `point_of_interaction.transaction_data.qr_code_base64` (imagem do QR Code já codificada em Base64).
- **Segurança & Webhook:**
  - Notificações via HTTP POST com cabeçalho `x-signature` contendo `ts` e `v1`.
  - Validação via HMAC-SHA256 (`id:${dataId};request-id:${xRequestId};ts:${ts};`) usando chave secreta da aplicação (`MERCADOPAGO_WEBHOOK_SECRET`).
  - Suporta cabeçalho `X-Idempotency-Key` na criação da cobrança para evitar duplicidade.
- **Prós:**
  - Menor taxa do mercado sem teto abusivo (0,99% = ~10 centavos).
  - Saldo disponível na hora na conta Mercado Pago.
  - Autenticação simples por `Bearer AccessToken` (sem necessidade de arquivos de certificados).
  - Aceita tanto Pessoa Física (PF) quanto MEI / PJ.
  - Suporte a Sandbox completo com simuladores de pagamento.
- **Contras / Ponto de Atenção de UX:**
  - Para evitar rejeições do antifraude do Mercado Pago (erro `400 Bad Request`), o objeto `payer` deve conter `email`, `first_name`, `last_name` e `identification: { type: "CPF", number: "..." }`.
  - Isso requer que a tela de checkout capture o CPF do comprador, adicionando um campo ao formulário mobile.

---

### 3.2. AbacatePay

- **Avaliação Geral:** **Melhor DX e ecossistema dev, mas taxa fixa desfavorável para micro-ticket (Nota 8.0/10)**
- **Documentação Oficial:** [AbacatePay Docs](https://docs.abacatepay.com) | Contexto IA: [abacatepay.com/llms.txt](https://abacatepay.com/llms.txt)
- **Como Funciona:**
  - Desenvolvida no Brasil especificamente para desenvolvedores, criadores e micro-SaaS.
  - O backend faz chamada ao endpoint de criação de cobrança/cliente enviando o valor em **centavos** (`price: 990`), alinhando-se diretamente ao nosso schema Drizzle (`amountCents`).
  - O cadastro de cliente (`/v2/customers/create`) exige apenas `email` de forma estrita; o CPF (`taxId`) é opcional para gerar Pix imediato.
  - O checkout transparente Pix entrega diretamente o código `brCode` (Pix Copia e Cola).
- **Segurança & Webhook:**
  - Dupla camada de proteção: Secret no query parameter da URL (`?webhookSecret=...`) + assinatura no cabeçalho HTTP `X-Webhook-Signature` via HMAC-SHA256 validada com chave pública.
- **Prós:**
  - DX excepcional: SDK oficial para Node.js/TypeScript (`abacatepay`), tipagem estrita, documentação otimizada para agentes de IA (`llms.txt`).
  - API nativa em centavos inteiros (`amountCents`).
  - Alternância transparente entre ambiente de testes (`devMode`) e produção apenas trocando a chave de API.
  - Onboarding ágil tanto para Pessoa Física quanto Pessoa Jurídica.
  - Não exige envio obrigatório de CPF para emissão de Pix imediato.
- **Contras:**
  - **Taxa fixa de R$ 0,80 por Pix recebido**: Em uma venda de R$ 9,90, isso retém **8,08%** da receita bruta (contra 0,99% do Mercado Pago).
  - **Tarifa de Saque (Payout):** Os primeiros 21 saques do mês custam R$ 0,80 cada; a partir do 22º saque custa R$ 2,50 por operação (saque mínimo R$ 3,50). No Mercado Pago, o saldo pode ser transferido via Pix sem custo.

---

### 3.3. Woovi / OpenPix

- **Avaliação Geral:** **Boa alternativa para UX sem CPF, porém onerosa para micro-ticket (Nota 7.5/10)**
- **Documentação Oficial:** [Woovi Developers — Charges API](https://openpix.com.br)
- **Como Funciona:**
  - O backend faz `POST /api/v1/charge` enviando `correlationID`, `value: 990` e `comment`.
  - O envio de `customer.taxID` (CPF) é **opcional** para cobranças imediatas, permitindo que o microempresário gere o Pix apenas informando e-mail ou WhatsApp.
- **Segurança & Webhook:**
  - Webhook instantâneo com assinatura HMAC e suporte a WebSocket para acompanhamento em tempo real.
- **Prós:**
  - Menor atrito no checkout: permite checkout anônimo ou sem digitação de CPF.
  - Foco 100% nativo em Pix com confirmações submétricas.
- **Contras:**
  - Custo por transação (R$ 0,50 a R$ 0,85) drena entre 5% e 8,5% da margem do produto de R$ 9,90.
  - Exige cadastro e aprovação de conta PJ na instituição.

---

### 3.3. Efí Bank (antiga Gerencianet)

- **Avaliação Geral:** **Ótima taxa, porém alta complexidade de infraestrutura mTLS (Nota 7.0/10)**
- **Documentação Oficial:** [Efí Developers — API Pix BACEN](https://dev.sejaefi.com.br)
- **Como Funciona:**
  - Implementa rigorosamente os endpoints do Banco Central (`/v2/cob`).
  - Autenticação via OAuth2 com Basic Auth (`client_id` + `client_secret`) e certificado digital mútuo (**mTLS**).
- **Prós:**
  - Taxa muito competitiva: 1,19% sem mensalidade (R$ 0,12 por transação).
  - Instituição bancária sólida no Brasil com suporte robusto a MEI e PJ.
- **Contras:**
  - Exige gerar e manter um certificado digital `.p12`/`.pem` no servidor. Em ambientes modernos serverless (Vercel, Cloudflare, Netlify) ou contêineres Docker, gerenciar certificados mTLS em memória/disco adiciona atrito e fragilidade operacional de renovação.

---

### 3.4. Pushin Pay

- **Avaliação Geral:** **Simples e acessível, mas fintech de nicho (Nota 7.0/10)**
- **Documentação Oficial:** [Pushin Pay Docs](https://pushinpay.com.br)
- **Como Funciona:**
  - Criada com foco em infoprodutos e micro-SaaS.
  - API REST direta com `Bearer Token`, emissão de QR Code Pix e webhooks.
- **Prós:**
  - Taxa fixa baixa de R$ 0,35 por transação (3,5%).
  - Não exige certificados mTLS e aceita PF e PJ com facilidade.
- **Contras:**
  - Menor histórico institucional e governança de risco que Mercado Pago ou Efí.
  - Taxa fixa de R$ 0,35 ainda é mais de 3 vezes mais cara que o Mercado Pago (R$ 0,10).

---

### 3.5. Asaas

- **Avaliação Geral:** **Descartado para o OfertaPronta (Nota 4.0/10)**
- **Motivo:** A taxa de R$ 1,99 por Pix recebido (mesmo com eventuais R$ 0,99 em meses promocionais) foi desenhada para faturas e mensalidades de tickets mais altos (R$ 100 a R$ 500). Para R$ 9,90, 20% do valor bruto seria retido pelo gateway.

---

### 3.6. Stripe Brasil

- **Avaliação Geral:** **Inconveniente para fluxo instantâneo (Nota 5.5/10)**
- **Motivo:** Embora a DX seja padrão ouro internacional, a Stripe liquida o Pix em **T+2** (dois dias úteis para transferir para a conta bancária) e o Pix para contas brasileiras ainda possui limitações e verificações manuais de ativação, sem vantagem frente ao Mercado Pago.

---

## 4. Análise de Aderência à Arquitetura do OfertaPronta

O projeto adota os princípios de **Deep Modules** e **Isolamento Estrito Client/Server**:

```
src/features/checkout/
├── components/          # PixQRCodeCard, PixCopiaECola, PaymentPollingIndicator
├── hooks/               # use-pix-checkout, use-order-polling
├── views/               # CheckoutView
└── server/
    ├── functions/       # checkout.functions.ts (RPC createServerFn com Zod)
    └── services/        # pix-checkout.service.ts (Módulo profundo com máquina de estados)

src/routes/api/
└── webhooks.pix.ts      # createAPIFileRoute fino que delega a validação HMAC ao serviço
```

### O que o schema do banco (`orders` e `payment_charges`) já espera:

- `txId`: Identificador da transação do gateway (ex: `payment.id` do Mercado Pago).
- `qrCodeImageUrl`: Link da imagem do QR Code ou Base64 (`data:image/png;base64,...`).
- `copiaECola`: Linha digitável EMV do Pix Copia e Cola.
- `amountCents`: 990 (fixo no backend).
- `status`: `"PENDING"` -> `"PAID"` | `"EXPIRED"`.
- `paidAt`: Timestamp de confirmação.

Tanto o **Mercado Pago** quanto a **Woovi** se encaixam como uma luva nesta estrutura. O Mercado Pago já entrega o código Copia e Cola e o QR Code em base64 prontos na resposta do `/v1/payments`, evitando qualquer dependência adicional de geração de QR Code no frontend ou backend.

---

## 5. Matriz de Decisão: Mercado Pago vs. AbacatePay vs. Woovi vs. Efí

| Critério                    | Mercado Pago                | AbacatePay               | Woovi (OpenPix)               | Efí Bank                       |
| --------------------------- | --------------------------- | ------------------------ | ----------------------------- | ------------------------------ |
| **Taxa em R$ 9,90**         | **R$ 0,10 (0,99%)** 🏆      | R$ 0,80 (8,08%)          | R$ 0,50 a R$ 0,85 (5% a 8,5%) | R$ 0,12 (1,19%)                |
| **Exigência de CPF**        | Sim (no pagador)            | Não (opcional) 🏆        | Não (opcional) 🏆             | Sim (no pagador)               |
| **Autenticação**            | Token Simples 🏆            | Token Simples 🏆         | Token Simples 🏆              | Certificado mTLS (.p12) ⚠️     |
| **Complexidade Deploy**     | Zero (Apenas env var) 🏆    | Zero (Apenas env var) 🏆 | Zero (Apenas env var) 🏆      | Média (gestão de arquivo .p12) |
| **Validação Webhook**       | HMAC-SHA256 (`x-signature`) | Secret URL + HMAC-SHA256 | HMAC-SHA256                   | mTLS ou HMAC                   |
| **Custo de Saque (Payout)** | Gratuito (D+0) 🏆           | R$ 0,80 a R$ 2,50/saque  | Gratuito (> R$ 500)           | Gratuito / Variável            |
| **Abertura de Conta**       | PF, MEI ou PJ 🏆            | PF, MEI ou PJ 🏆         | PJ Obrigatório                | MEI ou PJ                      |

---

## 6. Decisão Estratégica & Recomendação Arquitetural

### 🎯 Decisão Aprovada: Pushin Pay (Foco em Zero Fricção + Menor Custo Fixo)

Avaliando a jornada mobile do microempresário (donos de salão, restaurantes, mercados), **a redução de fricção supera a economia marginal de taxas**. Exigir CPF no celular geraria alto abandono de checkout.

**Pushin Pay foi o provedor selecionado para o Épico 3 pelos seguintes motivos:**

1. **Zero Fricção (1 Clique):** O cliente clica em "Liberar Card por R$ 9,90" e o Pix Copia e Cola e QR Code aparecem instantaneamente, **sem necessidade de preencher CPF, Nome ou E-mail**.
2. **Custo Altamente Competitivo:** Taxa fixa de apenas **R$ 0,35 por Pix** (menos da metade dos R$ 0,80 do AbacatePay e R$ 0,85 da Woovi), retendo apenas **3,53%** do ticket de R$ 9,90.
3. **Engenharia Simples:** API REST pura em centavos (`value: 990`), sem complexidade de certificados mTLS e autenticação via Bearer Token.
4. **Segurança de Webhooks:** Validação por Secret / Header customizado e consulta de reconciliação via API antes de liberar o status `PAID`.
5. **Campo Opcional de Resgate (WhatsApp):** Para proteger o cliente caso ele feche a aba acidentalmente, adicionamos apenas um campo opcional e amigável: _"Seu WhatsApp para envio do link da arte (opcional)"_, sem obrigar preenchimento de documentos.

---

## 7. Fontes Primárias Consultadas

1. **Mercado Pago Developers:**
   - [Documentação Oficial — Criar Pagamento Pix](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix)
   - [Validação de Assinatura de Notificações Webhook (`x-signature`)](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks/validate-signature)
   - [Tabela Oficial de Tarifas e Prazos do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/costs-and-deadlines)
2. **AbacatePay:**
   - [Preços e Tarifas Oficiais da AbacatePay](https://abacatepay.com/pricing)
   - [Documentação da API v2 e Webhooks](https://docs.abacatepay.com)
   - [Documentação para LLMs / Contexto de IA](https://abacatepay.com/llms.txt)
3. **Woovi / OpenPix:**
   - [Tabela de Preços e Planos Oficiais Woovi](https://woovi.com/pricing/)
   - [Documentação da API de Cobranças (Charges API)](https://openpix.com.br/docs)
4. **Efí Bank (Gerencianet):**
   - [Tabela de Custos e Tarifas Efí Pay](https://sejaefi.com.br/tarifas)
   - [Documentação Técnica API Pix com mTLS e OAuth2](https://dev.sejaefi.com.br/docs/api-pix)
5. **Asaas:**
   - [Tabela de Tarifas e Custos de Cobrança](https://asaas.com/precos-e-taxas)
6. **Stripe Brasil:**
   - [Stripe Pricing Brasil — Métodos de Pagamento](https://stripe.com/br/pricing)
   - [Documentação de Integração Pix via PaymentIntents](https://stripe.com/docs/payments/pix)
7. **Pushin Pay:**
   - [Portal e Documentação Técnica Pushin Pay](https://pushinpay.com.br)
