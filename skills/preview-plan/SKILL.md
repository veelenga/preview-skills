---
name: preview-plan
description: Render implementation plans as navigable HTML with sidebar TOC and progress tracking. Activate automatically when producing or previewing implementation plans, design docs, architecture proposals, migration plans, or any long-form structured plan.
user-invocable: true
commands:
  - preview-plan
---

# Preview Plan Skill

Plans are hard to review in raw markdown. This skill renders them as navigable HTML with a sidebar TOC and reading progress — so the reviewer can quickly orient, jump between sections, and focus on what matters.

You don't need to wait for the user to ask for preview. If you're writing a plan, pipe it directly.

## Agent Usage

```bash
# Preview an existing file
./run.sh plan.plan.md

# Pipe generated plan content directly (preferred)
cat <<'EOF' | ./run.sh
# My Plan

## Phase 1: Setup
...
EOF
```

The script **automatically opens the result in the browser**. Do NOT open the file manually.

## Writing Plans for Best Preview Quality

Structure your plan markdown to take full advantage of the viewer:

- **Use `# Title` for the plan name** — displayed in the sidebar header
- **Use `## Sections` for major phases/sections** — each becomes a TOC entry
- **Use `### Subsections` and `#### Details`** — nested TOC entries with indentation
- **Use task lists** (`- [ ]` / `- [x]`) — the viewer counts completed/total tasks in the sidebar
- **Use tables** for comparisons, risk matrices, field specs
- **Use `\`\`\`diff` code blocks** — lines with `+`/`-` get colored highlighting
- **Use `\`\`\`mermaid` blocks** — rendered as interactive diagrams
- **Use blockquotes** (`>`) for callouts and important notes

## Usage

```bash
/preview-plan implementation.plan.md
cat design.plan.md | /preview-plan
```

## Options

- `-o, --output PATH` - Custom output path
- `--no-browser` - Skip browser, output file path only

## File Requirements

- File extensions: `.plan.md`, `.plan`
- Encoding: UTF-8
