#!/bin/bash

# Session start script for Claude Code web environments
# Installs GitHub CLI if not already present

set -e

# Check if gh is already installed
if command -v gh &> /dev/null; then
    echo "GitHub CLI already installed: $(gh --version | head -1)"
    exit 0
fi

echo "Installing GitHub CLI..."

# Detect OS and install accordingly
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux installation
    (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
    && sudo mkdir -p -m 755 /etc/apt/keyrings \
    && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update \
    && sudo apt install gh -y
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS installation
    brew install gh
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo "GitHub CLI installed successfully: $(gh --version | head -1)"
