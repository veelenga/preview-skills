#!/usr/bin/env bash

# Mermaid Preview Skill Configuration

# Skill metadata
TOOL_NAME="mermaid"
TOOL_TITLE_PREFIX="Mermaid"
DEFAULT_FILENAME="diagram"
FILE_EXTENSIONS=(".mmd" ".mermaid")
DEFAULT_THEME="default"

# Layout configuration
LAYOUT_TYPE="centered"  # document, centered, or full
BACKGROUND_COLOR="#f5f5f5"

# CDN Libraries with SRI hashes
# Format: URL::INTEGRITY_HASH
# To get SRI hash: curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A
CDN_SCRIPTS=(
    "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js::sha384-6F4Ibv/ylL12O35KFWTeGTHuBKDz5L6yjKsgv3QHQ8s4NTqlDXq7kMlYXGs7MHFc"
)

# CSS Files (relative to LIB_ROOT or absolute paths)
STYLE_FILES=(
    "templates/styles/layout.css"
    "templates/styles/diagram.css"
)

# Content processing
CONTENT_ENCODING="base64"

# Renderer configuration
RENDERER_FILE="templates/scripts/mermaid-renderer.js"
RENDERER_VARS=(
    "DIAGRAM_ENCODED"  # Base64 encoded diagram content
    "MERMAID_THEME"    # Theme parameter
)

# Theme variable for renderer (used by MERMAID_THEME substitution)
MERMAID_THEME="default"
