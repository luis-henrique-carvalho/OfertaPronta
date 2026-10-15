# GLOSSARY — OfertaPronta

Glossário canônico de termos de domínio e arquitetura do OfertaPronta. Utilize estes termos com exatidão em especificações, discussões e no código (nomes de funções, módulos e tabelas).

---

## 1. Termos de Domínio do Negócio

### Campaign (Campanha)
A unidade de entrega contratada pelo comerciante. Uma campanha engloba as informações da oferta (nome do negócio, produto, preço promocional, foto/logo e chamada para ação) associadas a um template visual renderizado em dois formatos de imagem para o Instagram:
- **Feed Format**: 1080 × 1350 (proporção 4:5).
- **Story Format**: 1080 × 1920 (proporção 9:16).

### Draft (Rascunho)
Os dados transitórios preenchidos pelo usuário durante o fluxo de criação rápida sem login. Pode ser modificado e salvo livremente antes da compra.

### Frozen Snapshot (Snapshot Congelado)
A cópia imutável e autoritativa de todos os textos, referências de imagem, layout escolhido e valor comercial (R$ 9,90) gravada no momento exato em que o pedido é criado. Garante que alterações posteriores no formulário não afetem um pedido já emitido ou pago.

### Order (Pedido)
Registro financeiro da compra avulsa de uma campanha por R$ 9,90. Possui ciclo de vida estrito: `PENDING` &rarr; `PAID` &rarr; `FAILED` / `EXPIRED`.

### Payment Charge (Cobrança Pix)
A cobrança Pix dinâmica emitida junto ao provedor de pagamento (OpenPix / Woovi). Contém o QR Code em imagem, o código Pix Copia e Cola, identificador único da transação e expiração.

### Watermark (Marca d'Água)
Camada vetorial semitransparente ("OfertaPronta — Prévia") inserida diagonalmente sobre as imagens geradas para visualização gratuita antes do pagamento.

### Export (Arquivo Final)
Os dois arquivos PNG em alta resolução gerados sem marca d'água após a confirmação do pagamento, disponibilizados por meio de URLs privadas com validade mínima de 7 dias.

---

## 2. Termos de Arquitetura e Módulos Profundos (`/codebase-design`)

### TemplateEngine
**Módulo profundo e puro** (`src/features/templates/engine/`) que recebe os dados da oferta e gera o markup SVG vetorial determinístico para Feed e Story.
- **Interface**: Função pura `renderTemplateSvg(templateId, data, options: { format, watermark })`.
- **Isomorfismo**: Executado identicamente no navegador (prévia visual em tempo real sem chamadas de rede) e no servidor (entrada para o Resvg).
- **Seam**: Puramente computacional; zero dependências de I/O ou banco.

### ExportEngine (`CampaignArtisan`)
**Módulo profundo de infraestrutura** (`src/server/export-engine/`) responsável por transformar o SVG em PNGs de alta fidelidade e armazená-los.
- **Interface**: `renderAndStore(snapshot: FrozenSnapshot): Promise<ExportResult>`.
- **Implementação**: Oculta internamente a rasterização via `@resvg/resvg-js` + `sharp`, o upload para S3/Cloudinary e a emissão de URLs assinadas/privadas.
- **Superfície de Teste**: Testável de ponta a ponta substituindo apenas o storage por um *in-memory fake* (*replace-don't-layer*).

### PixCheckout
**Módulo profundo de ciclo de vida financeiro** (`src/features/checkout/server/pix-checkout.ts`) que gerencia a emissão de cobranças e a confirmação de pagamento.
- **Interface**:
  - `createCharge(draftSnapshot): Promise<PixChargeResult>`
  - `confirmPayment(payload, signature): Promise<PaymentConfirmationResult>`
- **Implementação**: Oculta o congelamento do snapshot, a chamada à API Pix, a validação de assinatura HMAC e a transação idempotente no banco.
