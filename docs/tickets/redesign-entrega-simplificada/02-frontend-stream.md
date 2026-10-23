# Ticket 02: Frontend Stream — Unified Hero Card, Chips de Refinamento & View Simplificada

**Blocked by:** N/A (Execução Concorrente com Stream 1 graças a contratos Zod tipados)

## Contexto & Objetivo

Redesenhar a interface da página de entrega (`/pedido/$orderId`), eliminando a sobrecarga de 5 cartões pesados empilhados. Implementar a Opção A aprovada pelo usuário:

1. Header compacto com status discreto.
2. `AdCardUnifiedDeliveryHero`: Card hero unificado trazendo a arte para o primeiro plano imediato, com abas Feed/Story e botão de download dinâmico sincronizado com a aba ativa.
3. `AiRegenerationQuickPanel`: Painel de refinamento simplificado por chips de intenção rápida (Mudar Preço, Corrigir Título, Trocar Cores/Estilo, Outro Ajuste) inspirado no `/criar`.
4. Tratamento amigável e positivo de encerramento da janela com botão para criar nova oferta.

## Arquivos a Modificar / Criar

- `src/features/delivery/components/ad-card-unified-delivery-hero.tsx`: Card unificado de preview + download sincronizado + WhatsApp.
- `src/features/delivery/components/ai-regeneration-quick-panel.tsx`: Painel de micro-ajustes por chips rápidos estilo `/criar`.
- `src/features/delivery/views/order-delivery-view.tsx`: Substituição dos 5 cards antigos pela nova composição limpa.
- `src/features/delivery/components/index.ts`: Exportação dos novos componentes.
- `src/features/delivery/views/order-delivery-view.test.tsx`: Testes de integração da nova visualização.

## Critérios de Aceite (BDD)

- [ ] O topo da página exibe um header limpo e compacto, garantindo que o Hero da arte apareça no primeiro viewport mobile (390×844) sem rolagem.
- [ ] O alternador de abas (Feed / Story) atualiza tanto a imagem exibida quanto o rótulo do botão de download principal ("Baixar Feed em HD" / "Baixar Story em HD").
- [ ] O botão do WhatsApp envia o link permanente formatado sem poluir visualmente a tela.
- [ ] O refinamento por IA exibe chips clicáveis amigáveis e apenas exibe o input relevante quando o chip correspondente está selecionado.
- [ ] Quando a cota de 3 regenerações acaba ou os 30 min expiram, a tela exibe uma mensagem positiva de arte salva permanentemente e incentiva a criação de um novo card.
- [ ] Testes cirúrgicos: `pnpm vitest run src/features/delivery/views/order-delivery-view.test.tsx` passam 100%.
- [ ] `./.agents/scripts/verify.sh --shadcn` e `pnpm typecheck` passam com sucesso.
