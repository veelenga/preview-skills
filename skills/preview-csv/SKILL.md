---
name: preview-csv
description: Render and preview CSV files in browser with interactive sorting, filtering, and column statistics
user-invocable: true
commands:
  - preview
  - preview-csv
---

# Preview CSV Skill

Interactive CSV file viewer that generates HTML visualizations with sorting, filtering, and statistical analysis.

## Usage

```bash
# Preview a CSV file
/preview data.csv

# Pipe CSV data (preferred for temporary content)
cat data.csv | /preview
echo "name,age\nAlice,30\nBob,25" | /preview

# With custom background color
/preview data.csv --background "#1e1e1e"
```

**Best Practice:** For temporary or generated content, prefer piping over creating temporary files. This avoids cluttering your filesystem and the content is automatically cleaned up.

## Options

The script works with sensible defaults but supports these flags for flexibility:

- `-o, --output PATH` - Custom output path
- `--no-browser` - Skip browser, output file path only

## Features

- **Interactive table** with sortable columns (click headers)
- **Search and filter** across all data in real-time
- **Column statistics** including:
  - Min/Max values
  - Average for numeric columns
  - Unique value counts
  - Data type detection
- **Export to JSON** functionality
- **Large file support** with automatic pagination (10,000+ rows)
- **Responsive design** adapts to screen size
- **Keyboard navigation** for accessibility

## When to Use This Skill

Use this skill when the user wants to:

- View and explore CSV data files
- Analyze data with sorting and filtering
- Inspect column statistics quickly
- Share formatted data views
- Debug or verify CSV file contents

## Examples

**Natural language requests:**

- "preview this CSV file"
- "show me the data in customers.csv"
- "open the employee data"
- "visualize this CSV"
- "let me see what's in sales.csv"

## Technical Details

### File Requirements

- File extension: `.csv`
- Maximum size: 10MB (configurable)
- Encoding: UTF-8

### Features in Detail

#### Sortable Columns

- Click any column header to sort
- Click again to reverse sort order
- Visual indicators show current sort direction

#### Search and Filter

- Live search across all columns
- Case-insensitive matching
- Instant results as you type

#### Column Statistics

- Automatically calculated for each column
- Numeric columns show: min, max, average
- All columns show: unique value count, data type
- Statistics update with filtered data

#### Export

- One-click export to JSON format
- Preserves all data and structure
- Downloads directly to browser

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- No external dependencies (all assets bundled)

## Output

The skill generates a standalone HTML file at:

```
/tmp/preview-skills/preview-csv-{filename}.html
```

The file is self-contained and can be:

- Opened directly in any browser
- Shared with others (no dependencies)
- Archived for later viewing

## Troubleshooting

### CSV doesn't display correctly

- Ensure file is valid CSV format
- Check that delimiters are commas
- Verify UTF-8 encoding

### File too large

- Files over 10MB may fail to load
- Consider filtering data before preview
- Use pagination for very large files

### Missing columns or data

- Check for empty lines at end of file
- Verify header row is present
- Ensure consistent column counts per row

## Development

This skill is standalone and includes all dependencies:

- Shared libraries bundled in `lib/`
- Templates bundled in `templates/`
- No external CDN requirements

To modify the skill:

1. Edit `config.sh` for configuration
2. Edit `templates/scripts/csv-renderer.js` for behavior
3. Edit `templates/styles/csv.css` for styling
4. Run `run.sh` to test changes
