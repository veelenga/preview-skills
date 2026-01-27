/* eslint-disable no-unused-vars */
// Functions in this file are called from HTML onclick handlers

const rawData = base64DecodeUnicode('JSON_DATA_ENCODED');
let jsonData;
let isJsonl = false;

function parseJsonl(text) {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return null;

  const results = [];
  for (const line of lines) {
    results.push(JSON.parse(line));
  }
  return results;
}

try {
  jsonData = JSON.parse(rawData);
} catch (e) {
  // Try JSONL format (one JSON object per line)
  jsonData = parseJsonl(rawData);
  isJsonl = true;
}

const container = document.getElementById('content');
let searchQuery = '';

function analyzeJSON(obj, depth = 0) {
  let keys = 0;
  let maxDepth = depth;

  if (Array.isArray(obj)) {
    keys = obj.length;
    obj.forEach((item) => {
      const analysis = analyzeJSON(item, depth + 1);
      maxDepth = Math.max(maxDepth, analysis.maxDepth);
    });
  } else if (typeof obj === 'object' && obj !== null) {
    const objKeys = Object.keys(obj);
    keys = objKeys.length;
    objKeys.forEach((key) => {
      const analysis = analyzeJSON(obj[key], depth + 1);
      maxDepth = Math.max(maxDepth, analysis.maxDepth);
    });
  }

  return { keys, maxDepth };
}

const analysis = analyzeJSON(jsonData);
const rootType = isJsonl ? 'JSONL' : Array.isArray(jsonData) ? 'Array' : 'Object';
const itemCount = isJsonl ? `${jsonData.length} lines` : '';
const stats = `${rootType}${itemCount ? ' • ' + itemCount : ''} • Depth ${analysis.maxDepth}`;

const toolbarItems = [
  createSearchBox('searchJSON(this.value)', 'clearSearch()'),
  createButton('Collapse All', 'toggleAll(false)'),
  createButton('Expand All', 'toggleAll(true)'),
  createButton('Copy JSON', 'copyJSON()', '📋'),
];

const viewerTitle = isJsonl ? 'JSONL Viewer' : 'JSON Viewer';
container.innerHTML =
  createHeader(viewerTitle, stats, toolbarItems) +
  '<div class="preview-body"><div id="json-container"></div></div>' +
  createFooter();

function generatePreview(obj, maxLength = 80) {
  if (Array.isArray(obj)) {
    const items = [];
    for (let i = 0; i < obj.length && items.join(', ').length < maxLength; i++) {
      items.push(formatPreviewValue(obj[i]));
    }
    const preview = items.join(', ');
    const suffix = obj.length > items.length ? ', …' : '';
    return (
      '[ ' +
      preview +
      suffix +
      ' ]  <span class="json-preview-count">' +
      obj.length +
      ' items</span>'
    );
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    const items = [];
    for (let i = 0; i < keys.length && items.join(', ').length < maxLength; i++) {
      const key = keys[i];
      items.push('"' + escapeHtml(key) + '": ' + formatPreviewValue(obj[key]));
    }
    const preview = items.join(', ');
    const suffix = keys.length > items.length ? ', …' : '';
    return (
      '{ ' +
      preview +
      suffix +
      ' }  <span class="json-preview-count">' +
      keys.length +
      ' keys</span>'
    );
  }
  return '';
}

function formatPreviewValue(val) {
  if (val === null) return '<span class="json-null">null</span>';
  if (typeof val === 'string') {
    const truncated = val.length > 20 ? val.substring(0, 20) + '…' : val;
    return '<span class="json-string">"' + escapeHtml(truncated) + '"</span>';
  }
  if (typeof val === 'number') return '<span class="json-number">' + val + '</span>';
  if (typeof val === 'boolean') return '<span class="json-boolean">' + val + '</span>';
  if (Array.isArray(val)) return '<span class="json-bracket">[…]</span>';
  if (typeof val === 'object') return '<span class="json-bracket">{…}</span>';
  return String(val);
}

function formatJSON(obj, indent, path) {
  indent = indent || 0;
  path = path || '';
  const spaces = '  '.repeat(indent);
  let html = '';

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '<span class="json-bracket">[]</span>';
    }
    const preview = generatePreview(obj);
    html += '<span class="json-bracket json-collapsible" onclick="toggleCollapse(event)">[</span>';
    html += '<span class="json-preview">' + preview + '</span>';
    html += '<div class="json-children">';
    obj.forEach((item, i) => {
      const itemPath = path + '[' + i + ']';
      html += '<div class="json-line" data-path="' + escapeHtml(itemPath) + '">' + spaces + '  ';
      html += formatJSON(item, indent + 1, itemPath);
      if (i < obj.length - 1) html += '<span class="json-comma">,</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<span class="json-bracket json-closing">]</span>';
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-bracket">{}</span>';
    }
    const preview = generatePreview(obj);
    html += '<span class="json-bracket json-collapsible" onclick="toggleCollapse(event)">{</span>';
    html += '<span class="json-preview">' + preview + '</span>';
    html += '<div class="json-children">';
    keys.forEach((key, i) => {
      const keyPath = path ? path + '.' + key : key;
      html += '<div class="json-line" data-path="' + escapeHtml(keyPath) + '">' + spaces + '  ';
      html += '<span class="json-key">"' + escapeHtml(key) + '"</span>: ';
      html += formatJSON(obj[key], indent + 1, keyPath);
      if (i < keys.length - 1) html += '<span class="json-comma">,</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<span class="json-bracket json-closing">}</span>';
  } else if (typeof obj === 'string') {
    html += '<span class="json-string">"' + escapeHtml(obj) + '"</span>';
  } else if (typeof obj === 'number') {
    html += '<span class="json-number">' + obj + '</span>';
  } else if (typeof obj === 'boolean') {
    html += '<span class="json-boolean">' + obj + '</span>';
  } else if (obj === null) {
    html += '<span class="json-null">null</span>';
  }
  return html;
}

function escapeHtml(str) {
  if (typeof str !== 'string') str = String(str);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleCollapse(event) {
  event.stopPropagation();
  event.target.classList.toggle('json-collapsed');
}

function toggleAll(expand) {
  const collapsibles = document.querySelectorAll('.json-collapsible');
  collapsibles.forEach((el) => {
    if (expand) {
      el.classList.remove('json-collapsed');
    } else {
      el.classList.add('json-collapsed');
    }
  });
}

function getParentPath(path) {
  // Get the parent path (e.g., "a.b.c" -> "a.b", "[0].name" -> "[0]")
  if (!path) return '';

  // Find the last separator (. or [)
  let lastDot = path.lastIndexOf('.');
  let lastBracket = path.lastIndexOf('[');

  if (lastDot === -1 && lastBracket === -1) return '';
  if (lastDot > lastBracket) return path.substring(0, lastDot);
  return path.substring(0, lastBracket);
}

function getAncestorPaths(path) {
  // Get all ancestor paths including self
  const ancestors = [path];
  let current = path;
  while (current) {
    current = getParentPath(current);
    if (current) ancestors.push(current);
  }
  return ancestors;
}

function searchJSON(query) {
  searchQuery = query.toLowerCase();
  const lines = document.querySelectorAll('.json-line[data-path]');

  if (!searchQuery) {
    lines.forEach((line) => line.classList.remove('hidden', 'highlight'));
    return;
  }

  // First pass: find matching lines and their parent paths
  const matchingPaths = new Set();
  const parentPaths = new Set();

  lines.forEach((line) => {
    // Get only direct text content, excluding nested .json-children and .json-preview
    const clone = line.cloneNode(true);
    const children = clone.querySelector('.json-children');
    const preview = clone.querySelector('.json-preview');
    if (children) children.remove();
    if (preview) preview.remove();
    const text = clone.textContent.toLowerCase();

    const path = line.getAttribute('data-path') || '';
    const pathLower = path.toLowerCase();

    if (text.includes(searchQuery) || pathLower.includes(searchQuery)) {
      matchingPaths.add(path);
      // Add the parent path (to show siblings)
      const parent = getParentPath(path);
      if (parent) parentPaths.add(parent);
    }
  });

  // Collect all paths to show:
  // - ancestors of matches (for navigation)
  // - all children of parent paths (siblings of matches)
  const pathsToShow = new Set();
  const ancestorPaths = new Set();

  matchingPaths.forEach((path) => {
    getAncestorPaths(path).forEach((p) => ancestorPaths.add(p));
  });

  lines.forEach((line) => {
    const path = line.getAttribute('data-path') || '';
    const parent = getParentPath(path);

    // Show if: it's an ancestor, OR its parent is in parentPaths (sibling of match)
    if (ancestorPaths.has(path) || parentPaths.has(parent)) {
      pathsToShow.add(path);
    }
  });

  // Second pass: show collected paths, highlight only actual matches
  let visibleCount = 0;

  lines.forEach((line) => {
    const path = line.getAttribute('data-path') || '';
    const shouldShow = pathsToShow.has(path);
    const isDirectMatch = matchingPaths.has(path);
    const isAncestor = ancestorPaths.has(path);

    if (shouldShow) {
      line.classList.remove('hidden');
      visibleCount++;

      if (isDirectMatch) {
        line.classList.add('highlight');
      } else {
        line.classList.remove('highlight');
      }

      // Expand all visible items when searching
      const collapsible = line.querySelector(':scope > .json-collapsible');
      if (collapsible) {
        collapsible.classList.remove('json-collapsed');
      }

      // Expand all parent containers
      let parent = line.closest('.json-children');
      while (parent) {
        const parentCollapsible = parent.previousElementSibling;
        if (parentCollapsible && parentCollapsible.classList.contains('json-collapsible')) {
          parentCollapsible.classList.remove('json-collapsed');
        }
        parent = parent.parentElement.closest('.json-children');
      }
    } else {
      line.classList.add('hidden');
      line.classList.remove('highlight');
    }
  });

  const jsonContainer = document.getElementById('json-container');

  // Expand root-level collapsible when there are matches
  if (matchingPaths.size > 0) {
    const rootCollapsible = jsonContainer.querySelector(':scope > .json-collapsible');
    if (rootCollapsible) {
      rootCollapsible.classList.remove('json-collapsed');
    }
  }

  let noResults = jsonContainer.querySelector('.no-results');

  if (matchingPaths.size === 0 && searchQuery) {
    if (!noResults) {
      noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = 'No matches found';
      jsonContainer.appendChild(noResults);
    }
  } else if (noResults) {
    noResults.remove();
  }
}

function clearSearch() {
  const input = document.querySelector('.search-input');
  input.value = '';
  searchJSON('');
}

function copyJSON() {
  copyToClipboard(JSON.stringify(jsonData, null, 2), 'JSON copied to clipboard!');
}

initSearchShortcut('.search-input');

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearSearch();
  }
});

document.getElementById('json-container').innerHTML = formatJSON(jsonData);
