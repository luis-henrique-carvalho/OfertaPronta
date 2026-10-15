#!/usr/bin/env python3
"""
guard_protected_files.py — PreToolUse Hook para o Antigravity

Localizado em: .agents/scripts/guard_protected_files.py

Protege arquivos críticos de configuração (ESLint, Prettier, TypeScript, Vitest, Playwright, Drizzle, scripts de verificação),
forçando confirmação explícita do usuário (force_ask) antes de permitir qualquer modificação por agentes.
"""
import json
import os
import sys
import re

PROTECTED_PATTERNS = [
    r"eslint\.config\.[cm]?[jt]s$",
    r"\.eslintrc(\.[a-z]+)?$",
    r"\.prettierrc(\.[a-z]+)?$",
    r"tsconfig(\..*)?\.json$",
    r"jsconfig(\..*)?\.json$",
    r"vitest\.config\.[cm]?[jt]s$",
    r"playwright\.config\.[cm]?[jt]s$",
    r"drizzle\.config\.[cm]?[jt]s$",
    r"(\.agents/)?scripts/verify\.sh$",
]

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"decision": "allow"}))
            return

        payload = json.loads(raw_input)
        tool_call = payload.get("toolCall", {})
        args = tool_call.get("args", {})
        
        target_file = args.get("TargetFile") or args.get("target_file") or args.get("path") or ""
        
        if target_file:
            for pattern in PROTECTED_PATTERNS:
                if re.search(pattern, target_file):
                    output = {
                        "decision": "force_ask",
                        "reason": f"Alteração no arquivo protegido '{os.path.basename(target_file)}'. Confirmar alteração de configuração de qualidade/lint/banco?"
                    }
                    print(json.dumps(output))
                    return

        print(json.dumps({"decision": "allow"}))
    except Exception:
        print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()
