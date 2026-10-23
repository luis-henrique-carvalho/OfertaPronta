# Ticket 01: Visual Showcase de Alta Conversão, Painel Unificado Pix & Refatoração do Checkout

**Slug**: `redesign-checkout-simplificado`  
**Ticket**: `01-frontend-stream.md`  
**Responsável**: `frontend-builder`  
**Status**: Ready

---

## 1. Contexto & Requisitos

O usuário precisa ver o card de forma clara e atraente no topo da tela de checkout, despertando o desejo imediato de pagar para ter o arquivo em alta resolução sem marca d'água. Em seguida, logo abaixo do showcase visual, um painel compacto unificado permite copiar o código Pix em 1 toque (ou visualizar o QR Code em aba dedicada), com indicador sutil de tempo restante e acordeão de WhatsApp.

## 2. Tarefas de Implementação

1. **Criar `src/features/checkout/components/ad-card-checkout-showcase.tsx`**:
   - Exibir a imagem prévia do card com aspecto adequado (Feed 4:5 ou Story 9:16), com bordas arredondadas e sombra elegante.
   - Badge flutuante de alto contraste: `variant="outline"` com `border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold`: "Alta Resolução (1080p) sem Marca d'Água após Pix".
   - Título da oferta, nome da empresa (se houver) e preço em destaque: `R$ 9,90` com badge "Feed + Story".
   - Botão/ícone sutil de expandir para tela cheia ou ver detalhes se o usuário desejar ampliar.

2. **Criar `src/features/checkout/components/unified-pix-payment-card.tsx`**:
   - Indicador de status elegante no topo:
     - Bolinha pulsante verde + "Aguardando pagamento Pix" + timer regressivo ("Expira em MM:SS") em badge sutil.
     - Se expirado, exibe alerta com botão de gerar novo código Pix.
   - Abas Radix UI (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`):
     - **Aba "Copia e Cola" (Default)**:
       - Botão primário proeminente de 1 toque: `h-12 w-full rounded-xl bg-primary text-sm font-bold shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]` com ícone de `Copy` / `Check` e texto "Copiar Código Pix" / "Código Pix Copiado!".
       - Bloco de código Pix resumido / colapsável.
       - Micro-instrução em 3 etapas de leitura rápida: "1. Copie o código • 2. Abra o app do seu banco • 3. Cole em Pix Copia e Cola".
     - **Aba "QR Code"**:
       - QR Code nítido centralizado em container branco com cantos arredondados.
       - Instrução clara: "Abra o app do seu banco e aponte a câmera".
   - Acordeão discreto para WhatsApp de recuperação:
     - Trigger sutil: "Receber link também no WhatsApp (opcional)" com ícone do WhatsApp / MessageSquare.
     - Campo com input DDD + número e botão rápido de salvar.

3. **Refatorar `src/features/checkout/views/checkout-view.tsx`**:
   - Substituir os 5 cards empilhados pelo `AdCardCheckoutShowcase` e `UnifiedPixPaymentCard`.
   - Manter compatibilidade com `details.isDevMode` (`DevPaymentSimulatorCard`).
   - Manter redirecionamento com `CheckoutPaidSuccessCard` quando `isPaid` for confirmado.

## 3. Critérios de Aceite (BDD)

- [x] O card publicitário é exibido em tamanho expressivo com aspect ratio correto e visual atraente.
- [x] Preço R$ 9,90 e entrega de ambos os formatos (Feed e Story) destacados sem poluição de bullet points.
- [x] Botão de Copiar Código Pix funciona em 1 toque com feedback visual imediato.
- [x] A alternância de abas entre Copia e Cola e QR Code é suave e responsiva.
- [x] Indicador de tempo restante é exibido de forma sutil e se adapta quando o Pix expira.
- [x] Acordeão de WhatsApp fica colapsado por padrão e permite salvar o contato sem quebrar o layout.
- [x] Pipeline `./.agents/scripts/verify.sh --shadcn` e `pnpm typecheck` passam 100%.
