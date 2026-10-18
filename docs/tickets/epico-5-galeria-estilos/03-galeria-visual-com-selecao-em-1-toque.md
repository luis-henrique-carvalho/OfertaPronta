# 03: Galeria Visual Mobile-First com Seleção de 1 Toque e Abas de Referência

**Spec:** [`docs/specs/epico-5-galeria-estilos.md`](../../specs/epico-5-galeria-estilos.md)

**What to build:**
Implementar o componente visual de galeria `StylePresetGallery` (`src/features/promotions/components/style-preset-gallery.tsx`), substituindo o antigo seletor textual `StylePresetsCard`. Oferece uma interface intuitiva mobile-first com abas de alternância (*"Estilos Prontos (Galeria)"* vs *"Enviar Arte Própria"*), grid responsivo com cartões enriquecidos pelas miniaturas visuais `StyleMockupThumbnail`, seleção imediata em 1 toque (`1-tap selection`) com anéis de destaque visual (`ring-2 ring-primary`) e checkmark, tags visuais de escaneabilidade rápida, diálogo com detalhes aprofundados do estilo e campo retrátil para instruções extras de estilo para a IA. Implementa a regra de negócio de exclusividade mútua: selecionar um estilo da galeria limpa qualquer upload manual de referência e vice-versa, prevenindo insumos contraditórios para o modelo de IA.

**Blocked by:** 02: Miniaturas Vetoriais Locais dos Mockups e Componente de Thumbnail

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Dado** a exibição da seção de estilos no Passo 2 do formulário de criação, **quando** renderizada, **então** deve apresentar por padrão a aba *"Estilos Prontos (Galeria)"* ativa, com os 4 cartões visuais do segmento comercial atual contendo miniaturas `StyleMockupThumbnail`, título comercial, tags descritivas e badge de cor.
- [ ] **Dado** um microempresário tocando em qualquer cartão da galeria, **quando** o toque for realizado, **então** deve selecionar imediatamente o estilo em 1 toque, exibir o anel de seleção vibrante, o ícone de checkmark e acionar `onStylePresetChange` com o identificador correspondente.
- [ ] **Dado** um microempresário que alterna para a aba *"Enviar Arte Própria"*, **quando** enviar uma imagem de referência pessoal, **então** o `stylePresetId` ativo deve ser desmarcado e limpo, priorizando o arquivo customizado.
- [ ] **Dado** um comerciante com uma imagem de referência manual carregada que toca em um estilo da galeria, **quando** o preset for selecionado, **então** a imagem de referência manual deve ser limpa do estado do rascunho (`onReferenceImageChange(undefined)`).
- [ ] **Dado** a auditoria de acessibilidade e ergonomia mobile (viewport 360px a 430px), **quando** o componente for inspecionado, **então** todos os botões e áreas interativas devem ter touch target mínimo de 44×44px, zero transbordo horizontal e atributos `aria-pressed` e `role="tab"` válidos.
- [ ] **Dado** a suíte de testes de interface, **quando** executada com `pnpm test`, **então** `style-preset-gallery.test.tsx` deve validar todas as interações de toque, troca de abas e exclusividade mútua de seleção com 100% de sucesso.
