# Dev container for Azadi Landing – Go 1.24 + Node 22 + Firebase
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Go 1.24 (auto-detect architecture)
ARG TARGETARCH
RUN curl -fsSL "https://go.dev/dl/go1.24.2.linux-${TARGETARCH}.tar.gz" | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:/home/vscode/go/bin:${PATH}"
ENV GOPATH="/home/vscode/go"

# Node.js 22 (for Firebase CLI)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Firebase CLI
RUN npm install -g firebase-tools

# Playwright CLI + browser dependencies
RUN npx playwright install --with-deps chromium

# Go tools
RUN mkdir -p /home/vscode/go/bin \
    && GOPATH=/home/vscode/go go install github.com/air-verse/air@v1.61.5 \
    && GOPATH=/home/vscode/go go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.64.8

# Verify installations
RUN go version && node --version && firebase --version

# Pre-create cache directories
RUN mkdir -p /home/vscode/.cache/go-build /home/vscode/go \
    && chown -R vscode:vscode /home/vscode/.cache /home/vscode/go

USER vscode
WORKDIR /workspace
