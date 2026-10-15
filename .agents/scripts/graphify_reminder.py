#!/usr/bin/env python3
"""
PreInvocation hook: inject an ephemeral Graphify reminder into every model call.

Localizado em: .agents/scripts/graphify_reminder.py

Fires when invocationNum == 0 (first call), which is when the agent is most likely
to start a new exploration task without having used Graphify yet.
"""
import json
import os
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    print(json.dumps({}))
    sys.exit(0)

invocation_num = payload.get("invocationNum", 0)

# Injeta apenas na primeiríssima chamada de planejamento (invocationNum == 0)
if invocation_num != 0:
    print(json.dumps({}))
    sys.exit(0)

workspace_paths = payload.get("workspacePaths", [])
graphify_exists = any(
    os.path.isdir(os.path.join(p, "graphify-out")) for p in workspace_paths
)

if not graphify_exists:
    print(json.dumps({}))
    sys.exit(0)

message = (
    "🔍 GRAPHIFY FIRST — Este projeto possui um grafo de conhecimento em `graphify-out/`. "
    "ANTES de usar grep, find, view_file ou list_dir para explorar o codebase, "
    "você DEVE executar:\n"
    "  • `graphify query \"<termo>\"` — para buscas conceituais/arquiteturais\n"
    "  • `graphify explain \"<módulo>\"` — para entender um componente específico\n"
    "  • `graphify path \"<A>\" \"<B>\"` — para mapear dependências entre módulos\n"
    "Somente recorra a grep/find/view_file quando graphify não retornar informação suficiente."
)

result = {"injectSteps": [{"ephemeralMessage": message}]}
print(json.dumps(result))
