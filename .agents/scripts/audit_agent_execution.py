#!/usr/bin/env python3
"""
audit_agent_execution.py
Script oficial para auditoria operacional, telemetria de tokens, perfilamento de ferramentas
e detecção de gargalos de execução de agentes no Antigravity.
"""

import sys
import os
import json
import glob
import re
from datetime import datetime
from collections import Counter

def parse_iso(ts):
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None

def format_duration(seconds):
    if seconds is None:
        return "N/A"
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"

def audit_conversation(conv_id, brain_base=None):
    if not brain_base:
        brain_base = os.path.expanduser("~/.gemini/antigravity/brain")
    
    conv_dir = os.path.join(brain_base, conv_id)
    transcript_path = os.path.join(conv_dir, ".system_generated/logs/transcript.jsonl")
    
    if not os.path.exists(transcript_path):
        print(f"Erro: Transcript não encontrado em {transcript_path}", file=sys.stderr)
        sys.exit(1)

    steps = []
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    steps.append(json.loads(line))
                except Exception:
                    pass

    total_steps = len(steps)
    first_time = None
    last_time = None
    
    total_in_tokens = 0
    total_out_tokens = 0
    total_cache_tokens = 0
    peak_input = (0, 0)
    peak_cache = (0, 0)
    peak_output = (0, 0)
    
    model_invocations = 0
    tool_counts = Counter()
    commands_run = []
    tail_spy_commands = []
    file_views = Counter()
    file_edits = Counter()
    schedule_calls = []
    subagents_created = []
    
    # Process steps
    for s in steps:
        idx = s.get("step_index", 0)
        t_raw = s.get("created_at")
        t = parse_iso(t_raw)
        if t:
            if not first_time or t < first_time:
                first_time = t
            if not last_time or t > last_time:
                last_time = t
                
        stype = s.get("type")
        if stype == "PLANNER_RESPONSE":
            model_invocations += 1
            
        in_tok = s.get("input_tokens", 0) or 0
        out_tok = s.get("output_tokens", 0) or 0
        cache_tok = s.get("cache_read_tokens", 0) or 0
        
        total_in_tokens += in_tok
        total_out_tokens += out_tok
        total_cache_tokens += cache_tok
        
        if in_tok > peak_input[1]:
            peak_input = (idx, in_tok)
        if cache_tok > peak_cache[1]:
            peak_cache = (idx, cache_tok)
        if out_tok > peak_output[1]:
            peak_output = (idx, out_tok)
            
        for tc in s.get("tool_calls", []):
            name = tc.get("name", "unknown")
            tool_counts[name] += 1
            args = tc.get("args", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    pass
            if isinstance(args, dict):
                if name == "run_command":
                    cmd = args.get("CommandLine", "")
                    commands_run.append(cmd)
                    if "transcript.jsonl" in cmd or "tail" in cmd and "brain" in cmd:
                        tail_spy_commands.append(cmd)
                elif name == "view_file":
                    p = args.get("AbsolutePath", "")
                    file_views[p] += 1
                elif name == "replace_file_content":
                    p = args.get("TargetFile", "")
                    file_edits[p] += 1
                elif name == "schedule":
                    schedule_calls.append(args)
                elif name == "invoke_subagent":
                    subs = args.get("Subagents", [])
                    if isinstance(subs, str):
                        try:
                            subs = json.loads(subs)
                        except Exception:
                            pass
                    if isinstance(subs, list):
                        subagents_created.extend(subs)

    # Calculate duration
    total_duration_sec = (last_time - first_time).total_seconds() if (first_time and last_time) else 0

    # Tasks in task directory
    task_files = glob.glob(os.path.join(conv_dir, ".system_generated/tasks/task-*.log"))
    task_count = len(task_files)
    large_tasks = []
    for tf in task_files:
        sz = os.path.getsize(tf)
        if sz > 50 * 1024:
            large_tasks.append((os.path.basename(tf), sz))
    large_tasks.sort(key=lambda x: -x[1])

    # Turns analysis
    turns = []
    curr_turn = None
    for s in steps:
        if s.get("type") == "USER_INPUT":
            if curr_turn:
                turns.append(curr_turn)
            curr_turn = {
                "step": s.get("step_index"),
                "prompt": s.get("content", "").strip(),
                "start": parse_iso(s.get("created_at")),
                "steps": [],
                "in_tok": 0,
                "out_tok": 0,
                "cache_tok": 0,
                "tools": Counter(),
            }
        else:
            if curr_turn:
                curr_turn["steps"].append(s)
                curr_turn["in_tok"] += (s.get("input_tokens", 0) or 0)
                curr_turn["out_tok"] += (s.get("output_tokens", 0) or 0)
                curr_turn["cache_tok"] += (s.get("cache_read_tokens", 0) or 0)
                for tc in s.get("tool_calls", []):
                    curr_turn["tools"][tc.get("name", "unknown")] += 1

    if curr_turn:
        turns.append(curr_turn)

    # Print Report
    print(f"# Relatório de Auditoria Operacional & Telemetria do Agente")
    print(f"\n**Conversation ID:** `{conv_id}`")
    print(f"**Data da Sessão:** {first_time.strftime('%d/%m/%Y') if first_time else 'N/A'}")
    print(f"**Intervalo de Execução:** {first_time.strftime('%H:%M:%S UTC') if first_time else ''} → {last_time.strftime('%H:%M:%S UTC') if last_time else ''}")
    print(f"**Duração Total:** **{format_duration(total_duration_sec)}**\n")
    print("---\n")

    print("## 1. Dashboard Geral de Telemetria e Consumo\n")
    print("| Métrica | Valor Registrado | Avaliação de Eficiência |")
    print("|---|:---:|:---:|")
    dur_eval = "🔴 Crítico (> 1h)" if total_duration_sec > 3600 else ("🟡 Atenção (> 30m)" if total_duration_sec > 1800 else "🟢 Ótimo")
    print(f"| **Duração Total da Sessão** | **{format_duration(total_duration_sec)}** | {dur_eval} |")
    
    step_eval = "🔴 Crítico (> 300)" if total_steps > 300 else ("🟡 Atenção (> 100)" if total_steps > 100 else "🟢 Ótimo")
    print(f"| **Total de Steps Registrados** | **{total_steps:,}** | {step_eval} |")
    
    print(f"| **Invocações do Modelo (LLM)** | **{model_invocations:,} turnos** | {step_eval} |")
    
    total_tools = sum(tool_counts.values())
    tool_eval = "🔴 Crítico (> 150)" if total_tools > 150 else ("🟡 Atenção (> 50)" if total_tools > 50 else "🟢 Ótimo")
    print(f"| **Total de Tool Calls Executadas** | **{total_tools:,} chamadas** | {tool_eval} |")
    
    task_eval = "🔴 Crítico (> 20)" if task_count > 20 else ("🟡 Atenção (> 5)" if task_count > 5 else "🟢 Ótimo")
    print(f"| **Background Tasks Criadas** | **{task_count:,} tasks** | {task_eval} |")
    
    print(f"| **Tokens de Entrada (Input)** | **{total_in_tokens:,}** | {'🔴 Alto (> 1M)' if total_in_tokens > 1_000_000 else '🟢 Normal'} |")
    print(f"| **Tokens de Saída (Output)** | **{total_out_tokens:,}** | 🟢 Normal |")
    print(f"| **Tokens de Leitura de Cache** | **{total_cache_tokens:,}** | {'🔴 Extremo (> 20M)' if total_cache_tokens > 20_000_000 else '🟢 Normal'} |")
    print(f"| **Pico de Contexto em 1 Step** | **{peak_cache[1]:,} tokens** *(Step {peak_cache[0]})* | {'🔴 Risco de Estouro' if peak_cache[1] > 150000 else '🟢 Seguro'} |\n")
    print("---\n")

    print("## 2. Detalhamento de Ferramentas (Tool Breakdown)\n")
    print("| Ferramenta | Chamadas | % do Total | Finalidade Típica |")
    print("|---|:---:|:---:|---|")
    for name, cnt in tool_counts.most_common():
        pct = (cnt / total_tools * 100) if total_tools else 0
        desc = ""
        if name == "run_command": desc = "Execução de comandos bash no terminal"
        elif name == "view_file": desc = "Leitura de arquivos do repositório"
        elif name == "replace_file_content": desc = "Edição cirúrgica de código"
        elif name == "schedule": desc = "Timers de espera (potencial busy-waiting)"
        elif name == "manage_subagents": desc = "Gestão / polling de subagentes"
        elif name == "invoke_subagent": desc = "Despacho de novos subagentes"
        elif name == "write_to_file": desc = "Criação de novos arquivos"
        elif name == "ask_question": desc = "Entrevista interativa com o usuário"
        print(f"| `{name}` | **{cnt:,}** | {pct:.1f}% | {desc} |")
    print(f"| **Total Geral** | **{total_tools:,}** | **100%** | |\n")
    print("---\n")

    print("## 3. Diagnóstico de Gargalos & Fontes de Desperdício\n")
    issues_found = []
    
    if len(schedule_calls) > 5:
        issues_found.append(f"🚨 **Busy-Waiting Polling Loop Detectado:** A ferramenta `schedule` foi chamada {len(schedule_calls)} vezes como timer manual. Isso viola o princípio do `Reactive Wakeup`, onde o agente deve parar e esperar ser acordado automaticamente.")
    
    if len(tail_spy_commands) > 0:
        issues_found.append(f"🚨 **Espionagem Manual de Subagentes (`tail` em transcripts):** Detectadas {len(tail_spy_commands)} execuções de comandos lendo transcripts de subagentes via terminal. Isso incha a janela de contexto com milhares de linhas de log desnecessárias.")
        
    repetitive_edits = [f"{p} ({c}x)" for p, c in file_edits.items() if c >= 4]
    if repetitive_edits:
        issues_found.append(f"⚠️ **Tentativa e Erro Caótica (Edições Repetidas):** Arquivos editados 4 ou mais vezes na mesma sessão: {', '.join(repetitive_edits)}. Indica falta de planejamento prévio e desrespeito ao princípio Ponytail.")

    if len(large_tasks) > 0:
        large_list = [f"`{t[0]}` ({t[1]//1024} KB)" for t in large_tasks[:4]]
        issues_found.append(f"⚠️ **Logs Massivos em Background Tasks:** {len(large_tasks)} tarefas geraram logs maiores que 50 KB ({', '.join(large_list)}). Ocorreu devido a `WaitMsBeforeAsync` curto demais em comandos de teste/build.")

    if not issues_found:
        print("✅ Nenhum gargalo grave detectado! Execução limpa e eficiente.\n")
    else:
        for iss in issues_found:
            print(f"- {iss}")
        print()

    print("---\n")

    print("## 4. Tabela de Desperdício / Consumo por Turno\n")
    print("| # | Pedido do Usuário | Steps | Duração | Input Tokens | Cache Read | Principais Ferramentas | Diagnóstico |")
    print("|:---:|---|:---:|:---:|:---:|:---:|---|---|")
    
    for i, trn in enumerate(turns):
        t_steps = len(trn["steps"])
        t_prompt = trn["prompt"].replace("\n", " ")[:60] + "..." if len(trn["prompt"]) > 60 else trn["prompt"].replace("\n", " ")
        t_in = trn["in_tok"]
        t_cache = trn["cache_tok"]
        top_t = ", ".join([f"{k}:{v}" for k, v in trn["tools"].most_common(2)])
        
        diag = "🟢 Eficiente"
        if t_steps > 150 or t_cache > 10_000_000:
            diag = "🔴 Desperdício Crítico"
        elif t_steps > 50 or t_cache > 3_000_000:
            diag = "🟡 Ineficiente"
            
        print(f"| **T{i+1}** | {t_prompt} | {t_steps} | ~ | {t_in:,} | {t_cache:,} | {top_t} | {diag} |")
        
    print("\n---\n")

    print("## 5. Scoreboard de Eficiência Operacional\n")
    score = 100
    if total_duration_sec > 3600: score -= 30
    elif total_duration_sec > 1800: score -= 15
    if len(schedule_calls) > 10: score -= 25
    if len(tail_spy_commands) > 5: score -= 20
    if len(repetitive_edits) > 0: score -= 15
    if score < 10: score = 10
    
    score_badge = "🔴 F (Péssimo)" if score < 50 else ("🟡 C (Regular)" if score < 75 else "🟢 A (Excelente)")
    print(f"**Nota de Eficiência Operacional:** **{score}/100** ({score_badge})")
    print("\n*Relatório gerado automaticamente por `.agents/scripts/audit_agent_execution.py`.*")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: audit_agent_execution.py <conversation_id> [brain_path]")
        sys.exit(1)
    audit_conversation(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
