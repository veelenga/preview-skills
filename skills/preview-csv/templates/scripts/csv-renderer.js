/* eslint-disable no-unused-vars */
// Functions in this file are called from HTML onclick handlers

const csvData = base64DecodeUnicode('CSV_DATA_ENCODED');
const container = document.getElementById('content');

let sortState = {};
let selectedCell = null;
let searchQuery = '';

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
  const tbody = document.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach((row) => {
    const cells = Array.from(row.cells).slice(1);
    const text = cells.map((cell) => cell.textContent.toLowerCase()).join(' ');

    if (text.includes(searchQuery)) {
      row.classList.remove('filtered-out');
      visibleCount++;
    } else {
      row.classList.add('filtered-out');
    }
  });

  updateStats(visibleCount);
}

function clearSearch() {
  const input = document.querySelector('.search-input');
  input.value = '';
  filterTable('');
}

function updateStats(visibleCount) {
  const statsEl = document.querySelector('.preview-header-stats');
  const totalRows = document.querySelectorAll('tbody tr').length;
  const totalCols = document.querySelectorAll('thead th').length - 1;

  if (searchQuery && visibleCount !== totalRows) {
    statsEl.innerHTML = `${visibleCount} of ${totalRows} rows × ${totalCols} columns`;
  } else {
    statsEl.innerHTML = `${totalRows} rows × ${totalCols} columns`;
  }
}

function sortTable(columnIndex) {
  const tbody = document.querySelector('tbody');

  tbody.classList.add('sorting');

  setTimeout(() => {
    const allRows = Array.from(tbody.querySelectorAll('tr'));

    const currentSort = sortState[columnIndex] || 'none';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';
    sortState = { [columnIndex]: newSort };

    allRows.sort((a, b) => {
      const aValue = a.cells[columnIndex + 1].textContent.trim();
      const bValue = b.cells[columnIndex + 1].textContent.trim();

      const aNum = parseFloat(aValue.replace(/[$,%,]/g, ''));
      const bNum = parseFloat(bValue.replace(/[$,%,]/g, ''));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return newSort === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const compare = aValue.localeCompare(bValue, undefined, { numeric: true });
      return newSort === 'asc' ? compare : -compare;
    });

    allRows.forEach((row) => tbody.appendChild(row));

    document.querySelectorAll('th').forEach((th, idx) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (idx === columnIndex + 1) {
        th.classList.add(`sort-${newSort}`);
      }
    });

    tbody.classList.remove('sorting');
  }, 10);
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
  const headers = document.querySelectorAll('th:not(.row-number)');

  headers.forEach((th) => {
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
  const rows = parseCSV(csvData);
  const hasHeaderRow = hasHeader(rows);
  const headers = hasHeaderRow ? rows[0] : rows[0].map((_, i) => `Column ${i + 1}`);
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;

  const json = dataRows.map((row) => {
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

const rows = parseCSV(csvData);
const hasHeaderRow = hasHeader(rows);
const stats = `${rows.length} rows × ${rows[0]?.length || 0} columns`;

const toolbarItems = [
  createSearchBox('filterTable(this.value)', 'clearSearch()'),
  createButton('Copy CSV', 'copyCSV()', '📋'),
  createButton('Export JSON', 'exportJSON()', '💾'),
];

container.innerHTML =
  createHeader('CSV Viewer', stats, toolbarItems) +
  '<div class="preview-body"><div id="csv-container"><div class="table-wrapper"><table>' +
  generateTable(rows, hasHeaderRow) +
  '</table></div></div></div>' +
  createFooter();

function generateTable(rows, hasHeaderRow) {
  let html = '<thead><tr>';
  html += '<th class="row-number">#</th>';

  if (hasHeaderRow && rows.length > 0) {
    rows[0].forEach((cell, idx) => {
      html += `<th onclick="sortTable(${idx})" title="Click to sort, drag edge to resize">${formatCell(cell)}</th>`;
    });
  } else if (rows.length > 0) {
    rows[0].forEach((_, idx) => {
      html += `<th onclick="sortTable(${idx})" title="Click to sort, drag edge to resize">Column ${idx + 1}</th>`;
    });
  }
  html += '</tr></thead>';

  html += '<tbody>';
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;
  dataRows.forEach((row, rowIdx) => {
    html += '<tr>';
    html += `<td class="row-number">${rowIdx + 1}</td>`;
    row.forEach((cell) => {
      const isNum = isNumeric(cell);
      const className = isNum ? 'numeric' : 'text';
      const title = cell.length > 50 ? formatCell(cell) : '';
      html += `<td class="${className}" title="${title}" onclick="handleCellClick(event)">${formatCell(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';

  return html;
}

initSearchShortcut('.search-input');

setTimeout(() => {
  initColumnResize();
  initKeyboardShortcuts();
}, 100);
