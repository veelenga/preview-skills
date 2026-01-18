#!/usr/bin/env bash

TOOL_NAME="threejs"
TOOL_TITLE_PREFIX="Three.js 3D Visualization"
DEFAULT_FILENAME="visualization"
FILE_EXTENSIONS=(".threejs" ".3d" ".threejs.js")
DEFAULT_THEME="default"

LAYOUT_TYPE="full"
BACKGROUND_COLOR="#000000"

CDN_SCRIPTS=(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js::sha384-qOkzR5Ke/XkQxuGVJ9hpFEpDlcoLtWwVYhnJf06cLIZa2vaIptSqaubivErzmD5O"
)

STYLE_FILES=(
    "templates/styles/layout.css"
    "templates/styles/threejs.css"
)

CONTENT_ENCODING="raw"

RENDERER_FILE="templates/scripts/threejs-renderer.js"
RENDERER_VARS=()

# Needs user code template for interactive 3D
NEEDS_USER_CODE_TEMPLATE=1
