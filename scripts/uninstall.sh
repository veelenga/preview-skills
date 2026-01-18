#!/usr/bin/env bash
set -euo pipefail

# Uninstallation script for preview skills
# Removes symlinks from ~/.claude/skills (or custom directory)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

# Default destination
DEFAULT_DEST="$HOME/.claude/skills"
DEST_DIR="$DEFAULT_DEST"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Available skills
AVAILABLE_SKILLS=(
    "preview-csv"
    "preview-json"
    "preview-markdown"
    "preview-mermaid"
    "preview-diff"
    "preview-d3"
    "preview-threejs"
    "preview-leaflet"
)

log() {
    echo -e "${BLUE}[Uninstall]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [SKILLS...]

Uninstall preview skills by removing symlinks from Claude Code skills directory.

OPTIONS:
  --dest DIR         Destination directory (default: ~/.claude/skills)
  --all              Uninstall all preview skills
  -h, --help         Show this help message

SKILLS:
  preview-csv        Preview CSV files
  preview-json       Preview JSON files
  preview-markdown   Preview Markdown files
  preview-mermaid    Preview Mermaid diagrams
  preview-diff       Preview git diffs
  preview-d3         Preview D3.js visualizations
  preview-threejs    Preview Three.js 3D visualizations
  preview-leaflet    Preview Leaflet maps

EXAMPLES:
  # Interactive mode - select skills to remove
  $0

  # Uninstall all skills from default location
  $0 --all

  # Uninstall specific skills
  $0 preview-csv preview-json

  # Uninstall from custom directory
  $0 --dest /custom/path --all

EOF
}

# Parse arguments
SELECTED_SKILLS=()
UNINSTALL_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dest)
            if [[ -z "${2:-}" ]]; then
                error "Error: --dest requires a directory path"
                exit 1
            fi
            DEST_DIR="$2"
            shift 2
            ;;
        --all)
            UNINSTALL_ALL=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        preview-*)
            SELECTED_SKILLS+=("$1")
            shift
            ;;
        *)
            error "Unknown argument: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Expand tilde in DEST_DIR
DEST_DIR="${DEST_DIR/#\~/$HOME}"

# Check if destination exists
if [[ ! -d "$DEST_DIR" ]]; then
    error "Destination directory does not exist: $DEST_DIR"
    exit 1
fi

# Interactive mode if no skills selected and not --all
if [[ ${#SELECTED_SKILLS[@]} -eq 0 && "$UNINSTALL_ALL" == "false" ]]; then
    log "Interactive uninstallation mode"
    echo ""
    echo "Installed skills in $DEST_DIR:"
    echo ""

    INSTALLED_SKILLS=()
    for skill in "${AVAILABLE_SKILLS[@]}"; do
        dest_path="$DEST_DIR/$skill"
        if [[ -L "$dest_path" ]]; then
            INSTALLED_SKILLS+=("$skill")
        fi
    done

    if [[ ${#INSTALLED_SKILLS[@]} -eq 0 ]]; then
        log "No preview skills found in $DEST_DIR"
        exit 0
    fi

    for i in "${!INSTALLED_SKILLS[@]}"; do
        skill="${INSTALLED_SKILLS[$i]}"
        num=$((i + 1))

        # Get description from SKILL.md
        skill_dir="$SKILLS_DIR/$skill"
        desc=""
        if [[ -f "$skill_dir/SKILL.md" ]]; then
            desc=$(grep "^description:" "$skill_dir/SKILL.md" | sed 's/description: //')
        fi

        printf "  %d) %-20s %s\n" "$num" "$skill" "$desc"
    done

    echo ""
    echo "  a) All installed skills"
    echo "  q) Quit"
    echo ""

    read -p "Select skills to uninstall (e.g., 1 3 5 or 'a' for all): " selection

    if [[ "$selection" == "q" ]]; then
        log "Uninstallation cancelled"
        exit 0
    elif [[ "$selection" == "a" ]]; then
        SELECTED_SKILLS=("${INSTALLED_SKILLS[@]}")
    else
        # Parse numbers
        for num in $selection; do
            if [[ "$num" =~ ^[0-9]+$ ]]; then
                local idx=$((num - 1))
                if [[ $idx -ge 0 && $idx -lt ${#INSTALLED_SKILLS[@]} ]]; then
                    SELECTED_SKILLS+=("${INSTALLED_SKILLS[$idx]}")
                else
                    warn "Invalid selection: $num (out of range)"
                fi
            fi
        done

        if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
            error "No valid skills selected"
            exit 1
        fi
    fi
fi

# If --all flag, uninstall all skills
if [[ "$UNINSTALL_ALL" == "true" ]]; then
    SELECTED_SKILLS=("${AVAILABLE_SKILLS[@]}")
fi

# Validate that at least one skill is selected
if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
    error "No skills selected for uninstallation"
    exit 1
fi

# Show uninstallation plan
log "Uninstallation plan:"
echo "  Directory: $DEST_DIR"
echo "  Skills:"
for skill in "${SELECTED_SKILLS[@]}"; do
    echo "    - $skill"
done
echo ""

# Confirm with user
read -p "Proceed with uninstallation? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log "Uninstallation cancelled"
    exit 0
fi

echo ""

# Uninstall each selected skill
REMOVED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

for skill in "${SELECTED_SKILLS[@]}"; do
    dest_path="$DEST_DIR/$skill"

    # Check if it's a symlink
    if [[ -L "$dest_path" ]]; then
        target=$(readlink "$dest_path")

        # Verify it points to our repo (safety check)
        if [[ "$target" == "$SKILLS_DIR/$skill" ]]; then
            rm "$dest_path"
            success "Removed: $skill"
            ((REMOVED_COUNT++))
        else
            warn "Symlink points to unexpected location: $skill"
            warn "  Target: $target"
            read -p "  Remove anyway? (y/N): " remove

            if [[ "$remove" =~ ^[Yy]$ ]]; then
                rm "$dest_path"
                success "Removed: $skill"
                ((REMOVED_COUNT++))
            else
                warn "Skipped: $skill"
                ((SKIPPED_COUNT++))
            fi
        fi
    elif [[ -e "$dest_path" ]]; then
        warn "Path exists but is not a symlink: $skill"
        warn "  Path: $dest_path"
        warn "  Skipping (manual removal required)"
        ((SKIPPED_COUNT++))
    else
        warn "Not installed: $skill"
        ((SKIPPED_COUNT++))
    fi
done

# Summary
echo ""
log "Uninstallation complete!"
echo "  Removed: $REMOVED_COUNT"
[[ $SKIPPED_COUNT -gt 0 ]] && echo "  Skipped: $SKIPPED_COUNT"
[[ $ERROR_COUNT -gt 0 ]] && echo "  Errors:  $ERROR_COUNT"

exit 0
