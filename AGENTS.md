## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).


# Diretrizes do Workspace — OfertaPronta (Full-Stack TanStack Start)

Este arquivo é a fonte única de regras e arquitetura do repositório para agentes no Codex e no Gemini. O `GEMINI.md` da raiz encaminha o Gemini para estas mesmas regras. Aplique as regras do projeto independentemente do nome das ferramentas oferecidas pelo ambiente; use apenas ferramentas realmente disponíveis na sessão.

---

## 1. Visão Geral do Projeto — OfertaPronta

O **OfertaPronta** é uma plataforma web mobile-first voltada para pequenos comerciantes de alimentação (hamburguerias, pizzarias, açaíterias e delivery em geral) criarem artes promocionais profissionais prontas para publicação no Instagram (Feed 1080×1350 e Story 1080×1920) em menos de 90 segundos, sem necessidade de cadastro ou conhecimento de design.

- **Proposta de Valor:** "Sua promoção pronta para postar, sem precisar saber design."
- **Modelo de Negócio (MVP):** R$ 9,90 por campanha (1 design nos 2 formatos: Feed e Story), com pagamento avulso via Pix (QR Code e Copia e Cola) e entrega automática dos arquivos em alta resolução após confirmação via webhook.
- **Princípio Fundamental:** Validar a experiência de ponta a ponta (criação rápida sem login, prévia com marca d'água, checkout Pix e geração/entrega de PNGs fiéis) com extrema simplicidade e sem bloat (YAGNI).

---

## 2. Stack Tecnológica Oficial

| Camada | Tecnologia | Detalhes & Responsabilidades |
|---|---|---|
| **Framework Full-Stack** | **TanStack Start** | React 19 + TanStack Router + Vite / Vinxi / Nitro (SSR, File-based Routing, RPC via Server Functions). |
| **Frontend & UI** | **Tailwind CSS v4 + shadcn/ui** | Design system mobile-first, primitivos Radix UI, Lucide Icons, tipografia moderna (Inter + Space Grotesk). |
| **Client State & Cache** | **TanStack Query v5** | Cache de dados assíncronos, polling de status de pagamento e mutations tipadas. |
| **Backend / Server Layer** | **Server Functions + API Routes** | `createServerFn` para RPC tipado end-to-end com Zod; `createAPIFileRoute` para Webhooks (Pix) e streaming binário de downloads. |
| **Arquitetura de Backend** | **Clean Architecture / Hexagonal** | Domínio e casos de uso isolados de transporte (HTTP) e persistência (ORM/APIs externas). |
| **Banco de Dados & ORM** | **PostgreSQL + Drizzle ORM** | Schemas tipados em TypeScript, migrações seguras, transações atômicas e consultas de alta performance. |
| **Renderização Gráfica** | **SVG + @resvg/resvg-js + Sharp** | Templates baseados em SVG vetorial determinístico renderizados no servidor em PNGs de alta resolução com e sem marca d'água. |
| **Gateway de Pagamento** | **Woovi / OpenPix (Pix Dinâmico)** | Cobranças Pix instantâneas com webhook idempotente assinado via HMAC. |
| **Storage de Mídia** | **Cloudinary ou S3-Compatible** | Armazenamento de fotos/logos de entrada e arquivos PNG finais exportados com URLs temporárias/assinadas. |
| **Testes & Qualidade** | **Vitest + Testing Library** | TDD (Red-Green-Refactor) com suítes unitárias, integração de rotas e testes visuais de templates. |

---

## 3. Arquitetura de Pastas e Estrutura de Código

A estrutura do projeto combina a **modularidade orientada a features** (inspirada no `dorama/web`) com um **backend full-stack robusto e isolado**:

```
src/
├── api/                             # Clientes HTTP auxiliares e tratamento de erros do frontend
│   ├── client.ts                    # Utilitários de fetch/axios e interceptores de erro
│   └── handle-api-error.ts          # Mapeamento e normalização de erros de API
│
├── components/                      # Componentes visuais transversais
│   ├── ui/                          # Primitivos shadcn/ui estilizados (button, dialog, input, etc.)
│   └── shared/                      # Componentes compartilhados (Header, MobileLayout, PixModal)
│
├── config/                          # Configurações do ambiente com validação Zod
│   ├── client-env.ts                # Variáveis públicas acessíveis no browser (VITE_PUBLIC_*)
│   └── server-env.ts                # [SERVER-ONLY] Segredos de backend (DATABASE_URL, PIX_KEY, S3_SECRET)
│
├── hooks/                           # React hooks globais utilitários (use-mobile, use-copy-to-clipboard)
│
├── lib/                             # Utilitários gerais do frontend
│   ├── query-client.ts              # Instância do TanStack Query Client
│   └── utils.ts                     # Utilitário cn() e formatadores monetários BRL
│
├── routes/                          # File-based routing do TanStack Router / Start
│   ├── __root.tsx                   # Shell raiz da aplicação (HTML, Head, Meta, Providers)
│   ├── index.tsx                    # Landing Page / Apresentação do serviço
│   ├── criar.tsx                    # Wizard de criação (Passo 1: Dados -> Passo 2: Template -> Passo 3: Prévia)
│   ├── checkout.$orderId.tsx        # Tela de pagamento Pix (QR Code + Copia e Cola)
│   ├── pedido.$orderId.tsx          # Tela de entrega com download dos PNGs finais
│   └── api/                         # [HTTP REST Endpoints via createAPIFileRoute]
│       ├── webhooks.pix.ts          # Webhook de confirmação Pix com validação de assinatura HMAC
│       └── downloads.$token.ts      # Endpoint seguro para streaming ou redirecionamento de download do PNG
│
├── styles/                          # Estilização global e tokens Tailwind CSS v4
│   ├── theme.css                    # Variáveis de tema CSS, cores e tokens visuais
│   └── index.css                    # Folha de estilos raiz e resets
│
├── features/                        # Módulos verticais de negócio (Feature-Sliced Design)
│   │
│   ├── promotions/                  # Feature: Rascunhos e Configuração da Oferta
│   │   ├── components/              # PromotionForm, ImageUploader, StepNavigation
│   │   ├── hooks/                   # use-promotion-draft, use-image-upload
│   │   ├── views/                   # CreatePromotionView, PreviewView
│   │   ├── data/                    # Schemas Zod de validação de formulário e DTOs
│   │   └── server/                  # [SERVER-ONLY] Lógica backend da feature
│   │       ├── promotion.schema.ts  # Definição Drizzle das tabelas `drafts` e `campaigns`
│   │       ├── promotion.service.ts # Casos de uso de validação e persistência do rascunho
│   │       └── server-functions.ts  # TanStack Start createServerFn (saveDraftFn, getDraftFn)
│   │
│   ├── templates/                   # Feature: Catálogo de Templates & Motores SVG
│   │   ├── components/              # TemplateSelector, SvgPreviewCanvas
│   │   ├── data/                    # Metadados e definições dos 3 templates (Hamburgueria, Pizzaria, Delivery)
│   │   └── server/                  # [SERVER-ONLY]
│   │       ├── svg-generator.ts     # Gerador determinístico de marcação SVG com textos e imagens embutidas
│   │       └── watermark.ts         # Aplicador de marca d'água vetorial para visualizações gratuitas
│   │
│   ├── checkout/                    # Feature: Criação de Pedidos & Checkout Pix
│   │   ├── components/              # PixQRCodeCard, PixCopiaECola, PaymentPollingIndicator
│   │   ├── hooks/                   # use-pix-checkout, use-order-polling
│   │   ├── views/                   # CheckoutView
│   │   ├── data/                    # Schemas de checkout, DTOs de pagamento e estados
│   │   └── server/                  # [SERVER-ONLY]
│   │       ├── order.schema.ts      # Definição Drizzle das tabelas `orders` e `payment_charges`
│   │       ├── order.service.ts     # Criação de pedidos com preço congelado no backend (R$ 9,90)
│   │       ├── webhook.service.ts   # Processamento idempotente de notificações de pagamento Pix
│   │       └── server-functions.ts  # TanStack Start createServerFn (createOrderFn, getOrderStatusFn)
│   │
│   └── delivery/                    # Feature: Geração de PNGs & Entrega Segura
│       ├── components/              # DownloadCard, ShareButtons, CorrectionNotice
│       ├── hooks/                   # use-delivery-status
│       ├── views/                   # OrderDeliveryView
│       ├── data/                    # Tipos de exportação e schemas de download
│       └── server/                  # [SERVER-ONLY]
│           ├── delivery.schema.ts   # Definição Drizzle da tabela `exports`
│           ├── render.worker.ts     # Orquestrador de renderização (SVG -> Sharp/Resvg -> Storage)
│           ├── token.service.ts     # Emissão e validação de tokens privados com retenção de 7 dias
│           └── server-functions.ts  # TanStack Start createServerFn (getDeliveryStatusFn)
│
└── server/                          # [SERVER-ONLY] Infraestrutura Central & Portas/Adaptadores (Clean Arch)
    ├── db/                          # Conexão Drizzle ORM + PostgreSQL
    │   ├── index.ts                 # Conexão de banco e pooling do PostgreSQL
    │   └── schema.ts                # Export consolidado de todos os schemas Drizzle
    ├── storage/                     # Adaptadores de Armazenamento de Arquivos
    │   ├── storage.port.ts          # Contrato StoragePort (upload, getSignedUrl)
    │   └── s3-storage.adapter.ts    # Implementação S3 / Cloudinary
    ├── payment/                     # Adaptadores de Gateway Pix
    │   ├── payment.port.ts          # Contrato PaymentGatewayPort (createCharge, verifyWebhookSignature)
    │   └── openpix.adapter.ts       # Implementação Woovi / OpenPix
    ├── renderer/                    # Adaptadores de Renderização Gráfica
    │   ├── renderer.port.ts         # Contrato ImageRendererPort (renderSvgToPng)
    │   └── resvg-sharp.adapter.ts   # Implementação @resvg/resvg-js e sharp
    └── queue/                       # Fila de Processamento em Segundo Plano
        ├── queue.port.ts            # Contrato JobQueuePort (enqueueRenderJob)
        └── pg-boss.adapter.ts       # Implementação de fila com retry automático (Postgres / pg-boss)
```

---

## 4. Invariantes de Arquitetura e Engenharia

1. **Padrão Obrigatório de Frontend (Mobile-First)**:
   - Todo layout DEVE ser desenvolvido prioritariamente para telas móveis (viewport 360px a 430px), garantindo toque fluido, campos de formulário acessíveis e sem estouro horizontal.
   - Componentes visuais utilizam exclusivamente **Tailwind CSS v4** e primitivos do **shadcn/ui** (Radix UI).
   - Proibido usar elementos HTML nativos sem estilização acessível (`<button>`, `<input>`, etc.).
   - Convenção de nomenclatura kebab-case estrita para arquivos (`pix-qrcode-card.tsx`, `use-order-polling.ts`).

2. **Isolamento Estrito entre Client e Server (Zero Server Code Leaks)**:
   - Arquivos dentro de `src/server/` ou subpastas `server/` dentro de features contêm código que roda **exclusivamente no Node.js**.
   - Dependências nativas de backend (`sharp`, `@resvg/resvg-js`, `pg`, `drizzle-orm`) e segredos de ambiente NUNCA devem ser importados em componentes cliente ou em código executado no navegador.
   - A comunicação entre o frontend e a lógica de backend deve ocorrer exclusivamente através de:
     - **Server Functions (`createServerFn`)**: Validadas obrigatoriamente com Zod tanto na entrada quanto na saída, fornecendo tipagem estrita de ponta a ponta sem expor detalhes internos de banco.
     - **API Routes (`createAPIFileRoute`)**: Reservadas para webhooks externos (`/api/webhooks/pix`) e endpoints binários (streaming protegido de download de PNGs).

3. **Integridade de Negócio e Segurança de Preços**:
   - **Preços são autoritativos do backend**: O frontend NUNCA informa o preço a ser cobrado. O backend determina o valor da campanha (R$ 9,90) e congela o snapshot dos dados (títulos, valores, imagens) no momento da criação do pedido (`orders`).
   - Nenhuma informação de promoção é gerada ou inventada aleatoriamente pelo sistema; se o comerciante não enviar foto, o template deve adotar tipografia de destaque sem produto fictício.

4. **Idempotência e Segurança de Webhooks**:
   - O webhook Pix DEVE validar rigorosamente a assinatura digital (HMAC) enviada pelo provedor de pagamento.
   - O processamento de pagamentos deve ser estritamente idempotente: registrar o identificador da transação e ignorar notificações duplicadas sem gerar novas cobranças ou novos jobs redundantes.
   - Liberação de downloads é restrita a pedidos cujo status de pagamento foi confirmado com sucesso. Arquivos são protegidos por tokens assinados com validade mínima de 7 dias.

5. **Clean Architecture & TDD**:
   - Lógica de negócio, cálculos e transformações de templates residem em serviços puros de domínio, desacoplados de bibliotecas HTTP ou ORM específicos.
   - Aplique TDD (Red → Green → Refactor): escreva testes falhando antes de implementar a lógica de domínio ou endpoints de webhook.
   - Princípios SOLID com **YAGNI radical (Ponytail)**: prefira funções puras e a biblioteca padrão antes de adicionar pacotes pesados; não crie abstrações prematuras ou classes genéricas desnecessárias.

6. **Gerenciamento de Dependências**:
   - Nunca edite manifestos manualmente (`package.json`).
   - Utilize exclusivamente o `pnpm` para adicionar ou remover pacotes:
     - `pnpm add <pacote>`
     - `pnpm add -D <pacote>`

7. **Qualidade e Tipagem Estrita**:
   - TypeScript em modo estrito (`strict: true`) com **zero `any`**.
   - Toda resposta externa (webhooks, APIs parceiras, uploads) deve ser validada na fronteira com schemas Zod.

8. **Segredos e Credenciais**:
   - Nunca registre segredos, tokens de API ou credenciais no Git.
   - Trate `.env`, `.env.local` e credenciais como dados estritamente sensíveis.

---

## 5. Fluxo de Trabalho dos Agentes (Feature Factory)

Para novas fases, funcionalidades ou refatorações:

1. **Context Discovery**: Inspecione o `PRD.md` e a arquitetura em `src/` antes de propor alterações. Mapeie dependências com `graphify query` ou leitura direta.
2. **Gate 0 (/grill-me)**: Se houver qualquer dúvida sobre regras de negócio, UX mobile ou trade-offs técnicos, formule de 2 a 3 perguntas objetivas via `ask_question`.
3. **Planejamento**: Redija a especificação técnica em `docs/plans/<slug>.md` e no artefato `implementation_plan.md` antes de codificar, incluindo diagramas Mermaid de fluxo e ciclo de vida.
4. **Construção Paralela Inteligente**:
   - Despache `backend-builder` para serviços de backend (Server Functions, Drizzle schemas, Webhooks Pix, renderizador SVG/Sharp, portas e adaptadores).
   - Despache `frontend-builder` para rotas TanStack Start, componentes de formulário, preview canvas e telas mobile-first.
5. **Validação & Auditoria Paralelas**:
   - Despache `test-verifier` para rodar a suíte de testes do projeto (`pnpm test`), checagem de tipos (`pnpm typecheck`) e regressões.
   - Despache `implementation-validator` para auditar o diff contra a Spec, SOLID e anti-bloat (`ponytail-review`).
6. **Fechamento**: Apresente o resultado no Gate 3 e registre aprendizados relevantes no ritual `/learn`.

---

## 6. Comandos de Referência do Projeto

```bash
# Instalação e Desenvolvimento
pnpm install            # Instala dependências do monorepo / app
pnpm dev                # Inicia o servidor full-stack TanStack Start em modo desenvolvimento
pnpm build              # Compila o bundle de produção (client + server Nitro)
pnpm preview            # Executa a prévia local do build de produção

# Qualidade e Testes
pnpm test               # Executa os testes unitários e de integração com Vitest
pnpm test:watch         # Executa Vitest em modo interativo
pnpm typecheck          # Validação estrita de tipos TypeScript (tsc --noEmit)
pnpm lint               # Executa linter ESLint

# Banco de Dados & Drizzle ORM
pnpm db:generate        # Gera migrações SQL a partir dos schemas Drizzle
pnpm db:migrate         # Aplica migrações pendentes no banco PostgreSQL
pnpm db:push            # Sincroniza schemas diretamente com o banco de desenvolvimento
pnpm db:studio          # Abre interface gráfica do Drizzle Studio para inspecionar tabelas
```

