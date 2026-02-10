---
name: preview-json
description: Render and preview JSON files in browser with syntax highlighting, collapsible tree view, and search
user-invocable: true
commands:
  - preview-json
---

# Preview JSON Skill

Interactive JSON/JSONL viewer that generates HTML visualizations with syntax highlighting, collapsible tree structure, and search functionality.

## Agent Usage

When the user asks to preview a JSON or JSONL file, **DO NOT** build HTML manually. Use the Bash tool to execute this skill's `run.sh` script:

```bash
# Preview a JSON file
./run.sh data.json

# Preview a JSONL file
./run.sh logs.jsonl

# Pipe content
cat data.json | ./run.sh
```

The script handles all HTML generation and **automatically opens the result in the browser**. Do NOT open the file manually to avoid duplicate tabs.

## Usage

```bash
# Preview a JSON file
/preview-json data.json

# Preview a JSONL file (JSON Lines format)
/preview-json logs.jsonl

# Pipe JSON data (preferred for temporary content)
cat data.json | /preview-json
echo '{"name":"test","value":123}' | /preview-json

# Pipe JSONL data
echo '{"id":1,"name":"Alice"}
{"id":2,"name":"Bob"}' | /preview-json

# With custom background color
/preview-json data.json --background "#1e1e1e"
```

**Best Practice:** For temporary or generated content, prefer piping over creating temporary files. This avoids cluttering your filesystem and the content is automatically cleaned up.

## Options

The script works with sensible defaults but supports these flags for flexibility:

- `-o, --output PATH` - Custom output path
- `--no-browser` - Skip browser, output file path only

## Features

- **Syntax highlighting** with color-coded types:
  - Strings (green)
  - Numbers (blue)
  - Booleans (orange)
  - Null values (red)
  - Keys (purple)
- **Collapsible tree view** for nested structures
- **Search** through keys and values in real-time
- **Copy values** to clipboard with one click
- **Pretty formatted** with proper indentation
- **Type indicators** for each value
- **Line numbers** for easy reference
- **Responsive design** adapts to screen size

## When to Use This Skill

Use this skill when the user wants to:

- View and explore JSON data files
- View JSONL (JSON Lines) log files or streaming data
- Inspect API responses
- Debug JSON structures
- Verify JSON formatting
- Share formatted JSON data
- Analyze newline-delimited JSON exports

## Examples

**Natural language requests:**

- "preview this JSON file"
- "show me the API response"
- "open the config.json"
- "visualize this JSON"
- "let me see what's in package.json"
- "preview the logs.jsonl file"
- "show me this JSONL export"

## Technical Details

### File Requirements

- File extension: `.json` or `.jsonl`
- Maximum size: 10MB (configurable)
- Encoding: UTF-8
- Valid JSON or JSONL format
- JSONL: One valid JSON object per line

### Features in Detail

#### Syntax Highlighting

- Automatic color coding based on data type
- Clear visual distinction between keys and values
- Proper formatting for readability

#### Collapsible Tree View

- Click arrows to expand/collapse objects and arrays
- Collapse all / expand all buttons
- Memory of collapsed state during session
- Visual nesting indicators

#### Search Functionality

- Live search as you type
- Case-insensitive matching
- Searches both keys and values
- Highlights matching results

#### Copy to Clipboard

- Click any value to copy
- Automatic formatting for strings
- Visual feedback on copy

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- No external dependencies (all assets bundled)

## Output

The skill generates a standalone HTML file at:

```
/tmp/preview-skills/preview-json-{filename}.html
```

The file is self-contained and can be:

- Opened directly in any browser
- Shared with others (no dependencies)
- Archived for later viewing

## Troubleshooting

### JSON doesn't display correctly

- Ensure file is valid JSON format
- Check for trailing commas (invalid in JSON)
- Verify UTF-8 encoding
- Run through a JSON validator

### Invalid JSON error

- Check syntax: missing brackets, quotes, or commas
- Ensure proper escaping of special characters
- Use `jq` to validate: `cat file.json | jq .`

### JSONL parsing issues

- Ensure each line is a valid JSON object
- Check for empty lines (they will be ignored)
- Each line must be complete (no multi-line JSON objects)
- Validate with: `cat file.jsonl | jq -c '.' > /dev/null`

### File too large

- Files over 10MB may fail to load
- Consider splitting large JSON files
- Use JSON streaming for very large files

### Search not working

- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

## Development

This skill is standalone and includes all dependencies:

- Shared libraries bundled in `lib/`
- Templates bundled in `templates/`
- No external CDN requirements

To modify the skill:

1. Edit `config.sh` for configuration
2. Edit `templates/scripts/json-renderer.js` for behavior
3. Edit `templates/styles/json.css` for styling
4. Run `run.sh` to test changes
