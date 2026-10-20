# Product Specification: Modo de Estilo Orientado à Imagem de Referência (`reference-driven-style`)

- **Slug**: `reference-driven-style`
- **Data**: 20 de Outubro de 2026
- **Status**: Aprovado para Arquitetura e Engenharia
- **Responsáveis**: Product Manager & Principal Solution Architect

---

## 1. Visão Geral e Problema do Usuário

O **OfertaPronta** permite que microempresários criem Cards Publicitários profissionais gerados por IA em menos de 90 segundos.
No **Passo 3 (Insumos Visuais)**, o comerciante tem a opção de enviar um **Print de Referência (`referenceImageDataUrl`)** de um anúncio que gostou (por exemplo, um post minimalista com fundo claro e tipografia elegante) para que a IA replique esse estilo.

### O Problema ("Attention Bleeding" / Conflito Semântico)
1. **Frontend**: Ao avançar para o **Passo 4 (Visual do Card)**, o sistema selecionava por padrão o primeiro preset de catálogo do segmento (ex: *"Dark Burger & Fumaça"* no ramo de hamburgueria, com fundo preto carvão, ardósia rústica e fumaça densa).
2. **Backend**: No Deep Module `AdCardGenerator` (`ai-card-generator.service.ts`), o compilador de prompt injetava todas as diretrizes rígidas, paleta HEX (#000000, #E11D48), variantes de layout (`retail-burst` / `dark-luxury`) e a narrativa cênica do preset padrão.
3. **Impacto na IA**: O modelo multimodal Gemini recebia simultaneamente duas ordens conflitantes:
   - *"Copie o estilo do print anexo"* (que podia ser branco/minimalista).
   - *"Aplique o estilo Dark Burger com fumaça, ardósia escura, fonte Didone e cores #000000 e #E11D48"*.
   Essa sobreposição gerava **"attention bleeding"** no espaço latente da IA, fazendo com que a imagem gerada ignorasse o print do usuário ou criasse uma colagem visualmente inconsistente.

---

## 2. Solução Proposta

Implementar o **Modo de Estilo Orientado à Referência (`REFERENCE_DRIVEN`)** de ponta a ponta:

1. **Frontend (Passo 4 do Wizard)**:
   - Quando houver `referenceImageDataUrl`, exibir no topo da seleção de estilos um card interativo e destacado: **"Estilo do seu Print de Referência"**, com miniatura do print, selo "Ativo / Recomendado" e selecionado por padrão.
   - Os presets de catálogo abaixo iniciam desmarcados. O usuário ainda tem total liberdade para clicar em um preset de catálogo se desejar um estilo híbrido deliberado.
   - O hook `use-offer-brief-draft.ts` não força o primeiro preset quando há referência ativa.

2. **Backend (`AdCardGenerator`)**:
   - Detectar o modo `REFERENCE_DRIVEN` quando `referenceImageDataUrl` estiver ativo e `stylePresetId` for nulo, indefinido ou o sentinela canônico `"reference-style"`.
   - Substituir as diretrizes do catálogo por uma diretriz autoritativa de **Replicação Estética da Imagem de Referência** (extraindo grid, tipografia, iluminação, paleta e diagramação do print).
   - Eliminar completamente a injeção de HEX, nomes de presets e descrições cênicas de catálogo quando o modo de referência estiver ativo, erradicando a poluição de prompt.
   - Manter a estratégia híbrida caso o usuário selecione conscientemente um preset de catálogo tendo uma referência anexada.

---

## 3. Critérios de Sucesso e Aceitação

1. **Fidelidade Visual do Print**: Anúncios gerados com print de referência respeitam a paleta de cores, iluminação e grid visual do print sem contaminações de presets de catálogo indesejados.
2. **Clareza de Escolha no Wizard**: O comerciante entende imediatamente no Passo 4 que o seu print de referência é o estilo que está ativo e guiando a geração.
3. **Liberdade do Usuário**: O comerciante pode alternar facilmente entre o estilo do print e estilos pré-moldados do catálogo sem perda de dados.
4. **Zero Regressão**: Geração padrão sem imagem de referência permanece 100% idêntica e validada pela suíte de testes.
