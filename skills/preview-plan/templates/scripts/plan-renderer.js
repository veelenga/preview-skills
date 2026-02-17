/* eslint-disable no-unused-vars */

const SCROLL_PADDING = 20;
const INITIAL_SCROLL_DELAY_MS = 100;
const READING_SPEED_WPM = 200;
const HEADER_SELECTOR =
  '#plan-content h1, #plan-content h2, #plan-content h3, #plan-content h4, #plan-content h5, #plan-content h6';

const container = document.getElementById('content');
const planContent = base64DecodeUnicode('PLAN_CONTENT');

// ============================================================
// Marked & DOMPurify Configuration
// ============================================================

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
  });
}

const renderer = new marked.Renderer();
const usedIds = {};

renderer.heading = function (text, level, raw) {
  let id = raw
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure unique IDs (like GitHub: "foo", "foo-1", "foo-2")
  if (usedIds[id] !== undefined) {
    usedIds[id]++;
    id = id + '-' + usedIds[id];
  } else {
    usedIds[id] = 0;
  }

  return `<h${level} id="${id}">${text}</h${level}>`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer: renderer,
});

const rawHtml = marked.parse(planContent);
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
});

// ============================================================
// Extract Plan Metadata
// ============================================================

const tempDiv = document.createElement('div');
tempDiv.innerHTML = renderedHtml;

const titleEl = tempDiv.querySelector('h1');
const planTitle = titleEl ? titleEl.textContent : 'Implementation Plan';
const phaseCount = tempDiv.querySelectorAll('h2').length;
const checkboxes = tempDiv.querySelectorAll('input[type="checkbox"]');
const totalTasks = checkboxes.length;
const completedTasks = Array.from(checkboxes).filter((cb) => cb.checked).length;
const words = planContent.split(/\s+/).filter((w) => w.length > 0).length;
const readingTime = Math.max(1, Math.ceil(words / READING_SPEED_WPM));
const lines = planContent.split('\n').length;
const chars = planContent.length;

const stats = `${phaseCount} sections \u2022 ${words} words \u2022 ~${readingTime} min read`;

// ============================================================
// Build Page Structure
// ============================================================

container.innerHTML =
  createHeader('Plan Preview', stats) +
  '<div class="reading-progress"><div class="reading-progress-fill" id="progress-fill"></div></div>' +
  '<div class="plan-layout">' +
  '  <aside class="plan-sidebar" id="plan-sidebar">' +
  '    <div class="sidebar-header">' +
  '      <div class="sidebar-title">Contents</div>' +
  '      <div class="plan-meta" id="plan-meta"></div>' +
  '    </div>' +
  '    <nav class="toc-container" id="toc-container"><ul class="toc-list" id="toc-list"></ul></nav>' +
  '    <div class="sidebar-footer">' +
  '      <div class="sidebar-progress-bar"><div class="sidebar-progress-fill" id="sidebar-progress-fill"></div></div>' +
  '      <span id="progress-text">0%</span>' +
  '    </div>' +
  '  </aside>' +
  '  <main class="plan-main" id="plan-main">' +
  '    <div id="plan-content"></div>' +
  '  </main>' +
  '</div>' +
  '<div class="sidebar-overlay" id="sidebar-overlay"></div>' +
  '<button class="sidebar-toggle" id="sidebar-toggle" title="Toggle table of contents">\u2630</button>' +
  createFooter();

document.getElementById('plan-content').innerHTML = renderedHtml;

// ============================================================
// Plan Metadata Badges
// ============================================================

const metaContainer = document.getElementById('plan-meta');
const metaItems = [];

if (phaseCount > 0) {
  metaItems.push(`\uD83D\uDCC1 ${phaseCount} sections`);
}
if (totalTasks > 0) {
  metaItems.push(`\u2611 ${completedTasks}/${totalTasks} tasks`);
}
metaItems.push(`\u23F1 ${readingTime} min`);

metaContainer.innerHTML = metaItems
  .map((item) => `<span class="meta-badge">${item}</span>`)
  .join('');

// ============================================================
// Table of Contents Generation
// ============================================================

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
      const planMain = document.getElementById('plan-main');
      scrollToElement(target, planMain);
      setTimeout(updateProgress, 100);

      closeSidebar();
    });

    li.appendChild(link);
    tocList.appendChild(li);
  });
}

// ============================================================
// Scroll Spy (IntersectionObserver)
// ============================================================

function initScrollSpy() {
  const tocLinks = document.querySelectorAll('.toc-link');
  const headers = document.querySelectorAll(HEADER_SELECTOR);
  const planMain = document.getElementById('plan-main');

  if (headers.length === 0 || !planMain) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });

          // Scroll active TOC link into view
          const activeLink = document.querySelector('.toc-link.active');
          if (activeLink) {
            const tocContainer = document.getElementById('toc-container');
            const linkRect = activeLink.getBoundingClientRect();
            const containerRect = tocContainer.getBoundingClientRect();
            if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
              activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }
      });
    },
    {
      root: planMain,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    }
  );

  headers.forEach((header) => observer.observe(header));
}

// ============================================================
// Reading Progress
// ============================================================

function updateProgress() {
  const planMain = document.getElementById('plan-main');
  const progressFill = document.getElementById('progress-fill');
  const sidebarProgressFill = document.getElementById('sidebar-progress-fill');
  const progressText = document.getElementById('progress-text');

  if (!planMain) return;

  const scrollTop = planMain.scrollTop;
  const scrollHeight = planMain.scrollHeight - planMain.clientHeight;
  const progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
  const rounded = Math.round(progress);

  if (progressFill) progressFill.style.width = rounded + '%';
  if (sidebarProgressFill) sidebarProgressFill.style.width = rounded + '%';
  if (progressText) progressText.textContent = rounded + '%';
}

function initReadingProgress() {
  const planMain = document.getElementById('plan-main');
  if (!planMain) return;

  let ticking = false;

  planMain.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ============================================================
// Diff Highlighting
// ============================================================

function highlightDiffBlocks() {
  const diffBlocks = document.querySelectorAll('#plan-content code.language-diff');

  diffBlocks.forEach((codeBlock) => {
    const html = codeBlock.innerHTML;
    const lines = html.split('\n');
    const highlighted = lines.map((line) => {
      const stripped = line.replace(/<[^>]*>/g, '');
      if (stripped.startsWith('+') && !stripped.startsWith('+++')) {
        return `<span class="diff-line-add">${line}</span>`;
      } else if (stripped.startsWith('-') && !stripped.startsWith('---')) {
        return `<span class="diff-line-del">${line}</span>`;
      } else if (stripped.startsWith('@@')) {
        return `<span class="diff-line-info">${line}</span>`;
      }
      return line;
    });
    codeBlock.innerHTML = highlighted.join('\n');
  });
}

// ============================================================
// Mermaid Diagrams
// ============================================================

function renderMermaidDiagrams() {
  const codeBlocks = document.querySelectorAll('#plan-content code.language-mermaid');
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

// ============================================================
// Header Anchors & Scrolling
// ============================================================

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

function scrollToElement(element, scrollContainer) {
  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const scrollTop =
    scrollContainer.scrollTop + (elementRect.top - containerRect.top) - SCROLL_PADDING;

  scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
}

function setupAnchorScrolling() {
  const planMain = document.getElementById('plan-main');
  if (!planMain) return;

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    e.preventDefault();
    history.pushState(null, '', `#${targetId}`);
    scrollToElement(targetElement, planMain);
    setTimeout(updateProgress, 100);
  });
}

function handleInitialHash() {
  const planMain = document.getElementById('plan-main');
  if (!window.location.hash || !planMain) return;

  const targetId = window.location.hash.slice(1);
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  setTimeout(() => scrollToElement(targetElement, planMain), INITIAL_SCROLL_DELAY_MS);
}

// ============================================================
// Mobile Sidebar Toggle
// ============================================================

function closeSidebar() {
  const sidebar = document.getElementById('plan-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function initMobileSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('plan-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebar && overlay) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', closeSidebar);
  }
}

// ============================================================
// Initialize
// ============================================================

if (typeof mermaid !== 'undefined') {
  renderMermaidDiagrams();
}

highlightDiffBlocks();
generateTOC();
addHeaderAnchors();
initScrollSpy();
initReadingProgress();
setupAnchorScrolling();
initMobileSidebar();
handleInitialHash();
