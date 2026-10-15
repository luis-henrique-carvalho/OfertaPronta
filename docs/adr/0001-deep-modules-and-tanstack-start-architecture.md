# ADR 0001: Adoção de Módulos Profundos no TanStack Start em Substituição a Portas Rasas

- **Status:** Aceito
- **Data:** 2026-10-15
- **Decisores:** Luis Carvalho & Antigravity Assistant
- **Contexto:** OfertaPronta — Arquitetura Full-Stack com TanStack Start

---

## Contexto

A proposta arquitetural inicial adotava o modelo convencional de Clean Architecture ("Ports & Adapters") fragmentado por camadas: cada dependência de infraestrutura possuía uma interface/porta abstrata (`storage.port.ts`, `renderer.port.ts`, `payment.port.ts`, `queue.port.ts`), mesmo com apenas uma implementação real prevista (S3, Sharp/Resvg, OpenPix e Postgres). Além disso, a estrutura herdava um cliente REST com Axios (`src/api/client.ts`) do projeto de referência (`dorama/web`), que operava como SPA desconectada de backend em Go.

A análise via `/improve-codebase-architecture` revelou quatro fontes graves de fricção:
1. **Visual Drift:** A geração de SVG para prévia no cliente e para exportação no servidor corria risco de divergência tipográfica caso implementada separadamente.
2. **Portas Hipotéticas (Clean Arch Cerimonial):** *"Um adaptador significa uma costura hipotética; dois adaptadores significam uma costura real."* A proliferação de portas de único adaptador gerava 7 arquivos rasos apenas para transformar SVG em PNG e enviar ao storage.
3. **Cascas de Passagem:** O cliente REST Axios tornava-se um intermediário redundante frente aos recursos nativos de Server Functions (`createServerFn`) do TanStack Start.
4. **Ciclo de Pagamento Fragmentado:** A lógica de snapshot de preço (R$ 9,90) e o webhook Pix estavam dispersos entre rotas e serviços.

---

## Decisão

Adotamos a abordagem de **Módulos Profundos** (*Codebase Design*) combinada com o modelo full-stack do TanStack Start:

1. **Módulo Isomórfico `TemplateEngine`:**
   - Centralizar toda a geração de SVG vetorial (Feed 1080×1350 e Story 1080×1920) em um módulo puro TypeScript (`src/features/templates/engine/`).
   - O mesmo código executa no navegador (para prévia interativa com marca d'água sem chamadas de rede) e no servidor (alimentando o Resvg para o PNG final).

2. **Módulo Profundo `ExportEngine` (`CampaignArtisan`):**
   - Eliminar as portas rasas `renderer.port.ts`, `storage.port.ts` e `queue.port.ts`.
   - Concentrar a rasterização e o upload em `src/server/export-engine/`, expondo uma interface única de alto valor: `renderAndStore(snapshot, options): Promise<ExportResult>`.
   - Para testes, utilizar a estratégia *replace-don't-layer* com fakes in-memory de storage.

3. **Módulo Profundo `PixCheckout`:**
   - Encapsular a criação de cobrança com snapshot congelado (R$ 9,90), a validação de assinatura HMAC e a transação idempotente de webhook no módulo `src/features/checkout/server/pix-checkout.ts`.
   - A rota de webhook (`src/routes/api/webhooks.pix.ts`) torna-se um adaptador HTTP fino que apenas repassa a requisição ao `PixCheckout`.

4. **Eliminação do Cliente REST Legado:**
   - Deletar `src/api/client.ts` e `src/api/handle-api-error.ts`.
   - Utilizar exclusivamente **Server Functions (`createServerFn`)** do TanStack Start com validação de entrada/saída via Zod.

---

## Consequências

### Positivas
- **Fidelidade Visual Absoluta:** O que o cliente vê na prévia de 90 segundos é milimetricamente idêntico ao PNG exportado.
- **Alta Localidade (*Locality*):** Regras de renderização, exportação e pagamento concentram-se em seus respectivos módulos, evitando saltos entre 7 arquivos rasos.
- **Testabilidade Natural:** A interface pública dos módulos profundos é a própria superfície de teste. Menos mocks, mais testes com significado real de negócio.
- **Zero Bloat / YAGNI:** Eliminação de 4 interfaces sem variação real e de dependências desnecessárias (Axios no frontend).

### Negativas / Trade-offs
- **Acoplamento Interno Controlado:** O módulo `ExportEngine` gerencia diretamente o Resvg e o S3. Caso no futuro surja um segundo provedor de storage, a costura será introduzida quando houver a segunda implementação real, não antes.
