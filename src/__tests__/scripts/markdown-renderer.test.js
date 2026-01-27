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
  Renderer: jest.fn().mockImplementation(() => ({
    heading: jest.fn(),
  })),
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
        renderer: expect.any(Object),
      });
    });

    it('should create custom renderer for header IDs', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(marked.Renderer).toHaveBeenCalled();
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

    it('should allow details and summary tags for expandable sections', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_TAGS).toContain('details');
      expect(callArg.ALLOWED_TAGS).toContain('summary');
    });

    it('should allow safe attributes', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_ATTR).toContain('href');
      expect(callArg.ALLOWED_ATTR).toContain('src');
      expect(callArg.ALLOWED_ATTR).toContain('alt');
      expect(callArg.ALLOWED_ATTR).toContain('class');
    });

    it('should allow open attribute for expandable sections', () => {
      eval(loadMarkdownRenderer(defaultMarkdown));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_ATTR).toContain('open');
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

  describe('Header anchors', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="content"></div>';
      jest.clearAllMocks();
    });

    it('should add anchor links to headers with IDs', () => {
      global.marked.parse.mockReturnValue('<h1 id="test-heading">Test Heading</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1 id="test-heading">Test Heading</h1>');

      eval(loadMarkdownRenderer('# Test Heading'));

      const header = document.querySelector('#markdown-content h1');
      const anchor = header.querySelector('.header-anchor');
      expect(anchor).not.toBeNull();
    });

    it('should set correct href on anchor links', () => {
      global.marked.parse.mockReturnValue('<h2 id="my-section">My Section</h2>');
      global.DOMPurify.sanitize.mockReturnValue('<h2 id="my-section">My Section</h2>');

      eval(loadMarkdownRenderer('## My Section'));

      const anchor = document.querySelector('.header-anchor');
      expect(anchor.getAttribute('href')).toBe('#my-section');
    });

    it('should set aria-label on anchor links for accessibility', () => {
      global.marked.parse.mockReturnValue('<h1 id="intro">Introduction</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1 id="intro">Introduction</h1>');

      eval(loadMarkdownRenderer('# Introduction'));

      const anchor = document.querySelector('.header-anchor');
      expect(anchor.getAttribute('aria-label')).toContain('Introduction');
    });

    it('should use # symbol as anchor text', () => {
      global.marked.parse.mockReturnValue('<h1 id="test">Test</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1 id="test">Test</h1>');

      eval(loadMarkdownRenderer('# Test'));

      const anchor = document.querySelector('.header-anchor');
      expect(anchor.innerHTML).toBe('#');
    });

    it('should not add anchors to headers without IDs', () => {
      global.marked.parse.mockReturnValue('<h1>No ID Header</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1>No ID Header</h1>');

      eval(loadMarkdownRenderer('# No ID Header'));

      const anchor = document.querySelector('.header-anchor');
      expect(anchor).toBeNull();
    });

    it('should add anchors to all header levels (h1-h6)', () => {
      const html =
        '<h1 id="h1">H1</h1>' +
        '<h2 id="h2">H2</h2>' +
        '<h3 id="h3">H3</h3>' +
        '<h4 id="h4">H4</h4>' +
        '<h5 id="h5">H5</h5>' +
        '<h6 id="h6">H6</h6>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'));

      const anchors = document.querySelectorAll('.header-anchor');
      expect(anchors.length).toBe(6);
    });

    it('should insert anchor as first child of header', () => {
      global.marked.parse.mockReturnValue('<h1 id="test">Test Content</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1 id="test">Test Content</h1>');

      eval(loadMarkdownRenderer('# Test Content'));

      const header = document.querySelector('#markdown-content h1');
      expect(header.firstChild.classList.contains('header-anchor')).toBe(true);
    });

    it('should handle multiple headers with unique anchors', () => {
      const html =
        '<h2 id="section-1">Section 1</h2>' +
        '<h2 id="section-2">Section 2</h2>' +
        '<h2 id="section-3">Section 3</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('## Section 1\n## Section 2\n## Section 3'));

      const anchors = document.querySelectorAll('.header-anchor');
      expect(anchors.length).toBe(3);
      expect(anchors[0].getAttribute('href')).toBe('#section-1');
      expect(anchors[1].getAttribute('href')).toBe('#section-2');
      expect(anchors[2].getAttribute('href')).toBe('#section-3');
    });

    it('should preserve original header text', () => {
      global.marked.parse.mockReturnValue('<h1 id="hello">Hello World</h1>');
      global.DOMPurify.sanitize.mockReturnValue('<h1 id="hello">Hello World</h1>');

      eval(loadMarkdownRenderer('# Hello World'));

      const header = document.querySelector('#markdown-content h1');
      expect(header.textContent).toContain('Hello World');
    });
  });

  describe('Anchor scrolling', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="content"></div>';
      jest.clearAllMocks();
      Element.prototype.scrollTo = jest.fn();
    });

    it('should setup click handler for anchor links', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('should setup cleanup handler on window unload', () => {
      const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');

      eval(loadMarkdownRenderer(defaultMarkdown));

      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('unload', expect.any(Function));
      windowAddEventListenerSpy.mockRestore();
    });

    it('should remove click listener on cleanup', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      eval(loadMarkdownRenderer(defaultMarkdown));
      window.dispatchEvent(new Event('unload'));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should scroll to target element when anchor link is clicked', () => {
      global.marked.parse.mockReturnValue('<h2 id="section">Section</h2><p>Content</p>');
      global.DOMPurify.sanitize.mockReturnValue('<h2 id="section">Section</h2><p>Content</p>');

      eval(loadMarkdownRenderer('## Section\n\nContent'));

      const anchor = document.querySelector('.header-anchor');
      const previewBody = document.querySelector('.preview-body');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      anchor.dispatchEvent(clickEvent);

      expect(previewBody.scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });

    it('should update URL hash when anchor link is clicked', () => {
      global.marked.parse.mockReturnValue('<h2 id="test-section">Test</h2>');
      global.DOMPurify.sanitize.mockReturnValue('<h2 id="test-section">Test</h2>');

      const pushStateSpy = jest.spyOn(history, 'pushState');

      eval(loadMarkdownRenderer('## Test'));

      const anchor = document.querySelector('.header-anchor');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      anchor.dispatchEvent(clickEvent);

      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#test-section');
      pushStateSpy.mockRestore();
    });

    it('should handle TOC links clicking', () => {
      const html =
        '<ul><li><a href="#features">Features</a></li></ul>' + '<h2 id="features">Features</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer(''));

      const tocLink = document.querySelector('a[href="#features"]');
      const previewBody = document.querySelector('.preview-body');

      const clickEvent = new MouseEvent('click', { bubbles: true });
      tocLink.dispatchEvent(clickEvent);

      expect(previewBody.scrollTo).toHaveBeenCalled();
    });

    it('should not scroll for non-anchor links', () => {
      const html = '<a href="https://example.com">External</a><h2 id="test">Test</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer(''));

      const externalLink = document.querySelector('a[href="https://example.com"]');
      const previewBody = document.querySelector('.preview-body');

      const clickEvent = new MouseEvent('click', { bubbles: true });
      externalLink.dispatchEvent(clickEvent);

      expect(previewBody.scrollTo).not.toHaveBeenCalled();
    });

    it('should handle initial hash on page load', () => {
      Object.defineProperty(window, 'location', {
        value: { hash: '#section' },
        writable: true,
      });

      global.marked.parse.mockReturnValue('<h2 id="section">Section</h2>');
      global.DOMPurify.sanitize.mockReturnValue('<h2 id="section">Section</h2>');

      jest.useFakeTimers();
      eval(loadMarkdownRenderer('## Section'));
      jest.advanceTimersByTime(150);

      const previewBody = document.querySelector('.preview-body');
      expect(previewBody.scrollTo).toHaveBeenCalled();

      jest.useRealTimers();
      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true,
      });
    });
  });

  describe('Expandable sections', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="content"></div>';
      jest.clearAllMocks();
    });

    it('should render details element', () => {
      const html = '<details><summary>Click me</summary><p>Hidden content</p></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('<details><summary>Click me</summary>Hidden content</details>'));

      const details = document.querySelector('#markdown-content details');
      expect(details).not.toBeNull();
    });

    it('should render summary element', () => {
      const html = '<details><summary>Toggle</summary><p>Content</p></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('<details><summary>Toggle</summary>Content</details>'));

      const summary = document.querySelector('#markdown-content summary');
      expect(summary).not.toBeNull();
      expect(summary.textContent).toBe('Toggle');
    });

    it('should render details with open attribute', () => {
      const html = '<details open><summary>Expanded</summary><p>Visible</p></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('<details open><summary>Expanded</summary>Visible</details>'));

      const details = document.querySelector('#markdown-content details');
      expect(details.hasAttribute('open')).toBe(true);
    });

    it('should render nested content inside details', () => {
      const html =
        '<details><summary>More info</summary><p>Paragraph 1</p><p>Paragraph 2</p></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer('<details><summary>More info</summary>Content</details>'));

      const details = document.querySelector('#markdown-content details');
      const paragraphs = details.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
    });

    it('should render multiple expandable sections', () => {
      const html =
        '<details><summary>Section 1</summary><p>Content 1</p></details>' +
        '<details><summary>Section 2</summary><p>Content 2</p></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer(''));

      const detailsElements = document.querySelectorAll('#markdown-content details');
      expect(detailsElements.length).toBe(2);
    });

    it('should allow details with code blocks inside', () => {
      const html =
        '<details><summary>Code example</summary><pre><code>const x = 1;</code></pre></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer(''));

      const code = document.querySelector('#markdown-content details code');
      expect(code).not.toBeNull();
      expect(code.textContent).toBe('const x = 1;');
    });

    it('should allow details with lists inside', () => {
      const html =
        '<details><summary>List</summary><ul><li>Item 1</li><li>Item 2</li></ul></details>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadMarkdownRenderer(''));

      const list = document.querySelector('#markdown-content details ul');
      expect(list).not.toBeNull();
      const items = list.querySelectorAll('li');
      expect(items.length).toBe(2);
    });
  });
});
