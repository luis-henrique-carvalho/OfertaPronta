# 04: Mobile Delivery View & AI Regeneration UI

**Spec:** [`docs/specs/epico-4-entrega-e-regeneracao.md`](../../specs/epico-4-entrega-e-regeneracao.md)

**What to build:**
Construir a interface mobile-first completa de entrega do pedido e a rota TanStack Start `/pedido/$orderId`. Inclui banner de celebração, visualizador com alternância Feed (1080×1350) e Story (1080×1920) em alta resolução, botões diretos de download em PNG HD, botão de conveniência "Enviar artes para meu WhatsApp" (link direto `wa.me` com mensagem pré-formatada contendo o link permanente do pedido), e painel retrátil de refinamento com IA exibindo o cronômetro regressivo da janela de 30 minutos e cota restante (X de 3).

**Blocked by:**

- `docs/tickets/epico-4-entrega-e-regeneracao/02-delivery-server-functions-and-download-endpoint.md`
- `docs/tickets/epico-4-entrega-e-regeneracao/03-post-payment-ai-regeneration-service.md`

**Status:** `completed`

## Acceptance Criteria (BDD)

- [x] **Dado** a rota `/pedido/$orderId`, **quando** carregada com um pedido com status `PAID`, **então** deve exibir o banner comemorativo de pagamento confirmado, o título da promoção e o visualizador da arte sem nenhuma marca d'água.
- [x] **Dado** o componente `ad-card-delivery-preview.tsx`, **quando** o usuário alternar entre as abas "Feed (1080×1350)" e "Story (1080×1920)", **então** a visualização deve trocar dinamicamente para a arte correspondente no aspect ratio correto (4:5 e 9:16).
- [x] **Dado** o componente `download-actions-card.tsx`, **quando** renderizado no celular ou desktop, **então** deve apresentar botões de download direto em destaque ("Baixar Feed (1080×1350)" e "Baixar Story (1080×1920)") disparando os arquivos PNG nítidos com headers de attachment.
- [x] **Dado** o componente `order-whatsapp-share-card.tsx`, **quando** clicado pelo microempresário, **então** deve abrir o WhatsApp (`wa.me`) com uma mensagem pré-preenchida contendo o link permanente do pedido para resgate e consulta a qualquer momento.
- [x] **Dado** o painel `ai-regeneration-panel.tsx`, **quando** a janela de 30 minutos estiver ativa e houver cota disponível (`remainingRegenerations > 0`), **então** deve exibir o badge "Ajustes restantes: X de 3", o cronômetro regressivo `regeneration-countdown-timer.tsx` e o formulário focado para refinar títulos, preços ou adicionar instruções à IA mantendo a foto original do produto.
- [x] **Dado** que o microempresário envia um ajuste no painel de regeneração, **quando** a mutação estiver em processamento, **então** deve exibir estado de loading amigável ("A IA está refinando seu card..."), e ao concluir com sucesso, atualizar a arte exibida e decrementar o contador de cota sem recarregar a página.
- [x] **Dado** que a janela de 30 minutos expirou ou a cota de 3 ajustes esgotou, **quando** renderizado, **então** o formulário de regeneração deve ser desabilitado graciosamente com mensagem explicativa, mantendo os botões de download dos arquivos existentes permanentemente disponíveis.
- [x] **Dado** a auditoria de acessibilidade e responsividade mobile-first, **quando** inspecionado em viewports móveis (360px a 430px), **então** todos os touch targets devem possuir altura ≥ 44px, zero overflow horizontal, conformidade total com o Shadcn UI e tipografia do projeto.
- [x] **Dado** a execução da suíte de testes de UI e hooks com `pnpm test`, **quando** executada, **então** todos os testes de componentes e hooks de entrega devem passar com 100% de sucesso.
