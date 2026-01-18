#!/usr/bin/env bash

# Skill metadata
TOOL_NAME="preview-diff"
TOOL_TITLE_PREFIX="Git Diff"
DEFAULT_FILENAME="diff"

# Layout
LAYOUT_TYPE="full"
BACKGROUND_COLOR="#f6f8fa"

# CDN Libraries with SRI hashes (diff2html for GitHub-style rendering)
# Format: URL::INTEGRITY_HASH
# To get SRI hash: curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A
CDN_SCRIPTS=(
    "https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/js/diff2html.min.js::sha384-1tVmtFdzvhqVP3vQWJmKYvD0uTtR0r+FhlLWw+vG6F/vNDS7yegNMNNHRS12fSyR"
)

# CSS Files (with SRI hashes for CDN)
STYLE_FILES=(
    "$LIB_ROOT/templates/styles/common.css"
    "https://cdn.jsdelivr.net/npm/diff2html@3.4.47/bundles/css/diff2html.min.css::sha384-iBvSlI3tNrrSIy7s6mvLg+5B2Z/QXbR4L0Pzg1nRf8zkXrz5JF316MLm2igMIpi2"
)

# Content processing
CONTENT_ENCODING="base64"

# Renderer
RENDERER_FILE="templates/scripts/diff-renderer.js"
RENDERER_VARS=("DIFF_DATA")
