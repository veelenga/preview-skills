#!/usr/bin/env bash

#===============================================================================
# AUTO-GENERATED - DO NOT EDIT
#===============================================================================
# Source: src/core/lib/browser-utils.sh
# To edit: Modify source file, then run: src/scripts/sync-skills.sh
#===============================================================================


# Browser Utilities Library
# Functions for opening browsers and managing preview files

# Preview output directory (project-local)
readonly PREVIEW_DIR=".preview-skills"

#######################################
# Validate file path for security
# Prevents path traversal and ensures file is in allowed locations
# Arguments:
#   $1 - File path to validate
#   $2 - Optional base directory (defaults to current directory)
# Environment:
#   PREVIEW_ALLOW_EXTERNAL_FILES - Set to "1" to allow files outside base dir (default: 1)
#   PREVIEW_ALLOW_SYMLINKS - Set to "1" to allow symlinks (default: 0)
# Returns:
#   Exit code 0 if valid, 1 if invalid
#######################################
validate_file_path() {
    local file_path="$1"
    local base_dir="${2:-.}"
    local allow_external="${PREVIEW_ALLOW_EXTERNAL_FILES:-1}"
    local allow_symlinks="${PREVIEW_ALLOW_SYMLINKS:-0}"

    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "Error: File not found: $file_path" >&2
        return 1
    fi

    # Check if file is a symbolic link
    if [ -L "$file_path" ]; then
        if [ "$allow_symlinks" != "1" ]; then
            echo "Error: Symbolic links are not allowed for security: $file_path" >&2
            echo "Set PREVIEW_ALLOW_SYMLINKS=1 to override this restriction." >&2
            return 1
        else
            echo "Warning: File is a symbolic link: $file_path" >&2
        fi
    fi

    # Get absolute paths and validate location
    if command -v realpath >/dev/null 2>&1; then
        local abs_file
        local abs_base

        abs_file=$(realpath "$file_path" 2>/dev/null) || return 1
        abs_base=$(realpath "$base_dir" 2>/dev/null) || abs_base="$base_dir"

        # Check if file is under base directory (prevent path traversal)
        if [[ "$abs_file" != "$abs_base"* ]]; then
            if [ "$allow_external" != "1" ]; then
                echo "Error: Access denied - file is outside allowed directory: $file_path" >&2
                echo "File location: $abs_file" >&2
                echo "Allowed base: $abs_base" >&2
                echo "Set PREVIEW_ALLOW_EXTERNAL_FILES=1 to override this restriction." >&2
                return 1
            fi
            # No warning when external files are explicitly allowed
        fi
    else
        # Fallback: check for path traversal patterns when realpath is unavailable
        # This is a basic check that catches common traversal attempts
        if [[ "$file_path" == *".."* ]]; then
            echo "Error: Path contains '..' which may indicate path traversal: $file_path" >&2
            return 1
        fi
        # Check for absolute paths outside base when external files not allowed
        if [ "$allow_external" != "1" ]; then
            if [[ "$file_path" == /* ]] && [[ "$file_path" != "$base_dir"* ]]; then
                echo "Warning: Cannot fully validate path without realpath command" >&2
            fi
        fi
    fi

    return 0
}

#######################################
# Open file in default browser
# Arguments:
#   $1 - Path to file to open
# Returns:
#   Exit code 0 on success
# Note: Tab reuse works automatically since we use same filename
#######################################
open_in_browser() {
    local file_path="$1"

    if [ ! -f "$file_path" ]; then
        echo "Error: File not found: $file_path" >&2
        return 1
    fi

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$file_path"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$file_path" 2>/dev/null || true
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start "$file_path"
    else
        echo "Error: Unsupported operating system: $OSTYPE" >&2
        return 1
    fi

    return 0
}

#######################################
# Sanitize a string for use in file/directory names
# Arguments:
#   $1 - String to sanitize
#   $2 - Max length (default: 100)
#   $3 - Fallback if empty (default: "file")
# Returns:
#   Sanitized string safe for filenames
#######################################
sanitize_name() {
    local input="$1"
    local max_length="${2:-100}"
    local fallback="${3:-file}"

    local safe
    safe=$(echo "$input" | sed 's/[^a-zA-Z0-9_-]/-/g' | cut -c1-"$max_length")
    [ -z "$safe" ] && safe="$fallback"

    echo "$safe"
}

#######################################
# Generate preview file path
# Arguments:
#   $1 - Skill name (e.g., "markdown", "mermaid")
#   $2 - Filename (e.g., "document", "diagram")
# Returns:
#   Path to preview file (e.g., ".preview-skills/markdown/document.html")
#######################################
get_preview_file_path() {
    local skill_name="$1"
    local filename="$2"

    local safe_skill
    local safe_filename
    safe_skill=$(sanitize_name "$skill_name" 50 "unknown")
    safe_filename=$(sanitize_name "$filename" 100 "file")

    local output_dir="${PREVIEW_DIR}/${safe_skill}"
    mkdir -p "$output_dir" 2>/dev/null || {
        echo "Error: Failed to create preview directory: $output_dir" >&2
        return 1
    }

    echo "${output_dir}/${safe_filename}.html"
}

#######################################
# Get output file path (custom or default)
# Arguments:
#   $1 - Skill name (e.g., "markdown", "mermaid")
#   $2 - Filename (e.g., "document", "diagram")
#   $3 - Custom output path (optional, can be file or directory)
# Returns:
#   Path to output file
#######################################
get_output_file_path() {
    local skill_name="$1"
    local filename="$2"
    local custom_output="${3:-}"

    if [ -z "$custom_output" ]; then
        get_preview_file_path "$skill_name" "$filename"
        return
    fi

    local safe_filename
    safe_filename=$(sanitize_name "$filename" 100 "file")

    if [ -d "$custom_output" ]; then
        echo "${custom_output%/}/${safe_filename}.html"
        return
    fi

    if [[ "$custom_output" == */ ]]; then
        mkdir -p "$custom_output" 2>/dev/null || {
            echo "Error: Cannot create directory: $custom_output" >&2
            return 1
        }
        echo "${custom_output%/}/${safe_filename}.html"
        return
    fi

    local parent_dir
    parent_dir=$(dirname "$custom_output")
    if [ ! -d "$parent_dir" ]; then
        mkdir -p "$parent_dir" 2>/dev/null || {
            echo "Error: Cannot create directory: $parent_dir" >&2
            return 1
        }
    fi

    if [[ "$custom_output" != *.html ]]; then
        echo "${custom_output}.html"
    else
        echo "$custom_output"
    fi
}

#######################################
# Clean up old preview files
# Arguments:
#   $1 - Skill name (optional, cleans all if not specified)
#   $2 - Age in minutes (optional, defaults to 60)
# Returns:
#   Number of files removed
#######################################
cleanup_old_previews() {
    local skill_name="${1:-}"
    local age_minutes="${2:-60}"
    local search_dir="${PREVIEW_DIR}"
    local count=0

    if [ -n "$skill_name" ] && [ -d "${PREVIEW_DIR}/${skill_name}" ]; then
        search_dir="${PREVIEW_DIR}/${skill_name}"
    fi

    # Find and remove files older than specified age
    if [ -d "$search_dir" ] && command -v find >/dev/null 2>&1; then
        while IFS= read -r file; do
            rm -f "$file"
            ((count++))
        done < <(find "$search_dir" -name "*.html" -type f -mmin "+${age_minutes}" 2>/dev/null)
    fi

    echo "$count"
}

#######################################
# Get list of active preview files
# Arguments:
#   $1 - Skill name (optional, lists all if not specified)
# Returns:
#   List of preview file paths
#######################################
list_preview_files() {
    local skill_name="${1:-}"
    local search_dir="${PREVIEW_DIR}"

    if [ -n "$skill_name" ] && [ -d "${PREVIEW_DIR}/${skill_name}" ]; then
        search_dir="${PREVIEW_DIR}/${skill_name}"
    fi

    # List matching files
    find "$search_dir" -name "*.html" -type f 2>/dev/null | sort || true
}

#######################################
# Check if browser command is available
# Returns:
#   Exit code 0 if browser can be opened, 1 otherwise
#######################################
check_browser_available() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        command -v open >/dev/null 2>&1
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        command -v xdg-open >/dev/null 2>&1
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        command -v start >/dev/null 2>&1
    else
        return 1
    fi
}

#######################################
# Future: Start live server for preview
# Arguments:
#   $1 - Port number (default: 8765)
#   $2 - Source file to watch
# Returns:
#   Server PID
# Note: Not yet implemented, placeholder for future enhancement
#######################################
start_live_server() {
    local port="${1:-8765}"
    local source_file="$2"

    echo "Error: Live server not yet implemented" >&2
    return 1
}

#######################################
# Future: Watch file for changes
# Arguments:
#   $1 - File to watch
#   $2 - Callback command to execute on change
# Returns:
#   Watcher PID
# Note: Not yet implemented, placeholder for future enhancement
#######################################
watch_file() {
    local file="$1"
    local callback="$2"

    echo "Error: File watching not yet implemented" >&2
    return 1
}
