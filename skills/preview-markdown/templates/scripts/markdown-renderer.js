/* eslint-disable no-unused-vars */

const SCROLL_PADDING = 20;
const INITIAL_SCROLL_DELAY_MS = 100;
const READING_SPEED_WPM = 200;
const SCROLL_SPY_OFFSET = 120; // Offset to account for header/padding/progress bar
const HEADER_SELECTOR =
  '#markdown-content h1, #markdown-content h2, #markdown-content h3, #markdown-content h4, #markdown-content h5, #markdown-content h6';

const container = document.getElementById('content');
const markdownContent = base64DecodeUnicode('MARKDOWN_CONTENT');

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
  });
}

const renderer = new marked.Renderer();

renderer.heading = function (text, level, raw) {
  const id = raw
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `<h${level} id="${id}">${text}</h${level}>`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer: renderer,
});

const rawHtml = marked.parse(markdownContent);
const renderedHtml = DOMPurify.sanitize(rawHtml, {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'strong',
    'em',
    'del',
    'br',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'div',
    'span',
    'input',
    'label',
    'details',
    'summary',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'type',
    'checked',
    'disabled',
    'open',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_JQUERY: true,
});

const lines = markdownContent.split('\n').length;
const words = markdownContent.split(/\s+/).filter((w) => w.length > 0).length;
const chars = markdownContent.length;
const readingTime = Math.max(1, Math.ceil(words / READING_SPEED_WPM));
const stats = `${lines} lines • ${words} words • ~${readingTime} min read`;

const toolbarItems = [];

container.innerHTML =
  createHeader('Markdown Preview', stats, toolbarItems) +
  '<div class="reading-progress"><div class="reading-progress-fill" id="progress-fill"></div></div>' +
  '<div class="markdown-layout">' +
  '  <aside class="markdown-sidebar" id="markdown-sidebar">' +
  '    <div class="sidebar-header">' +
  '      <div class="sidebar-title">Contents</div>' +
  '    </div>' +
  '    <nav class="toc-container" id="toc-container"><ul class="toc-list" id="toc-list"></ul></nav>' +
  '  </aside>' +
  '  <main class="markdown-main" id="markdown-main">' +
  '    <div id="markdown-content"></div>' +
  '  </main>' +
  '</div>' +
  '<div class="sidebar-overlay" id="sidebar-overlay"></div>' +
  '<button class="sidebar-toggle" id="sidebar-toggle" title="Toggle table of contents">☰</button>' +
  createFooter();

document.getElementById('markdown-content').innerHTML = renderedHtml;

if (typeof mermaid !== 'undefined') {
  renderMermaidDiagrams();
}

generateTOC();
addHeaderAnchors();
initScrollSpy();
initReadingProgress();
setupAnchorScrolling();
initMobileSidebar();
handleInitialHash();

function renderMermaidDiagrams() {
  const codeBlocks = document.querySelectorAll('code.language-mermaid');
  let diagramIndex = 0;

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    const diagramCode = codeBlock.textContent;
    const diagramId = `mermaid-diagram-${diagramIndex++}`;

    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-container';
    diagramContainer.style.textAlign = 'center';
    diagramContainer.style.margin = '20px 0';

    const diagramDiv = document.createElement('div');
    diagramDiv.id = diagramId;
    diagramDiv.className = 'mermaid';
    diagramDiv.textContent = diagramCode;

    diagramContainer.appendChild(diagramDiv);
    pre.parentNode.replaceChild(diagramContainer, pre);
  });

  if (diagramIndex > 0) {
    mermaid.run({ querySelector: '.mermaid' });
  }
}

function generateTOC() {
  const tocList = document.getElementById('toc-list');
  const headers = document.querySelectorAll(HEADER_SELECTOR);

  headers.forEach((header) => {
    if (!header.id) return;

    const level = parseInt(header.tagName.charAt(1), 10);
    const li = document.createElement('li');
    const link = document.createElement('a');

    link.className = 'toc-link';
    link.setAttribute('data-level', level);
    link.href = `#${header.id}`;
    link.textContent = header.textContent.replace(/^#\s*/, '');
    link.title = header.textContent.replace(/^#\s*/, '');

    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById(header.id);
      if (!target) return;

      history.pushState(null, '', `#${header.id}`);
      const markdownMain = document.getElementById('markdown-main');
      scrollToElement(target, markdownMain);
      setTimeout(updateProgress, 100);

      closeSidebar();
    });

    li.appendChild(link);
    tocList.appendChild(li);
  });
}

function initScrollSpy() {
  const tocLinks = document.querySelectorAll('.toc-link');
  const headers = Array.from(document.querySelectorAll(HEADER_SELECTOR));
  const markdownMain = document.getElementById('markdown-main');

  if (headers.length === 0 || !markdownMain) return;

  function updateActiveSection() {
    const scrollPos = markdownMain.scrollTop + SCROLL_SPY_OFFSET;

    // Find the current section (last header above scroll position)
    let currentHeader = headers[0];
    for (const header of headers) {
      if (header.offsetTop <= scrollPos) {
        currentHeader = header;
      } else {
        break;
      }
    }

    // Update active link
    tocLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentHeader.id}`);
    });
  }

  markdownMain.addEventListener('scroll', updateActiveSection);
  updateActiveSection(); // Initial update
}

function updateProgress() {
  const markdownMain = document.getElementById('markdown-main');
  const progressFill = document.getElementById('progress-fill');

  if (!markdownMain) return;

  const scrollTop = markdownMain.scrollTop;
  const scrollHeight = markdownMain.scrollHeight - markdownMain.clientHeight;
  const progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
  const rounded = Math.round(progress);

  if (progressFill) progressFill.style.width = rounded + '%';
}

function initReadingProgress() {
  const markdownMain = document.getElementById('markdown-main');
  if (!markdownMain) return;

  let ticking = false;

  markdownMain.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });
}

function closeSidebar() {
  const sidebar = document.getElementById('markdown-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function initMobileSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('markdown-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', closeSidebar);
  }
}

function addHeaderAnchors() {
  const headers = document.querySelectorAll(HEADER_SELECTOR);

  headers.forEach((header) => {
    if (!header.id) return;

    const anchor = document.createElement('a');
    anchor.className = 'header-anchor';
    anchor.href = `#${header.id}`;
    anchor.setAttribute('aria-label', `Link to ${header.textContent}`);
    anchor.textContent = '#';

    header.insertBefore(anchor, header.firstChild);
  });
}

function setupAnchorScrolling() {
  const markdownMain = document.getElementById('markdown-main');
  if (!markdownMain) return;

  function handleAnchorClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    e.preventDefault();
    history.pushState(null, '', `#${targetId}`);
    scrollToElement(targetElement, markdownMain);
    setTimeout(updateProgress, 100);
  }

  document.addEventListener('click', handleAnchorClick);

  window.addEventListener('unload', function cleanup() {
    document.removeEventListener('click', handleAnchorClick);
    window.removeEventListener('unload', cleanup);
  });
}

function handleInitialHash() {
  const markdownMain = document.getElementById('markdown-main');
  if (!window.location.hash || !markdownMain) return;

  const targetId = window.location.hash.slice(1);
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  setTimeout(() => scrollToElement(targetElement, markdownMain), INITIAL_SCROLL_DELAY_MS);
}

function scrollToElement(element, container) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - SCROLL_PADDING;

  container.scrollTo({ top: scrollTop, behavior: 'smooth' });
}
