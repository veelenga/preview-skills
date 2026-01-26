const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../../skills/preview-diff/templates/scripts/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

global.Diff2Html = {
  parse: jest.fn((diff) => [
    {
      blocks: [
        {
          lines: [
            { type: 'insert', content: '+added' },
            { type: 'delete', content: '-removed' },
          ],
        },
      ],
    },
  ]),
  html: jest.fn(
    () =>
      '<div class="d2h-wrapper"><div class="d2h-file-wrapper"><div class="d2h-file-header"><span class="d2h-file-name">test.js</span></div></div></div>'
  ),
};

const diffRendererPath = path.join(
  __dirname,
  '../../../skills/preview-diff/templates/scripts/diff-renderer.js'
);

// Helper to load renderer with substituted data
function loadDiffRenderer(diffContent) {
  const encoded = btoa(diffContent);
  const code = fs.readFileSync(diffRendererPath, 'utf8');
  return code.replace(/DIFF_DATA/g, encoded);
}

const defaultDiff = 'diff --git a/file.js b/file.js\n+added line\n-removed line';

describe('diff-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="container"><div id="content"></div></div>';
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should decode and parse diff data', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        expect(Diff2Html.parse).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should render diff HTML', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        expect(Diff2Html.html).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should create header with stats', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const container = document.getElementById('container');
        expect(container.innerHTML).toContain('Git Changes Preview');
        done();
      }, 100);
    });

    it('should display file statistics', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const container = document.getElementById('container');
        expect(container.innerHTML).toContain('file');
        expect(container.innerHTML).toContain('additions');
        expect(container.innerHTML).toContain('deletions');
        done();
      }, 100);
    });
  });

  describe('controls', () => {
    it('should include expand/collapse button', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const container = document.getElementById('container');
        expect(container.innerHTML).toContain('Expand All');
        done();
      }, 100);
    });

    it('should include search box', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const container = document.getElementById('container');
        expect(container.innerHTML).toContain('Search files');
        done();
      }, 100);
    });

    it('should include view toggle buttons', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const container = document.getElementById('container');
        expect(container.innerHTML).toContain('Split View');
        expect(container.innerHTML).toContain('Unified');
        done();
      }, 100);
    });
  });

  describe('view modes', () => {
    it('should default to line-by-line view', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const callArg = Diff2Html.html.mock.calls[0][1];
        expect(callArg.outputFormat).toBe('line-by-line');
        done();
      }, 100);
    });

    it('should use stored view mode from localStorage', (done) => {
      localStorage.setItem('diff-view-mode', 'side-by-side');

      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const callArg = Diff2Html.html.mock.calls[0][1];
        expect(callArg.outputFormat).toBe('side-by-side');
        done();
      }, 100);
    });
  });

  describe('empty diff handling', () => {
    it('should show no changes message for empty diff', (done) => {
      eval(loadDiffRenderer(''));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const content = document.getElementById('content');
        expect(content.innerHTML).toContain('No changes detected');
        done();
      }, 100);
    });
  });

  describe('styling', () => {
    it('should add custom styles to document head', (done) => {
      eval(loadDiffRenderer(defaultDiff));

      window.dispatchEvent(new Event('load'));

      setTimeout(() => {
        const styles = document.head.querySelectorAll('style');
        expect(styles.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });
});
