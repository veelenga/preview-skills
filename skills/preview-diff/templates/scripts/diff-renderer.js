const encodedDiffData = 'DIFF_DATA';

const VIEW_MODES = {
  SIDE_BY_SIDE: 'side-by-side',
  LINE_BY_LINE: 'line-by-line',
};

const STORAGE_KEY = 'diff-view-mode';
const DEFAULT_VIEW_MODE = VIEW_MODES.LINE_BY_LINE;

const LINE_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete',
};

const COLLAPSE_ICONS = {
  EXPANDED: '▼',
  COLLAPSED: '▶',
};

const DEFAULT_FILE_INDEX_TO_EXPAND = 1;

window.addEventListener('load', function () {
  const container = document.getElementById('container');
  const targetElement = document.getElementById('content');

  let currentViewMode = loadViewMode();
  let parsedDiff = null;
  let currentFilter = '';

  function loadViewMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && Object.values(VIEW_MODES).includes(saved) ? saved : DEFAULT_VIEW_MODE;
  }

  function saveViewMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
  }

  function calculateStats(parsed) {
    let additions = 0;
    let deletions = 0;
    const files = parsed.length;

    parsed.forEach((file) => {
      file.blocks.forEach((block) => {
        block.lines.forEach((line) => {
          if (line.type === LINE_TYPES.INSERT) additions++;
          if (line.type === LINE_TYPES.DELETE) deletions++;
        });
      });
    });

    return { files, additions, deletions };
  }

  function createHeader(stats) {
    const header = document.createElement('div');
    header.style.cssText =
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;';

    header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Git Changes Preview</h1>
                    <div style="display: flex; gap: 20px; font-size: 14px; opacity: 0.95;">
                        <span><strong>${stats.files}</strong> ${stats.files === 1 ? 'file' : 'files'} changed</span>
                        <span style="color: #7bed9f;"><strong>+${stats.additions}</strong> additions</span>
                        <span style="color: #ff6b6b;"><strong>-${stats.deletions}</strong> deletions</span>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;" id="controls"></div>
            </div>
        `;

    return header;
  }

  function createSearchBox() {
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'position: relative;';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search files...';
    searchInput.style.cssText =
      'padding: 8px 36px 8px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.15); color: white; font-size: 14px; width: 200px; outline: none;';
    searchInput.style.setProperty('::placeholder', 'color: rgba(255,255,255,0.7);');

    const searchIcon = document.createElement('span');
    searchIcon.innerHTML = '🔍';
    searchIcon.style.cssText =
      'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: 0.8;';

    searchInput.addEventListener('input', function (e) {
      currentFilter = e.target.value.toLowerCase();
      filterFiles();
    });

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);

    return searchContainer;
  }

  function createExpandCollapseButton() {
    const btn = document.createElement('button');
    btn.textContent = 'Expand All';
    btn.id = 'expand-collapse-btn';
    btn.style.cssText =
      'padding: 8px 16px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.15); cursor: pointer; font-size: 14px; color: white; border-radius: 6px; transition: all 0.2s;';

    btn.addEventListener('click', function () {
      const allFiles = Array.from(document.querySelectorAll('.d2h-file-wrapper'));
      const allExpanded = allFiles.every((el) => !el.classList.contains('collapsed'));

      if (allExpanded) {
        allFiles.forEach((el) => collapseFile(el));
        btn.textContent = 'Expand All';
      } else {
        allFiles.forEach((el) => expandFile(el));
        btn.textContent = 'Collapse All';
      }
    });

    btn.addEventListener('mouseenter', function () {
      btn.style.background = 'rgba(255,255,255,0.25)';
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.background = 'rgba(255,255,255,0.15)';
    });

    return btn;
  }

  function createViewToggle() {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText =
      'background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; display: flex;';

    const sideBySideBtn = createButton('Split View', VIEW_MODES.SIDE_BY_SIDE);
    const lineByLineBtn = createButton('Unified', VIEW_MODES.LINE_BY_LINE);

    toggleContainer.appendChild(sideBySideBtn);
    toggleContainer.appendChild(lineByLineBtn);

    return { container: toggleContainer, sideBySideBtn, lineByLineBtn };
  }

  function createButton(text, mode) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText =
      'padding: 8px 16px; border: none; background: transparent; cursor: pointer; font-size: 14px; color: white; transition: all 0.2s;';

    btn.addEventListener('click', function () {
      if (currentViewMode !== mode) {
        currentViewMode = mode;
        saveViewMode(currentViewMode);
        updateButtonStates();
        renderDiff();
      }
    });

    btn.addEventListener('mouseenter', function () {
      if (currentViewMode !== mode) {
        btn.style.background = 'rgba(255,255,255,0.1)';
      }
    });

    btn.addEventListener('mouseleave', function () {
      if (currentViewMode !== mode) {
        btn.style.background = 'transparent';
      }
    });

    return btn;
  }

  let viewToggleButtons = null;

  function updateButtonStates() {
    if (!viewToggleButtons) return;

    const { sideBySideBtn, lineByLineBtn } = viewToggleButtons;

    if (currentViewMode === VIEW_MODES.SIDE_BY_SIDE) {
      sideBySideBtn.style.background = 'rgba(255,255,255,0.25)';
      sideBySideBtn.style.fontWeight = '600';
      lineByLineBtn.style.background = 'transparent';
      lineByLineBtn.style.fontWeight = 'normal';
    } else {
      sideBySideBtn.style.background = 'transparent';
      sideBySideBtn.style.fontWeight = 'normal';
      lineByLineBtn.style.background = 'rgba(255,255,255,0.25)';
      lineByLineBtn.style.fontWeight = '600';
    }
  }

  function expandFile(fileWrapper) {
    fileWrapper.classList.remove('collapsed');
    const header = fileWrapper.querySelector('.d2h-file-header');

    let sibling = header ? header.nextElementSibling : null;
    while (sibling) {
      sibling.style.display = '';
      sibling = sibling.nextElementSibling;
    }

    const icon = fileWrapper.querySelector('.collapse-icon');
    if (icon) {
      icon.textContent = COLLAPSE_ICONS.EXPANDED;
    }
  }

  function collapseFile(fileWrapper) {
    fileWrapper.classList.add('collapsed');
    const header = fileWrapper.querySelector('.d2h-file-header');

    let sibling = header ? header.nextElementSibling : null;
    while (sibling) {
      sibling.style.display = 'none';
      sibling = sibling.nextElementSibling;
    }

    const icon = fileWrapper.querySelector('.collapse-icon');
    if (icon) {
      icon.textContent = COLLAPSE_ICONS.COLLAPSED;
    }
  }

  function toggleFile(fileWrapper) {
    if (fileWrapper.classList.contains('collapsed')) {
      expandFile(fileWrapper);
    } else {
      collapseFile(fileWrapper);
    }
    updateExpandCollapseButton();
  }

  function updateExpandCollapseButton() {
    const btn = document.getElementById('expand-collapse-btn');
    if (!btn) return;

    const allFiles = Array.from(document.querySelectorAll('.d2h-file-wrapper'));
    const visibleFiles = allFiles.filter((el) => el.style.display !== 'none');
    const allExpanded = visibleFiles.every((el) => !el.classList.contains('collapsed'));

    btn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
  }

  function makeFilesCollapsible() {
    document.querySelectorAll('.d2h-file-wrapper').forEach((fileWrapper, index) => {
      const header = fileWrapper.querySelector('.d2h-file-header');
      if (!header) return;

      header.style.cursor = 'pointer';
      header.style.userSelect = 'none';

      const icon = document.createElement('span');
      icon.className = 'collapse-icon';
      icon.textContent = COLLAPSE_ICONS.EXPANDED;
      icon.style.cssText =
        'margin-right: 8px; font-size: 12px; transition: transform 0.2s; display: inline-block;';

      const nameSpan = header.querySelector('.d2h-file-name-wrapper, .d2h-file-name');
      if (nameSpan) {
        nameSpan.insertBefore(icon, nameSpan.firstChild);
      }

      header.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') return;
        toggleFile(fileWrapper);
      });

      if (index >= DEFAULT_FILE_INDEX_TO_EXPAND) {
        collapseFile(fileWrapper);
      }
    });

    updateExpandCollapseButton();
  }

  function filterFiles() {
    if (!currentFilter) {
      document.querySelectorAll('.d2h-file-wrapper').forEach((el) => {
        el.style.display = '';
      });
      updateExpandCollapseButton();
      return;
    }

    document.querySelectorAll('.d2h-file-wrapper').forEach((el) => {
      const fileName = el.querySelector('.d2h-file-name');
      if (fileName) {
        const name = fileName.textContent.toLowerCase();
        const isVisible = name.includes(currentFilter);
        el.style.display = isVisible ? '' : 'none';
        if (isVisible) {
          expandFile(el);
        }
      }
    });

    updateExpandCollapseButton();
  }

  function enhanceDiffUI() {
    const style = document.createElement('style');
    style.textContent = `
            html {
                scroll-behavior: smooth;
            }
            .d2h-wrapper {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
            }
            .d2h-file-header {
                background: linear-gradient(to right, #f6f8fa, #ffffff) !important;
                border-bottom: 2px solid #e1e4e8 !important;
                padding: 12px 16px !important;
                transition: background 0.2s !important;
            }
            .d2h-file-header:hover {
                background: linear-gradient(to right, #eef1f5, #f6f8fa) !important;
            }
            .d2h-file-name {
                font-weight: 600 !important;
                font-size: 14px !important;
                color: #24292e !important;
            }
            .d2h-file-wrapper.collapsed .d2h-file-header {
                border-bottom: none !important;
            }
            .d2h-file-stats {
                font-size: 13px !important;
                color: #586069 !important;
            }
            .d2h-code-line {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
                font-size: 13px !important;
                line-height: 20px !important;
            }
            .d2h-code-line-ctn {
                padding: 0 8px !important;
            }
            .d2h-file-wrapper {
                border: 1px solid #e1e4e8 !important;
                border-radius: 8px !important;
                margin-bottom: 16px !important;
                overflow: hidden !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
                transition: box-shadow 0.2s, background 0.6s !important;
                scroll-margin-top: 140px !important;
            }
            .d2h-file-wrapper:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
            }
            .d2h-ins {
                background: #e6ffed !important;
            }
            .d2h-del {
                background: #ffeef0 !important;
            }
            .d2h-code-line-prefix {
                opacity: 0.6 !important;
            }
            .d2h-file-list-wrapper {
                display: none !important;
            }
            input::placeholder {
                color: rgba(255,255,255,0.7) !important;
            }
        `;
    document.head.appendChild(style);
  }

  function renderDiff() {
    try {
      if (!parsedDiff) {
        const diffData = base64DecodeUnicode(encodedDiffData);

        if (!diffData || diffData.trim().length === 0) {
          targetElement.innerHTML = `
                        <div class="no-changes" style="text-align: center; padding: 80px 40px; color: #586069;">
                            <div style="font-size: 64px; margin-bottom: 20px;">✓</div>
                            <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #24292e;">No changes detected</h2>
                            <p style="margin: 0; font-size: 16px; color: #586069;">Your working directory is clean</p>
                        </div>
                    `;
          return;
        }

        if (typeof Diff2Html === 'undefined') {
          targetElement.innerHTML = `
                        <div style="max-width: 600px; margin: 60px auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <div style="font-size: 48px; text-align: center; margin-bottom: 20px;">⚠️</div>
                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #d73a49; text-align: center;">Library Loading Failed</h2>
                            <p style="margin: 0 0 20px 0; color: #586069; text-align: center;">The diff2html library couldn't be loaded from the CDN.</p>
                            <div style="background: #f6f8fa; padding: 16px; border-radius: 6px;">
                                <p style="margin: 0 0 8px 0; font-weight: 600; color: #24292e;">Possible causes:</p>
                                <ul style="margin: 0; padding-left: 24px; color: #586069;">
                                    <li>No internet connection</li>
                                    <li>CDN is blocked or unavailable</li>
                                    <li>Firewall or ad blocker interference</li>
                                </ul>
                            </div>
                        </div>
                    `;
          return;
        }

        parsedDiff = Diff2Html.parse(diffData);

        const stats = calculateStats(parsedDiff);
        const header = createHeader(stats);
        container.insertBefore(header, targetElement);

        const controlsContainer = document.getElementById('controls');
        const expandCollapseBtn = createExpandCollapseButton();
        const searchBox = createSearchBox();
        const viewToggle = createViewToggle();

        viewToggleButtons = {
          sideBySideBtn: viewToggle.sideBySideBtn,
          lineByLineBtn: viewToggle.lineByLineBtn,
        };

        controlsContainer.appendChild(expandCollapseBtn);
        controlsContainer.appendChild(searchBox);
        controlsContainer.appendChild(viewToggle.container);

        updateButtonStates();
        enhanceDiffUI();
      }

      const diffHtml = Diff2Html.html(parsedDiff, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: currentViewMode,
        renderNothingWhenEmpty: false,
      });

      targetElement.innerHTML = diffHtml;
      makeFilesCollapsible();
      filterFiles();
    } catch (error) {
      targetElement.innerHTML = `
                <div style="max-width: 600px; margin: 60px auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; text-align: center; margin-bottom: 20px;">❌</div>
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #d73a49; text-align: center;">Rendering Error</h2>
                    <p style="margin: 0 0 20px 0; color: #24292e; text-align: center;"><strong>${error.message}</strong></p>
                    <details style="margin-top: 20px;">
                        <summary style="cursor: pointer; color: #0366d6; font-weight: 600; margin-bottom: 12px;">Show stack trace</summary>
                        <pre style="margin: 0; padding: 16px; background: #f6f8fa; border-radius: 6px; overflow-x: auto; font-size: 12px; color: #24292e; white-space: pre-wrap;">${error.stack || 'No stack trace available'}</pre>
                    </details>
                </div>
            `;
    }
  }

  renderDiff();
});
