# 05: Componentes do Wizard em Micro-Passos, Rodapé Fixo e Integração na Rota /criar

**Spec:** [`docs/specs/epico-6-redesign-criacao-micro-passos.md`](../../specs/epico-6-redesign-criacao-micro-passos.md)

**What to build:**
Construção da interface oficial do wizard em micro-passos mobile-first (`offer-creation-wizard.tsx` e subcomponentes de passos), com barra de progresso tátil, rodapé fixo de navegação colado na base (`CreationFixedFooter`), modal de progresso contextual com IA (`ContextualAiLoader`) e redirecionamento direto para o checkout Pix com a prévia em destaque. Substituição oficial do wizard antigo na rota `/criar` (`src/routes/criar.tsx`).

**Blocked by:**

- `03: Catálogo Isomórfico Extensível e Componentes de Mini-Posts`
- `04: Hook de Estado e Orquestração de Geração com Redirecionamento ao Checkout`

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Passo 1: Ramo do Comércio (`Step1SegmentSelect`)**:
  - Exibe grid móvel 2 colunas com os 7 ramos de atividade (Moda & Roupas, Supermercado, Pizzaria, Hamburgueria, Salão, Restaurante, Outros).
  - Toque no card seleciona o ramo com feedback sonoro/visual e redefine o estilo visual selecionado para o padrão do novo ramo.
- [x] **Passo 2: O Anúncio & Objetivo (`Step2OfferDetails`)**:
  - Grade tátil com os 6 objetivos de anúncio.
  - Se selecionado "Outro (Digitar)", exibe campo aberto para digitar o tipo de card desejado.
  - Campos de entrada: Nome da Loja e Mensagem Principal com placeholders contextuais do ramo/objetivo.
  - Preço da Promoção:
    - Visível e obrigatório para `promo`.
    - Oculto por padrão para `custom`, com botão `+ Adicionar preço neste card` e botão de remover.
    - **Completamente oculto (sem botão de adição)** nos objetivos `new-arrival`, `special-date`, `announcement` e `schedule`.
- [x] **Passo 3: Suas Imagens (`Step3VisualAssets`)**:
  - Exibe os três cartões opcionais via `PhotoOptionCard`: Foto do Produto, Print de Card para Copiar Estilo e Logomarca da Loja.
  - Se nenhuma imagem estiver carregada, exibe botão rápido em destaque: _"Não tenho imagens agora — Deixar a IA criar tudo"_, que avança diretamente para o Passo 4.
- [x] **Passo 4: Visual do Card & Paleta (`Step4StyleAndPalette`)**:
  - Se houver print de referência enviado no Passo 3, exibe alerta visual: _"Print de Referência Ativo! A IA vai seguir o formato do print que você enviou"_.
  - Grade 2x3 com os 6 `StyleMiniPostCard` do segmento, atualizados dinamicamente com os dados digitados pelo comerciante.
  - Seção de paleta com chips das 6 paletas rápidas (`QUICK_BRAND_PALETTES`) e campo de texto para cor personalizada.
- [x] **Rodapé Fixo Mobile-First (`CreationFixedFooter`)**:
  - Barra colada na base da viewport (`fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md`).
  - Botão "Voltar" (1/3 da largura) visível nos passos 2, 3 e 4.
  - Botão "Continuar" (2/3 da largura) com validação dinâmica no Passo 2 (desabilitado se faltar nome, mensagem, preço em `promo` ou texto em `custom`).
  - No Passo 4, botão "Gerar Meu Card" com ícone de varinha mágica.
- [x] **Geração e Redirecionamento Direto para Checkout**:
  - Ao tocar em "Gerar Meu Card", exibe `ContextualAiLoader` com animação das três fases.
  - Concluída a geração, inicia o pedido Pix e navega diretamente para `/checkout/$orderId`.
  - A tela de checkout exibe a prévia gerada com marca d'água ao lado do QR Code Pix.
- [x] **Integração Oficial na Rota `/criar`**:
  - `src/routes/criar.tsx` passa a renderizar `OfferCreationWizard` como fluxo primário oficial.
- [x] **Qualidade e Conformidade**:
  - Layout testado e validado em viewport móvel (360px a 430px) com zero overflow horizontal e touch targets ≥ 44px.
  - Conformidade estrita com Shadcn UI auditada via `./.agents/scripts/check_shadcn_usage.py`.
  - Suíte de testes com Vitest e Testing Library (`offer-creation-wizard.test.tsx`).
