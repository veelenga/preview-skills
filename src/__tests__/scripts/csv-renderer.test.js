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

global.CSV_DATA_ENCODED = btoa('name,age\nJohn,30\nJane,25');

const csvRendererPath = path.join(
  __dirname,
  '../../../skills/preview-csv/templates/scripts/csv-renderer.js'
);

describe('csv-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    global.CSV_DATA_ENCODED = btoa('name,age\nJohn,30');
  });

  describe('rendering', () => {
    it('should render CSV as table', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const table = document.querySelector('table');
      expect(table).not.toBeNull();
    });

    it('should include header', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('CSV Viewer');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include footer', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });

    it('should create table headers', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const thead = document.querySelector('thead');
      expect(thead).not.toBeNull();
      expect(thead.innerHTML).toContain('name');
      expect(thead.innerHTML).toContain('age');
    });

    it('should create table rows', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const tbody = document.querySelector('tbody');
      expect(tbody).not.toBeNull();
      expect(tbody.innerHTML).toContain('John');
      expect(tbody.innerHTML).toContain('30');
    });
  });

  describe('toolbar', () => {
    it('should include search box', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('search-input');
      expect(container.innerHTML).toContain('filterTable');
    });

    it('should include copy CSV button', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy CSV');
      expect(container.innerHTML).toContain('copyCSV()');
    });

    it('should include export JSON button', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Export JSON');
      expect(container.innerHTML).toContain('exportJSON()');
    });
  });

  describe('stats calculation', () => {
    it('should show row count', () => {
      global.CSV_DATA_ENCODED = btoa('a,b\n1,2\n3,4');
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('rows');
    });

    it('should show column count', () => {
      global.CSV_DATA_ENCODED = btoa('a,b,c\n1,2,3');
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('columns');
    });
  });

  describe('table features', () => {
    it('should add row numbers', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const rowNumbers = document.querySelectorAll('.row-number');
      expect(rowNumbers.length).toBeGreaterThan(0);
    });

    it('should support sortable columns', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const headers = document.querySelectorAll('th:not(.row-number)');
      headers.forEach((header) => {
        expect(header.getAttribute('onclick')).toContain('sortTable');
      });
    });

    it('should add click handlers to cells', () => {
      const csvRendererCode = fs.readFileSync(csvRendererPath, 'utf8');
      eval(csvRendererCode);

      const cells = document.querySelectorAll('td:not(.row-number)');
      cells.forEach((cell) => {
        expect(cell.getAttribute('onclick')).toContain('handleCellClick');
      });
    });
  });
});
