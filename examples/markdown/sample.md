# Sample Markdown Document

This is a **sample markdown** document to demonstrate the preview functionality including anchor links, expandable sections, and various formatting options.

## Table of Contents

- [Features](#features)
- [Code Example](#code-example)
- [Table Example](#table-example)
- [Blockquote](#blockquote)
- [Links](#links)
- [Task List](#task-list)
- [Expandable Sections](#expandable-sections)

---

## Features

The markdown preview supports a wide range of formatting options:

- **Bold** and _italic_ text
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Tables with alternating row colors
- Links and images
- Blockquotes
- Task lists with checkboxes
- Mermaid diagrams
- Expandable sections with `<details>` and `<summary>`
- Anchor links for easy navigation

This preview tool is designed to render GitHub-flavored markdown with full support for common extensions. The theme can be toggled between light and dark modes using the button in the header.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

---

## Code Example

Here are some code examples in different languages:

### Bash Script

```bash
#!/usr/bin/env bash

# A simple greeting script
NAME=${1:-"World"}
echo "Hello, ${NAME}!"

# Loop example
for i in {1..5}; do
  echo "Count: $i"
done
```

### JavaScript

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

// Arrow function example
const multiply = (a, b) => a * b;

// Async function
async function fetchData(url) {
  const response = await fetch(url);
  return response.json();
}
```

### Python

```python
def fibonacci(n):
    """Generate Fibonacci sequence up to n."""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

# Usage
for num in fibonacci(100):
    print(num)
```

---

## Table Example

| Feature    | Status | Notes                 |
| ---------- | ------ | --------------------- |
| Markdown   | ✅     | Fully supported       |
| Mermaid    | ✅     | Diagrams work         |
| JSON       | ✅     | Interactive viewer    |
| CSV        | ✅     | Sortable tables       |
| Dark Mode  | ✅     | Toggle in header      |
| Anchors    | ✅     | Click # on hover      |
| Expandable | ✅     | Using details/summary |

### Comparison Table

| Language   | Type System | Paradigm            | Year |
| ---------- | ----------- | ------------------- | ---- |
| JavaScript | Dynamic     | Multi-paradigm      | 1995 |
| TypeScript | Static      | Multi-paradigm      | 2012 |
| Python     | Dynamic     | Multi-paradigm      | 1991 |
| Rust       | Static      | Systems programming | 2010 |
| Go         | Static      | Concurrent          | 2009 |

---

## Blockquote

> This is a blockquote.
> It can span multiple lines and is useful for highlighting important information or quoting external sources.

> **Note:** Blockquotes can also contain **bold text**, _italic text_, and even `inline code`.

> ### Nested Content
>
> Blockquotes can contain headers and other markdown elements:
>
> - List item one
> - List item two
> - List item three

---

## Links

Check out the [GitHub repository](https://github.com/anthropics/claude-code) for more information.

### Useful Resources

- [Markdown Guide](https://www.markdownguide.org/) - Learn markdown syntax
- [GitHub Flavored Markdown](https://github.github.com/gfm/) - GFM specification
- [Mermaid Documentation](https://mermaid.js.org/) - Diagram syntax reference

---

## Task List

### Project Progress

- [x] Create extensible architecture
- [x] Refactor existing skills
- [x] Add JSON preview
- [x] Add CSV preview
- [x] Add Mermaid support
- [x] Implement dark mode
- [x] Add anchor links to headers
- [x] Add expandable sections
- [ ] Add XML preview
- [ ] Add YAML preview
- [ ] Add syntax highlighting themes

### Documentation Tasks

- [x] Write README
- [x] Add usage examples
- [ ] Create video tutorial
- [ ] Write API documentation

---

## Expandable Sections

Expandable sections use HTML `<details>` and `<summary>` tags to create collapsible content.

<details>
<summary>Click to see installation instructions</summary>

To install the preview skills, run:

```bash
npm install preview-skills
```

Then configure your environment:

1. Clone the repository
2. Run `npm install`
3. Start previewing!

</details>

<details>
<summary>Frequently Asked Questions</summary>

**Q: What file types are supported?**

A: Currently supported formats include:

- Markdown (`.md`)
- JSON (`.json`)
- CSV (`.csv`)
- Mermaid diagrams

**Q: Can I customize the theme?**

A: Yes! Use the theme toggle in the top-right corner to switch between light and dark modes.

**Q: How do anchor links work?**

A: Hover over any header to see the `#` anchor link. Click it to update the URL hash, which you can then share to link directly to that section.

</details>

<details>
<summary>Advanced Configuration</summary>

You can customize the preview behavior with these options:

| Option       | Default | Description              |
| ------------ | ------- | ------------------------ |
| `theme`      | `light` | Color theme (light/dark) |
| `fontSize`   | `16px`  | Base font size           |
| `lineHeight` | `1.6`   | Line height multiplier   |
| `maxWidth`   | `900px` | Maximum content width    |

Example configuration:

```json
{
  "theme": "dark",
  "fontSize": "14px",
  "lineHeight": 1.5
}
```

</details>

<details open>
<summary>This section is expanded by default</summary>

Use the `open` attribute on the `<details>` tag to have a section expanded when the page loads.

This is useful for important information that should be immediately visible.

</details>

---

**Happy previewing!** 🎉
