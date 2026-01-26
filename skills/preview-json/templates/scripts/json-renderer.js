/* eslint-disable no-unused-vars */
// Functions in this file are called from HTML onclick handlers

const jsonData = JSON.parse(base64DecodeUnicode('JSON_DATA_ENCODED'));
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
const rootType = Array.isArray(jsonData) ? 'Array' : 'Object';
const stats = `${rootType} • Depth ${analysis.maxDepth}`;

const toolbarItems = [
  createSearchBox('searchJSON(this.value)', 'clearSearch()'),
  createButton('Collapse All', 'toggleAll(false)'),
  createButton('Expand All', 'toggleAll(true)'),
  createButton('Copy JSON', 'copyJSON()', '📋'),
];

container.innerHTML =
  createHeader('JSON Viewer', stats, toolbarItems) +
  '<div class="preview-body"><div id="json-container"></div></div>' +
  createFooter();

function formatJSON(obj, indent, path) {
  indent = indent || 0;
  path = path || '';
  const spaces = '  '.repeat(indent);
  let html = '';

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '<span class="json-bracket">[]</span>';
    }
    html +=
      '<span class="json-bracket json-collapsible" onclick="toggleCollapse(event)">[</span>\n';
    html += '<div class="json-children">';
    obj.forEach((item, i) => {
      const itemPath = path + '[' + i + ']';
      html += '<div class="json-line" data-path="' + escapeHtml(itemPath) + '">' + spaces + '  ';
      html += formatJSON(item, indent + 1, itemPath);
      if (i < obj.length - 1) html += '<span class="json-comma">,</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="json-line">' + spaces + '<span class="json-bracket">]</span></div>';
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-bracket">{}</span>';
    }
    html +=
      '<span class="json-bracket json-collapsible" onclick="toggleCollapse(event)">{</span>\n';
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
    html += '<div class="json-line">' + spaces + '<span class="json-bracket">}</span></div>';
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

function searchJSON(query) {
  searchQuery = query.toLowerCase();
  const lines = document.querySelectorAll('.json-line[data-path]');
  let visibleCount = 0;

  if (!searchQuery) {
    lines.forEach((line) => line.classList.remove('hidden', 'highlight'));
    return;
  }

  lines.forEach((line) => {
    const text = line.textContent.toLowerCase();
    const path = (line.getAttribute('data-path') || '').toLowerCase();

    if (text.includes(searchQuery) || path.includes(searchQuery)) {
      line.classList.remove('hidden');
      line.classList.add('highlight');
      visibleCount++;

      let parent = line.closest('.json-children');
      while (parent) {
        const collapsible = parent.previousElementSibling;
        if (collapsible && collapsible.classList.contains('json-collapsible')) {
          collapsible.classList.remove('json-collapsed');
        }
        parent = parent.parentElement.closest('.json-children');
      }
    } else {
      line.classList.add('hidden');
      line.classList.remove('highlight');
    }
  });

  const jsonContainer = document.getElementById('json-container');
  let noResults = jsonContainer.querySelector('.no-results');

  if (visibleCount === 0 && searchQuery) {
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
