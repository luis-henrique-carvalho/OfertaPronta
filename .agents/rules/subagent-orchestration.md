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
       - **`product-manager`**: analisa regras de negócio, domínio (`AGENTS.md`, `PRD.md`, `GLOSSARY.md`) e jornada do usuário (UX), entrevistando o usuário diretamente via `ask_question` para eliminar gaps de negócio, salvando a Spec de Produto em `docs/specs/<slug>.md` (`to-spec`) e os tickets verticais em `docs/tickets/<slug>/<NN>-<ticket>.md` (`to-tickets`).
       - **`solution-architect`**: avalia arquitetura (*Deep Modules*), isolamento de camadas/fronteiras, qualidade (SOLID/Ponytail) e segurança (validação de schemas nas bordas, assinaturas/autenticação, idempotência e regras autoritativas no backend), entrevistando o usuário via `ask_question` e redigindo a especificação técnica em `docs/plans/<slug>.md` (e `implementation_plan.md`) com diagramas Mermaid estruturais obrigatórios.
     - Aguarda aprovação explícita do usuário no Gate Humano 1 & 2.
     - **Provisionamento Obrigatório de Git Worktree (Isolamento Físico de Features)**:
       Antes de invocar o `feature-orchestrator`, o Chat Canvas DEVE obrigatoriamente:
       1. Provisionar a worktree isolada: `git worktree add .worktrees/<slug> -b feat/<slug>`
       2. Garantir que `.worktrees/` conste no `.gitignore`.
       3. Invocar o `feature-orchestrator` passando o diretório da worktree (`Cwd: .worktrees/<slug>`) como raiz de execução para que a branch `main` permaneça 100% intocada até a homologação final.
     - Invoca o subagente `feature-orchestrator` (`Role: "Feature Factory Orchestrator"`) com o plano aprovado.
     - Apresenta o resultado final no Gate 3 e dispara o fechamento `/learn`.
   - **Nível 2 — Subagente Orquestrador (`feature-orchestrator`)**:
     - Ativa suas skills no Passo 0.
     - Comanda a esteira técnica e gerencia os blocos de execução paralela respeitando a ordem de dependência (`Blocked by:`) dos tickets em `docs/tickets/<slug>/`.
     - Conduz o loop de auto-correção iterativo caso haja quebras de teste ou code smells.
     - Reporta o resultado consolidado ao Chat Canvas.

2. **Passo 0 Mandatório de Ativação de Skills (Progressive Disclosure)**:
   - Todo agente e subagente DEVE iniciar sua execução lendo os arquivos `SKILL.md` de seus respectivos playbooks através da ferramenta `view_file`.
   - **Resolução Dinâmica**: O caminho absoluto deve ser obtido dinamicamente da seção `Available skills` do prompt do sistema ou resolvido a partir da raiz do workspace ativo: `<workspace_root>/.agents/skills/<skill>/SKILL.md` (onde `<workspace_root>` é a URI do workspace atual). Nunca utilize caminhos absolutos fixos nos playbooks.

3. **Paralelismo Duplo Inteligente (Construção e Validação)**:
   - **Bloco 1 — Construção Concorrente**: Devido ao desacoplamento arquitetural entre camadas, `backend-builder` (serviços, banco de dados, módulos profundos, rotas de API/RPC) e `frontend-builder` (rotas, telas, componentes de UI acessíveis e responsivos) **PODEM e DEVEM ser despachados em paralelo** dentro de uma única chamada de `invoke_subagent` sempre que atuarem em diretórios desacoplados.
   - **Bloco 2 — Validação & Auditoria Concorrentes**: Concluída a construção, `test-verifier` (execução da suíte de testes oficial, typecheck, linting, Dual Browser Audit e pipeline de verificação do `AGENTS.md`) e `implementation-validator` (leitura e auditoria do diff contra Spec/Plan/Tickets/SOLID/Ponytail) **PODEM e DEVEM ser despachados simultaneamente** em uma única chamada de `invoke_subagent`. Como o validador é estritamente read-only e o verificador executa testes em processo isolado, não há concorrência de arquivos nem disputa de git lock.
   - **Dual Browser Audit Obrigatório no Bloco de Validação**:
     O `test-verifier` DEVE subir o dev server local (`pnpm dev`) em background e executar a auditoria visual em dois viewports:
     - **Mobile (390×844)**: toque fluido, zero overflow horizontal, touch targets ≥ 44px e formulários acessíveis.
     - **Desktop (1440×900)**: grid responsivo, espaçamento e alinhamento visual correto.
     - *Fallback*: Se o MCP Server do Chrome DevTools estiver ausente da sessão, o `test-verifier` deve testar as rotas via requisições HTTP smoke reais no servidor ativo (`curl -I http://localhost:3000/...`), combinadas com os testes do React Testing Library e linter Shadcn UI, registrando explicitamente a cobertura e a ausência do MCP no relatório final.
   - Apenas arquivos compartilhados da raiz (ex.: manifestos de pacotes, configurações de bundler/infra) operam em sequência.
   - **Identificadores Canônicos (`TypeName`)**:
     Ao invocar workers via `invoke_subagent`, utilize SEMPRE os identificadores únicos definidos em `.agents/agents/<name>.md`:
     - `codebase-researcher` para mapeamento rápido do grafo (`graphify`) e leitura exploratória (`model: flash`).
     - `product-manager` para descoberta de regras de negócio, casos de borda, UX e entrevistas `/grill-me` via `ask_question` (`model: inherit`).
     - `solution-architect` para arquitetura (*Deep Modules*), segurança, qualidade, entrevistas `/grill-me` técnicas e escrita de `docs/plans/<slug>.md` (`model: inherit`).
     - `backend-builder` para construção do backend guiada por TDD e pelo `AGENTS.md` do projeto (`model: flash`).
     - `frontend-builder` para construção do frontend guiada pelo design system e pelo `AGENTS.md` do projeto (`model: flash`).
     - `test-verifier` para execução da suíte de testes e pipeline de qualidade oficial do projeto (`model: flash`).
     - `implementation-validator` para auditoria de código, spec, segurança e anti-bloat (`model: flash`).
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
   - Spec de Produto: docs/specs/<slug>.md
   - Plano Técnico: docs/plans/<slug>.md (e implementation_plan.md)
   - Ticket Ativo: docs/tickets/<slug>/<NN>-<ticket>.md
   - Regras Canônicas: AGENTS.md local do projeto (Stack, Deep Modules, Isolamento de Camadas, Tipagem Estrita e CLI oficial)

   **Escopo a Implementar**:
   1. Componentes/Arquivos exatos a criar ou modificar.
   2. Tipos, DTOs, schemas e rotas necessárias.
   3. Protocolos de qualidade (TDD Red-Green no backend, UI acessível e responsiva no frontend).
   4. Comandos de validação definidos no AGENTS.md do projeto.
   ```

5. **Ritual de Fechamento com `/learn`**:
   - Concluída a entrega e aprovado o Gate 3, o Chat Canvas deve invocar o protocolo `/learn` para consolidar lições aprendidas e atualizar o `AGENTS.md`.

6. **Proibição Estrita de Polling Ativo e Espionagem de Subagentes (`Zero-Polling & Anti-Spy Invariant`)**:
   - **Zero-Polling (Confiança no Reactive Wakeup)**: É TERMINANTEMENTE PROIBIDO utilizar a ferramenta `schedule` ou invocar `manage_subagents(Action="list")` em loop para "monitorar" ou "esperar" o progresso de subagentes. O sistema Antigravity já retoma a execução reativamente quando o subagente responde. Após despachar um worker ou orquestrador, o agente DEVE PARAR imediatamente de chamar ferramentas.
   - **Zero-Spying (Proibição de `tail` em Transcripts)**: É TERMINANTEMENTE PROIBIDO executar comandos bash (`tail`, `grep`, `cat` ou scripts Python) para ler arquivos `.system_generated/logs/transcript.jsonl` de subagentes em execução. Isso incha o contexto com centenas de KB de JSON Lines desnecessárias e queima milhões de tokens de cache à toa.
   - **WaitMsBeforeAsync Adequado**: Em comandos demorados (`verify.sh`, suítes completas de testes), configure `WaitMsBeforeAsync` de até 10000ms para evitar criação excessiva de background tasks e logs massivos truncados.

7. **Padrão Mandatório do Relatório de Auditoria Operacional do Agente (Telemetria & Eficiência)**:
   - Sempre que o usuário solicitar "Relatório de Auditoria de Execução", análise de desempenho do agente ou profiling de tokens, o agente NÃO deve limitar-se a testes de software (BDD/SOLID). Ele DEVE obrigatoriamente executar `./.agents/scripts/audit_agent_execution.py <conversation_id>` e apresentar a telemetria completa:
     1. **Dashboard Geral de Telemetria e Consumo** (Duração total, steps, invocações LLM, tool calls, background tasks, tokens input/output/cache e pico de contexto por step).
     2. **Detalhamento de Ferramentas (Tool Breakdown)** (contagem exata e % de cada ferramenta).
     3. **Diagnóstico de Gargalos & Fontes de Desperdício** (loops de polling, tasks em background fúteis, reedição repetida de arquivos e logs massivos).
     4. **Tabela de Desperdício / Consumo por Turno** (steps, duração aproximada, tokens e diagnóstico por turno).
     5. **Scoreboard de Eficiência Operacional** (Nota de 0 a 100 com avaliação de A a F).