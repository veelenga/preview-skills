#!/usr/bin/env bash

# D3 Visualization Preview Skill Configuration

# Skill metadata
TOOL_NAME="d3"
TOOL_TITLE_PREFIX="D3.js Visualization"
DEFAULT_FILENAME="visualization"
FILE_EXTENSIONS=(".d3" ".d3.js")
DEFAULT_THEME="default"

# Layout configuration
LAYOUT_TYPE="full"  # document, centered, or full
BACKGROUND_COLOR="#ffffff"

# CDN Libraries with SRI hashes
# D3.js v7 - Full library
CDN_SCRIPTS=(
    "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js::sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i"
)

# CSS Files (relative to LIB_ROOT or absolute paths)
STYLE_FILES=(
    "templates/styles/layout.css"
    "templates/styles/d3.css"
)

# Content processing
CONTENT_ENCODING="raw"
NEEDS_USER_CODE_TEMPLATE=1

# Renderer configuration
RENDERER_FILE="templates/scripts/d3-renderer.js"
RENDERER_VARS=()

# Detect visualization type from D3 code
preprocess_content() {
    local code="$1"

    # Detect viz type
    local viz_type="Custom"
    if echo "$code" | grep -qi "scaleBand\|barChart"; then
        viz_type="Bar Chart"
    elif echo "$code" | grep -qi "d3\.line\|lineChart"; then
        viz_type="Line Chart"
    elif echo "$code" | grep -qi "scatterplot\|scatter"; then
        viz_type="Scatter Plot"
    elif echo "$code" | grep -qi "d3\.pie\|pieChart"; then
        viz_type="Pie Chart"
    elif echo "$code" | grep -qi "forceSimulation\|forceLink"; then
        viz_type="Network"
    elif echo "$code" | grep -qi "d3\.chord"; then
        viz_type="Chord Diagram"
    elif echo "$code" | grep -qi "heatmap\|scaleSequential"; then
        viz_type="Heatmap"
    elif echo "$code" | grep -qi "d3\.tree\|d3\.hierarchy"; then
        viz_type="Tree"
    fi

    # Just return the code - metadata detection can be added later if needed
    echo "$code"
}
