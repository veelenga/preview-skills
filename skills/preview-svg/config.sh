#!/usr/bin/env bash

# SVG Animation Preview Skill Configuration

# Skill metadata
TOOL_NAME="svg"
TOOL_TITLE_PREFIX="SVG Animation"
DEFAULT_FILENAME="animation"
FILE_EXTENSIONS=(".svg" ".svg.xml")
DEFAULT_THEME="default"

# Layout configuration
LAYOUT_TYPE="full"
BACKGROUND_COLOR="#ffffff"

# No CDN libraries needed — SVG/SMIL/CSS animations run natively.
CDN_SCRIPTS=()

# CSS files
STYLE_FILES=(
    "templates/styles/layout.css"
    "templates/styles/svg.css"
)

# Content is base64-encoded to safely transport arbitrary SVG markup
# (including newlines, quotes, ampersands) into the rendered HTML.
CONTENT_ENCODING="base64"
NEEDS_USER_CODE_TEMPLATE=0

# Renderer configuration. The renderer receives the encoded SVG content via
# the substitution token below; stats (features, lines, chars) are computed
# in the renderer at runtime from the decoded SVG so no extra plumbing is needed.
RENDERER_FILE="templates/scripts/svg-renderer.js"
RENDERER_VARS=("SVG_CONTENT_ENCODED")

# Light input check — warn but don't fail if the payload looks non-SVG.
validate_content() {
    local content="$1"
    if ! echo "$content" | grep -qiE '<svg|<\?xml|xmlns'; then
        echo "Warning: Content does not look like SVG (no <svg> tag found). Rendering anyway." >&2
    fi
    return 0
}
