# Pesquisa Técnica: Configuração de Logs do Server no TanStack Start (Zero Server Code Leaks)

**Data:** 17 de Outubro de 2026  
**Status:** Concluído  
**Escopo:** Arquitetura de Logging Server-Side para TanStack Start, eliminação de vazamento para o cliente (Zero Code Leaks) e padronização reutilizável para todos os módulos do OfertaPronta.

---

## 1. Contexto e Objetivos

O projeto **OfertaPronta** utiliza **TanStack Start** (React 19 + TanStack Router + Vite/Nitro) com uma arquitetura de **Módulos Profundos (Deep Modules)** e **Feature-Sliced Design**. Atualmente, existem chamadas esparsas a `console.warn` e `console.error` em arquivos de backend (como `generator.functions.ts` e `ai-card-generator.service.ts`), sem rastreabilidade de correlação (`requestId`), sem padronização estruturada (JSON para observabilidade/produção) e sem garantia formal de ciclo de vida nos endpoints RPC e rotas HTTP.

### Objetivos desta Pesquisa

1. **Investigar o mecanismo nativo de middleware do TanStack Start** contra fontes primárias do framework (`@tanstack/react-start`, `@tanstack/start-client-core`, `@tanstack/start-plugin-core`).
2. **Definir um padrão reaproveitável** para todos os módulos de backend (`promotions`, `checkout`, `delivery`, `export-engine`, `db`, `routes/api.*`).
3. **Garantir Isolamento Estrito (Zero Server Code Leaks)**: comprovar tecnicamente como o código do logger, dependências do Node.js (`node:async_hooks`, etc.) e metadados confidenciais nunca são empacotados no bundle do cliente.
4. **Propor o design arquitetural do módulo profundo `ServerLogger`**, alinhado ao Ponytail (zero bloat, aproveitando primitivos do Node.js) e TDD.

---

## 2. Mecanismos do TanStack Start (Fontes Primárias)

Com base na inspeção direta do código-fonte e documentação embutida de `@tanstack/start-client-core` (v1.170.x) e `@tanstack/start-plugin-core`:

### 2.1. Dois Tipos de Middleware no TanStack Start

Conforme documentado em `node_modules/@tanstack/start-client-core/skills/start-core/middleware/SKILL.md`:

| Característica           | Request Middleware                                                | Server Function Middleware                             |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Escopo**               | Todas as requisições HTTP (SSR, rotas `/api/*`, Server Functions) | Exclusivo para Server Functions RPC (`createServerFn`) |
| **Fases / Métodos**      | `.server()`                                                       | `.client()` e `.server()`                              |
| **Validação de Entrada** | Não                                                               | Sim (`.validator()`)                                   |
| **Criação**              | `createMiddleware()`                                              | `createMiddleware({ type: 'function' })`               |

### 2.2. O Arquivo Global `src/start.ts` e Descoberta Automática

O plugin do compilador do TanStack Start (`@tanstack/start-plugin-core/src/planning.ts`) busca automaticamente o arquivo `src/start.ts`:

```typescript
// planning.ts
const startFilePath = resolveEntry({
  type: "start entry",
  configuredEntry: opts.startConfig.start.entry,
  defaultEntry: "start",
  resolvedSrcDirectory: srcDirectory,
  required: false,
});
```

Quando `src/start.ts` é criado e exporta `startInstance = createStart(...)`, o TanStack Start intercepta todas as execuções do servidor:

```typescript
// src/start.ts
import { createStart, createMiddleware } from "@tanstack/react-start";
import { requestLoggingMiddleware } from "~/server/logger/middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware],
  functionMiddleware: [functionLoggingMiddleware],
}));
```

- **`requestMiddleware`**: Executa no início de qualquer request recebida pelo servidor (rotas SSR, endpoints de webhook como `/api/webhooks/pix` e chamadas RPC de server functions).
- **`functionMiddleware`**: Executa especificamente no pipeline de chamada de qualquer `createServerFn`.

### 2.3. Context Passing e Rastreamento com `AsyncLocalStorage`

O TanStack Start suporta propagação de contexto via `next({ context: { ... } })`. No entanto, passar contexto explicitamente em cada middleware ou função de serviço acopla as assinaturas de métodos (`PixCheckoutService.initiateCheckout(data, ctx)`).

A solução idiomática e de baixo acoplamento para Node.js é o **`AsyncLocalStorage`** nativo (`node:async_hooks`).
Como o método `.server(async ({ next, request }) => ...)` do middleware retorna uma Promise encadeada com `next()`, ao envolver a chamada com:

```typescript
return asyncLocalStorage.run({ requestId, pathname, timestamp }, async () => {
  return await next();
});
```

Qualquer camada síncrona ou assíncrona chamada subsequentemente (serviços de domínio, Drizzle ORM, Google Gemini SDK, Sharp, Pushin Pay SDK) consegue ler `asyncLocalStorage.getStore()` de forma transparente, obtendo o `requestId` sem necessidade de poluir os parâmetros das funções de negócio!

---

## 3. Garantia de Isolamento: Por que Não Vaza para o Cliente?

A invariante 2 do `AGENTS.md` estabelece:

> _"Isolamento Estrito entre Client e Server (Zero Server Code Leaks): Arquivos dentro de src/server/ ou subpastas server/ dentro de features contêm código que roda exclusivamente no Node.js. Dependências nativas de backend e segredos de ambiente NUNCA devem ser importados em componentes cliente ou em código executado no navegador."_

Como o TanStack Start garante isso na prática?

### 3.1. Eliminação de Código no Compilador do TanStack Start

Inspecionando `@tanstack/start-plugin-core/src/start-compiler/`:

1. **`handleCreateMiddleware.ts` (Linha 34-37)**:

   ```typescript
   if (server) {
     // remove the server call expression
     stripMethodCall(server.callPath);
   }
   ```

   No bundle do cliente, qualquer bloco `.server(...)` dentro de um `createMiddleware` é **literalmente podado (stripped)** da AST via Babel/compiler transform. O código dentro de `.server()` simplesmente deixa de existir no JavaScript servido ao navegador.

2. **`handleCreateServerFn.ts`**:
   O compilador do TanStack Start transforma chamadas a `createServerFn` no cliente em stubs leves de RPC (`createClientRpc(functionId)`). O código de `.handler(...)`, os imports de serviços backend e conexões de banco de dados são removidos do bundle do cliente.

### 3.2. Estratégia de Isolamento em Camadas no OfertaPronta

Para blindagem total contra vazamentos:

1. **Localização Centralizada**:
   O logger e seus adaptadores residem exclusivamente em `src/server/logger/` e `src/start.ts`.
2. **Barrels de Features Limpos (`src/features/*/server/index.ts`)**:
   Os barrels públicos das features re-exportam **apenas** Server Functions (`*Fn`) e schemas Zod de entrada/saída. Eles **nunca** re-exportam instâncias do logger, do Drizzle ou serviços internos.
3. **Testes Automatizados de Isolamento (`server-isolation.test.ts`)**:
   Já existem testes de isolamento estrito no projeto (ex.: `src/features/checkout/server/server-isolation.test.ts`). O novo módulo `src/server/logger/` terá seu próprio `server-isolation.test.ts`, assegurando que nada de `node:async_hooks`, `node:util` ou métodos de escrita em disco/stdout possa ser importado no browser.

---

## 4. Arquitetura do Padrão de Logs (Deep Module `ServerLogger`)

Seguindo o princípio de **Módulos Profundos (Deep Modules)** e **Ponytail (anti-bloat)**:

- Não é necessário instalar bibliotecas pesadas de terceiros (como Winston ou Pino com worker threads complexos incompatíveis com SSR/Vite Nitro).
- O módulo profundo oculta a complexidade de:
  - Captura contextual via `node:async_hooks` (`AsyncLocalStorage`).
  - Formatação dual: JSON estruturado em `production` (pronto para Datadog/CloudWatch/Logtail) e formatação legível/colorizada com timestamps em `development` e `test`.
  - Serialização segura de instâncias de `Error` (captura de `name`, `message`, `stack`, `cause`).
  - Redação automática de dados sensíveis (senhas, tokens Pix, segredos de API, `pushinPayToken`).
  - Cálculo de latência e métricas de execução (`durationMs`).

### 4.1. Design da Interface Pública

```typescript
export interface LogContext {
  requestId?: string;
  module?: string;
  orderId?: string;
  draftId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  child(defaultContext: LogContext): Logger;
}
```

### 4.2. Exemplo de Uso nos Módulos do Sistema

#### Em Serviços de Negócio (ex.: `src/features/checkout/server/services/pix-checkout.service.ts`):

```typescript
import { createServerLogger } from "~/server/logger";

const log = createServerLogger("checkout.pix");

export class PixCheckoutService {
  async handleWebhookPayment(payload: PushinPayWebhookPayload) {
    log.info("Processando webhook Pix", {
      txId: payload.id,
      valueCents: payload.value,
    });
    // ...
  }
}
```

#### Em Server Functions RPC (ex.: `generator.functions.ts`):

```typescript
import { createServerLogger } from "~/server/logger";

const log = createServerLogger("promotions.generator");

export async function executeGeneratePreview(data: GeneratePreviewInput) {
  log.info("Iniciando geração de prévia de card publicitário", {
    draftId: data.draftId,
  });
  // Substitui os console.warn/console.error esparsos por logs rastreáveis e estruturados
}
```

#### No Middleware Global (`src/start.ts`):

```typescript
import { createStart, createMiddleware } from "@tanstack/react-start";
import { requestLoggingMiddleware } from "~/server/logger/middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware],
}));
```

---

## 5. Plano de Adoção e Recomendações

1. **Criar Módulo Profundo `src/server/logger/`**:
   - `src/server/logger/index.ts`: Interface pública, factory `createServerLogger` e singleton `logger`.
   - `src/server/logger/async-context.ts`: Encapsulamento de `AsyncLocalStorage` (`node:async_hooks`).
   - `src/server/logger/formatters.ts`: Formatador JSON para produção e formatador colorizado para desenvolvimento.
   - `src/server/logger/middleware.ts`: Middleware TanStack Start (`createMiddleware().server(...)`) para injeção de `requestId` e log de request/response.
   - `src/server/logger/logger.test.ts`: Testes unitários com TDD cobrindo níveis, herança de contexto, redação de segredos e serialização de erros.
   - `src/server/logger/server-isolation.test.ts`: Garantia de zero vazamento para o cliente.

2. **Configurar `src/start.ts`**:
   - Registrar `requestLoggingMiddleware` e `createCsrfMiddleware` no `createStart`.

3. **Substituição Gradual e Limpa**:
   - Substituir `console.warn` e `console.error` em:
     - `src/features/promotions/server/services/ai-card-generator.service.ts`
     - `src/features/promotions/server/functions/generator.functions.ts`
     - `src/features/checkout/server/services/pix-checkout.service.ts`
     - `src/features/checkout/server/services/pushin-pay.service.ts`
     - `src/routes/api.webhooks.pix.ts`
     - `src/server/export-engine/image-processor.ts`

4. **Benefícios Imediatos**:
   - **Rastreabilidade Ponta a Ponta**: Um `requestId` único correlaciona a requisição do usuário desde o clique no browser até o webhook da Pushin Pay ou geração no Gemini.
   - **Zero Dependências Externas**: Aproveita 100% da biblioteca padrão do Node.js, respeitando o YAGNI e a velocidade do build.
   - **Segurança Absoluta**: Nenhuma linha de código ou segredo de backend atinge o bundle web do cliente.
