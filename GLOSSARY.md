# OfertaPronta — Glossário Canônico de Domínio

O OfertaPronta é uma plataforma web mobile-first para pequenos estabelecimentos de alimentação criarem e adquirirem artes promocionais profissionais prontas para o Instagram em até 90 segundos sem cadastro prévio.

---

## 1. Termos de Domínio do Negócio

**Campaign (Campanha)**:
A unidade de entrega comercial contratada pelo comerciante, composta pela arte promocional formatada simultaneamente para Instagram Feed (1080×1350) e Story (1080×1920).
_Avoid_: Post, banner, flyer, anúncio, arte avulsa

**Draft (Rascunho)**:
Os dados da oferta preenchidos e editados pelo comerciante na sessão antes de realizar o pagamento.
_Avoid_: Formulário, sessão, carrinho, proposta

**Dual Image Mode (Modo Dual de Imagem)**:
A capacidade da oferta de utilizar uma fotografia enviada diretamente pelo comerciante ou uma imagem gastronômica foto-realista gerada sob demanda por IA.
_Avoid_: Foto fake, gerador genérico, prompt livre

**Frozen Snapshot (Snapshot Congelado)**:
O registro imutável de textos, referências de imagem, template e valor financeiro (R$ 9,90) gravado no momento em que a cobrança do pedido é gerada.
_Avoid_: Payload, estado do pedido, cópia do formulário

**Order (Pedido)**:
O registro transacional da compra de uma campanha promocional avulsa por R$ 9,90 via Pix.
_Avoid_: Compra, transação, checkout, fatura

**Payment Charge (Cobrança Pix)**:
A cobrança Pix dinâmica emitida junto ao provedor com QR Code, linha digitável Pix Copia e Cola, identificador único e tempo de expiração.
_Avoid_: Boleto, fatura, Pix avulso

**Watermark (Marca d'Água)**:
A sobreposição visual semitransparente aplicada diagonalmente sobre a arte durante a visualização prévia gratuita para proteger o trabalho antes do pagamento.
_Avoid_: Logo de prévia, overlay, trava visual

**Export (Arquivo Final)**:
Os dois arquivos de imagem PNG em alta resolução (1080×1350 e 1080×1920) gerados sem marca d'água após confirmação do Pix, protegidos por links temporários assinados.
_Avoid_: Download, entrega, anexo, render

---

## 2. Termos de Arquitetura e Módulos Profundos (`/codebase-design`)

**AiImageGenerator**:
Módulo profundo do backend (`src/features/promotions/server/ai-image.ts`) responsável por formular prompts fotográficos gastronômicos, consultar a Gemini Imagen API e aplicar a política de cotas de geração.
_Avoid_: Serviço de IA, wrapper Gemini, helper de imagem

**TemplateEngine**:
Módulo puro e isomórfico (`src/features/templates/engine/`) que renderiza os dados da oferta em strings SVG vetoriais idênticas tanto no navegador quanto no servidor.
_Avoid_: Gerador de tela, componente de preview, renderizador HTML

**ExportEngine (`CampaignArtisan`)**:
Módulo profundo de infraestrutura (`src/server/export-engine/`) que rasteriza o SVG vetorial em PNGs de alta fidelidade via Resvg/Sharp e realiza a persistência segura no storage.
_Avoid_: Conversor PNG, serviço de upload, exportador

**PixCheckout**:
Módulo profundo financeiro (`src/features/checkout/server/pix-checkout.ts`) que gerencia a máquina de estados de cobrança Pix, validação HMAC de webhooks e garantia de idempotência.
_Avoid_: Gateway Pix, webhook handler, controller de pagamento
