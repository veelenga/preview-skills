---
name: preview-diff
description: Git diff preview tool with GitHub-style formatting and interactive features
user-invocable: true
---

# Git Diff Preview Tool

Internal tool for previewing git changes with GitHub-style formatting. Accessed via `/preview-it` command.

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

## Usage (via /preview-it)

**All uncommitted changes:**

```bash
/preview-it
```

**Specific file:**

```bash
/preview-it src/components/Button.tsx
```

**Pipe from git diff (preferred for custom diffs):**

```bash
git diff main..feature-branch | /preview-it
git diff HEAD~3..HEAD | /preview-it
git show abc123 | /preview-it
```

**Best Practice:** For comparing branches, commits, or custom diff output, prefer piping git commands directly. This gives you more control and avoids creating temporary patch files.

## What It Shows

- Modified tracked files
- Staged new files (after `git add`)
- Untracked files (not yet added to git)
- Deleted files
- Renamed/moved files
- Line-by-line changes with context

No need to `git add` files to see them in the preview.

## Requirements

- Git repository
- Internet connection for diff2html library from CDN

## Technology

- **diff2html**: GitHub-style diff rendering
- **git diff**: Unified diff format
- **JavaScript/CSS**: Browser-based rendering
