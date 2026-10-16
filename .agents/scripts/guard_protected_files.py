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
        
        command_line = args.get("CommandLine") or args.get("command") or ""
        if command_line:
            # Bloqueio de comandos git destrutivos
            destructive_git_pattern = r"\bgit\s+(reset|restore|checkout|clean)\b"
            if re.search(destructive_git_pattern, command_line):
                for pattern in PROTECTED_PATTERNS:
                    if re.search(pattern, command_line) or "--hard" in command_line or "--force" in command_line or "-f" in command_line:
                        output = {
                            "decision": "force_ask",
                            "reason": f"Tentativa de execução de comando git destrutivo ou sobre arquivo de configuração protegido: '{command_line}'"
                        }
                        print(json.dumps(output))
                        return

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
