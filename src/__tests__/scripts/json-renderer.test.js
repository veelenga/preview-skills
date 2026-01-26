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

const jsonRendererPath = path.join(
  __dirname,
  '../../../skills/preview-json/templates/scripts/json-renderer.js'
);

// Helper to load renderer with substituted data
function loadJsonRenderer(jsonData) {
  const encoded = btoa(JSON.stringify(jsonData));
  const code = fs.readFileSync(jsonRendererPath, 'utf8');
  return code.replace(/JSON_DATA_ENCODED/g, encoded);
}

const defaultJson = { test: 'data' };

describe('json-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
  });

  describe('rendering', () => {
    it('should render JSON content in container', () => {
      eval(loadJsonRenderer({ name: 'test', value: 42 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer).not.toBeNull();
      expect(jsonContainer.innerHTML).toContain('name');
      expect(jsonContainer.innerHTML).toContain('test');
    });

    it('should include header', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('JSON Viewer');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include footer', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });

    it('should wrap content in preview-body', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-body');
    });
  });

  describe('toolbar', () => {
    it('should include search box', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('search-input');
      expect(container.innerHTML).toContain('searchJSON');
    });

    it('should include collapse all button', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Collapse All');
      expect(container.innerHTML).toContain('toggleAll(false)');
    });

    it('should include expand all button', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Expand All');
      expect(container.innerHTML).toContain('toggleAll(true)');
    });

    it('should include copy button', () => {
      eval(loadJsonRenderer(defaultJson));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy JSON');
      expect(container.innerHTML).toContain('copyJSON()');
    });
  });

  describe('stats calculation', () => {
    it('should show depth stat for objects', () => {
      eval(loadJsonRenderer({ a: { b: { c: 1 } } }));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Depth');
    });

    it('should identify arrays', () => {
      eval(loadJsonRenderer([1, 2, 3]));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Array');
    });

    it('should identify objects', () => {
      eval(loadJsonRenderer({ key: 'value' }));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Object');
    });
  });

  describe('JSON formatting', () => {
    it('should format string values', () => {
      eval(loadJsonRenderer({ text: 'hello' }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-string');
      expect(jsonContainer.innerHTML).toContain('hello');
    });

    it('should format number values', () => {
      eval(loadJsonRenderer({ num: 42 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-number');
      expect(jsonContainer.innerHTML).toContain('42');
    });

    it('should format boolean values', () => {
      eval(loadJsonRenderer({ flag: true }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-boolean');
      expect(jsonContainer.innerHTML).toContain('true');
    });

    it('should format null values', () => {
      eval(loadJsonRenderer({ empty: null }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-null');
      expect(jsonContainer.innerHTML).toContain('null');
    });

    it('should add collapsible class to objects', () => {
      eval(loadJsonRenderer({ a: 1 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-collapsible');
    });

    it('should include data-path attributes', () => {
      eval(loadJsonRenderer({ key: 'value' }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('data-path');
    });
  });
});
