#!/usr/bin/env bash

# Generate HTML examples for GitHub Pages documentation
# This script runs each preview skill and saves the output to docs/examples

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
EXAMPLES_DIR="$PROJECT_ROOT/examples"
SKILLS_DIR="$PROJECT_ROOT/skills"

# Note: All skill scripts are called with --no-browser flag below

# Create docs/examples directories
mkdir -p "$DOCS_DIR/examples"/{csv,json,markdown,mermaid,diff,d3,threejs,leaflet}

echo "Generating documentation examples..."

# Helper function to generate preview and copy to docs
generate_example() {
    local skill="$1"
    local input_file="$2"
    local output_dir="$3"
    local output_name="$4"

    printf "  %-30s" "$output_name"

    local skill_script="$SKILLS_DIR/$skill/run.sh"

    if [ ! -f "$skill_script" ]; then
        echo "[SKIP - skill not found]"
        return 1
    fi

    # Run the skill and capture output file path
    local result
    result=$("$skill_script" "$input_file" --no-browser 2>&1) || true
    local output
    output=$(echo "$result" | grep "Preview created:" | sed 's/Preview created: //')

    if [ -z "$output" ] || [ ! -f "$output" ]; then
        echo "[FAIL]"
        echo "    Error: $result" >&2
        return 1
    fi

    # Copy main HTML to docs directory
    cp "$output" "$output_dir/$output_name"

    # For skills that generate user code files (D3, ThreeJS, Leaflet), copy those too
    local user_code_file="${output%.html}-user.js"
    if [ -f "$user_code_file" ]; then
        local user_code_name="${output_name%.html}-user.js"
        local old_user_code_name
        old_user_code_name=$(basename "$user_code_file")
        cp "$user_code_file" "$output_dir/$user_code_name"
        # Update the reference in the HTML file (cross-platform sed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|$old_user_code_name|$user_code_name|g" "$output_dir/$output_name"
        else
            sed -i "s|$old_user_code_name|$user_code_name|g" "$output_dir/$output_name"
        fi
    fi

    echo "[OK]"
}

echo ""
echo "CSV Examples:"
generate_example "preview-csv" "$EXAMPLES_DIR/csv/employees.csv" "$DOCS_DIR/examples/csv" "employees.html"

echo ""
echo "JSON Examples:"
generate_example "preview-json" "$EXAMPLES_DIR/json/sample.json" "$DOCS_DIR/examples/json" "sample.html"
generate_example "preview-json" "$EXAMPLES_DIR/json/logs.jsonl" "$DOCS_DIR/examples/json" "logs.html"

echo ""
echo "Markdown Examples:"
generate_example "preview-markdown" "$EXAMPLES_DIR/markdown/sample.md" "$DOCS_DIR/examples/markdown" "sample.html"
generate_example "preview-markdown" "$EXAMPLES_DIR/markdown/mermaid-test.md" "$DOCS_DIR/examples/markdown" "mermaid-test.html"

echo ""
echo "Mermaid Examples:"
generate_example "preview-mermaid" "$EXAMPLES_DIR/mermaid/sample.mmd" "$DOCS_DIR/examples/mermaid" "sample.html"

echo ""
echo "Diff Examples:"
generate_example "preview-diff" "$EXAMPLES_DIR/diff/feature.diff" "$DOCS_DIR/examples/diff" "feature.html"

echo ""
echo "D3 Examples:"
generate_example "preview-d3" "$EXAMPLES_DIR/d3/sample.d3" "$DOCS_DIR/examples/d3" "sample.html"
generate_example "preview-d3" "$EXAMPLES_DIR/d3/pie-chart.d3" "$DOCS_DIR/examples/d3" "pie-chart.html"
generate_example "preview-d3" "$EXAMPLES_DIR/d3/network-graph.d3" "$DOCS_DIR/examples/d3" "network-graph.html"
generate_example "preview-d3" "$EXAMPLES_DIR/d3/heatmap.d3" "$DOCS_DIR/examples/d3" "heatmap.html"

echo ""
echo "Three.js Examples:"
generate_example "preview-threejs" "$EXAMPLES_DIR/threejs/sample.threejs" "$DOCS_DIR/examples/threejs" "sample.html"
generate_example "preview-threejs" "$EXAMPLES_DIR/threejs/molecule.threejs" "$DOCS_DIR/examples/threejs" "molecule.html"
generate_example "preview-threejs" "$EXAMPLES_DIR/threejs/solar-system.threejs" "$DOCS_DIR/examples/threejs" "solar-system.html"

echo ""
echo "Leaflet Examples:"
generate_example "preview-leaflet" "$EXAMPLES_DIR/leaflet/world-cities.leaflet" "$DOCS_DIR/examples/leaflet" "world-cities.html"
generate_example "preview-leaflet" "$EXAMPLES_DIR/leaflet/everest-trail.leaflet" "$DOCS_DIR/examples/leaflet" "everest-trail.html"
generate_example "preview-leaflet" "$EXAMPLES_DIR/leaflet/longest-trails.leaflet" "$DOCS_DIR/examples/leaflet" "longest-trails.html"

echo ""
echo "Documentation examples generated successfully!"
echo "Output directory: $DOCS_DIR/examples"
