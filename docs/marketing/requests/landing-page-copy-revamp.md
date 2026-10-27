# Especificação de Reformulação de Copy & CRO — Landing Page OfertaPronta

- **Documento:** `docs/marketing/requests/landing-page-copy-revamp.md`
- **Responsável:** Performance Marketing Manager (`copywriting` + `cro` + `offers`)
- **Data:** 2026-10-26
- **Escopo de Arquivos Alvo:**
  - `src/components/shared/landing-hero-section.tsx`
  - `src/components/shared/landing-steps-section.tsx`
  - `src/components/shared/landing-pricing-section.tsx`
  - `src/components/shared/landing-header.tsx`
  - `src/components/shared/landing-segments-section.tsx`
  - `src/components/shared/landing-formats-section.tsx`
  - `src/components/shared/landing-footer.tsx`
  - `src/routes/index.tsx`

---

## 1. Diagnóstico de CRO, Copywriting e Design de Oferta

### 1.1. Diagnóstico Copywriting (Framework *Decompose & Lock* — Situação B)
- **Classificação:** **Situação B (Voz real presente no contexto do produto, mas execução atual na LP com foco técnico e atrito precoce).**
- **Problema Central 1 — Pedágio Precoce no CTA (Premature Price Friction):** O botão principal da seção Hero (`Criar meu card agora (R$ 9,90 via Pix)`) cobra uma decisão de compra antes mesmo de o visitante descobrir que pode gerar e ver a prévia gratuitamente. Na psicologia do consumidor, exibir preço + método de pagamento dentro do botão primário faz o usuário acreditar que o clique abrirá imediatamente um QR Code de cobrança, derrubando a taxa de clique (CTR) da dobra principal.
- **Problema Central 2 — Ancoragem em "Preço Baixo" vs. "Alto Valor Percebido":** Repetir o preço na Hero, nos Passos, no Preço e no Rodapé sem construir valor antes posiciona o produto como "ferramenta baratinha" em vez de "design com padrão de agência na velocidade do seu balcão". Comerciantes de gastronomia, estética e varejo querem que sua marca pareça cara e confiável para seus clientes.
- **Problema Central 3 — Vazamento de Jargão Técnico:** Expressões como *"IA Multimodal"*, *"Insumos Visuais"*, *"Placeholders"* e *"PNGs"* pertencem ao vocabulário de engenharia de software, não à rotina do dono de açougue, pizzaria, barbearia ou salão.

### 1.2. Diagnóstico pela Equação de Valor (`offers` — Hormozi Value Equation)

$$\text{Valor} = \frac{\text{Resultado Desejado} \times \text{Probabilidade Percebida}}{\text{Tempo de Espera} \times \text{Esforço e Sacrifício}}$$

| Alavanca | Estado Atual na LP | Correção Proposta nesta Reformulação |
| :--- | :--- | :--- |
| **Resultado Desejado (↑)** | Descreve o artefato técnico ("Seu Card Publicitário gerado por IA"). | Conecta ao resultado comercial real: **anúncios bonitos que enchem o WhatsApp de pedidos sem depender de agência ou perder horas no celular**. |
| **Probabilidade Percebida (↑)** | Pede pagamento antes de provar que funciona para o nicho do cliente. | **Reversão Total de Risco:** enfatiza que o comerciante **gera e vê a prévia de graça** antes de decidir pagar, mais **3 ajustes por IA** inclusos. |
| **Tempo de Espera (↓)** | Menciona "90 segundos" escondido no final de uma lista de 7 segmentos. | Traz os **90 segundos** para o subtítulo enxuto e para o botão de ação principal. |
| **Esforço e Sacrifício (↓)** | Usa termos que parecem dar trabalho ("Dados & Insumos Visuais", "Placeholders"). | Simplifica para 3 ações do cotidiano: **1. Descreva sua promoção ➔ 2. A IA monta na hora ➔ 3. Baixe e poste**. |

---

## 2. Especificação Completa de Copy por Componente

---

### 2.1. Seção Hero (`src/components/shared/landing-hero-section.tsx`)

#### Comparativo Antes vs. Depois

| Elemento | Copy Atual (Com Atrito) | Nova Copy Recomendada (Alta Conversão) |
| :--- | :--- | :--- |
| **Badge Superior** | `IA Multimodal para Microempresários & Comércio Local` | `Feito para Donos de Mercado, Pizzaria, Salão e Comércio Local` |
| **Headline (H1)** | `Seu Card Publicitário gerado por IA e pronto para postar.` | `Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência.` |
| **Subtítulo (Lead)** | `Crie artes profissionais para Supermercados, Salões, Barbearias, Pizzarias, Hamburguerias, Restaurantes e Comércio Local em menos de 90 segundos.` | `Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu card profissional pronto para postar no WhatsApp e Instagram.` |
| **CTA Principal** | `Criar meu card agora (R$ 9,90 via Pix)` | `Gerar meu card grátis em 90 segundos` |
| **Micro-copy 1** | `Sem mensalidade` | `Gere a prévia gratuitamente` |
| **Micro-copy 2** | `Feed (4:5) & Story (9:16)` | `Sem cadastro demorado` |
| **Micro-copy 3** | `Download HD sem marca d'água` | `Pronto para Feed & Story` |

#### Alternativas de Headline e CTA para Teste A/B (`copywriting` + `cro`)
- **Opção A (Recomendada — Dor Operacional + Anti-Alternativa):**
  - **Headline:** *Anúncios que vendem o seu produto hoje, sem perder horas no Canva nem pagar agência.*
  - **Subtítulo:** *Digite o nome da oferta e o preço. Em 90 segundos, a IA entrega seu card profissional pronto para postar no WhatsApp e Instagram.*
  - **CTA:** *Gerar meu card grátis em 90 segundos*
- **Opção B (Foco em Velocidade e Praticidade Diária):**
  - **Headline:** *A promoção do dia pronta para o WhatsApp antes mesmo de você abrir a loja.*
  - **Subtítulo:** *Preencha o produto e o valor pelo celular. A IA monta a arte completa com visual de agência em menos de 90 segundos.*
  - **CTA:** *Criar meu card em 90 segundos*
- **Opção C (Foco em Autoridade Visual e Vendas):**
  - **Headline:** *Deixe as promoções do seu comércio com visual de marca grande em 90 segundos.*
  - **Subtítulo:** *Sem mexer em programas de design. Informe sua oferta, veja a prévia na hora e poste no Feed e nos Stories hoje mesmo.*
  - **CTA:** *Testar grátis com a minha oferta*

#### Nota de Implementação Técnica (`landing-hero-section.tsx`)
- Remover a importação e chamada de `getDefaultCampaignPlan()` de `landing-hero-section.tsx`, pois o componente Hero não deve exibir nem acoplar dados de preço.

#### Justificativa de CRO
1. **Remoção total do atrito financeiro no primeiro clique:** O visitante não está comprando no botão da Hero; ele está iniciando a experiência de criação (`/criar`). Trocar `(R$ 9,90 via Pix)` por `Gerar meu card grátis em 90 segundos` alinha a promessa do botão com a etapa real seguinte do funil (gerar a prévia gratuita).
2. **Regra dos 5 Segundos:** O subtítulo cai de 23 palavras com 7 vírgulas para duas frases curtas e concretas baseadas na ação física do comerciante ("Digite o nome da oferta e o preço").
3. **Ataque às alternativas reais:** A headline nomeia diretamente os dois maiores concorrentes na rotina do lojista (perder horas no Canva ou pagar caro para agência), gerando identificação imediata.

---

### 2.2. Seção de Passos (`src/components/shared/landing-steps-section.tsx`)

#### Comparativo Antes vs. Depois

| Elemento | Copy Atual (Técnica/Burocrática) | Nova Copy Recomendada (Simplicidade Extrema) |
| :--- | :--- | :--- |
| **Badge da Seção** | `Simples e Direto` | `Simples do Início ao Fim` |
| **Título da Seção (H2)** | `Como funciona em 3 passos` | `Da sua ideia para o WhatsApp dos clientes em 3 passos` |
| **Subtítulo da Seção** | `Você não precisa de cadastro, cartão de crédito ou tutorial. Só preencher e baixar.` | `Tudo direto pelo celular, sem criar conta e sem mexer em ferramentas complicadas de edição.` |
| **Passo 1 — Título** | `Escolha seu Ramo` | `Descreva sua promoção` |
| **Passo 1 — Subtítulo** | `Supermercado, Salão, Barbearia, Pizzaria, Hamburgueria, Restaurante ou Comércio.` | `Escolha o ramo do seu negócio, digite a oferta e o preço que vai anunciar.` |
| **Passo 1 — Corpo** | `A IA adapta o vocabulário, placeholders e clima publicitário com base no seu nicho.` | `Tem foto do produto no celular? Pode enviar junto. Se não tiver, a própria IA cria o cenário e a imagem para você.` |
| **Passo 2 — Título** | `Dados & Insumos Visuais` | `A IA monta o card na hora` |
| **Passo 2 — Subtítulo** | `Digite o produto, valor e anexe opcionalmente foto do produto ou referência.` | `Em menos de 90 segundos, seu anúncio fica pronto com iluminação, cores e preço em destaque.` |
| **Passo 2 — Corpo** | `Se não tiver foto, a IA cria a imagem do zero com iluminação e composição profissional.` | `Você confere a prévia completa na tela gratuitamente antes de tomar qualquer decisão.` |
| **Passo 3 — Título** | `Pix e Download HD` | `Baixe em alta definição e poste` |
| **Passo 3 — Subtítulo** | `Pague R$ 9,90 no Pix e receba os PNGs nítidos sem marca d'água em segundos.` | `Gostou do resultado? Libere os arquivos sem marca d'água e publique no WhatsApp e Instagram.` |
| **Passo 3 — Corpo** | `Confirmação instantânea com direito a até 3 regenerações por IA pós-compra.` | `Você já recebe as duas versões prontas (Feed e Story) para mandar nos grupos e atrair pedidos no mesmo minuto.` |

#### Nota de Implementação Técnica (`landing-steps-section.tsx`)
- Remover `getDefaultCampaignPlan()` de `landing-steps-section.tsx` para eliminar a repetição precoce de preço na seção explicativa de funcionamento.

#### Justificativa de CRO
1. **Eliminação de jargão técnico:** Termos como *"placeholders"*, *"insumos visuais"* e *"PNGs"* foram banidos. O comerciante lê palavras do dia a dia: *promoção, preço, foto no celular, prévia na tela, WhatsApp e Instagram*.
2. **Redução do esforço percebido:** O fluxo de 3 passos agora reflete exatamente a jornada mental do usuário: informar o que quer vender ➔ ver a IA montar de graça ➔ baixar e postar.
3. **Antecipação da Objeção "Não tenho foto boa":** O Passo 1 já tranquiliza quem não tem foto profissional do prato ou produto.

---

### 2.3. Seção de Preço & Oferta (`src/components/shared/landing-pricing-section.tsx`)

#### Comparativo Antes vs. Depois

| Elemento | Copy Atual (Sem Ancoragem) | Nova Copy Recomendada (Ancoragem + Reversão de Risco) |
| :--- | :--- | :--- |
| **Badge Superior** | `Preço Avulso & Justo` | `Risco Zero: Teste Antes de Pagar` |
| **Título (H2)** | `Apenas R$ 9,90 por campanha completa` | `Visual de agência por uma fração do que você gasta hoje` |
| **Subtítulo (Ancoragem)** | `1 card publicitário entregue nos dois formatos: Feed (1080×1350) e Story (1080×1920).` | `Uma agência cobra R$ 150 por arte avulsa e o Canva consome 2 horas da sua noite. Aqui você gera a prévia de graça e só paga se aprovar o resultado.` |
| **Rótulo de Preço** | `R$ 9,90 / avulso` | `R$ 9,90 / por campanha aprovada (Feed + Story)` |
| **Benefício 1 (Reversão de Risco)** | `Sem mensalidade ou fidelidade` | `Você só paga depois de ver a prévia gerada com marca d'água` |
| **Benefício 2 (Entrega Dupla HD)** | `QR Code Pix e Copia e Cola instantâneo` | `Download imediato em altíssima definição: Feed (1080×1350) e Story (1080×1920)` |
| **Benefício 3 (Garantia de Ajuste)** | `Download direto em alta resolução` | `Direito a até 3 regenerações por IA após a compra para ajustar detalhes` |
| **Benefício 4 (Sem Amarração)** | `Até 3 regenerações por IA inclusas` | `Pagamento único via Pix, sem mensalidade e sem cadastrar cartão` |
| **CTA da Oferta** | `Criar meu card agora sem cadastro` *(com ícone QrCode)* | `Gerar minha prévia grátis agora` *(com ícone Sparkles ou Bolt)* |
| **Micro-copy de Segurança** | `Pagamento protegido via Pix Dinâmico` | `Zero compromisso: gere a prévia sem pagar nada • Liberação instantânea via Pix` |

#### Justificativa de CRO e Oferta (`offers`)
1. **Ancoragem Dupla (Dinheiro + Tempo):** Antes de ler o número `R$ 9,90`, o cérebro do comerciante processa duas referências reais e dolorosas: **R$ 150 de um designer/agência** e **2 horas perdidas à noite no Canva**. Diante dessas duas âncoras, R$ 9,90 deixa de ser uma despesa e passa a ser um alívio imediato.
2. **Reversão Total de Risco (Try Before You Buy):** O maior medo do comprador em ferramentas de IA é *"E se a arte ficar feia depois que eu pagar?"*. Ao destacar no topo e no primeiro item do checklist que **ele só paga depois de ver a prévia gerada** e ainda conta com **até 3 regenerações por IA pós-pagamento**, neutralizamos a ansiedade de compra.
3. **Correção do Ícone e Copy do Botão:** O botão atual usava um ícone de `QrCode`, reforçando a impressão errada de cobrança imediata. A troca para `Gerar minha prévia grátis agora` mantém 100% de consistência com o fluxo real da aplicação.

---

### 2.4. Seções Complementares para Coerência Integral da Página

Para que a Landing Page inteira fale a mesma língua (sem pontos cegos onde o foco em preço baixo ou jargão técnico reapareça), recomendamos também os seguintes ajustes nos componentes de apoio:

#### A. Header (`src/components/shared/landing-header.tsx`)
- **Badge Atual:** `Sem cadastro` ➔ **Manter:** `Sem cadastro` (excelente redutor de atrito).
- **CTA Atual:** `Criar Card com IA` ➔ **Nova Copy:** `Gerar prévia grátis`
- **Justificativa CRO:** O cabeçalho fixo (`sticky top-0`) acompanha toda a rolagem no celular. Mudar o botão para `Gerar prévia grátis` reforça a ausência de risco durante toda a leitura da página.

#### B. Seção de Segmentos (`src/components/shared/landing-segments-section.tsx`)
- **Badge Atual:** `Multisegmento Especializado` ➔ **Nova Copy:** `Feito para a Rotina do Comércio`
- **Título (H2) Atual:** `Feito para o seu tipo de negócio` ➔ **Nova Copy:** `Pronto para o ritmo do seu balcão`
- **Subtítulo Atual:** `A IA adapta automaticamente os elementos gráficos, iluminação, cores e tipografia ao perfil exato da sua empresa.` ➔ **Nova Copy:** `Não importa se você vende quilo de alcatra, pizza grande ou corte de cabelo: a IA já conhece o visual que dá água na boca e atrai clientes no seu ramo.`
- **Descrições dos 6 Cards de Segmento:**
  1. **Supermercados:** `Dia do hortifrúti, ofertas do açougue e encartes de fim de semana com preço bem visível.`
  2. **Salões & Barbearias:** `Combos de corte e barba, progressiva, manicure e promoções para encher a agenda da semana.`
  3. **Pizzarias:** `Foto de queijo derretendo, borda recheada e combo família com refrigerante para bombar o delivery.`
  4. **Hamburguerias:** `Smash burger na chapa, cheddar cremoso e combos com batata que dão fome só de olhar no celular.`
  5. **Restaurantes:** `Prato feito do dia, marmitex, executivo e cardápio de almoço pronto antes de abrir as portas.`
  6. **Comércio Local:** `Queima de estoque em lojas de roupa, banho e tosa em pet shop, óticas, farmácias e oficinas.`
- **Justificativa CRO:** Aplica a regra n.º 1 do `copywriting` (*"Can the reader picture it?"*). Troca descrições genéricas por cenas concretas que o comerciante vive toda semana (quilo de alcatra, agenda vazia na semana, marmitex do almoço, banho e tosa).

#### C. Seção de Formatos (`src/components/shared/landing-formats-section.tsx`)
- **Badge Atual:** `2 Formatos em 1 Compra` ➔ **Nova Copy:** `2 Formatos Prontos de Uma Vez`
- **Título (H2) Atual:** `Pronto para Feed e Stories do Instagram e WhatsApp` ➔ **Nova Copy:** `Uma única criação entrega o post do Feed e a tela cheia do Story`
- **Subtítulo Atual:** `Cada geração cria automaticamente as 2 peças nas proporções recomendadas para você postar sem cortes.` ➔ **Nova Copy:** `Nada de post cortado pela metade ou letra miúda que ninguém lê no celular. Você recebe os dois tamanhos certos para divulgar em todas as redes.`
- **Card 1 (Feed Retrato `1080 × 1350 px`):**
  - **Título:** `Post para Feed e Grupos`
  - **Descrição:** `Formato retrato que ocupa mais espaço na tela do celular e faz o cliente parar de rolar o Instagram.`
  - **Rodapé:** `Ideal para fixar no perfil da loja e disparar nas listas de transmissão do WhatsApp.`
- **Card 2 (Story & Status `1080 × 1920 px`):**
  - **Título:** `Story e Status com Espaço para Link`
  - **Descrição:** `Tela cheia vertical com espaço livre na parte de baixo para você colar a figurinha do link do seu WhatsApp.`
  - **Rodapé:** `Perfeito para postar todo dia no Status do WhatsApp e nos Stories sem tampar o preço.`
- **Justificativa CRO:** Remove a palavra "Compra" do badge e traduz proporções técnicas (`4:5` e `9:16`) no benefício prático que o comerciante entende: o post não corta o preço e sobra o lugar exato para colar o botão do WhatsApp nos Stories.

#### D. Rodapé (`src/components/shared/landing-footer.tsx`)
- **Descrição da Marca Atual:** `Cards publicitários profissionais gerados por IA para Instagram e WhatsApp em menos de 90 segundos. R$ 9,90 avulso via Pix, sem mensalidade ou cadastro.`
- **Nova Descrição da Marca:** `Anúncios profissionais gerados por IA para Instagram e WhatsApp em menos de 90 segundos. Gere a prévia grátis, sem cadastro e sem mensalidade.`
- **Justificativa CRO:** Mantém o rodapé institucional alinhado à proposta de valor e livre de ancoragem precoce de preço.

---

## 3. Auditoria de Conformidade Anti-Slop (`copywriting` Self-Check)

| Regra Anti-Slop | Verificação na Nova Copy | Status |
| :--- | :--- | :---: |
| Proibido *"Não é apenas X, é Y"* (Contrast reveals) | Zero ocorrências em todas as seções. | ✅ Aprovado |
| Proibido *"No mundo dinâmico de hoje"* / *"Próximo nível"* | Zero clichês corporativos ou de IA. | ✅ Aprovado |
| Proibido jargão técnico (*IA Multimodal, Insumos, Placeholders*) | Substituído por vocabulário real de balcão e comércio local. | ✅ Aprovado |
| Proibido preço ou *"via Pix"* no botão do Hero | Removido 100% do botão principal e da seção de passos. | ✅ Aprovado |
| Proibido travessões (`—`) em headlines e botões | Zero travessões nos títulos, subtítulos e CTAs. | ✅ Aprovado |
| Especificidade e Imagem Mental (*Three-Question Gate*) | Exemplos concretos (2 horas no Canva, R$ 150 de agência, 90 segundos, 1080×1350 e 1080×1920, figurinha do WhatsApp). | ✅ Aprovado |

---

## 4. Hipóteses de Teste e Métricas de Sucesso (`cro`)

1. **Hipótese Primária (Topo de Funil — Hero CTA):**
   - *Se* removermos a menção prematura a `(R$ 9,90 via Pix)` do botão principal do Hero e substituirmos por `Gerar meu card grátis em 90 segundos` com os selos `Gere a prévia gratuitamente` e `Sem cadastro demorado`, *então* a taxa de passagem da Landing Page para o fluxo `/criar` (`LP Click-Through Rate`) aumentará em **+25% a +45%**, *porque* eliminamos a percepção de cobrança imediata antes da experimentação do produto.
2. **Hipótese Secundária (Fundo de Funil — Seção de Oferta):**
   - *Se* ancorarmos o valor de R$ 9,90 contra R$ 150 de uma arte avulsa de agência e 2 horas perdidas no Canva, enfatizando a reversão de risco (*só paga depois de aprovar a prévia + 3 ajustes por IA*), *então* aumentaremos a conversão em pagamento Pix (`InitiateCheckout` ➔ `Purchase`) sem atrair objeções de preço.
