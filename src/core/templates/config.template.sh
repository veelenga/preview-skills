#!/usr/bin/env bash

#===============================================================================
# Preview Skill Configuration
#===============================================================================
# This file defines the configuration for a preview skill.
# Format: Bash variables (no external dependencies required)
#
# Configuration is organized into sections:
# - Metadata: Basic skill identification
# - Layout: Visual presentation settings
# - Dependencies: External libraries and styles
# - Processing: Content handling options
# - Renderer: JavaScript renderer configuration
# - Limits: Size and validation constraints
#===============================================================================

#-------------------------------------------------------------------------------
# METADATA
#-------------------------------------------------------------------------------
# Core skill identification

TOOL_NAME=""              # Internal identifier (e.g., "csv", "json", "d3")
TOOL_TITLE_PREFIX=""      # Display name (e.g., "CSV Viewer", "D3.js Visualization")
DEFAULT_FILENAME=""       # Fallback filename when none provided
DEFAULT_THEME="default"   # Theme variant (if applicable)

#-------------------------------------------------------------------------------
# LAYOUT
#-------------------------------------------------------------------------------
# Visual presentation configuration

LAYOUT_TYPE="document"    # Layout mode: "document" | "centered" | "full"
                          # - document: Standard page with padding
                          # - centered: Centered content with max-width
                          # - full: Full viewport (for visualizations)

BACKGROUND_COLOR="#ffffff" # Page background color (hex or named color)

#-------------------------------------------------------------------------------
# DEPENDENCIES
#-------------------------------------------------------------------------------
# External libraries and stylesheets

# CDN Scripts with SRI (Subresource Integrity) hashes
# Format: "URL::INTEGRITY_HASH"
# Example: "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js::sha384-abc123..."
# Empty array if no CDN dependencies
CDN_SCRIPTS=()

# CSS Files (paths relative to skill root)
# Order matters - loaded sequentially
STYLE_FILES=(
    "templates/styles/layout.css"  # Common layout styles
    "templates/styles/common.css"  # Shared UI styles
    # Add tool-specific styles here
)

#-------------------------------------------------------------------------------
# PROCESSING
#-------------------------------------------------------------------------------
# Content handling configuration

CONTENT_ENCODING="raw"    # Encoding method: "raw" | "base64" | "json"
                          # - raw: No encoding (for simple text)
                          # - base64: Base64 encode (for binary-safe embedding)
                          # - json: JSON-escape (for structured data)

#-------------------------------------------------------------------------------
# RENDERER
#-------------------------------------------------------------------------------
# JavaScript renderer configuration

RENDERER_FILE="templates/scripts/TOOL-renderer.js"  # Path to renderer script

# Variables to substitute in renderer
# These will be replaced with actual content during generation
RENDERER_VARS=(
    "DATA_VARIABLE"  # Example: "CSV_DATA", "JSON_DATA", "D3_CODE"
)

#===============================================================================
# NOTES
#===============================================================================
# - MAX_CONTENT_SIZE is defined in content-utils.sh (10MB default)
#   Do not override here as it's readonly
# - File extension validation is handled automatically based on TOOL_NAME
# - Additional validation can be added in the tool-specific run.sh

#===============================================================================
# End of configuration
#===============================================================================
