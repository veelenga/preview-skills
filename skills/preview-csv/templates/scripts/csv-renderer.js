/* eslint-disable no-unused-vars */
// Functions in this file are called from HTML onclick handlers

const csvData = base64DecodeUnicode('CSV_DATA_ENCODED');
const container = document.getElementById('content');

// Virtual scrolling configuration
const ROW_HEIGHT = 40; // Must match --csv-row-height in CSS
const BUFFER_ROWS = 20; // Extra rows to render above/below viewport

// Data state
let allRows = [];
let filteredRows = [];
let headers = [];
let hasHeaderRow = false;
let sortState = {};
let searchQuery = '';
let selectedCell = null;

// Virtual scroll state
let scrollContainer = null;
let tbody = null;
let visibleStartIndex = 0;
let visibleEndIndex = 0;

function parseCSV(text) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  return lines;
}

function hasHeader(rows) {
  if (rows.length < 2) return true;

  const firstRow = rows[0];
  const secondRow = rows[1];

  let headerScore = 0;

  const hasHeaderPattern = firstRow.some((cell) => {
    const trimmed = cell.trim();
    return (
      trimmed.includes('_') ||
      /^[a-z][a-zA-Z]*$/.test(trimmed) ||
      /^[A-Z][a-z]+([A-Z][a-z]+)*$/.test(trimmed)
    );
  });
  if (hasHeaderPattern) headerScore += 2;

  const firstRowHasNoNumbers = firstRow.every((cell) => {
    const trimmed = cell.trim();
    return isNaN(trimmed) || trimmed === '';
  });
  if (firstRowHasNoNumbers) headerScore += 2;

  const secondRowHasNumbers = secondRow.some((cell) => {
    const trimmed = cell.trim();
    return !isNaN(trimmed) && trimmed !== '';
  });
  if (secondRowHasNumbers) headerScore += 1;

  let differentTypes = 0;
  for (let i = 0; i < Math.min(firstRow.length, secondRow.length); i++) {
    const firstIsNumber = !isNaN(firstRow[i]) && firstRow[i].trim() !== '';
    const secondIsNumber = !isNaN(secondRow[i]) && secondRow[i].trim() !== '';

    if (firstIsNumber !== secondIsNumber) {
      differentTypes++;
    }
  }
  if (differentTypes > 0) headerScore += 1;

  return headerScore >= 3;
}

function isNumeric(value) {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const cleaned = trimmed.replace(/[$,%,]/g, '');
  return !isNaN(cleaned) && cleaned !== '';
}

function formatCell(value) {
  const escaped = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped;
}

function filterTable(query) {
  searchQuery = query.toLowerCase();

  if (!searchQuery) {
    filteredRows = [...allRows];
  } else {
    filteredRows = allRows.filter((row) => {
      const text = row.map((cell) => cell.toLowerCase()).join(' ');
      return text.includes(searchQuery);
    });
  }

  // Reset scroll position and re-render
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
  renderVisibleRows(true);
  updateStats();
}

function clearSearch() {
  const input = document.querySelector('.search-input');
  input.value = '';
  filterTable('');
}

function updateStats() {
  const statsEl = document.querySelector('.preview-header-stats');
  const totalRows = allRows.length;
  const visibleCount = filteredRows.length;
  const totalCols = headers.length;

  if (searchQuery && visibleCount !== totalRows) {
    statsEl.innerHTML = `${visibleCount} of ${totalRows} rows × ${totalCols} columns`;
  } else {
    statsEl.innerHTML = `${totalRows} rows × ${totalCols} columns`;
  }
}

function sortTable(columnIndex) {
  tbody.classList.add('sorting');

  setTimeout(() => {
    const currentSort = sortState[columnIndex] || 'none';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';
    sortState = { [columnIndex]: newSort };

    filteredRows.sort((a, b) => {
      const aValue = a[columnIndex].trim();
      const bValue = b[columnIndex].trim();

      const aNum = parseFloat(aValue.replace(/[$,%,]/g, ''));
      const bNum = parseFloat(bValue.replace(/[$,%,]/g, ''));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return newSort === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const compare = aValue.localeCompare(bValue, undefined, { numeric: true });
      return newSort === 'asc' ? compare : -compare;
    });

    // Update header sort indicators
    document.querySelectorAll('th').forEach((th, idx) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (idx === columnIndex + 1) {
        th.classList.add(`sort-${newSort}`);
      }
    });

    renderVisibleRows(true);
    tbody.classList.remove('sorting');
  }, 10);
}

function renderVisibleRows(forceRender = false) {
  if (!scrollContainer || !tbody) return;

  const scrollTop = scrollContainer.scrollTop;
  const viewportHeight = scrollContainer.clientHeight;
  const totalRows = filteredRows.length;

  // Calculate visible range
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIdx = Math.min(
    totalRows,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_ROWS
  );

  // Skip render if range hasn't changed significantly
  if (
    !forceRender &&
    Math.abs(startIdx - visibleStartIndex) < BUFFER_ROWS / 2 &&
    Math.abs(endIdx - visibleEndIndex) < BUFFER_ROWS / 2
  ) {
    return;
  }

  visibleStartIndex = startIdx;
  visibleEndIndex = endIdx;

  // Build HTML for visible rows
  let html = '';

  // Top spacer
  if (startIdx > 0) {
    const topHeight = startIdx * ROW_HEIGHT;
    html += `<tr class="virtual-spacer"><td colspan="${headers.length + 1}" style="height:${topHeight}px"></td></tr>`;
  }

  // Visible rows
  for (let i = startIdx; i < endIdx; i++) {
    const row = filteredRows[i];
    if (!row) continue;

    const originalIndex = allRows.indexOf(row);
    html += '<tr>';
    html += `<td class="row-number">${originalIndex + 1}</td>`;

    row.forEach((cell) => {
      const isNum = isNumeric(cell);
      const className = isNum ? 'numeric' : 'text';
      const title = cell.length > 50 ? formatCell(cell) : '';
      html += `<td class="${className}" title="${title}">${formatCell(cell)}</td>`;
    });

    html += '</tr>';
  }

  // Bottom spacer
  const remainingRows = totalRows - endIdx;
  if (remainingRows > 0) {
    const bottomHeight = remainingRows * ROW_HEIGHT;
    html += `<tr class="virtual-spacer"><td colspan="${headers.length + 1}" style="height:${bottomHeight}px"></td></tr>`;
  }

  tbody.innerHTML = html;
}

function handleCellClick(event) {
  const cell = event.target.closest('td');
  if (!cell || cell.classList.contains('row-number')) return;

  if (selectedCell) {
    selectedCell.classList.remove('selected');
  }

  if (cell === selectedCell) {
    cell.classList.toggle('expanded');
  } else {
    cell.classList.add('selected');
    selectedCell = cell;
  }

  if (event.detail === 2) {
    cell.classList.toggle('expanded');
  }
}

let resizingColumn = null;
let startX = 0;
let startWidth = 0;

function initColumnResize() {
  const headerCells = document.querySelectorAll('th:not(.row-number)');

  headerCells.forEach((th) => {
    th.addEventListener('mousedown', (e) => {
      const rect = th.getBoundingClientRect();
      const isRightEdge = e.clientX > rect.right - 8;

      if (isRightEdge) {
        e.preventDefault();
        resizingColumn = th;
        startX = e.clientX;
        startWidth = th.offsetWidth;
        document.body.style.cursor = 'col-resize';

        document.addEventListener('mousemove', handleColumnResize);
        document.addEventListener('mouseup', stopColumnResize);
      }
    });
  });
}

function handleColumnResize(e) {
  if (!resizingColumn) return;

  const diff = e.clientX - startX;
  const newWidth = Math.max(50, startWidth + diff);
  resizingColumn.style.width = newWidth + 'px';
  resizingColumn.style.minWidth = newWidth + 'px';
}

function stopColumnResize() {
  resizingColumn = null;
  document.body.style.cursor = '';
  document.removeEventListener('mousemove', handleColumnResize);
  document.removeEventListener('mouseup', stopColumnResize);
}

function copyCSV() {
  copyToClipboard(csvData, 'CSV copied to clipboard!');
}

function exportJSON() {
  const json = allRows.map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });

  const jsonString = JSON.stringify(json, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);

  showStatus('JSON file downloaded!');
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
      if (selectedCell) {
        selectedCell.classList.remove('selected', 'expanded');
        selectedCell = null;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedCell) {
      e.preventDefault();
      copyToClipboard(selectedCell.textContent, 'Cell content copied!');
    }
  });
}

function generateTableHeader() {
  let html = '<thead><tr>';
  html += '<th class="row-number">#</th>';

  headers.forEach((header, idx) => {
    html += `<th onclick="sortTable(${idx})" title="Click to sort, drag edge to resize">${formatCell(header)}</th>`;
  });

  html += '</tr></thead>';
  return html;
}

// Initialize
const rows = parseCSV(csvData);
hasHeaderRow = hasHeader(rows);

if (hasHeaderRow) {
  headers = rows[0];
  allRows = rows.slice(1);
} else {
  headers = rows[0].map((_, i) => `Column ${i + 1}`);
  allRows = rows;
}

filteredRows = [...allRows];

const stats = `${allRows.length} rows × ${headers.length} columns`;

const toolbarItems = [
  createSearchBox('filterTable(this.value)', 'clearSearch()'),
  createButton('Copy CSV', 'copyCSV()', '📋'),
  createButton('Export JSON', 'exportJSON()', '💾'),
];

container.innerHTML =
  createHeader('CSV Viewer', stats, toolbarItems) +
  '<div class="preview-body"><div id="csv-container"><div class="table-wrapper"><table>' +
  generateTableHeader() +
  '<tbody></tbody></table></div></div></div>' +
  createFooter();

// Initialize scroll handling
scrollContainer = document.getElementById('csv-container');
tbody = document.querySelector('tbody');

// Add scroll listener with throttling
let scrollTimeout = null;
scrollContainer.addEventListener('scroll', () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    renderVisibleRows();
    scrollTimeout = null;
  }, 16); // ~60fps
});

// Add click listener to tbody for event delegation
tbody.addEventListener('click', handleCellClick);

// Initial render
renderVisibleRows(true);

initSearchShortcut('.search-input');

setTimeout(() => {
  initColumnResize();
  initKeyboardShortcuts();
}, 100);
