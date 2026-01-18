const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../../skills/preview-json/templates/scripts/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-json/templates/scripts/common-ui.js'
);
const commonUiCode = fs.readFileSync(commonUiPath, 'utf8');
eval(commonUiCode);

global.JSON_DATA_ENCODED = btoa(JSON.stringify({ test: 'data', nested: { value: 123 } }));

const jsonRendererPath = path.join(
  __dirname,
  '../../../skills/preview-json/templates/scripts/json-renderer.js'
);

describe('json-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    global.JSON_DATA_ENCODED = btoa(JSON.stringify({ test: 'data' }));
  });

  describe('rendering', () => {
    it('should render JSON content in container', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ name: 'test', value: 42 }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer).not.toBeNull();
      expect(jsonContainer.innerHTML).toContain('name');
      expect(jsonContainer.innerHTML).toContain('test');
    });

    it('should include header', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('JSON Viewer');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include footer', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });

    it('should wrap content in preview-body', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-body');
    });
  });

  describe('toolbar', () => {
    it('should include search box', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('search-input');
      expect(container.innerHTML).toContain('searchJSON');
    });

    it('should include collapse all button', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Collapse All');
      expect(container.innerHTML).toContain('toggleAll(false)');
    });

    it('should include expand all button', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Expand All');
      expect(container.innerHTML).toContain('toggleAll(true)');
    });

    it('should include copy button', () => {
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy JSON');
      expect(container.innerHTML).toContain('copyJSON()');
    });
  });

  describe('stats calculation', () => {
    it('should show depth stat for objects', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ a: { b: { c: 1 } } }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Depth');
    });

    it('should identify arrays', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify([1, 2, 3]));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Array');
    });

    it('should identify objects', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ key: 'value' }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Object');
    });
  });

  describe('JSON formatting', () => {
    it('should format string values', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ text: 'hello' }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-string');
      expect(jsonContainer.innerHTML).toContain('hello');
    });

    it('should format number values', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ num: 42 }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-number');
      expect(jsonContainer.innerHTML).toContain('42');
    });

    it('should format boolean values', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ flag: true }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-boolean');
      expect(jsonContainer.innerHTML).toContain('true');
    });

    it('should format null values', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ empty: null }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-null');
      expect(jsonContainer.innerHTML).toContain('null');
    });

    it('should add collapsible class to objects', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ a: 1 }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-collapsible');
    });

    it('should include data-path attributes', () => {
      global.JSON_DATA_ENCODED = btoa(JSON.stringify({ key: 'value' }));
      const jsonRendererCode = fs.readFileSync(jsonRendererPath, 'utf8');
      eval(jsonRendererCode);

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('data-path');
    });
  });
});
