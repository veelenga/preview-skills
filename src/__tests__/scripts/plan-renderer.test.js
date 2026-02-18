const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../../skills/preview-plan/templates/scripts/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-plan/templates/scripts/common-ui.js'
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

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => cb());

const planRendererPath = path.join(
  __dirname,
  '../../../skills/preview-plan/templates/scripts/plan-renderer.js'
);

function loadPlanRenderer(planContent) {
  const encoded = btoa(planContent);
  const code = fs.readFileSync(planRendererPath, 'utf8');
  return code.replace(/PLAN_CONTENT/g, encoded);
}

const defaultPlan =
  '# Auth Redesign\n\n## Phase 1\n\n- [x] Task 1\n- [ ] Task 2\n\n## Phase 2\n\nSome content here.';

describe('plan-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    jest.clearAllMocks();
    Element.prototype.scrollTo = jest.fn();
  });

  describe('initialization', () => {
    it('should configure marked with correct options', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(marked.setOptions).toHaveBeenCalledWith({
        breaks: true,
        gfm: true,
        renderer: expect.any(Object),
      });
    });

    it('should create custom renderer for header IDs', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(marked.Renderer).toHaveBeenCalled();
    });

    it('should decode plan content', () => {
      eval(loadPlanRenderer('Test plan'));

      expect(marked.parse).toHaveBeenCalledWith('Test plan');
    });

    it('should sanitize HTML with DOMPurify', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(DOMPurify.sanitize).toHaveBeenCalled();
      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg).toHaveProperty('ALLOWED_TAGS');
      expect(callArg).toHaveProperty('ALLOWED_ATTR');
    });

    it('should not set deprecated SAFE_FOR_JQUERY option', () => {
      eval(loadPlanRenderer(defaultPlan));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg).not.toHaveProperty('SAFE_FOR_JQUERY');
    });

    it('should allow safe HTML tags', () => {
      eval(loadPlanRenderer(defaultPlan));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_TAGS).toContain('h1');
      expect(callArg.ALLOWED_TAGS).toContain('p');
      expect(callArg.ALLOWED_TAGS).toContain('a');
      expect(callArg.ALLOWED_TAGS).toContain('code');
      expect(callArg.ALLOWED_TAGS).toContain('table');
      expect(callArg.ALLOWED_TAGS).toContain('input');
    });

    it('should allow details and summary tags', () => {
      eval(loadPlanRenderer(defaultPlan));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOWED_TAGS).toContain('details');
      expect(callArg.ALLOWED_TAGS).toContain('summary');
    });

    it('should disallow data attributes', () => {
      eval(loadPlanRenderer(defaultPlan));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOW_DATA_ATTR).toBe(false);
    });

    it('should disallow unknown protocols', () => {
      eval(loadPlanRenderer(defaultPlan));

      const callArg = DOMPurify.sanitize.mock.calls[0][1];
      expect(callArg.ALLOW_UNKNOWN_PROTOCOLS).toBe(false);
    });
  });

  describe('stats calculation', () => {
    it('should calculate sections from h2 count', () => {
      const html =
        '<h1 id="title">Title</h1><h2 id="p1">P1</h2><h2 id="p2">P2</h2><h2 id="p3">P3</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('# Title\n\n## P1\n\n## P2\n\n## P3'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 sections');
    });

    it('should calculate word count', () => {
      eval(loadPlanRenderer('one two three four five'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('5 words');
    });

    it('should calculate reading time', () => {
      // 200 words = 1 min at 200 WPM
      const words = Array(200).fill('word').join(' ');
      eval(loadPlanRenderer(words));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('1 min read');
    });

    it('should show minimum 1 min read time', () => {
      eval(loadPlanRenderer('short'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('1 min read');
    });
  });

  describe('page structure', () => {
    it('should include header with Plan Preview title', () => {
      eval(loadPlanRenderer(defaultPlan));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Plan Preview');
      expect(container.innerHTML).toContain('preview-header');
    });

    it('should include sidebar', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('plan-sidebar')).not.toBeNull();
    });

    it('should include TOC container', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('toc-list')).not.toBeNull();
    });

    it('should include main content area', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('plan-main')).not.toBeNull();
      expect(document.getElementById('plan-content')).not.toBeNull();
    });

    it('should include reading progress bar', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('progress-fill')).not.toBeNull();
    });

    it('should include sidebar toggle button for mobile', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('sidebar-toggle')).not.toBeNull();
    });

    it('should include sidebar overlay for mobile', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('sidebar-overlay')).not.toBeNull();
    });

    it('should include footer', () => {
      eval(loadPlanRenderer(defaultPlan));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('preview-footer');
    });
  });

  describe('TOC generation', () => {
    it('should create TOC entries for headers', () => {
      const html =
        '<h1 id="title">Title</h1><h2 id="section-a">Section A</h2><h3 id="sub">Sub</h3>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('# Title\n\n## Section A\n\n### Sub'));

      const tocLinks = document.querySelectorAll('.toc-link');
      expect(tocLinks.length).toBe(3);
    });

    it('should set correct href on TOC links', () => {
      const html = '<h2 id="phase-1">Phase 1</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('## Phase 1'));

      const tocLink = document.querySelector('.toc-link');
      expect(tocLink.getAttribute('href')).toBe('#phase-1');
    });

    it('should set data-level attribute on TOC links', () => {
      const html = '<h1 id="t">T</h1><h2 id="s">S</h2><h3 id="ss">SS</h3>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('# T\n\n## S\n\n### SS'));

      const tocLinks = document.querySelectorAll('.toc-link');
      expect(tocLinks[0].getAttribute('data-level')).toBe('1');
      expect(tocLinks[1].getAttribute('data-level')).toBe('2');
      expect(tocLinks[2].getAttribute('data-level')).toBe('3');
    });

    it('should skip headers without IDs', () => {
      const html = '<h1>No ID</h1><h2 id="has-id">Has ID</h2>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const tocLinks = document.querySelectorAll('.toc-link');
      expect(tocLinks.length).toBe(1);
      expect(tocLinks[0].textContent).toBe('Has ID');
    });
  });

  describe('diff highlighting', () => {
    it('should highlight added lines in diff blocks', () => {
      const html = '<pre><code class="language-diff">+added line\n normal line</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const addLine = document.querySelector('.diff-line-add');
      expect(addLine).not.toBeNull();
      expect(addLine.textContent).toContain('+added line');
    });

    it('should highlight removed lines in diff blocks', () => {
      const html = '<pre><code class="language-diff">-removed line\n normal line</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const delLine = document.querySelector('.diff-line-del');
      expect(delLine).not.toBeNull();
      expect(delLine.textContent).toContain('-removed line');
    });

    it('should highlight info lines in diff blocks', () => {
      const html = '<pre><code class="language-diff">@@ -1,3 +1,4 @@\n normal</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const infoLine = document.querySelector('.diff-line-info');
      expect(infoLine).not.toBeNull();
    });

    it('should not highlight +++ and --- file headers', () => {
      const html =
        '<pre><code class="language-diff">--- a/file.txt\n+++ b/file.txt\n normal</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const addLines = document.querySelectorAll('.diff-line-add');
      const delLines = document.querySelectorAll('.diff-line-del');
      expect(addLines.length).toBe(0);
      expect(delLines.length).toBe(0);
    });

    it('should not affect non-diff code blocks', () => {
      const html = '<pre><code class="language-javascript">const x = 1;</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const diffLines = document.querySelectorAll(
        '.diff-line-add, .diff-line-del, .diff-line-info'
      );
      expect(diffLines.length).toBe(0);
    });
  });

  describe('header anchors', () => {
    it('should add anchor links to h1 headers', () => {
      const html = '<h1 id="title">Title</h1>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('# Title'));

      const anchor = document.querySelector('#plan-content h1 .header-anchor');
      expect(anchor).not.toBeNull();
      expect(anchor.getAttribute('href')).toBe('#title');
    });

    it('should add anchors to h2 headers', () => {
      const html = '<h2 id="section">Section</h2><p>Content</p>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('## Section\n\nContent'));

      const anchor = document.querySelector('#plan-content h2 .header-anchor');
      expect(anchor).not.toBeNull();
      expect(anchor.getAttribute('href')).toBe('#section');
    });

    it('should add anchors to h3-h6 headers', () => {
      const html = '<h3 id="sub">Sub</h3><h4 id="detail">Detail</h4>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('### Sub\n\n#### Detail'));

      const h3Anchor = document.querySelector('#plan-content h3 .header-anchor');
      const h4Anchor = document.querySelector('#plan-content h4 .header-anchor');
      expect(h3Anchor).not.toBeNull();
      expect(h4Anchor).not.toBeNull();
    });

    it('should set aria-label for accessibility', () => {
      const html = '<h1 id="intro">Introduction</h1>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer('# Introduction'));

      const anchor = document.querySelector('.header-anchor');
      expect(anchor.getAttribute('aria-label')).toContain('Introduction');
    });
  });

  describe('Mermaid integration', () => {
    it('should initialize mermaid with strict security', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      });
    });

    it('should replace mermaid code blocks with diagram containers', () => {
      const html = '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const container = document.querySelector('.mermaid-container');
      expect(container).not.toBeNull();
      const diagram = container.querySelector('.mermaid');
      expect(diagram).not.toBeNull();
      expect(diagram.textContent).toBe('graph TD\nA-->B');
    });

    it('should call mermaid.run when diagrams exist', () => {
      const html = '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      expect(mermaid.run).toHaveBeenCalledWith({ querySelector: '.mermaid' });
    });

    it('should not call mermaid.run when no diagrams', () => {
      const html = '<p>No diagrams</p>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      expect(mermaid.run).not.toHaveBeenCalled();
    });

    it('should assign unique IDs to multiple diagrams', () => {
      const html =
        '<pre><code class="language-mermaid">graph TD\nA-->B</code></pre>' +
        '<pre><code class="language-mermaid">graph LR\nX-->Y</code></pre>';
      global.marked.parse.mockReturnValue(html);
      global.DOMPurify.sanitize.mockReturnValue(html);

      eval(loadPlanRenderer(''));

      const diagrams = document.querySelectorAll('.mermaid');
      expect(diagrams.length).toBe(2);
      expect(diagrams[0].id).toBe('mermaid-diagram-0');
      expect(diagrams[1].id).toBe('mermaid-diagram-1');
    });
  });

  describe('reading progress', () => {
    it('should have progress fill element', () => {
      eval(loadPlanRenderer(defaultPlan));

      expect(document.getElementById('progress-fill')).not.toBeNull();
    });
  });

  describe('mobile sidebar', () => {
    it('should toggle sidebar on button click', () => {
      eval(loadPlanRenderer(defaultPlan));

      const toggle = document.getElementById('sidebar-toggle');
      const sidebar = document.getElementById('plan-sidebar');

      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);

      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(false);
    });

    it('should toggle overlay on button click', () => {
      eval(loadPlanRenderer(defaultPlan));

      const toggle = document.getElementById('sidebar-toggle');
      const overlay = document.getElementById('sidebar-overlay');

      toggle.click();
      expect(overlay.classList.contains('open')).toBe(true);
    });

    it('should close sidebar when overlay is clicked', () => {
      eval(loadPlanRenderer(defaultPlan));

      const toggle = document.getElementById('sidebar-toggle');
      const sidebar = document.getElementById('plan-sidebar');
      const overlay = document.getElementById('sidebar-overlay');

      toggle.click();
      expect(sidebar.classList.contains('open')).toBe(true);

      overlay.click();
      expect(sidebar.classList.contains('open')).toBe(false);
      expect(overlay.classList.contains('open')).toBe(false);
    });
  });
});
