---
name: preview-diff
description: Git diff preview tool with GitHub-style formatting and interactive features
user-invocable: true
---

# Git Diff Preview Tool

Internal tool for previewing git changes with GitHub-style formatting. Accessed via `/preview-diff` command.

## Features

### Visual Design

- Beautiful gradient header with clear stats summary
- GitHub-style formatting using diff2html library
- Modern UI with rounded corners and smooth transitions
- Enhanced readability with optimized fonts and spacing

### Functionality

- Accordion-style files: Click headers to expand/collapse
- Smart defaults: First file expanded, others collapsed
- Expand/Collapse All button for quick control
- Real-time search: Filter files by name
- View switching: Toggle between unified and split view
- Unified view (default): Traditional line-by-line diff
- Split view: Side-by-side comparison
- Change statistics: Files changed, additions, deletions
- Line numbers and syntax highlighting
- View persistence across sessions
- Shows all changes: tracked, staged, and untracked files

## Agent Usage

When the user asks to preview a diff, **DO NOT** build HTML manually. Simply pipe the diff to the skill's run.sh script:

```bash
# Preview current changes
git diff HEAD | ~/.claude/skills/preview-diff/run.sh

# Preview specific branch comparison
git diff main..feature-branch | ~/.claude/skills/preview-diff/run.sh

# Then open the result
open /tmp/preview-skills/preview-preview-diff-diff.html
```

The script handles all HTML generation automatically.

## Technology

- **diff2html**: GitHub-style diff rendering
- **git diff**: Unified diff format
- **JavaScript/CSS**: Browser-based rendering
