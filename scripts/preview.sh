#!/usr/bin/env bash
set -euo pipefail

# Universal Preview Command
# Automatically detects file type and uses the appropriate preview skill
#
# Usage:
#   src/scripts/preview.sh <file>              # Auto-detect type
#   src/scripts/preview.sh --type csv file     # Explicit type
#   cat file | src/scripts/preview.sh          # From stdin
#   git diff | src/scripts/preview.sh --type diff

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

# Parse arguments
EXPLICIT_TYPE=""
FILE_PATH=""
HAS_STDIN=false
STDIN_TEMP=""

# Check for stdin
if [ ! -t 0 ]; then
    STDIN_TEMP=$(mktemp -t preview-stdin.XXXXXX)
    chmod 600 "$STDIN_TEMP"
    cat > "$STDIN_TEMP"
    if [ -s "$STDIN_TEMP" ]; then
        HAS_STDIN=true
    else
        rm -f "$STDIN_TEMP"
        STDIN_TEMP=""
    fi
fi

# Cleanup on exit
cleanup() {
    [ -n "$STDIN_TEMP" ] && [ -f "$STDIN_TEMP" ] && rm -f "$STDIN_TEMP"
}
trap cleanup EXIT INT TERM

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --type|-t)
            EXPLICIT_TYPE="$2"
            shift 2
            ;;
        --help|-h)
            cat << EOF
Usage: preview.sh [OPTIONS] [FILE]

Automatically preview files in browser with the appropriate skill.

OPTIONS:
  --type, -t TYPE    Explicitly specify preview type
  --help, -h         Show this help

TYPES:
  csv, json, markdown, mermaid, diff, d3, threejs, leaflet

EXAMPLES:
  preview.sh data.csv                    # Auto-detect CSV
  preview.sh README.md                   # Auto-detect Markdown
  preview.sh diagram.mmd                 # Auto-detect Mermaid
  preview.sh --type diff                 # Git diff from stdin
  cat file.json | preview.sh             # JSON from stdin
  git diff | preview.sh --type diff      # Explicit diff type

EOF
            exit 0
            ;;
        *)
            FILE_PATH="$1"
            shift
            ;;
    esac
done

#===============================================================================
# Type Detection
#===============================================================================

detect_type() {
    local file="$1"
    local ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    case "$ext" in
        md|markdown)     echo "markdown" ;;
        mmd|mermaid)     echo "mermaid" ;;
        json)            echo "json" ;;
        csv)             echo "csv" ;;
        d3)              echo "d3" ;;
        threejs|3d)      echo "threejs" ;;
        leaflet|map)     echo "leaflet" ;;
        diff|patch)      echo "diff" ;;
        *)               echo "" ;;
    esac
}

#===============================================================================
# Main
#===============================================================================

# Determine type
if [ -n "$EXPLICIT_TYPE" ]; then
    TYPE="$EXPLICIT_TYPE"
elif [ -n "$FILE_PATH" ]; then
    TYPE=$(detect_type "$FILE_PATH")
    if [ -z "$TYPE" ]; then
        echo "Error: Cannot detect file type from: $FILE_PATH" >&2
        echo "Use --type to specify explicitly" >&2
        exit 1
    fi
    echo "Detected type: $TYPE" >&2
else
    # No file, must have stdin - try to detect from content or require --type
    if [ "$HAS_STDIN" = "false" ]; then
        echo "Error: No file or stdin provided" >&2
        echo "Usage: preview.sh [--type TYPE] [FILE]" >&2
        exit 1
    fi

    if [ -z "$EXPLICIT_TYPE" ]; then
        echo "Error: Cannot auto-detect type from stdin" >&2
        echo "Use --type to specify: csv, json, markdown, mermaid, diff, d3, threejs, leaflet" >&2
        exit 1
    fi
    TYPE="$EXPLICIT_TYPE"
fi

# Validate type
VALID_TYPES=("csv" "json" "markdown" "mermaid" "diff" "d3" "threejs" "leaflet")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TYPE} " ]]; then
    echo "Error: Invalid type: $TYPE" >&2
    echo "Valid types: ${VALID_TYPES[*]}" >&2
    exit 1
fi

# Construct skill path
SKILL_SCRIPT="$SKILLS_DIR/preview-$TYPE/run.sh"

if [[ ! -f "$SKILL_SCRIPT" ]]; then
    echo "Error: Skill not found: preview-$TYPE" >&2
    echo "Expected: $SKILL_SCRIPT" >&2
    exit 1
fi

# Execute skill
if [ "$HAS_STDIN" = "true" ]; then
    # Pass stdin to skill
    cat "$STDIN_TEMP" | "$SKILL_SCRIPT"
elif [ -n "$FILE_PATH" ]; then
    # Pass file to skill
    "$SKILL_SCRIPT" "$FILE_PATH"
else
    echo "Error: No input provided" >&2
    exit 1
fi
