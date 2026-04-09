#!/bin/bash
set -e

echo "Setting up Azadi Landing dev environment..."

# ============================================================
# Install Firestore emulator (gcloud CLI installed by devcontainer feature)
# ============================================================
sudo apt-get update -qq \
    && sudo apt-get install -y -qq --no-install-recommends google-cloud-cli-firestore-emulator \
    && sudo apt-get clean && sudo rm -rf /var/lib/apt/lists/*

# ============================================================
# Claude Code config
# ============================================================
if [ -f ~/.claude/.claude.json ] && [ ! -e ~/.claude.json ]; then
    ln -s ~/.claude/.claude.json ~/.claude.json
fi

# ============================================================
# NPM config
# ============================================================
npm config set cache ~/.npm
npm config set update-notifier false
npm config set fund false
npm config set audit false

# ============================================================
# Git config
# ============================================================
git config --global --add safe.directory /workspace
git config --global --add safe.directory /workspace/azadi-go
git config --global init.defaultBranch master

# ============================================================
# Shell aliases
# ============================================================
cat >> ~/.zshrc <<'EOF'
alias claude="claude --dangerously-skip-permissions"

# Azadi Go aliases
alias azadi="cd /workspace/azadi-go"
alias azadi-dev='cd /workspace/azadi-go && set -a && source local.env && set +a && DATASTORE_EMULATOR_HOST=localhost:8081 air'
alias azadi-run='cd /workspace/azadi-go && set -a && source local.env && set +a && DATASTORE_EMULATOR_HOST=localhost:8081 go run ./cmd/server'
alias azadi-frontend="cd /workspace/azadi-go/frontend && npm run dev"
alias fb-emulator="gcloud emulators firestore start --host-port=0.0.0.0:8081 --database-mode=datastore-mode --project=demo-azadi"
alias fb-emulator-reset="kill \$(lsof -ti:8081) 2>/dev/null; sleep 1; fb-emulator"
alias azadi-test="cd /workspace/azadi-go && go test ./... -short -count=1"
alias azadi-lint="cd /workspace/azadi-go && golangci-lint run ./..."
alias azadi-build="cd /workspace/azadi-go && CGO_ENABLED=0 go build -o bin/azadi ./cmd/server"

# Docker
alias dc='docker compose'
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
EOF

[ -f ~/.bashrc ] && ! grep -q 'exec zsh' ~/.bashrc && echo '[ -t 1 ] && exec zsh' >> ~/.bashrc

# ============================================================
# Install dependencies
# ============================================================
echo "Installing dependencies..."

# Go (azadi-go)
if [ -f /workspace/azadi-go/go.mod ]; then
    (cd /workspace/azadi-go && go mod download > /tmp/go-download.log 2>&1 && echo "Go deps: OK" || echo "Go deps: FAILED") &
fi

# Frontend (azadi-go)
if [ -f /workspace/azadi-go/frontend/package.json ]; then
    (cd /workspace/azadi-go/frontend && npm ci > /tmp/npm-install.log 2>&1 && echo "Azadi frontend deps: OK" || echo "Azadi frontend deps: FAILED") &
fi

wait

echo ""
echo "Setup complete! (Go $(go version | awk '{print $3}'))"
echo ""
echo "Azadi Go (mounted at /workspace/azadi-go):"
echo "  azadi             -> cd to azadi-go"
echo "  fb-emulator       -> Start Firestore emulator (:8081)"
echo "  azadi-frontend    -> Start Vite dev server (:5173)"
echo "  azadi-dev         -> Start Go server with hot reload (:8080)"
echo "  azadi-run         -> Start Go server without hot reload (:8080)"
echo "  azadi-test        -> Run unit tests"
echo "  azadi-lint        -> Run golangci-lint"
echo "  azadi-build       -> Build production binary"
echo ""
echo "Services:"
echo "  Firebase UI:      http://localhost:4000"
echo "  Firestore:        localhost:8081"
echo ""
echo "Workflow for azadi-go: Open 3 terminals:"
echo "  1. fb-emulator       (Firestore)"
echo "  2. azadi-frontend    (Vite HMR on :5173)"
echo "  3. azadi-dev         (Go server on :8080 with hot reload)"
echo ""
