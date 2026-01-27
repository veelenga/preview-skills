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

// Helper to load renderer with raw text (for JSONL)
function loadJsonRendererRaw(rawText) {
  const encoded = btoa(rawText);
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

  describe('JSONL parsing', () => {
    it('should parse JSONL format with multiple lines', () => {
      const jsonlData = '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}';
      eval(loadJsonRendererRaw(jsonlData));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('JSONL Viewer');
      expect(container.innerHTML).toContain('Alice');
      expect(container.innerHTML).toContain('Bob');
    });

    it('should show JSONL stats with line count', () => {
      const jsonlData = '{"a":1}\n{"b":2}\n{"c":3}';
      eval(loadJsonRendererRaw(jsonlData));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('JSONL');
      expect(container.innerHTML).toContain('3 lines');
    });

    it('should ignore empty lines in JSONL', () => {
      const jsonlData = '{"id":1}\n\n{"id":2}\n';
      eval(loadJsonRendererRaw(jsonlData));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('2 lines');
    });

    it('should still parse valid JSON as JSON (not JSONL)', () => {
      eval(loadJsonRenderer({ key: 'value' }));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('JSON Viewer');
      expect(container.innerHTML).not.toContain('JSONL');
    });

    it('should render JSONL items as array elements', () => {
      const jsonlData = '{"name":"test1"}\n{"name":"test2"}';
      eval(loadJsonRendererRaw(jsonlData));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-bracket');
      expect(jsonContainer.innerHTML).toContain('[');
    });
  });

  describe('collapsed preview', () => {
    it('should include preview span for objects', () => {
      eval(loadJsonRenderer({ name: 'Alice', age: 30 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-preview');
    });

    it('should include preview span for arrays', () => {
      eval(loadJsonRenderer([1, 2, 3]));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('json-preview');
    });

    it('should show key count for objects', () => {
      eval(loadJsonRenderer({ a: 1, b: 2, c: 3 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('3 keys');
    });

    it('should show item count for arrays', () => {
      eval(loadJsonRenderer([1, 2, 3, 4, 5]));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('5 items');
    });

    it('should show preview values for object keys', () => {
      eval(loadJsonRenderer({ name: 'test', value: 42 }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('"name"');
      expect(jsonContainer.innerHTML).toContain('test');
    });

    it('should truncate long string values in preview', () => {
      eval(loadJsonRenderer({ text: 'this is a very long string that should be truncated' }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('…');
    });

    it('should show nested objects as {…} in preview', () => {
      eval(loadJsonRenderer({ nested: { inner: 'value' } }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('{…}');
    });

    it('should show nested arrays as […] in preview', () => {
      eval(loadJsonRenderer({ items: [1, 2, 3] }));

      const jsonContainer = document.getElementById('json-container');
      expect(jsonContainer.innerHTML).toContain('[…]');
    });
  });

  describe('search functionality', () => {
    describe('getParentPath', () => {
      it('should return empty string for root-level keys', () => {
        eval(loadJsonRenderer({ key: 'value' }));

        expect(getParentPath('key')).toBe('');
      });

      it('should return parent for nested object paths', () => {
        eval(loadJsonRenderer({ a: { b: 1 } }));

        expect(getParentPath('a.b')).toBe('a');
        expect(getParentPath('a.b.c')).toBe('a.b');
      });

      it('should return parent for array paths', () => {
        eval(loadJsonRenderer([{ name: 'test' }]));

        expect(getParentPath('[0]')).toBe('');
        expect(getParentPath('[0].name')).toBe('[0]');
      });

      it('should handle mixed object and array paths', () => {
        eval(loadJsonRenderer({ items: [{ id: 1 }] }));

        expect(getParentPath('items[0]')).toBe('items');
        expect(getParentPath('items[0].id')).toBe('items[0]');
      });
    });

    describe('getAncestorPaths', () => {
      it('should return path and all ancestors', () => {
        eval(loadJsonRenderer({ a: { b: { c: 1 } } }));

        const ancestors = getAncestorPaths('a.b.c');
        expect(ancestors).toContain('a.b.c');
        expect(ancestors).toContain('a.b');
        expect(ancestors).toContain('a');
      });

      it('should return just the path for root-level keys', () => {
        eval(loadJsonRenderer({ key: 'value' }));

        const ancestors = getAncestorPaths('key');
        expect(ancestors).toEqual(['key']);
      });
    });

    describe('searchJSON', () => {
      it('should highlight matching lines', () => {
        eval(loadJsonRenderer({ name: 'alice', age: 30 }));

        searchJSON('alice');

        const lines = document.querySelectorAll('.json-line');
        const highlighted = document.querySelectorAll('.json-line.highlight');
        expect(highlighted.length).toBe(1);
        expect(highlighted[0].textContent).toContain('alice');
      });

      it('should show siblings of matching lines', () => {
        eval(loadJsonRenderer({ user: { name: 'alice', age: 30 } }));

        searchJSON('alice');

        const visibleLines = document.querySelectorAll('.json-line:not(.hidden)');
        const paths = Array.from(visibleLines).map((l) => l.getAttribute('data-path'));
        expect(paths).toContain('user');
        expect(paths).toContain('user.name');
        expect(paths).toContain('user.age');
      });

      it('should hide non-matching branches', () => {
        eval(loadJsonRenderer({ a: { x: 1 }, b: { y: 2 } }));

        searchJSON('x');

        const bLine = document.querySelector('[data-path="b"]');
        expect(bLine.classList.contains('hidden')).toBe(true);
      });

      it('should show no results message when nothing matches', () => {
        eval(loadJsonRenderer({ key: 'value' }));

        searchJSON('notfound');

        const noResults = document.querySelector('.no-results');
        expect(noResults).not.toBeNull();
        expect(noResults.textContent).toContain('No matches found');
      });

      it('should clear highlighting when search is cleared', () => {
        eval(loadJsonRenderer({ name: 'alice' }));

        searchJSON('alice');
        expect(document.querySelectorAll('.highlight').length).toBe(1);

        searchJSON('');
        expect(document.querySelectorAll('.highlight').length).toBe(0);
        expect(document.querySelectorAll('.hidden').length).toBe(0);
      });

      it('should match on path names', () => {
        eval(loadJsonRenderer({ userName: 'test' }));

        searchJSON('username');

        const highlighted = document.querySelectorAll('.json-line.highlight');
        expect(highlighted.length).toBe(1);
      });

      it('should be case insensitive', () => {
        eval(loadJsonRenderer({ Name: 'Alice' }));

        searchJSON('alice');

        const highlighted = document.querySelectorAll('.json-line.highlight');
        expect(highlighted.length).toBe(1);
      });
    });
  });
});
