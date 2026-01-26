const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../../skills/preview-csv/templates/scripts/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-csv/templates/scripts/common-ui.js'
);
const commonUiCode = fs.readFileSync(commonUiPath, 'utf8');
eval(commonUiCode);

const csvRendererPath = path.join(
  __dirname,
  '../../../skills/preview-csv/templates/scripts/csv-renderer.js'
);

// Helper to load renderer with substituted data
function loadCsvRenderer(csvContent) {
  const encoded = btoa(csvContent);
  const code = fs.readFileSync(csvRendererPath, 'utf8');
  return code.replace(/CSV_DATA_ENCODED/g, encoded);
}

const defaultCsv = 'name,age\nJohn,30';

describe('csv-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
  });

  describe('rendering', () => {
    it('should render CSV as table', () => {
      eval(loadCsvRenderer(defaultCsv));

      const table = document.querySelector('table');
      expect(table).not.toBeNull();
    });

    it('should include header', () => {
      eval(loadCsvRenderer(defaultCsv));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('CSV Viewer');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include footer', () => {
      eval(loadCsvRenderer(defaultCsv));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });

    it('should create table headers', () => {
      eval(loadCsvRenderer(defaultCsv));

      const thead = document.querySelector('thead');
      expect(thead).not.toBeNull();
      expect(thead.innerHTML).toContain('name');
      expect(thead.innerHTML).toContain('age');
    });

    it('should create table rows', () => {
      eval(loadCsvRenderer(defaultCsv));

      const tbody = document.querySelector('tbody');
      expect(tbody).not.toBeNull();
      expect(tbody.innerHTML).toContain('John');
      expect(tbody.innerHTML).toContain('30');
    });
  });

  describe('toolbar', () => {
    it('should include search box', () => {
      eval(loadCsvRenderer(defaultCsv));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('search-input');
      expect(container.innerHTML).toContain('filterTable');
    });

    it('should include copy CSV button', () => {
      eval(loadCsvRenderer(defaultCsv));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy CSV');
      expect(container.innerHTML).toContain('copyCSV()');
    });

    it('should include export JSON button', () => {
      eval(loadCsvRenderer(defaultCsv));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Export JSON');
      expect(container.innerHTML).toContain('exportJSON()');
    });
  });

  describe('stats calculation', () => {
    it('should show row count', () => {
      eval(loadCsvRenderer('a,b\n1,2\n3,4'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('rows');
    });

    it('should show column count', () => {
      eval(loadCsvRenderer('a,b,c\n1,2,3'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('columns');
    });
  });

  describe('table features', () => {
    it('should add row numbers', () => {
      eval(loadCsvRenderer(defaultCsv));

      const rowNumbers = document.querySelectorAll('.row-number');
      expect(rowNumbers.length).toBeGreaterThan(0);
    });

    it('should support sortable columns', () => {
      eval(loadCsvRenderer(defaultCsv));

      const headers = document.querySelectorAll('th:not(.row-number)');
      headers.forEach((header) => {
        expect(header.getAttribute('onclick')).toContain('sortTable');
      });
    });

    it('should add click handlers to cells', () => {
      eval(loadCsvRenderer(defaultCsv));

      const cells = document.querySelectorAll('td:not(.row-number)');
      cells.forEach((cell) => {
        expect(cell.getAttribute('onclick')).toContain('handleCellClick');
      });
    });
  });
});
