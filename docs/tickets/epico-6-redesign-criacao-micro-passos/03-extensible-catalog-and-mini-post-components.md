# 03: Catálogo Isomórfico Extensível e Componentes de Mini-Posts

**Spec:** [`docs/specs/epico-6-redesign-criacao-micro-passos.md`](../../specs/epico-6-redesign-criacao-micro-passos.md)

**What to build:**
Consolidação do catálogo isomórfico oficial em `src/features/promotions/data/creation-catalog.ts` contendo os 7 segmentos comerciais (incluindo `fashion`), 6 objetivos, paletas rápidas (`QUICK_BRAND_PALETTES`) e 6 estilos visuais por segmento. Construção dos componentes visuais reutilizáveis `StyleMiniPostCard` (cartão de mini-post com interpolação dinâmica dos dados do comerciante) e `PhotoOptionCard` (cartão de upload tátil com prévia).

**Blocked by:** `01: Schemas de Banco, Zod e Snapshot Congelado com Preço Condicional`

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Catálogo Isomórfico Extensível (`creation-catalog.ts`)**:
  - Exporta catálogo com os 7 ramos de comércio oficiais (`fashion`, `supermarket`, `pizzeria`, `burger-shop`, `beauty-salon`, `restaurant`, `local-retail`).
  - Cada segmento contém ícone Lucide, placeholders padrão, exemplos por objetivo e 6 estilos visuais completos com layout types (`bold-offer`, `clean-frame`, `dark-premium`, `vibrant-pop`).
  - Exporta `QUICK_BRAND_PALETTES` com as 6 paletas rápidas de duas cores.
  - Arquitetura declarativa e desacoplada, facilitando adição futura de novos ramos e exemplos.
- [ ] **Componente `StyleMiniPostCard`**:
  - Renderiza o mini-post em proporção 4:5 com o layout característico do estilo selecionado.
  - Interpola os dados reais digitados pelo comerciante: Nome da Loja, Mensagem/Título da Oferta e Preço (ou fallback para os placeholders padrão se ainda não digitados).
  - Se houver foto do produto enviada, renderiza como fundo com overlay estético.
  - Exibe os swatches da paleta cromática do estilo no rodapé do mini-post.
  - Atributos acessíveis: `role="button"`, `aria-pressed`, touch target adequado e anel visual de seleção (`ring-2 ring-primary`).
- [ ] **Componente `PhotoOptionCard`**:
  - Exibe título, ícone com fundo temático, descrição amigável e botão tátil de upload.
  - Se uma imagem estiver carregada, exibe miniatura com suporte a `cover` (para foto de produto/cenário) ou `contain` (para logotipo com fundo transparente), botão de remover e indicador de envio com sucesso.
  - Sem uso de `<input type="file">` não estilizado diretamente na tela (controlado via botão acessível).
- [ ] **Suíte de Testes Automatizados**:
  - Testes do catálogo validando integridade de dados e unicidade de identificadores.
  - Testes de renderização com Testing Library para `StyleMiniPostCard` e `PhotoOptionCard`.
