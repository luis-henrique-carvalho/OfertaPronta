# PRD — OfertaPronta

**Versão:** 1.0  
**Status:** MVP  
**Data:** 15/10/2026

## 1. Visão do produto

O OfertaPronta é uma plataforma web mobile-first que permite a pequenos comerciantes criar artes promocionais profissionais em poucos passos, sem precisar de conhecimento de design.

**Proposta de valor:** "Sua promoção pronta para postar, sem precisar saber design."

O usuário fornece as informações da oferta, seleciona um layout, visualiza uma prévia gratuita, realiza o pagamento via Pix e recebe os arquivos finais para publicar nas redes sociais.

### Público inicial

Pequenos negócios de alimentação:

- Hamburguerias
- Pizzarias
- Açaíterias
- Delivery em geral

## 2. Objetivos do MVP

1. Criar banners promocionais sem cadastro obrigatório.
2. Oferecer três templates profissionais.
3. Disponibilizar prévias gratuitas com marca d'água.
4. Permitir pagamento avulso com Pix.
5. Entregar automaticamente os arquivos em PNG após confirmação.
6. Medir conversão, custos e interesse em recompras.

**Meta de experiência:** permitir gerar uma prévia em até 90 segundos após o usuário começar a preencher as informações, em condições adequadas.

## 3. Fluxo principal

**Etapa 1 — Criar promoção**

O comerciante informa:

- Nome do estabelecimento.
- Nome do produto ou promoção.
- Preço promocional.
- Preço original (opcional).
- Foto do produto (opcional).
- Logotipo (opcional).
- Chamada para ação.
- WhatsApp comercial (opcional).

**Etapa 2 — Escolher design**

O sistema apresenta três templates adaptados às informações fornecidas.

O usuário pode alterar textos e escolher seu modelo preferido gratuitamente.

**Etapa 3 — Visualizar prévia**

Cada template possui uma prévia com marca d'água nos formatos Feed e Story.

**Etapa 4 — Comprar**

O usuário seleciona a opção de compra, visualiza QR Code e Pix Copia e Cola e realiza o pagamento.

**Etapa 5 — Receber**

Após confirmação do provedor, os arquivos são gerados sem marca d'água e liberados para download.

## 4. Monetização

**Preço inicial do MVP: R$ 9,90 por campanha.**

Uma campanha inclui um design selecionado em dois formatos:

- Instagram Feed: 1080 × 1350.
- Instagram Story: 1080 × 1920.

Pacotes previstos para uma segunda fase:

| Produto | Preço proposto |
|---|---:|
| 1 campanha | R$ 9,90 |
| 5 campanhas | R$ 29,90 |
| 10 campanhas | R$ 49,90 |

Os preços são hipóteses comerciais e precisam ser validados com compras reais.

## 5. Escopo funcional

| Requisito | Prioridade |
|---|---|
| Criar campanha sem login | P0 |
| Formulário com validação | P0 |
| Upload de foto e logo | P0 |
| Três templates | P0 |
| Prévia com marca d'água | P0 |
| Checkout Pix | P0 |
| Confirmação via webhook | P0 |
| Exportação PNG | P0 |
| Download protegido | P0 |
| Analytics de conversão | P0 |
| Recuperação de pedidos | P1 |
| Histórico de campanhas | P2 |
| Pacotes de créditos | P2 |

## 6. Regras de negócio

- O pagamento libera um design em dois formatos.
- Os preços são definidos exclusivamente no backend.
- O usuário pode alterar informações livremente antes da compra.
- Após a compra, a proposta é permitir até três correções simples em 30 minutos.
- O arquivo final só é liberado após confirmação segura do pagamento.
- Nenhuma informação promocional deve ser inventada pelo sistema.
- Os downloads devem ficar disponíveis por pelo menos sete dias, com mecanismo de acesso privado.
- A ausência de foto deve resultar em um layout tipográfico, e não em um produto fictício.

## 7. Arquitetura técnica

**Frontend e backend:** Next.js App Router, TypeScript, Tailwind CSS e shadcn/ui.

**Persistência:** PostgreSQL e Drizzle ORM.

**Imagens:** Cloudinary ou armazenamento compatível com S3.

**Renderização:** SVG com Sharp/Resvg para gerar arquivos PNG preservando a fidelidade dos textos e valores.

**Pagamentos:** integração Pix com Woovi/OpenPix ou provedor equivalente, utilizando cobranças dinâmicas e webhooks.

**Processamento:** fila de tarefas para gerar arquivos após a confirmação da compra, com tentativas automáticas em caso de falha.

**Inteligência artificial:** opcional para sugerir chamadas promocionais; fora do caminho crítico do MVP.

## 8. Modelo de dados

Entidades principais:

- `drafts`: informações preenchidas pelo usuário.
- `assets`: fotografias e logotipos.
- `campaigns`: layout selecionado e dados da campanha.
- `orders`: pedidos e valores cobrados.
- `payment_charges`: cobranças e estados de pagamento.
- `exports`: arquivos gerados.
- `analytics_events`: eventos do funil comercial.

Os dados de cada pedido devem preservar o conteúdo e o preço contratados, independentemente de alterações posteriores no formulário.

## 9. Segurança e privacidade

O sistema deverá:

- Validar dados no servidor.
- Confirmar a autenticidade dos webhooks.
- Evitar processamento duplicado dos pagamentos.
- Proteger arquivos por URLs assinadas ou tokens privados.
- Limitar abuso de uploads e chamadas à API.
- Definir regras de retenção e exclusão de imagens.
- Atender aos requisitos aplicáveis da LGPD.
- Informar claramente as condições de compra, correção e reembolso.

## 10. Métricas de sucesso

Indicadores essenciais:

- Visitantes que começam a criar.
- Usuários que chegam à prévia.
- Usuários que iniciam pagamento.
- Cobranças Pix efetivamente pagas.
- Faturamento bruto e margem por campanha.
- Tempo até a entrega.
- Erros de renderização.
- Taxa de recompra.

O lançamento deve priorizar evidências de compras reais, não apenas visitas ou elogios ao produto.

## 11. Critérios de aceite

O MVP estará pronto quando:

1. Um usuário sem conta conseguir criar uma campanha.
2. Três prévias forem apresentadas corretamente.
3. Os preços e textos forem reproduzidos sem alterações indevidas.
4. O checkout Pix funcionar em dispositivos móveis.
5. Um webhook validado confirmar o pagamento.
6. Webhooks duplicados não produzirem erros ou liberações indevidas.
7. Os dois PNGs forem gerados nas dimensões corretas.
8. Downloads não pagos permanecerem bloqueados.
9. Pedidos pagos puderem ser recuperados após atualizar a página.
10. Falhas de pagamento e renderização tiverem mensagens e caminhos de recuperação.

## 12. Roadmap

**Fase 0 — Validação comercial**

Conversar com comerciantes, apresentar exemplos e validar disposição real de pagar.

**Fase 1 — Protótipo funcional**

Formulário, um template, renderização, prévia, Pix em ambiente de testes e entrega de arquivos.

**Fase 2 — MVP publicável**

Adicionar mais dois templates, observabilidade, tratamento de erros, recuperação de pedidos, políticas de privacidade e controles de segurança.

**Fase 3 — Expansão**

Pacotes de créditos, identidade visual salva, novos segmentos, geração de campanhas completas e recursos opcionais de IA.

## 13. Fora do escopo inicial

O MVP não incluirá editor drag-and-drop, geração de vídeos, agendamento em redes sociais, assinatura mensal, múltiplos membros por organização nem editor de imagens avançado.

**Princípio de desenvolvimento:** validar a experiência completa de criação, pagamento e entrega antes de aumentar a quantidade de funcionalidades.