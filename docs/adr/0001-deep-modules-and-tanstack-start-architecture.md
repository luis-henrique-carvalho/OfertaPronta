# ADR 0001: Adoção de Módulos Profundos no TanStack Start em Substituição a Portas Rasas

- **Status:** Aceito (Atualizado para o Core de Cards Publicitários por IA)
- **Data:** 2026-10-15
- **Decisores:** Luis Carvalho & Antigravity Assistant
- **Contexto:** OfertaPronta — Arquitetura Full-Stack com TanStack Start

---

## Contexto

A proposta arquitetural inicial adotava o modelo convencional de Clean Architecture ("Ports & Adapters") fragmentado por camadas: cada dependência de infraestrutura possuía uma interface/porta abstrata (`storage.port.ts`, `renderer.port.ts`, `payment.port.ts`, `queue.port.ts`), mesmo com apenas uma implementação real prevista (S3, Sharp, OpenPix e Postgres). Além disso, a estrutura previa um cliente REST com Axios (`src/api/client.ts`), operando como SPA desconectada do backend.

A análise de design de código revelou três fontes graves de fricção:

1. **Portas Hipotéticas (Clean Arch Cerimonial):** _"Um adaptador significa uma costura hipotética; dois adaptadores significam uma costura real."_ A proliferação de portas de único adaptador gerava múltiplos arquivos rasos apenas para processar imagens e enviar ao storage.
2. **Cascas de Passagem:** O cliente REST Axios tornava-se um intermediário redundante frente aos recursos nativos de Server Functions (`createServerFn`) do TanStack Start.
3. **Ciclo de Pagamento e Geração Fragmentados:** A lógica de geração de card por IA, aplicação de marca d'água, snapshot de preço (R$ 9,90) e webhook Pix estavam dispersos entre rotas e serviços.

---

## Decisão

Adotamos a abordagem de **Módulos Profundos** (_Codebase Design_) combinada com o modelo full-stack do TanStack Start:

1. **Módulo Profundo `AdCardGenerator` (`src/features/promotions/server/ai-card-generator.ts`):**
   - Encapsula toda a inteligência de construção do prompt publicitário por segmento comercial, fusão multimodal da **Imagem do Produto (`Product Image`)** e da **Imagem de Referência (`Reference Image`)** via SDK `@google/genai` (`gemini-nano-banana-2.1` / `gemini-3-pro-image`) e controle estrito de cotas (1 prévia gratuita + até 3 regenerações pós-pagamento).

2. **Módulo Profundo `ExportEngine` (`src/server/export-engine/`):**
   - Elimina as portas rasas `renderer.port.ts`, `storage.port.ts` e `queue.port.ts`.
   - Concentra o pós-processamento gráfico (`Sharp` / `@resvg/resvg-js` para aplicação de marca d'água protetora na prévia e formatação exata 1080×1350 Feed e 1080×1920 Story) e o upload seguro para S3/Cloudinary em uma interface concisa.
   - Para testes, utiliza a estratégia _replace-don't-layer_ com fakes in-memory.

3. **Módulo Profundo `PixCheckout` (`src/features/checkout/server/pix-checkout.ts`):**
   - Encapsula a criação de cobrança com snapshot congelado (R$ 9,90), a validação de assinatura HMAC e a transação idempotente de webhook.
   - A rota de webhook (`src/routes/api/webhooks.pix.ts`) atua como um adaptador HTTP fino que delega ao `PixCheckout`.

4. **Comunicação Tipada via Server Functions:**
   - Utilizar exclusivamente **Server Functions (`createServerFn`)** do TanStack Start com validação de entrada/saída via Zod, mantendo API Routes apenas para webhooks externos e downloads binários.

---

## Consequências

### Positivas

- **Alta Localidade (_Locality_):** Regras de geração de card por IA, proteção de marca d'água/exportação e pagamento Pix concentram-se em seus respectivos módulos profundos.
- **Testabilidade Natural:** A interface pública dos módulos profundos é a própria superfície de teste, usando fakes in-memory rápidos e determinísticos.
- **Zero Bloat / YAGNI:** Eliminação de interfaces cerimoniais sem variação real e de clientes HTTP redundantes.

### Negativas / Trade-offs

- **Acoplamento Interno Controlado:** Os módulos profundos gerenciam diretamente suas dependências (`@google/genai`, `Sharp`, `S3`). Caso surja um segundo provedor real no futuro, a costura será extraída no momento da necessidade real.
