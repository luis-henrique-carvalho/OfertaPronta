# Modelagem Financeira & Unit Economics — OfertaPronta

- **Documento:** `docs/marketing/unit-economics.md`
- **Responsável:** Performance Marketing Manager
- **Status:** Baseline de Lançamento / Go-to-Market (GTM)
- **Data:** 2026-10-27
- **Versão:** 1.0

---

## 1. Visão Geral do Modelo de Negócios

O **OfertaPronta** opera em modelo de **B2B Micro-SaaS transacional sob demanda**, eliminando a barreira de entrada típica de assinaturas recorrentes para micro e pequenos comerciantes locais (MEIs, donos de mercadinhos, salões, pizzarias e barbearias).

### Premissas Centrais:
- **Preço de Venda Unitário (Ticket Avulso):** R$ 9,90 por campanha aprovada.
- **Entrega por Pedido:** 2 arquivos em alta definição sem marca d'água:
  - Feed Retrato: `1080 × 1350 px` (proporção 4:5).
  - Story & Status: `1080 × 1920 px` (proporção 9:16).
- **Direito a Regenerações:** Até 3 regenerações por IA inclusas pós-pagamento.
- **Forma de Pagamento:** Pix dinâmico via Pushin Pay (QR Code + Copia e Cola) com liberação instantânea.
- **Sem Custos Ocultos:** Sem mensalidade fixa, sem cobrança recorrente no cartão de crédito e sem fidelidade.

---

## 2. Decomposição de Custos Diretos e Variáveis (COGS)

Para garantir sustentabilidade financeira em escala com tráfego pago, cada custo envolvido na jornada desde a geração da prévia até a entrega final foi mapeado e parametrizado.

| Componente de Custo | Provedor / Mecanismo | Base de Cálculo | Custo Unitário (R$) | % da Receita Bruta |
| :--- | :--- | :--- | :--- | :--- |
| **Taxa de Gateway Pix** | Pushin Pay | Tarifa fixa por transação Pix liquidada (`orders.status === "PAID"`) | **R$ 0,35** | 3,54% |
| **IA — Planejamento de Prompt** | Google Gemini 1.5/2.0 Flash | Parsing de briefing, taxonomia do nicho e prompt estruturado (~1.200 tokens @ $0.075/1M tokens) | **R$ 0,01** | 0,10% |
| **IA — Geração de Imagens** | Google Gemini Multimodal / Imagen | - Prévia com marca d'água: 1 imagem<br>- Export HD (Feed + Story): 2 imagens<br>- Média observada de regeneração pós-compra: 0,6 ciclo (1,2 imagens)<br>Custo médio: ~4,2 imagens @ $0.038 USD (câmbio R$ 5,80) | **R$ 0,93** | 9,39% |
| **Armazenamento & CDN** | Cloudflare R2 / S3 + Fastly CDN | Upload, processamento e disponibilização dos PNGs em alta definição (TTL de download 30 dias) | **R$ 0,08** | 0,81% |
| **Hospedagem & Infraestrutura** | Vercel Serverless + Neon PostgreSQL | Execução de rotas API, webhooks e persistência relacional do pedido | **R$ 0,08** | 0,81% |
| **Tributação (Simples Nacional)** | Anexo III — Serviços de TI / Software | Alíquota inicial da faixa 1 do Simples Nacional (6,00% sobre faturamento bruto) | **R$ 0,59** | 5,96% |
| **Total de Custos Variáveis (COGS)** | — | — | **R$ 2,04** | **20,61%** |

---

## 3. Demonstração de Margem de Contribuição Unitária (CMU)

Abaixo é apresentada a margem de contribuição líquida por pedido pago de R$ 9,90, comparando o **Cenário Base (Uso Médio)** com o **Cenário Estresse (Pior Caso Operacional)**.

| Linha Financeira | Cenário Base (0,6 reg.) | Cenário Estresse (3 reg. completas) | Observações |
| :--- | :--- | :--- | :--- |
| **Receita Bruta** | **R$ 9,90** | **R$ 9,90** | Ticket de compra avulsa |
| (-) Impostos (Simples 6%) | -R$ 0,59 | -R$ 0,59 | Simples Nacional Anexo III |
| **Receita Líquida** | **R$ 9,31** | **R$ 9,31** | Base líquida pós-tributos |
| (-) Pushin Pay (Taxa Pix) | -R$ 0,35 | -R$ 0,35 | Taxa fixa independente do volume |
| (-) Custos de IA (Gemini) | -R$ 0,94 | -R$ 1,55 | Prévia + 2 HD + 6 imagens extras de regeneração |
| (-) Infraestrutura / Storage | -R$ 0,16 | -R$ 0,25 | Bandwidth e processamento extra |
| **Custos Variáveis Totais** | **-R$ 2,04** | **-R$ 2,74** | COGS integral por pedido |
| **Margem de Contribuição Unitária (CMU)** | **R$ 7,86** | **R$ 7,16** | Saldo para cobrir CAC e gerar lucro |
| **Margem de Contribuição (%)** | **79,39%** | **72,32%** | Margem saudável para produto digital |

---

## 4. Determinação do Break-even CPA e Metas de Aquisição

O **Break-even CPA** representa o teto máximo absoluto que o OfertaPronta pode gastar no Meta Ads para adquirir um cliente no primeiro pedido sem operar no prejuízo imediato.

### 4.1. Limites de Aquisição (Primeiro Pedido):

$$\text{Break-even CPA} = \text{Receita Bruta} - \text{Custos Variáveis} = \text{R\$ 7,86}$$

> [!IMPORTANT]
> **Piso Inegociável de Governança de Tráfego:**
> - **Break-even CPA (Teto Máximo):** **R$ 7,90** (qualquer anúncio com CPA sustentado acima de R$ 7,90 por mais de 72 horas em janela de aprendizado deve ser pausado).
> - **Floor ROAS:** **1,25x** sobre a receita bruta do primeiro pedido.
> - **Target CPA (Meta Saudável):** **R$ 4,50 a R$ 6,00** por pedido pago.
> - **Target ROAS:** **1,65x a 2,20x** no primeiro pedido.
> - **Lucro Líquido Unitário no Target CPA:** R$ 1,86 a R$ 3,36 por novo cliente adquirido no primeiro dia.

---

## 5. Matriz de Sensibilidade: CPC, CTR e Conversão do Funil

Para atingir o Target CPA de R$ 4,50 a R$ 6,00 com um ticket de R$ 9,90, a tabela de sensibilidade abaixo mapeia a taxa de conversão final necessária (Visitante da Landing Page ➔ Pedido Pix Pago) em função do Custo por Clique (CPC no Meta Ads):

| Custo por Clique (CPC) | Taxa Conv. Global necessária para CPA R$ 4,50 | Taxa Conv. Global necessária para CPA R$ 6,00 | Taxa Conv. Global necessária para Break-even (R$ 7,90) | Viabilidade Operacional |
| :---: | :---: | :---: | :---: | :---: |
| **R$ 0,15** | 3,33% | 2,50% | 1,90% | Excelente / Alta Folga |
| **R$ 0,25** | 5,55% | 4,16% | 3,16% | Ideal para Reels / Feed Aberto |
| **R$ 0,35** | 7,77% | 5,83% | 4,43% | Dentro da meta para criativos validados |
| **R$ 0,50** | 11,11% | 8,33% | 6,33% | Requer CRO refinado na LP |
| **R$ 0,75** | 16,66% | 12,50% | 9,49% | Risco Alto (demanda criativos mais agressivos) |

### Decomposição das Etapas do Funil Alvo:
1. **Taxa de Passagem LP ➔ Início de Criação (`/criar`):** 40% a 55% (graças ao CTA com fricção zero: *"Gerar meu card grátis em 90 segundos"*).
2. **Taxa de Conclusão do Briefing ➔ Prévia Gerada (`GeneratePreview`):** 65% a 75%.
3. **Taxa de Prévia ➔ Início de Checkout (`InitiateCheckout`):** 30% a 42%.
4. **Taxa de Conversão Pix (`InitiateCheckout` ➔ `Purchase` Pago):** 45% a 60% (pagamento instantâneo via QR Code e Copia e Cola Pushin Pay).
5. **Taxa de Conversão Global Estimada:** **3,5% a 5,5%** dos visitantes da LP tornam-se compradores pagos.

---

## 6. Projeção de LTV (Lifetime Value) e Retenção Orgânica

O modelo de aquisição do OfertaPronta não depende exclusivamente do lucro do primeiro pedido. A rotina de varejo e serviços locais exige **divulgações semanais recorrentes** (Quarta da Carne, Sexta da Pizza, Promoção de Terça no Salão, Sábado do Delivery).

### 6.1. Frequência Natural de Compra dos Segmentos:
- **Gastronomia (Pizzarias/Hamburguerias/Restaurantes):** 2 a 4 cards por semana.
- **Supermercados & Açougues:** 2 a 3 encartes por semana.
- **Salões & Barbearias:** 1 a 2 promoções semanais para preenchimento de horários ociosos.
- **Varejo & Serviços Locais:** 2 a 4 cards por mês.

### 6.2. Curva de Retenção & Cohort Esperada (60 e 90 dias):

| Período | Frequência Média de Pedidos | Receita Bruta Acumulada | Margem de Contribuição Acumulada (CMU) | ROAS Real Efetivo (CAC R$ 5,00) |
| :--- | :---: | :---: | :---: | :---: |
| **Dia 0 (Aquisição)** | 1,00 pedido | R$ 9,90 | R$ 7,86 | 1,98x |
| **Dia 30 (M1)** | 1,85 pedidos | R$ 18,31 | R$ 14,54 | 3,66x |
| **Dia 60 (M2)** | 2,70 pedidos | R$ 26,73 | R$ 21,22 | 5,34x |
| **Dia 90 (M3)** | 3,45 pedidos | R$ 34,15 | R$ 27,11 | 6,83x |

### 6.3. Alavanca de Expansão: Pacotes de Volume (Roadmap Fase 2)
Após a validação do fluxo avulso de R$ 9,90, serão introduzidos pacotes de créditos na tela pós-compra e no fluxo de checkout:
- **Pacote Pequeno (5 campanhas):** R$ 29,90 (R$ 5,98 por campanha). CMU estimada: **R$ 22,60**.
- **Pacote Profissional (10 campanhas):** R$ 49,90 (R$ 4,99 por campanha). CMU estimada: **R$ 38,10**.

> [!TIP]
> **Impacto na Aquisição:** A introdução futura de pacotes como *upsell pós-compra* eleva o Ticket Médio Imediato (AOV) de R$ 9,90 para ~R$ 16,50, permitindo absorver custos de tráfego mais altos caso o leilão do Meta Ads encareça no quarto trimestre.
