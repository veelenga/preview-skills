#!/usr/bin/env bash
set -euo pipefail

# Sync Skills - Development Tool
# Synchronizes shared files from src/ to skills/ directories
#
# What gets synced (truly shared files only):
#   1. Shared libraries: src/core/lib/*.sh → skills/*/lib/
#   2. Shared JavaScript: src/core/templates/scripts/{utils,common-ui}.js → skills/*/templates/scripts/
#   3. Shared CSS: src/core/templates/styles/{layout,common}.css → skills/*/templates/styles/
#   4. Unified run.sh: src/preview-skills/run.sh → skills/*/run.sh
#   5. User code template: src/preview-skills/templates/user-code-template.html → skills/{d3,threejs,leaflet}/templates/
#
# What does NOT get synced (tool-specific, already in skills/):
#   - Tool renderers: skills/*/templates/scripts/*-renderer.js
#   - Tool CSS: skills/*/templates/styles/*.css (except layout.css, common.css)
#   - Configs: skills/*/config.sh
#   - Documentation: skills/*/SKILL.md
#
# Usage:
#   src/scripts/sync-skills.sh           # Sync all skills
#   src/scripts/sync-skills.sh csv json  # Sync specific skills only

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CORE_DIR="$REPO_ROOT/src/core"
SOURCE_DIR="$REPO_ROOT/src/preview-skills"
SKILLS_DIR="$REPO_ROOT/skills"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[Sync]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

#===============================================================================
# Banner Generation
#===============================================================================

add_banner() {
    local source_file=$1
    local dest_file=$2
    local source_path=$3

    local ext="${source_file##*.}"

    if [[ "$ext" == "css" ]]; then
        cat > "$dest_file" << EOF
/*==============================================================================
 * AUTO-GENERATED - DO NOT EDIT
 *==============================================================================
 * Source: $source_path
 * To edit: Modify source file, then run: src/scripts/sync-skills.sh
 *============================================================================*/

EOF
        cat "$source_file" >> "$dest_file"
    elif [[ "$ext" == "js" ]]; then
        cat > "$dest_file" << EOF
//==============================================================================
// AUTO-GENERATED - DO NOT EDIT
//==============================================================================
// Source: $source_path
// To edit: Modify source file, then run: src/scripts/sync-skills.sh
//==============================================================================

EOF
        cat "$source_file" >> "$dest_file"
    else
        # Bash files with shebang
        echo "#!/usr/bin/env bash" > "$dest_file"
        cat >> "$dest_file" << EOF

#===============================================================================
# AUTO-GENERATED - DO NOT EDIT
#===============================================================================
# Source: $source_path
# To edit: Modify source file, then run: src/scripts/sync-skills.sh
#===============================================================================

EOF
        tail -n +2 "$source_file" >> "$dest_file"
        chmod +x "$dest_file"
    fi
}

#===============================================================================
# Skill Synchronization
#===============================================================================

sync_skill() {
    local tool_type=$1
    local skill_dir="$SKILLS_DIR/preview-$tool_type"

    if [[ ! -d "$skill_dir" ]]; then
        warn "Skill directory not found: preview-$tool_type"
        return 1
    fi

    log "Syncing preview-$tool_type..."

    # Create directory structure
    mkdir -p "$skill_dir/lib"
    mkdir -p "$skill_dir/templates"/{scripts,styles}

    # 1. Sync shared libraries from src/core/lib/
    for lib in content-utils.sh browser-utils.sh html-generator.sh; do
        add_banner "$CORE_DIR/lib/$lib" "$skill_dir/lib/$lib" "src/core/lib/$lib"
    done

    # 2. Sync shared JavaScript from src/core/templates/scripts/
    for js in utils.js common-ui.js; do
        add_banner "$CORE_DIR/templates/scripts/$js" "$skill_dir/templates/scripts/$js" "src/core/templates/scripts/$js"
    done

    # 3. Sync shared CSS from src/core/templates/styles/
    for css in layout.css common.css; do
        add_banner "$CORE_DIR/templates/styles/$css" "$skill_dir/templates/styles/$css" "src/core/templates/styles/$css"
    done

    # 4. Copy unified run.sh from src/preview-skills/
    cat > "$skill_dir/run.sh" << 'BANNER'
#!/usr/bin/env bash

#===============================================================================
# AUTO-GENERATED - DO NOT EDIT
#===============================================================================
# Source: src/preview-skills/run.sh
# To edit: Modify source file, then run: src/scripts/sync-skills.sh
#===============================================================================

BANNER

    # Append run.sh with path adjustments for standalone skills
    tail -n +2 "$SOURCE_DIR/run.sh" | \
        sed 's|^# Get directories (tools are inside skills/)$|# Get directories (standalone skill)|' | \
        sed 's|^SKILLS_ROOT=.*$|SKILL_ROOT="$SCRIPT_DIR"|' | \
        sed 's|^LIB_ROOT="$SKILLS_ROOT"$|LIB_ROOT="$SKILL_ROOT"|' \
        >> "$skill_dir/run.sh"
    chmod +x "$skill_dir/run.sh"

    # 5. Copy user-code-template for interactive tools (D3, ThreeJS, Leaflet)
    if [[ "$tool_type" == "d3" || "$tool_type" == "threejs" || "$tool_type" == "leaflet" ]]; then
        if [[ -f "$SOURCE_DIR/templates/user-code-template.html" ]]; then
            cp "$SOURCE_DIR/templates/user-code-template.html" "$skill_dir/templates/"
        fi
    fi

    success "Synced preview-$tool_type"
}

#===============================================================================
# Main
#===============================================================================

main() {
    log "Synchronizing skills from source..."
    echo ""

    # Validate directories
    if [[ ! -d "$CORE_DIR" ]]; then
        echo "Error: Core directory not found: $CORE_DIR" >&2
        exit 1
    fi

    if [[ ! -d "$SOURCE_DIR" ]]; then
        echo "Error: Source directory not found: $SOURCE_DIR" >&2
        exit 1
    fi

    if [[ ! -d "$SKILLS_DIR" ]]; then
        echo "Error: Skills directory not found: $SKILLS_DIR" >&2
        exit 1
    fi

    # Determine which skills to sync
    local skills_to_sync=()

    if [[ $# -eq 0 ]]; then
        # No arguments - sync all skills
        for skill_dir in "$SKILLS_DIR"/preview-*; do
            if [[ -d "$skill_dir" ]]; then
                local skill_name=$(basename "$skill_dir")
                local tool_type="${skill_name#preview-}"
                skills_to_sync+=("$tool_type")
            fi
        done
    else
        # Sync specific skills from arguments
        skills_to_sync=("$@")
    fi

    # Sync each skill
    local synced_count=0
    for tool_type in "${skills_to_sync[@]}"; do
        if sync_skill "$tool_type"; then
            ((synced_count++))
        fi
    done

    echo ""
    if [[ $synced_count -eq 0 ]]; then
        warn "No skills were synced"
        exit 1
    else
        success "Successfully synced $synced_count skill(s)"
    fi
}

main "$@"
