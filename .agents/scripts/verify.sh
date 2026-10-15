#!/usr/bin/env bash
# ==============================================================================
# verify.sh — Validador Completo de Qualidade (OfertaPronta — TanStack Start)
#
# Localizado em: .agents/scripts/verify.sh
#
# Pipeline de Integridade:
#  1. Shadcn UI Compliance: Garante o uso de @/components/ui/* e proíbe tags HTML nativas
#  2. TypeScript Typecheck: Modo estrito (zero any) via TanStack Router & tsc
#  3. ESLint: Regras de qualidade de código e boas práticas React 19 / TanStack
#  4. Vitest Unit & Integration: Suíte de testes automatizados com cobertura
#  5. TanStack Start Production Build: Compilação de produção (Client + Nitro SSR)
#
# Uso:
#   ./.agents/scripts/verify.sh       # Executa todas as validações padrão
#   ./.agents/scripts/verify.sh --quick # Pula o build de produção (feedback rápido no TDD)
#   ./.agents/scripts/verify.sh --shadcn # Apenas verificação do catálogo Shadcn UI
#   ./.agents/scripts/verify.sh --typecheck # Apenas TypeScript Typecheck
#   ./.agents/scripts/verify.sh --lint # Apenas ESLint
#   ./.agents/scripts/verify.sh --test # Apenas suíte de testes Vitest
#   ./.agents/scripts/verify.sh --build # Apenas build de produção
#   ./.agents/scripts/verify.sh --e2e # Inclui testes Playwright E2E
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detecta a raiz do repositório a partir de .agents/scripts/ ou scripts/
if [[ "$(basename "$(dirname "$SCRIPT_DIR")")" == ".agents" ]]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$REPO_ROOT"

# Cores para feedback visual no terminal
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

run_shadcn=true
run_typecheck=true
run_lint=true
run_test=true
run_build=true
run_e2e=false

for arg in "$@"; do
  case $arg in
    --quick|--fast)
      run_build=false
      ;;
    --shadcn)
      run_shadcn=true
      run_typecheck=false
      run_lint=false
      run_test=false
      run_build=false
      ;;
    --typecheck)
      run_shadcn=false
      run_typecheck=true
      run_lint=false
      run_test=false
      run_build=false
      ;;
    --lint)
      run_shadcn=false
      run_typecheck=false
      run_lint=true
      run_test=false
      run_build=false
      ;;
    --test)
      run_shadcn=false
      run_typecheck=false
      run_lint=false
      run_test=true
      run_build=false
      ;;
    --build)
      run_shadcn=false
      run_typecheck=false
      run_lint=false
      run_test=false
      run_build=true
      ;;
    --e2e)
      run_e2e=true
      ;;
    -h|--help)
      echo -e "${BOLD}Uso:${RESET} ./.agents/scripts/verify.sh [opções]"
      echo ""
      echo -e "${BOLD}Opções:${RESET}"
      echo "  --quick, --fast   Pula o build de produção (para iterações rápidas de TDD)"
      echo "  --shadcn          Executa exclusivamente o linter de conformidade Shadcn UI"
      echo "  --typecheck       Executa exclusivamente a checagem de tipos TypeScript"
      echo "  --lint            Executa exclusivamente o linter ESLint"
      echo "  --test            Executa exclusivamente a suíte de testes Vitest"
      echo "  --build           Executa exclusivamente o build de produção TanStack Start"
      echo "  --e2e             Executa também a suíte de testes Playwright E2E"
      echo "  -h, --help        Exibe esta mensagem de ajuda"
      exit 0
      ;;
  esac
done

step() {
  echo -e "\n${BLUE}${BOLD}==>${RESET} ${BOLD}$1${RESET}"
}

success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

error() {
  echo -e "${RED}✗ $1${RESET}" >&2
}

warning() {
  echo -e "${YELLOW}⚠ $1${RESET}"
}

START_TIME=$(date +%s)

echo -e "\n${CYAN}${BOLD}=====================================================${RESET}"
echo -e "${CYAN}${BOLD}  OFERTA PRONTA — VERIFICAÇÃO DE QUALIDADE E BUILD   ${RESET}"
echo -e "${CYAN}${BOLD}=====================================================${RESET}"

# ==============================================================================
# 1. SHADCN UI COMPLIANCE (Invariante #1 do AGENTS.md)
# ==============================================================================
if [ "$run_shadcn" = true ]; then
  step "[1/5] Shadcn UI Compliance Check (garantindo uso prioritário de @/components/ui/*)..."
  SHADCN_SCRIPT="$SCRIPT_DIR/check_shadcn_usage.py"
  if [ -f "$SHADCN_SCRIPT" ]; then
    if python3 "$SHADCN_SCRIPT"; then
      success "Componentes Shadcn UI e tipografia validados com sucesso."
    else
      error "Falha na verificação de conformidade Shadcn UI."
      exit 1
    fi
  else
    warning "Script '$SHADCN_SCRIPT' não encontrado. Pulando etapa."
  fi
fi

# Verifica se o ambiente Node / pnpm está configurado no workspace
HAS_PACKAGE_JSON=false
if [ -f "package.json" ]; then
  HAS_PACKAGE_JSON=true
fi

if [ "$HAS_PACKAGE_JSON" = false ] && { [ "$run_typecheck" = true ] || [ "$run_lint" = true ] || [ "$run_test" = true ] || [ "$run_build" = true ]; }; then
  echo ""
  warning "Aviso: 'package.json' ainda não foi inicializado na raiz do projeto."
  warning "As validações TypeScript, ESLint, Vitest e Build serão executadas assim que o projeto for inicializado com pnpm."
fi

# ==============================================================================
# 2. TYPESCRIPT TYPECHECK (Modo estrito / Zero Any)
# ==============================================================================
if [ "$run_typecheck" = true ] && [ "$HAS_PACKAGE_JSON" = true ]; then
  step "[2/5] TypeScript Typecheck (TanStack Router + Strict TS)..."
  if pnpm typecheck; then
    success "Typecheck passou sem nenhum erro de tipagem."
  else
    error "Falha no Typecheck TypeScript."
    exit 1
  fi
fi

# ==============================================================================
# 3. ESLINT
# ==============================================================================
if [ "$run_lint" = true ] && [ "$HAS_PACKAGE_JSON" = true ]; then
  step "[3/5] ESLint..."
  if pnpm lint; then
    success "ESLint passou sem erros."
  else
    error "Falha no ESLint."
    exit 1
  fi
fi

# ==============================================================================
# 4. VITEST (Unitários e Módulos Profundos)
# ==============================================================================
if [ "$run_test" = true ] && [ "$HAS_PACKAGE_JSON" = true ]; then
  step "[4/5] Vitest Suite (Testes Unitários e Integração de Módulos Profundos)..."
  if pnpm test; then
    success "Suíte de testes passou com sucesso."
  else
    error "Falha nos testes do Vitest."
    exit 1
  fi
fi

# ==============================================================================
# 5. TANSTACK START PRODUCTION BUILD
# ==============================================================================
if [ "$run_build" = true ] && [ "$HAS_PACKAGE_JSON" = true ]; then
  step "[5/5] TanStack Start Production Build (Client + Nitro SSR)..."
  if pnpm build; then
    success "Build de produção gerado com sucesso."
  else
    error "Falha no Build de produção."
    exit 1
  fi
fi

# ==============================================================================
# 6. PLAYWRIGHT E2E (Opcional via flag --e2e)
# ==============================================================================
if [ "$run_e2e" = true ] && [ "$HAS_PACKAGE_JSON" = true ]; then
  step "[E2E] Playwright End-to-End Tests..."
  if pnpm test:e2e; then
    success "Testes E2E do Playwright passaram com sucesso."
  else
    error "Falha nos testes E2E do Playwright."
    exit 1
  fi
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${GREEN}${BOLD}=====================================================${RESET}"
echo -e "${GREEN}${BOLD}  ✓ VERIFICAÇÃO CONCLUÍDA COM SUCESSO! (${ELAPSED}s)       ${RESET}"
echo -e "${GREEN}${BOLD}=====================================================${RESET}\n"
