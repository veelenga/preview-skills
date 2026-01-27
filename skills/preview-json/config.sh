#!/usr/bin/env bash

# JSON Preview Skill Configuration

# Skill metadata
TOOL_NAME="json"
TOOL_TITLE_PREFIX="JSON Viewer"
DEFAULT_FILENAME="data"
FILE_EXTENSIONS=(".json" ".jsonl")

# Layout configuration
LAYOUT_TYPE="document"
BACKGROUND_COLOR="#f5f5f5"

CDN_SCRIPTS=()

STYLE_FILES=(
    "templates/styles/layout.css"
    "templates/styles/json.css"
)

# Content processing
CONTENT_ENCODING="base64"

# Renderer configuration
RENDERER_FILE="templates/scripts/json-renderer.js"
RENDERER_VARS=(
    "JSON_DATA_ENCODED"  # Base64 encoded JSON content
)
