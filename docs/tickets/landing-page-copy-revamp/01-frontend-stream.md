# Ticket 01: Frontend Stream — Reformulação Completa de Copy da Landing Page com Foco em CRO

- **Slug**: `landing-page-copy-revamp`
- **Stream**: `01-frontend-stream` (Único Macro-Ticket — 100% Frontend)
- **Agente Executor**: `frontend-builder`
- **Blocked by**: None
- **Plano Técnico de Referência**: [docs/plans/landing-page-copy-revamp.md](file:///home/luis/repositories/OfertaPronta/.worktrees/landing-page-copy-revamp/docs/plans/landing-page-copy-revamp.md)
- **Especificação de Referência**: [docs/marketing/requests/landing-page-copy-revamp.md](file:///home/luis/repositories/OfertaPronta/.worktrees/landing-page-copy-revamp/docs/marketing/requests/landing-page-copy-revamp.md)
- **Worktree de Execução**: `/home/luis/repositories/OfertaPronta/.worktrees/landing-page-copy-revamp`

---

## 1. Objetivo e Escopo

Reformular toda a copy e títulos dos componentes da Landing Page (`src/components/shared/landing-*.tsx`), eliminando o atrito prematuro de preço no botão Hero e nos passos, aplicando a nova copy orientada a CRO, dor do comerciante e reversão de risco aprovada na especificação, e criando a suíte de testes unitários `src/components/shared/landing-sections.test.tsx`.

---

## 2. Arquivos no Escopo do Builder

### Modificar
- `src/components/shared/landing-hero-section.tsx`
- `src/components/shared/landing-steps-section.tsx`
- `src/components/shared/landing-pricing-section.tsx`
- `src/components/shared/landing-header.tsx`
- `src/components/shared/landing-segments-section.tsx`
- `src/components/shared/landing-formats-section.tsx`
- `src/components/shared/landing-footer.tsx`

### Criar
- `src/components/shared/landing-sections.test.tsx`

---

## 3. Especificação Detalhada por Componente

### 3.1. `src/components/shared/landing-hero-section.tsx`
1. Remover import de `getDefaultCampaignPlan` e `const defaultPlan = getDefaultCampaignPlan();`.
2. Atualizar o Badge para: `"Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local"`.
3. Headline (`h1`): `"Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência."`.
4. Subtítulo (`lead`): `"Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu card profissional pronto para postar no WhatsApp e Instagram."`.
5. Botão CTA:
   - Texto: `"Gerar meu card grátis em 90 segundos"`
   - Manter link `href="/criar"` e ícone `Bolt` com `data-icon="inline-start"`.
6. Selos de Confiança (CheckCircle2):
   - 1: `"Gere a prévia gratuitamente"`
   - 2: `"Sem cadastro demorado"`
   - 3: `"Pronto para Feed & Story"`

### 3.2. `src/components/shared/landing-steps-section.tsx`
1. Remover import de `getDefaultCampaignPlan` e chamada correspondente.
2. Badge: `"Simples do Início ao Fim"`.
3. Título (`h2`): `"Da sua ideia para o WhatsApp dos clientes em 3 passos"`.
4. Subtítulo: `"Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas complicadas de edição."`.
5. Card 1:
   - Título: `"Descreva sua promoção"`
   - Descrição: `"Escolha o ramo do seu negócio, digite a oferta e o preço que vai anunciar."`
   - Corpo: `"Tem foto do produto no celular? Pode enviar junto. Se não tiver, a própria IA cria o cenário e a imagem para você."`
6. Card 2:
   - Título: `"A IA monta o card na hora"`
   - Descrição: `"Em menos de 90 segundos, seu anúncio fica pronto com iluminação, cores e preço em destaque."`
   - Corpo: `"Você confere a prévia completa na tela gratuitamente antes de tomar qualquer decisão."`
7. Card 3:
   - Título: `"Baixe em alta definição e poste"`
   - Descrição: `"Gostou do resultado? Libere os arquivos sem marca d'água e publique no WhatsApp e Instagram."`
   - Corpo: `"Você já recebe as duas versões prontas (Feed e Story) para mandar nos grupos e atrair pedidos no mesmo minuto."`

### 3.3. `src/components/shared/landing-pricing-section.tsx`
1. Importar `Sparkles` do `lucide-react` (substituindo `QrCode` no botão CTA).
2. Badge: `"Risco Zero: Teste Antes de Pagar"`.
3. Título (`h2`): `"Visual de agência por uma fração do que você gasta hoje"`.
4. Subtítulo: `"Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas da sua noite. Aqui você gera a prévia de graça e só paga se aprovar o resultado."`.
5. Rótulo de preço: `"/ por campanha aprovada (Feed + Story)"`.
6. Itens de Checklist:
   - Item 1: `"Você só paga depois de ver a prévia gerada com marca d'água"`
   - Item 2: `"Download imediato em altíssima definição: Feed (1080×1350) e Story (1080×1920)"`
   - Item 3: ``{`Até ${defaultPlan.maxPostPaymentRegenerations} regenerações por IA inclusas para ajustar detalhes`}``
   - Item 4: `"Pagamento único via Pix, sem mensalidade e sem cadastrar cartão"`
7. Botão CTA:
   - Texto: `"Gerar minha prévia grátis agora"`
   - Ícone: `Sparkles` com `data-icon="inline-start"`
8. Rodapé de Segurança: `"Zero compromisso: gere a prévia sem pagar nada • Liberação instantânea via Pix"`.

### 3.4. `src/components/shared/landing-header.tsx`
1. Atualizar o texto do botão CTA secundário para: `"Gerar prévia grátis"`.

### 3.5. `src/components/shared/landing-segments-section.tsx`
1. Badge: `"Feito para a Rotina do Comércio"`.
2. Título (`h2`): `"Pronto para o ritmo do seu balcão"`.
3. Subtítulo: `"Não importa se você vende quilo de alcatra, pizza grande ou corte de cabelo: a IA já conhece o visual que dá água na boca e atrai clientes no seu ramo."`.
4. Atualizar as descrições dos 6 segmentos:
   - Supermercados: `"Dia do hortifrúti, ofertas do açougue e encartes de fim de semana com preço bem visível."`
   - Salões & Barbearias: `"Combos de corte e barba, progressiva, manicure e promoções para encher a agenda da semana."`
   - Pizzarias: `"Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery."`
   - Hamburguerias: `"Smash burger na chapa, cheddar cremoso e combos com batata que dão fome só de olhar no celular."`
   - Restaurantes: `"Prato feito do dia, marmitex, executivo e cardápio de almoço pronto antes de abrir as portas."`
   - Comércio Local: `"Queima de estoque em lojas de roupa, banho e tosa em pet shop, óticas, farmácias e oficinas."`

### 3.6. `src/components/shared/landing-formats-section.tsx`
1. Badge: `"2 Formatos Prontos de Uma Vez"`.
2. Título (`h2`): `"Uma única criação entrega o post do Feed e a tela cheia do Story"`.
3. Subtítulo: `"Nada de post cortado pela metade ou letra miúda que ninguém lê no celular. Você recebe os dois tamanhos certos para divulgar em todas as redes."`.
4. Card Feed:
   - Título: `"Post para Feed e Grupos"`
   - Descrição: `"Formato retrato que ocupa mais espaço na tela do celular e faz o cliente parar de rolar o Instagram."`
   - Rodapé: `"Ideal para fixar no perfil da loja e disparar nas listas de transmissão do WhatsApp."`
5. Card Story:
   - Título: `"Story e Status com Espaço para Link"`
   - Descrição: `"Tela cheia vertical com espaço livre na parte de baixo para você colar a figurinha do link do seu WhatsApp."`
   - Rodapé: `"Perfeito para postar todo dia no Status do WhatsApp e nos Stories sem tampar o preço."`

### 3.7. `src/components/shared/landing-footer.tsx`
1. Atualizar a descrição da marca:
   `"Anúncios profissionais gerados por IA para Instagram e WhatsApp em menos de 90 segundos. Gere a prévia grátis, sem cadastro e sem mensalidade."`

---

## 4. Critérios de Aceite (BDD)

- **Cenário 1: Seção Hero sem atrito de preço e com CTA de ação rápida**
  - **Dado** o componente `LandingHeroSection`,
  - **Quando** for renderizado,
  - **Então** deve exibir a headline `"Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência."`,
  - **E** o botão principal deve conter `"Gerar meu card grátis em 90 segundos"`,
  - **E** NÃO deve conter nenhuma menção a `"R$ 9,90"` ou `"via Pix"` no botão.

- **Cenário 2: Seção de Passos simples e sem jargão**
  - **Dado** o componente `LandingStepsSection`,
  - **Quando** for renderizado,
  - **Então** o Passo 1 deve ser `"Descreva sua promoção"`,
  - **E** o Passo 2 deve ser `"A IA monta o card na hora"`,
  - **E** o Passo 3 deve ser `"Baixe em alta definição e poste"`,
  - **E** não deve conter termos como `"placeholders"`, `"insumos visuais"` ou `"PNGs"`.

- **Cenário 3: Seção de Preço com Ancoragem e Reversão de Risco**
  - **Dado** o componente `LandingPricingSection`,
  - **Quando** for renderizado,
  - **Então** deve exibir o título `"Visual de agência por uma fração do que você gasta hoje"`,
  - **E** o subtítulo deve comparar contra agência de R$ 150 e 2 horas no Canva,
  - **E** a lista de benefícios deve destacar que o usuário só paga depois de ver a prévia com marca d'água,
  - **E** o botão CTA deve dizer `"Gerar minha prévia grátis agora"`.

- **Cenário 4: Conformidade Shadcn UI e TypeScript Estrito**
  - **Dado** todos os componentes editados,
  - **Quando** executado `./.agents/scripts/verify.sh --shadcn` e `pnpm typecheck`,
  - **Então** deve passar com zero erros de tipo e zero violações críticas de Shadcn.

---

## 5. Comandos de Verificação (TDD Cirúrgico no Builder)

Execute exclusivamente o teste unitário dos componentes da landing page e o typecheck:

```bash
pnpm vitest run src/components/shared/landing-sections.test.tsx src/components/shared/landing-footer.test.tsx
pnpm typecheck
./.agents/scripts/verify.sh --shadcn
```
