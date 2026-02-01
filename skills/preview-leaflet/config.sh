#!/usr/bin/env bash

# Leaflet Map Visualization Preview Skill Configuration

# Skill metadata
TOOL_NAME="leaflet"
TOOL_TITLE_PREFIX="Leaflet Map"
DEFAULT_FILENAME="map"
FILE_EXTENSIONS=(".leaflet" ".leaflet.js" ".map")

# Layout configuration
LAYOUT_TYPE="full"  # document, centered, or full
BACKGROUND_COLOR="#ffffff"

# CDN Libraries with SRI hashes
# Leaflet 1.9.4 - Interactive maps
CDN_SCRIPTS=(
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js::sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH"
)

# CSS Files (relative to LIB_ROOT, absolute paths, or CDN URLs with SRI)
STYLE_FILES=(
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css::sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H"
    "templates/styles/layout.css"
    "templates/styles/leaflet.css"
)

# Content processing
CONTENT_ENCODING="raw"

# Renderer configuration
RENDERER_FILE="templates/scripts/leaflet-renderer.js"
RENDERER_VARS=()

# Needs user code template for interactive maps
NEEDS_USER_CODE_TEMPLATE=1

# Generate metadata for the renderer
generate_metadata() {
    local code="$1"

    # Calculate stats
    local lines
    local chars
    lines=$(echo "$code" | wc -l | tr -d ' ')
    chars=$(echo "$code" | wc -c | tr -d ' ')

    # Output metadata JSON
    printf '{"lines":%d,"chars":%d,"type":"Map"}' "$lines" "$chars"
}
