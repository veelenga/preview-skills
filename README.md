# Preview Skills

Self-contained preview skills for visualizing files in the browser. Install what you need.

| Name                                                                                                | Description                                                   | File Types         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------ |
| [**preview-csv**](https://veelenga.github.io/preview-skills/examples/csv/employees.html)            | Sortable tables with search, filtering, and column statistics | `.csv`             |
| [**preview-json**](https://veelenga.github.io/preview-skills/examples/json/sample.html)             | Syntax highlighting with collapsible tree structure           | `.json`            |
| [**preview-markdown**](https://veelenga.github.io/preview-skills/examples/markdown/sample.html)     | GitHub-flavored rendering with syntax highlighting            | `.md`, `.markdown` |
| [**preview-mermaid**](https://veelenga.github.io/preview-skills/examples/mermaid/sample.html)       | Interactive diagrams (flowcharts, sequences, ER, etc.)        | `.mmd`, `.mermaid` |
| [**preview-diff**](https://veelenga.github.io/preview-skills/examples/diff/feature.html)            | GitHub-style diffs with side-by-side comparison               | Git diffs          |
| [**preview-d3**](https://veelenga.github.io/preview-skills/examples/d3/sample.html)                 | Interactive 2D data visualizations with zoom and pan          | `.d3`              |
| [**preview-threejs**](https://veelenga.github.io/preview-skills/examples/threejs/sample.html)       | Interactive 3D visualizations with orbit controls             | `.threejs`, `.3d`  |
| [**preview-leaflet**](https://veelenga.github.io/preview-skills/examples/leaflet/world-cities.html) | Interactive maps with markers and routes                      | `.leaflet`         |

## Quick Start

### Installation Script (Recommended)

The easiest way to install skills using symlinks:

```bash
# Clone repository
git clone https://github.com/veelenga/preview-skills.git && cd preview-skills

# Interactive installation - select which skills to install
scripts/install.sh

# Or install all skills
scripts/install.sh --all

# Or install specific skills
scripts/install.sh preview-csv preview-json preview-markdown
```

Symlinks keep the skills up-to-date with your repository. Use `git pull` to update, and the changes are immediately reflected.
Alternatively the specified skills can be manually copied to your agent skills directory.

### Uninstall

```bash
# Interactive - select skills to remove
scripts/uninstall.sh

# Remove all preview skills
scripts/uninstall.sh --all

# Remove specific skills
scripts/uninstall.sh preview-csv preview-json
```

## Usage

Each skill can be invoked directly:

```bash
# Preview CSV file
/preview data.csv

# Preview JSON file
/preview config.json

# Preview Markdown file
/preview README.md
```

Or use natural language:

- "generate pie diagram and preview"
- "preview this CSV file"
- "show me the JSON data"
- "render this Markdown document"

## Examples

```bash
# Data files
/preview examples/csv/employees.csv
/preview examples/json/sample.json

# Documentation
/preview README.md

# Diagrams
/preview examples/mermaid/sample.mmd
/preview examples/d3/network-graph.d3

# 3D and maps
/preview examples/threejs/sample.threejs
/preview examples/leaflet/world-cities.leaflet
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # ESLint
```

## How It Works

No servers, no dependencies, no installation complexity. Each skill is a bash script that:

1. Reads input file or stdin
2. Validates and processes content
3. Generates standalone HTML file with embedded JavaScript/CSS
4. Opens in default browser

The generated HTML files are completely self-contained and portable.

## Configuration

Each skill has a `config.sh` file with well-documented configuration options:

- Metadata (tool name, title, defaults)
- Layout settings (type, background color)
- Dependencies (CDN scripts, CSS files)
- Processing options (content encoding)
- Renderer configuration
- Size limits

See `src/core/templates/config.template.sh` for the full configuration reference.
