---
trigger: always_on
description: Organiza tarefas grandes com os recursos de delegação disponíveis no ambiente, sem impor ferramentas específicas.
---

## Orquestração Mandatória de Subagentes (Padrão Boost & Feature Factory)

Neste repositório, o agente primário da conversa atua como **User Bridge** e a execução técnica é delegada ao subagente **`feature-orchestrator`**.

### Regras Inegociáveis de Execução:

1. **Topologia Hierárquica de Planejamento e Execução**:
   - **Nível 1 — Chat Canvas (Root / User Bridge)**:
     - Coordena a descoberta inicial acionando `codebase-researcher` (`model: flash`) para mapeamento rápido do grafo (`graphify query`).
     - Delega o **Gate 0 Mandatório (`/grill-me`) e Planejamento (`/plan`)** para a dupla de especialistas em `model: inherit`:
       - **`product-manager`**: analisa regras de negócio, domínio (`PRD.md`, `GLOSSARY.md`) e UX mobile-first, entrevistando o usuário diretamente via `ask_question` para eliminar gaps de negócio, salvando a Spec de Produto em `docs/specs/<slug>.md` (`to-spec`) e os tickets verticais em `docs/tickets/<slug>/<NN>-<ticket>.md` (`to-tickets`).
       - **`solution-architect`**: avalia arquitetura (*Deep Modules*), isolamento Client/Server, qualidade (SOLID/Ponytail) e segurança (Zod nas bordas, HMAC, idempotência, preços autoritativos), entrevistando o usuário via `ask_question` e redigindo a especificação técnica em `docs/plans/<slug>.md` (e `implementation_plan.md`) com diagramas Mermaid estruturais obrigatórios.
     - Aguarda aprovação explícita do usuário no Gate Humano 1 & 2.
     - Invoca o subagente `feature-orchestrator` (`Role: "Feature Factory Orchestrator"`) com o plano aprovado.
     - Apresenta o resultado final no Gate 3 e dispara o fechamento `/learn`.
   - **Nível 2 — Subagente Orquestrador (`feature-orchestrator`)**:
     - Ativa suas skills no Passo 0.
     - Comanda a esteira técnica e gerencia os blocos de execução paralela.
     - Conduz o loop de auto-correção iterativo caso haja quebras de teste ou code smells.
     - Reporta o resultado consolidado ao Chat Canvas.

2. **Passo 0 Mandatório de Ativação de Skills (Progressive Disclosure)**:
   - Todo agente e subagente DEVE iniciar sua execução lendo os arquivos `SKILL.md` de seus respectivos playbooks através da ferramenta `view_file`.
   - **Resolução Dinâmica**: O caminho absoluto deve ser obtido dinamicamente da seção `Available skills` do prompt do sistema ou resolvido a partir da raiz do workspace ativo: `<workspace_root>/.agents/skills/<skill>/SKILL.md` (onde `<workspace_root>` é a URI do workspace atual). Nunca utilize caminhos absolutos fixos nos playbooks.

3. **Paralelismo Duplo Inteligente (Construção e Validação)**:
   - **Bloco 1 — Construção Concorrente**: Devido ao desacoplamento arquitetural (Isolamento Client/Server e Server Functions type-safe), `backend-builder` (serviços, Drizzle, rotas de API, adapters) e `frontend-builder` (rotas TanStack Router, componentes de UI, preview canvas, mobile-first) **PODEM e DEVEM ser despachados em paralelo** dentro de uma única chamada de `invoke_subagent` sempre que atuarem em diretórios desacoplados.
   - **Bloco 2 — Validação & Auditoria Concorrentes**: Concluída a construção, `test-verifier` (execução da suíte Vitest `pnpm test`, typecheck e linting) e `implementation-validator` (leitura e auditoria do diff contra Spec/SOLID/Ponytail) **PODEM e DEVEM ser despachados simultaneamente** em uma única chamada de `invoke_subagent`. Como o validador é estritamente read-only e o verificador executa testes em processo isolado, não há concorrência de arquivos nem disputa de git lock.
   - Apenas arquivos compartilhados da raiz (ex.: `package.json`, configurações de bundler) operam em sequência.
   - **Identificadores Canônicos (`TypeName`)**:
     Ao invocar workers via `invoke_subagent`, utilize SEMPRE os identificadores únicos definidos em `.agents/agents/<name>.md`:
     - `codebase-researcher` para mapeamento rápido do grafo (`graphify`) e leitura exploratória (`model: flash`).
     - `product-manager` para descoberta de regras de negócio, casos de borda, UX mobile e entrevistas `/grill-me` via `ask_question` (`model: inherit`).
     - `solution-architect` para arquitetura (*Deep Modules*), segurança, qualidade, entrevistas `/grill-me` técnicas e escrita de `docs/plans/<slug>.md` (`model: inherit`).
     - `backend-builder` para o backend (TypeScript, TanStack Start Server Functions, Drizzle ORM, Sharp/Resvg, Pix Webhooks) (`model: flash`).
     - `frontend-builder` para o frontend (TanStack Start, React 19, Tailwind CSS v4, shadcn/ui, SVG preview) (`model: flash`).
     - `test-verifier` para a suíte de testes (Vitest) e qualidade (typecheck, lint) (`model: flash`).
     - `implementation-validator` para a auditoria de código, spec e anti-bloat (`model: flash`).
     **NUNCA use `TypeName: "self"`** em despachos a partir do orquestrador (`self` é restrito ao agente raiz e sua invocação a partir de um subagente é bloqueada pelo runtime com erro fatal).

4. **Template Canônico de Prompt para Subagentes (Padrão Boost)**:
   Ao despachar subagentes, o prompt DEVE seguir rigorosamente a estrutura profunda:
   ```markdown
   **Task**: [Instrução do usuário verbatim]

   **Passo 0: Ativação Obrigatória de Skills (MANDATÓRIO)**:
   Antes de executar qualquer comando ou criar/modificar arquivos, você DEVE carregar seus playbooks invocando `view_file` nos caminhos resolvidos a partir da lista de `Available skills` do prompt do sistema (ou `<workspace_root>/.agents/skills/<skill>/SKILL.md`):
   - `<workspace_root>/.agents/skills/<skill_1>/SKILL.md` (ou via `Available skills`)
   - `<workspace_root>/.agents/skills/<skill_2>/SKILL.md` (ou via `Available skills`)

   **Additional Context**:
   - Repositório/Subprojeto: <caminho> | Branch: <branch>
   - Plano Técnico: docs/plans/<slug>.md e implementation_plan.md
   - Regras Canônicas: AGENTS.md local do projeto (Decoupled APIs, Strict Types, CLI nativo)

   **Escopo a Implementar**:
   1. Componentes/Arquivos exatos a criar ou modificar.
   2. Tipos, DTOs, schemas e rotas necessárias.
   3. Protocolos de qualidade (TDD Red-Green no backend, UI acessível e intencional no frontend).
   4. Comandos de validação (suíte de testes do subprojeto alvo).
   ```

5. **Ritual de Fechamento com `/learn`**:
   - Concluída a entrega e aprovado o Gate 3, o Chat Canvas deve invocar o protocolo `/learn` para consolidar lições aprendidas e atualizar o `GEMINI.md`.