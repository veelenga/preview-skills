const fs = require('fs');
const path = require('path');

const utilsPath = path.join(
  __dirname,
  '../../../skills/preview-markdown/templates/scripts/utils.js'
);
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-markdown/templates/scripts/common-ui.js'
);
const commonUiCode = fs.readFileSync(commonUiPath, 'utf8');
eval(commonUiCode);

global.marked = {
  setOptions: jest.fn(),
  parse: jest.fn((text) => `<p>${text}</p>`),
};

global.DOMPurify = {
  sanitize: jest.fn((html) => html),
};

global.mermaid = {
  initialize: jest.fn(),
  run: jest.fn(),
};

const markdownRendererPath = path.join(
  __dirname,
  '../../../skills/preview-markdown/templates/scripts/markdown-renderer.js'
);

// Helper to load renderer with substituted data
function loadMarkdownRenderer(markdownContent) {
  const encoded = btoa(markdownContent);
  const code = fs.readFileSync(markdownRendererPath, 'utf8');
  return code.replace(/MARKDOWN_CONTENT/g, encoded);
}

const defaultMarkdown = '# Hello World\n\nThis is a test.';

describe('markdown-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should configure marked with correct options', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(marked.setOptions).toHaveBeenCalledWith({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
      });
    });

    it('should decode markdown content', () => {
      eval(loadMarkdownRenderer('Test markdown'));

      expect(marked.parse).toHaveBeenCalledWith('Test markdown');
    });

    it('should sanitize HTML with DOMPurify', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(DOMPurify.sanitize).toHaveBeenCalled();
      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg).toHaveProperty('ALLOWED_TAGS');
      expect(callArg).toHaveProperty('ALLOWED_ATTR');
    });

    it('should allow safe HTML tags', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_TAGS).toContain('h1');
      expect(callArg.ALLOWED_TAGS).toContain('p');
      expect(callArg.ALLOWED_TAGS).toContain('a');
      expect(callArg.ALLOWED_TAGS).toContain('code');
      expect(callArg.ALLOWED_TAGS).toContain('table');
    });

    it('should allow safe attributes', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_ATTR).toContain('href');
      expect(callArg.ALLOWED_ATTR).toContain('src');
      expect(callArg.ALLOWED_ATTR).toContain('alt');
      expect(callArg.ALLOWED_ATTR).toContain('class');
    });

    it('should disallow data attributes', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOW_DATA_ATTR).toBe(false);
    });

    it('should disallow unknown protocols', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
    });
  });

  describe('stats calculation', () => {
    it('should calculate lines correctly', () => {
      eval(loadMarkdownRenderer('Line 1\nLine 2\nLine 3'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 lines');
    });

    it('should calculate words correctly', () => {
      eval(loadMarkdownRenderer('Hello world test'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 words');
    });

    it('should calculate characters correctly', () => {
      eval(loadMarkdownRenderer('Test'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('4 chars');
    });

    it('should handle empty content', () => {
      eval(loadMarkdownRenderer(''));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('1 lines');
      expect(container.innerHTML).toContain('0 words');
      expect(container.innerHTML).toContain('0 chars');
    });

    it('should handle multiple spaces', () => {
      eval(loadMarkdownRenderer('word1    word2     word3'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 words');
    });
  });

  describe('toolbar', () => {
    it('should include copy markdown button', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy Markdown');
      expect(container.innerHTML).toContain('copyMarkdown()');
    });

    it('should include copy HTML button', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy HTML');
      expect(container.innerHTML).toContain('copyHTML()');
    });

    it('should include icons in buttons', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('📋');
      expect(container.innerHTML).toContain('📄');
    });
  });

  describe('copyMarkdown', () => {
    it('should copy markdown content to clipboard', async () => {
      eval(loadMarkdownRenderer('# Test\n\nContent'));

      await copyMarkdown();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Test\n\nContent');
    });

    it('should show success message', async () => {
      jest.useFakeTimers();
      eval(loadMarkdownRenderer('Test'));

      await copyMarkdown();
      expect(document.querySelector('.status-message').textContent).toBe(
        'Markdown copied to clipboard!'
      );
      jest.useRealTimers();
    });
  });

  describe('copyHTML', () => {
    it('should copy rendered HTML to clipboard', async () => {
      global.marked.parse.mockReturnValue('<p>Test</p>');
      global.DOMPurify.sanitize.mockReturnValue('<p>Test</p>');

      eval(loadMarkdownRenderer('Test'));

      await copyHTML();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<p>Test</p>');
    });

    it('should show success message', async () => {
      jest.useFakeTimers();
      eval(loadMarkdownRenderer('Test'));

      await copyHTML();
      expect(document.querySelector('.status-message').textContent).toBe(
        'HTML copied to clipboard!'
      );
      jest.useRealTimers();
    });
  });

  describe('rendering', () => {
    it('should render markdown content in container', () => {
      global.marked.parse.mockReturnValue('<p>Test content</p>');
      global.DOMPurify.sanitize.mockReturnValue('<p>Test content</p>');

      eval(loadMarkdownRenderer('Test content'));

      const markdownContent = document.getElementById('markdown-content');
      expect(markdownContent).not.toBeNull();
      expect(markdownContent.innerHTML).toBe('<p>Test content</p>');
    });

    it('should include header', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Markdown Preview');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include footer', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });

    it('should wrap content in preview-body', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-body');
    });
  });

  describe('Mermaid integration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize Mermaid with correct options', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      });
    });

    it('should call renderMermaidDiagrams after rendering', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(mermaid.run).toHaveBeenCalled();
    });

    it('should detect and replace mermaid code blocks', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('markdown-content');
      expect(container.querySelector('.mermaid-container')).not.toBeNull();
      expect(container.querySelector('.mermaid')).not.toBeNull();
    });

    it('should set diagram content correctly', () => {
      document.body.innerHTML = '<div id="content"></div>';

      const diagramCode = 'graph TD\nA-->B\nB-->C';
      global.marked.parse.mockReturnValue(
        `<pre><code class="language-mermaid">${diagramCode}</code></pre>`
      );
      global.DOMPurify.sanitize.mockReturnValue(
        `<pre><code class="language-mermaid">${diagramCode}</code></pre>`
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      const diagramDiv = document.querySelector('.mermaid');
      expect(diagramDiv.textContent).toBe(diagramCode);
    });

    it('should assign unique IDs to multiple diagrams', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>' +
          '<pre><code class="language-mermaid">graph LR\nX-->Y</code></pre>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>' +
          '<pre><code class="language-mermaid">graph LR\nX-->Y</code></pre>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      const diagrams = document.querySelectorAll('.mermaid');
      expect(diagrams.length).toBe(2);
      expect(diagrams[0].id).toBe('mermaid-diagram-0');
      expect(diagrams[1].id).toBe('mermaid-diagram-1');
    });

    it('should call mermaid.run with correct selector', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(mermaid.run).toHaveBeenCalledWith({
        querySelector: '.mermaid',
      });
    });

    it('should not call mermaid.run if no diagrams found', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue('<p>No diagrams here</p>');
      global.DOMPurify.sanitize.mockReturnValue('<p>No diagrams here</p>');

      eval(loadMarkdownRenderer(defaultMarkdown));

      // mermaid.run should not be called when there are no diagrams
      expect(mermaid.run).not.toHaveBeenCalled();
    });

    it('should style diagram containers correctly', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.querySelector('.mermaid-container');
      expect(container.style.textAlign).toBe('center');
      expect(container.style.margin).toBe('20px 0px');
    });

    it('should handle mixed content with diagrams and regular code', () => {
      document.body.innerHTML = '<div id="content"></div>';

      global.marked.parse.mockReturnValue(
        '<pre><code class="language-javascript">console.log("test")</code></pre>' +
          '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>' +
          '<p>Some text</p>'
      );
      global.DOMPurify.sanitize.mockReturnValue(
        '<pre><code class="language-javascript">console.log("test")</code></pre>' +
          '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>' +
          '<p>Some text</p>'
      );

      eval(loadMarkdownRenderer(defaultMarkdown));

      const container = document.getElementById('markdown-content');
      expect(container.querySelector('.language-javascript')).not.toBeNull();
      expect(container.querySelector('.mermaid')).not.toBeNull();
      expect(container.textContent).toContain('Some text');
    });
  });
});
