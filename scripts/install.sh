#!/usr/bin/env bash
set -euo pipefail

# Installation script for preview skills
# Creates symlinks in ~/.claude/skills (or custom directory)

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
    "preview-plan"
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
    echo -e "${BLUE}[Install]${NC} $1"
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

Install preview skills by creating symlinks in Claude Code skills directory.

OPTIONS:
  --dest DIR         Destination directory (default: ~/.claude/skills)
  --all              Install all available skills
  -h, --help         Show this help message

SKILLS:
  preview-plan       Preview implementation plans with sidebar TOC
  preview-csv        Preview CSV files with sorting and filtering
  preview-json       Preview JSON files with syntax highlighting
  preview-markdown   Preview Markdown with GitHub-flavored formatting
  preview-mermaid    Preview Mermaid diagrams
  preview-diff       Preview git diffs with GitHub-style formatting
  preview-d3         Preview D3.js visualizations
  preview-threejs    Preview Three.js 3D visualizations
  preview-leaflet    Preview Leaflet maps

EXAMPLES:
  # Interactive mode - select skills
  $0

  # Install all skills to default location
  $0 --all

  # Install specific skills
  $0 preview-csv preview-json preview-markdown

  # Install to custom directory
  $0 --dest /custom/path --all

  # Install specific skills to custom directory
  $0 --dest /custom/path preview-csv preview-json

EOF
}

# Parse arguments
SELECTED_SKILLS=()
INSTALL_ALL=false

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
            INSTALL_ALL=true
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

# Interactive mode if no skills selected and not --all
if [[ ${#SELECTED_SKILLS[@]} -eq 0 && "$INSTALL_ALL" == "false" ]]; then
    log "Interactive installation mode"
    echo ""
    echo "Available skills:"
    echo ""

    for i in "${!AVAILABLE_SKILLS[@]}"; do
        skill="${AVAILABLE_SKILLS[$i]}"
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
    echo "  a) All skills"
    echo "  q) Quit"
    echo ""

    read -p "Select skills to install (e.g., 1 3 5 or 'a' for all): " selection

    if [[ "$selection" == "q" ]]; then
        log "Installation cancelled"
        exit 0
    elif [[ "$selection" == "a" ]]; then
        INSTALL_ALL=true
    else
        # Parse numbers
        for num in $selection; do
            if [[ "$num" =~ ^[0-9]+$ ]]; then
                idx=$((num - 1))
                if [[ $idx -ge 0 && $idx -lt ${#AVAILABLE_SKILLS[@]} ]]; then
                    SELECTED_SKILLS+=("${AVAILABLE_SKILLS[$idx]}")
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

# If --all flag, install all skills
if [[ "$INSTALL_ALL" == "true" ]]; then
    SELECTED_SKILLS=("${AVAILABLE_SKILLS[@]}")
fi

# Validate that at least one skill is selected
if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
    error "No skills selected for installation"
    exit 1
fi

# Show installation plan
log "Installation plan:"
echo "  Destination: $DEST_DIR"
echo "  Skills:"
for skill in "${SELECTED_SKILLS[@]}"; do
    echo "    - $skill"
done
echo ""

# Confirm with user
read -p "Proceed with installation? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log "Installation cancelled"
    exit 0
fi

echo ""

# Create destination directory if needed
if [[ ! -d "$DEST_DIR" ]]; then
    log "Creating destination directory: $DEST_DIR"
    mkdir -p "$DEST_DIR"
fi

# Install each selected skill
INSTALLED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

for skill in "${SELECTED_SKILLS[@]}"; do
    source_path="$SKILLS_DIR/$skill"
    dest_path="$DEST_DIR/$skill"

    # Validate source exists
    if [[ ! -d "$source_path" ]]; then
        error "Skill not found: $skill (expected at $source_path)"
        ((ERROR_COUNT++))
        continue
    fi

    # Check if destination already exists
    if [[ -L "$dest_path" ]]; then
        # It's a symlink - check if it points to our source
        current_target=$(readlink "$dest_path")

        if [[ "$current_target" == "$source_path" ]]; then
            warn "Symlink already exists: $skill"
            ((SKIPPED_COUNT++))
            continue
        else
            warn "Symlink exists but points to different location: $skill"
            warn "  Current: $current_target"
            warn "  Desired: $source_path"
            read -p "  Replace symlink? (y/N): " replace

            if [[ "$replace" =~ ^[Yy]$ ]]; then
                rm "$dest_path"
            else
                warn "Skipped: $skill"
                ((SKIPPED_COUNT++))
                continue
            fi
        fi
    elif [[ -e "$dest_path" ]]; then
        # Something exists but it's not a symlink
        error "Path already exists (not a symlink): $dest_path"
        warn "  Please remove or rename it manually"
        ((ERROR_COUNT++))
        continue
    fi

    # Create symlink
    ln -s "$source_path" "$dest_path"
    success "Installed: $skill"
    ((INSTALLED_COUNT++))
done

# Summary
echo ""
log "Installation complete!"
echo "  Installed: $INSTALLED_COUNT"
[[ $SKIPPED_COUNT -gt 0 ]] && echo "  Skipped:   $SKIPPED_COUNT"
[[ $ERROR_COUNT -gt 0 ]] && echo "  Errors:    $ERROR_COUNT"

if [[ $INSTALLED_COUNT -gt 0 ]]; then
    echo ""
    success "Skills are now available in Claude Code!"
    echo "  Use: /preview <file>"
fi

exit 0
