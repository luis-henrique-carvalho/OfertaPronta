# 01: Catálogo Canônico de Estilos Curados e Injeção de Direção de Arte no Gemini

**Spec:** [`docs/specs/epico-5-galeria-estilos.md`](../../specs/epico-5-galeria-estilos.md)

**What to build:**
Implementar o catálogo de estilos visuais curados por segmento e a injeção aprofundada de Direção de Arte no motor de IA Gemini. Cria o módulo profundo `src/features/promotions/data/style-presets-catalog.ts` com os 24 estilos visuais profissionais curados para os 6 segmentos comerciais atendidos pelo OfertaPronta (4 estilos por segmento), contendo IDs imutáveis, títulos comerciais, descrições, tags, cores de UI, especificações de mockup e diretrizes estruturadas de direção de arte (paleta cromática exata, composição gráfica, iluminação de estúdio e atmosfera publicitária). Atualiza o módulo profundo `AdCardGenerator` (`src/features/promotions/server/services/ai-card-generator.service.ts`) para injetar a seção `--- DIRETRIZ DE DIREÇÃO DE ARTE PROFISSIONAL ---` no prompt do Gemini, substituindo descrições rasas e garantindo estética de agência para cada nicho comercial.

**Blocked by:** None (can start immediately)

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Dado** qualquer um dos 6 segmentos comerciais (`supermarket`, `beauty-salon`, `pizzeria`, `burger-shop`, `restaurant`, `local-retail`), **quando** `getSegmentPresets(segment)` for invocado, **então** deve retornar exatamente 4 estilos visuais com IDs únicos, labels comerciais, descrições, tags de estilo, cores primárias/secundárias, especificações de mockup e diretrizes estruturadas de direção de arte.
- [ ] **Dado** um ID de preset válido do catálogo, **quando** `resolveArtDirectionDirective(segment, presetId)` for chamado, **então** deve retornar a diretriz de design completa com paleta exata, composição, iluminação e atmosfera formatadas para injeção em prompt.
- [ ] **Dado** um ID de preset nulo, indefinido ou inexistente, **quando** `resolveArtDirectionDirective` for chamado, **então** deve aplicar graciosamente o primeiro estilo padrão daquele segmento sem disparar exceção ou falhar a requisição.
- [ ] **Dado** uma solicitação de geração de imagem enviada ao `AdCardGenerator` (`generateAdCardImage`) com `stylePresetId: "market-discount"`, **quando** o prompt para a API Gemini for construído, **então** deve conter obrigatoriamente a seção estruturada de Direção de Arte com paleta de amarelo e vermelho, selos de impacto e iluminação de varejo.
- [ ] **Dado** os schemas de validação Zod em `offer-brief.schema.ts`, **quando** validados, **então** devem manter compatibilidade total com os IDs de presets do novo catálogo e exportar tipos limpos sem dependências circulares.
- [ ] **Dado** a suíte de testes de backend, **quando** executada com `pnpm test`, **então** `style-presets-catalog.test.ts` e `ai-card-generator.service.test.ts` devem passar com 100% de sucesso.
