<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

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

O **OfertaPronta** é uma plataforma web mobile-first voltada para **microempresários de diversos segmentos** (donos de supermercado, cabeleireiros, salões de beleza, barbearias, pizzarias, hamburguerias, restaurantes e comércio local) criarem **Cards Publicitários (`Ad Cards`) profissionais gerados por Inteligência Artificial** prontos para publicação no Instagram e WhatsApp (Feed 1080×1350 e Story 1080×1920) em menos de 90 segundos, sem necessidade de cadastro ou conhecimento de design.

- **Proposta de Valor:** *"Seu card publicitário criado por IA e pronto para postar, sem precisar saber design."*
- **Core do Produto (Geração de Card por IA Multimodal):** O microempresário informa os dados da promoção (**Briefing da Oferta**), envia opcionalmente a **Imagem do Produto/Serviço (`Product Image`)** e/ou uma **Imagem de Referência (`Reference Image`)** (ou escolhe um **Estilo Visual (`Style Preset`)**), e a IA gera o **Card Publicitário completo** (cenário, produto, composição gráfica e textos/preços integrados).
- **Modelo de Negócio (MVP):** R$ 9,90 por campanha (o Card Publicitário gerado nos 2 formatos: Feed e Story), com pagamento avulso via Pix (QR Code e Copia e Cola) e entrega automática dos arquivos em alta resolução sem marca d'água após confirmação via webhook (com direito a até 3 regenerações/ajustes por IA pós-pagamento).
- **Princípio Fundamental:** Validar a experiência de ponta a ponta (briefing rápido sem login, geração do card completo por IA, prévia protegida por marca d'água, checkout Pix e entrega em alta resolução) com extrema simplicidade e sem bloat (YAGNI).

---

## 2. Stack Tecnológica Oficial

| Camada | Tecnologia | Detalhes & Responsabilidades |
|---|---|---|
| **Framework Full-Stack** | **TanStack Start** | React 19 + TanStack Router + Vite / Vinxi / Nitro (SSR, File-based Routing, RPC via Server Functions). |
| **Frontend & UI** | **Tailwind CSS v4 + shadcn/ui** | Design system mobile-first, primitivos Radix UI, Lucide Icons, tipografia moderna (Inter + Space Grotesk). |
| **Client State & Cache** | **TanStack Query v5** | Cache de dados assíncronos, polling de status de pagamento e mutations tipadas via Server Functions. |
| **Fronteira RPC & HTTP** | **Server Functions + API Routes** | `createServerFn` para RPC tipado end-to-end com Zod; rota de API exclusivamente para o webhook Pix da Pushin Pay. |
| **Arquitetura de Código** | **Deep Modules & Codebase Design** | Módulos profundos com interfaces concisas e alta localidade; zero portas hipotéticas com único adaptador. |
| **Banco de Dados & ORM** | **PostgreSQL + Drizzle ORM** | Schemas tipados em TypeScript, transações atômicas e snapshots congelados imutáveis. |
| **Motor Central de IA** | **Google Gemini Multimodal Image API (`@google/genai`)** | Módulo profundo `AdCardGenerator` usando `gemini-nano-banana-2.1` / `gemini-3-pro-image` para gerar o Card Publicitário completo fundindo Briefing + Foto do Produto + Imagem de Referência. |
| **Pós-Processamento & Marca d'Água** | **Sharp + @resvg/resvg-js** | Módulo profundo `ExportEngine` para aplicação determinística de marca d'água na prévia gratuita e exportação limpa em alta resolução (1080×1350 e 1080×1920) pós-Pix. |
| **Gateway de Pagamento** | **Pushin Pay (Pix Dinâmico R$ 0,35)** | Módulo profundo `PixCheckout` com máquina de estados, token de segurança, reconciliação ativa e idempotência estrita. |
| **Storage & Exportação** | **S3 / Cloudinary** | Persistência dos insumos e dos PNGs finais de alta resolução (Feed 1080×1350 e Story 1080×1920) com URLs privadas de 7 dias. |
| **Testes & Qualidade** | **Vitest + Testing Library** | TDD nos limites da interface pública dos módulos profundos (replace-don't-layer com fakes in-memory). |

---

## 3. Arquitetura de Pastas e Estrutura de Código (Deep Modules)

A estrutura do projeto combina a **modularidade orientada a features** com **módulos profundos** (eliminando cascas de passagem, wrappers do Axios e portas rasas de único adaptador):

```
src/
├── components/                      # Componentes visuais transversais
│   ├── ui/                          # Primitivos shadcn/ui estilizados (button, dialog, input, etc.)
│   └── shared/                      # Componentes compartilhados (Header, MobileLayout, PixModal)
│
├── config/                          # Configurações do ambiente com validação Zod
│   ├── client-env.ts                # Variáveis públicas acessíveis no browser (VITE_PUBLIC_*)
│   └── server-env.ts                # [SERVER-ONLY] Segredos de backend (DATABASE_URL, GEMINI_API_KEY, PIX_KEY, S3_SECRET)
│
├── hooks/                           # React hooks globais utilitários (use-mobile, use-copy-to-clipboard)
│
├── lib/                             # Utilitários gerais do frontend
│   ├── query-client.ts              # Instância do TanStack Query Client
│   └── utils.ts                     # Utilitário cn() e formatadores monetários BRL
│
├── routes/                          # File-based routing do TanStack Router / Start
│   ├── __root.tsx                   # Shell raiz da aplicação (HTML, Head, Meta, Providers)
│   ├── index.tsx                    # Landing Page / Apresentação do serviço multisegmento
│   ├── criar.tsx                    # Fluxo de criação (Briefing + Upload Produto/Referência -> Geração do Card por IA -> Prévia)
│   ├── checkout.$orderId.tsx        # Tela de pagamento Pix (QR Code + Copia e Cola)
│   ├── pedido.$orderId.tsx          # Tela de entrega com download dos PNGs finais e até 3 regenerações com IA
│   └── api.webhooks.pix.ts          # Adaptador HTTP para o webhook Pix da Pushin Pay (valida payload, reconcilia e delega ao PixCheckout)
│
├── styles/                          # Estilização global e tokens Tailwind CSS v4
│   ├── theme.css                    # Variáveis de tema CSS, cores e tokens visuais
│   └── index.css                    # Folha de estilos raiz e resets
│
├── features/                        # Módulos verticais de negócio (Feature-Sliced Design)
│   │
│   ├── promotions/                  # Feature: Briefing da Oferta, Insumos Visuais e Geração de Card por IA
│   │   ├── components/              # OfferBriefForm, ProductAndReferenceUploader, StylePresetSelector, LiveCardPreview
│   │   ├── hooks/                   # use-promotion-draft, use-ad-card-generator
│   │   ├── views/                   # CreatePromotionView, PreviewView
│   │   ├── data/                    # Schemas Zod de Briefing multisegmento, estilos e DTOs
│   │   └── server/                  # [SERVER-ONLY] Lógica backend da feature
│   │       ├── index.ts             # Ponto único de export público (Server Functions e DTOs)
│   │       ├── functions/           # [FRONTEIRA RPC] TanStack Start createServerFn (drafts.functions.ts, generator.functions.ts)
│   │       └── services/            # [MÓDULOS PROFUNDOS] Regras de negócio puras e Drizzle (drafts.service.ts, ai-card-generator.service.ts)
│   │
│   ├── checkout/                    # Feature: Criação de Pedidos & Checkout Pix
│   │   ├── components/              # PixQRCodeCard, PixCopiaECola, PaymentPollingIndicator
│   │   ├── hooks/                   # use-pix-checkout, use-order-polling
│   │   ├── views/                   # CheckoutView
│   │   ├── data/                    # Schemas de checkout, DTOs de pagamento e estados
│   │   └── server/                  # [SERVER-ONLY]
│   │       ├── index.ts             # Ponto único de export público (Server Functions e DTOs)
│   │       ├── functions/           # [FRONTEIRA RPC] TanStack Start createServerFn (checkout.functions.ts)
│   │       └── services/            # [MÓDULOS PROFUNDOS] Máquina de estados Pix e banco (pix-checkout.service.ts)
│   │
│   └── delivery/                    # Feature: Entrega Segura, Downloads & Regeneração Pós-Compra
│       ├── components/              # DownloadCard, ShareButtons, AiRegenerationPanel
│       ├── hooks/                   # use-delivery-status
│       ├── views/                   # OrderDeliveryView
│       ├── data/                    # Tipos de exportação e schemas de download
│       └── server/                  # [SERVER-ONLY]
│           ├── index.ts             # Ponto único de export público (Server Functions e DTOs)
│           ├── functions/           # [FRONTEIRA RPC] TanStack Start createServerFn (delivery.functions.ts)
│           └── services/            # [MÓDULOS PROFUNDOS] Validação de tokens e liberação (delivery.service.ts)
│
└── server/                          # [SERVER-ONLY] Infraestrutura Central & Módulos Profundos
    ├── db/                          # Conexão Drizzle ORM + PostgreSQL
    │   ├── index.ts                 # Conexão singleton e pooling do PostgreSQL
    │   └── schema/                  # Pasta dedicada aos schemas Drizzle
    │       ├── index.ts             # Export consolidado de todos os schemas
    │       ├── promotions.ts        # Tabelas: drafts e campaigns (com segmento, foto do produto e imagem de referência)
    │       ├── orders.ts            # Tabelas: orders e payment_charges
    │       └── delivery.ts          # Tabela: exports
    └── export-engine/               # [MÓDULO PROFUNDO: WATERMARK, FORMAT & STORAGE]
        ├── index.ts                 # Interface pública única: applyWatermarkAndStore / exportFinalCards
        ├── image-processor.ts       # Aplicação de marca d'água e dimensionamento 1080×1350 e 1080×1920 via Sharp
        └── s3-storage.ts            # Upload para S3/Cloudinary e emissão de URLs privadas com validade de 7 dias
```

---

## 4. Invariantes de Arquitetura e Engenharia

1. **Padrão Obrigatório de Frontend (Mobile-First)**:
   - Todo layout DEVE ser desenvolvido prioritariamente para telas móveis (viewport 360px a 430px), garantindo toque fluido, campos de formulário acessíveis e sem estouro horizontal.
   - Componentes visuais utilizam exclusivamente **Tailwind CSS v4** e primitivos do **shadcn/ui** (Radix UI).
   - Proibido usar elementos HTML nativos sem estilização acessível (`<button>`, `<input>`, etc.). Esta regra é auditada e garantida automaticamente pelo linter `./.agents/scripts/check_shadcn_usage.py`.
   - Convenção de nomenclatura kebab-case estrita para arquivos (`pix-qrcode-card.tsx`, `use-order-polling.ts`).

2. **Isolamento Estrito entre Client e Server (Zero Server Code Leaks)**:
   - Arquivos dentro de `src/server/` ou subpastas `server/` dentro de features contêm código que roda **exclusivamente no Node.js**.
   - Dependências nativas de backend (`sharp`, `@resvg/resvg-js`, `pg`, `drizzle-orm`, `@google/genai`) e segredos de ambiente (`GEMINI_API_KEY`, `DATABASE_URL`) NUNCA devem ser importados em componentes cliente ou em código executado no navegador.
   - A comunicação entre o frontend e a lógica de backend deve ocorrer exclusivamente através de:
     - **Server Functions (`createServerFn`)**: Validadas obrigatoriamente com Zod tanto na entrada quanto na saída, fornecendo tipagem estrita de ponta a ponta sem expor detalhes internos de banco.
     - **API Routes (`createAPIFileRoute`)**: Reservadas para webhooks externos (`/api/webhooks/pix`) e endpoints binários (streaming protegido de download de PNGs).

3. **Integridade de Negócio, Segurança de Preços e Geração de Card por IA Multimodal**:
   - **Preços são autoritativos do backend**: O frontend NUNCA informa o preço a ser cobrado. O backend determina o valor da campanha (R$ 9,90) e congela o snapshot dos dados (`Frozen Snapshot`) no momento da criação do pedido (`orders`).
   - **Geração Completa de Card Publicitário por IA (`AdCardGenerator`)**: O microempresário informa o **Briefing da Oferta** (qualquer segmento: supermercado, salão/barbearia, pizzaria, hamburgueria, restaurante, varejo) e pode enviar opcionalmente a **Imagem do Produto**, a **Imagem de Referência**, ambas ou nenhuma (escolhendo um **Estilo Visual**). A IA multimodal (`gemini-nano-banana-2.1` / `gemini-3-pro-image`) gera o **Card Publicitário completo** com cenário, produto e textos/preços integrados.
   - **Controle de Cotas de IA e Marca d'Água**: Na prévia gratuita, permite-se **1 geração de Card por IA** sempre protegida por marca d'água; pós-pagamento Pix confirmado, os arquivos limpos são liberados e o usuário tem direito a até **3 regenerações/ajustes por pedido** para proteger custos de API.

4. **Idempotência e Segurança de Webhooks**:
   - O webhook Pix DEVE validar o token/secret de segurança enviado pelo provedor de pagamento (Pushin Pay).
   - O processamento de pagamentos deve ser estritamente idempotente: registrar o identificador da transação (`txId`) e ignorar notificações duplicadas sem gerar novas cobranças ou novos jobs redundantes.
   - O backend realiza reconciliação ativa (anti-spoofing) consultando a API da Pushin Pay antes de validar pagamentos em caso de divergência ou fallback.
   - Liberação de downloads sem marca d'água é restrita a pedidos cujo status de pagamento foi confirmado com sucesso (`orders.status === "PAID"`). Arquivos são protegidos por tokens assinados com validade mínima de 7 dias.

5. **Codebase Design & Módulos Profundos (TDD)**:
   - **Módulos Profundos**: Projete **módulos profundos** (uma interface pequena e concisa ocultando uma implementação substancial), proporcionando *leverage* para quem chama e *locality* para quem mantém. Evite módulos rasos que apenas repassam chamadas.
   - **A Interface é a Superfície de Teste**: Chamadores e testes cruzam a mesma costura (*seam*). Não teste além da interface nem crie abstrações apenas para injetar mocks.
   - **Disciplina de Costuras (*Seams*)**: "Um adaptador significa uma costura hipotética; dois adaptadores significam uma costura real." Não introduza interfaces/portas para dependências externas que possuem apenas uma implementação real (como S3 ou Sharp); prefira *replace-don't-layer* com *fakes in-memory* simples nos testes.
   - **O Teste de Deleção**: Se deletar um módulo faz a complexidade desaparecer, ele era uma casca rasa desnecessária e deve ser eliminado; se a complexidade reaparecer espalhada por N chamadores, o módulo ganhou seu lugar.
   - **TDD (Red → Green → Refactor)**: Escreva testes nos limites da interface pública do módulo antes de implementar a lógica interna.

6. **Gerenciamento de Dependências**:
   - Nunca edite manifestos manualmente (`package.json`).
   - Utilize exclusivamente o `pnpm` para adicionar ou remover pacotes:
     - `pnpm add <pacote>`
     - `pnpm add -D <pacote>`

7. **Qualidade e Tipagem Estrita**:
   - TypeScript em modo estrito (`strict: true`) com **zero `any`**.
   - Proibido usar comentários de supressão (`eslint-disable`, `eslint-disable-next-line`, `@ts-ignore`, etc.) ou configurar ignores para burlar regras de lint e tipos. Corrija a causa raiz do problema ou refatore o código em funções/componentes menores.
   - Toda resposta externa (webhooks, APIs parceiras, uploads) deve ser validada na fronteira com schemas Zod.

8. **Segredos e Credenciais**:
   - Nunca registre segredos, tokens de API ou credenciais no Git.
   - Trate `.env`, `.env.local` e credenciais como dados estritamente sensíveis.

9. **Configurações de Desenvolvimento e Integridade de Configurações**:
   - **Proibido alterar ou resetar arquivos de configuração de desenvolvimento**: Arquivos como `eslint.config.js`, `tsconfig.json`, `vitest.config.ts`, `vite.config.ts` e scripts de verificação são estritamente protegidos.
   - **Proibido executar comandos git destrutivos**: Jamais execute `git reset`, `git checkout -- <config>`, `git restore` em arquivos de configuração ou comandos com flags destrutivas (`--hard`, `--force`) para tentar contornar erros ou reverter configurações.
   - Qualquer ajuste nesses arquivos requer solicitação prévia e aprovação explícita do usuário. Violações de regras de lint e tipos devem ser resolvidas exclusivamente através de refatoração do código da aplicação (`src/`).

---

## 5. Fluxo de Trabalho dos Agentes (Feature Factory)

Para novas fases, funcionalidades ou refatorações:

1. **Context Discovery & Worktree Provisioning (`codebase-researcher`)**: Mapeie dependências com `graphify query` (`model: flash`), inspecione `PRD.md`, `GLOSSARY.md` e provisione obrigatoriamente a worktree isolada da feature via `git worktree add .worktrees/<slug> -b feat/<slug>` antes de iniciar qualquer ciclo de planejamento ou construção.
2. **Gate 0 — Produto & Regras de Negócio (`product-manager`, `model: inherit`)**: Despache o `product-manager` para analisar `PRD.md` e `GLOSSARY.md`, caçar lacunas de negócio, casos de borda e fluxos mobile-first, entrevistando o usuário diretamente via `ask_question` (`/grill-me`) até eliminar todos os gaps, salvando a Spec de Produto em `docs/specs/<slug>.md` (`to-spec`) e os tickets verticais em `docs/tickets/<slug>/<NN>-<ticket>.md` (`to-tickets`).
3. **Gate 0 Técnico & Planejamento (`solution-architect`, `model: inherit`)**: Despache o `solution-architect` para auditar Arquitetura (*Deep Modules*), Isolamento Client/Server, Segurança (Zod nas bordas, HMAC, idempotência, preços autoritativos) e Qualidade (SOLID + `ponytail`), entrevistando o usuário via `ask_question` sobre trade-offs técnicos e redigindo a especificação em `docs/plans/<slug>.md` (e `implementation_plan.md`) com diagramas Mermaid obrigatórios.
4. **Construção Paralela Inteligente (`feature-orchestrator`)**:
   - Despache `backend-builder` (`model: flash`) para serviços de backend (Server Functions, Drizzle schemas, `AdCardGenerator` Gemini, Webhooks Pix, `ExportEngine` Sharp/S3).
   - Despache `frontend-builder` (`model: flash`) para rotas TanStack Start, componentes de briefing multisegmento, uploaders de produto/referência, preview de card e telas mobile-first.
5. **Validação & Auditoria Paralelas**:
   - Despache `test-verifier` (`model: flash`) para rodar o pipeline completo de qualidade do projeto via `./.agents/scripts/verify.sh` (ou `./scripts/verify.sh`), checagem estrita de tipos (`pnpm typecheck`), conformidade Shadcn UI, Vitest (`pnpm test`), regressões e o **Dual Browser Audit** (Mobile 390×844 e Desktop 1440×900 no dev server ativo).
   - Despache `implementation-validator` (`model: flash`) para auditar o diff contra a Spec, SOLID e anti-bloat (`ponytail-review`).
6. **Fechamento**: Apresente o resultado no Gate 3 e registre aprendizados relevantes no ritual `/learn`.

---

## 6. Comandos de Referência do Projeto

```bash
# Validação e Qualidade Completa (Pipeline Oficial)
./.agents/scripts/verify.sh          # Executa todo o pipeline (Shadcn UI + Typecheck + ESLint + Vitest + Build)
./.agents/scripts/verify.sh --quick  # Executa sem build (feedback rápido para TDD)
./.agents/scripts/verify.sh --shadcn # Validação isolada de conformidade Shadcn UI / Typography

# Instalação e Desenvolvimento
pnpm install            # Instala dependências do monorepo / app
pnpm dev                # Inicia o servidor full-stack TanStack Start em modo desenvolvimento
pnpm build              # Compila o bundle de produção (client + server Nitro)
pnpm preview            # Executa a prévia local do build de produção

# Qualidade e Testes Isolados
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
