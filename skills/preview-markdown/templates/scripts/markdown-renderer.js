/* eslint-disable no-unused-vars */
// Functions in this file are called from HTML onclick handlers

const container = document.getElementById('content');
const markdownContent = base64DecodeUnicode(MARKDOWN_CONTENT);

// Initialize Mermaid
if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict',
  });
}

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false,
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
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'type', 'checked', 'disabled'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_JQUERY: true,
});

const lines = markdownContent.split('\n').length;
const words = markdownContent.split(/\s+/).filter((w) => w.length > 0).length;
const chars = markdownContent.length;
const stats = `${lines} lines • ${words} words • ${chars} chars`;

const toolbarItems = [
  createButton('Copy Markdown', 'copyMarkdown()', '📋'),
  createButton('Copy HTML', 'copyHTML()', '📄'),
];

container.innerHTML =
  createHeader('Markdown Preview', stats, toolbarItems) +
  '<div class="preview-body"><div id="markdown-content"></div></div>' +
  createFooter();

document.getElementById('markdown-content').innerHTML = renderedHtml;

// Render Mermaid diagrams
if (typeof mermaid !== 'undefined') {
  renderMermaidDiagrams();
}

function copyMarkdown() {
  copyToClipboard(markdownContent, 'Markdown copied to clipboard!');
}

function copyHTML() {
  copyToClipboard(renderedHtml, 'HTML copied to clipboard!');
}

function renderMermaidDiagrams() {
  const codeBlocks = document.querySelectorAll('code.language-mermaid');
  let diagramIndex = 0;

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;
    const diagramCode = codeBlock.textContent;
    const diagramId = `mermaid-diagram-${diagramIndex++}`;

    // Create a container for the diagram
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-container';
    diagramContainer.style.textAlign = 'center';
    diagramContainer.style.margin = '20px 0';

    const diagramDiv = document.createElement('div');
    diagramDiv.id = diagramId;
    diagramDiv.className = 'mermaid';
    diagramDiv.textContent = diagramCode;

    diagramContainer.appendChild(diagramDiv);

    // Replace the pre/code block with the diagram container
    pre.parentNode.replaceChild(diagramContainer, pre);
  });

  // Render all diagrams
  if (diagramIndex > 0) {
    mermaid.run({
      querySelector: '.mermaid',
    });
  }
}
