const fs = require('fs');
const path = require('path');

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-csv/templates/scripts/common-ui.js'
);
const commonUiCode = fs.readFileSync(commonUiPath, 'utf8');
eval(commonUiCode);

describe('common-ui.js', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    document.body.innerHTML = '';
  });

  describe('initTheme', () => {
    it('should set theme to light by default', () => {
      initTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should load theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');
      initTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should handle invalid theme in localStorage', () => {
      localStorage.setItem('theme', 'invalid');
      initTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('invalid');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      toggleTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle from dark to light', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggleTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should default to light when no theme is set', () => {
      toggleTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should save theme to localStorage', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      toggleTheme();
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('createHeader', () => {
    it('should create header with title', () => {
      const header = createHeader('Test Title');
      expect(header).toContain('Test Title');
      expect(header).toContain('preview-header');
    });

    it('should create header with stats', () => {
      const header = createHeader('Title', '100 rows');
      expect(header).toContain('100 rows');
      expect(header).toContain('preview-header-stats');
    });

    it('should create header without stats', () => {
      const header = createHeader('Title');
      expect(header).not.toContain('preview-header-stats');
    });

    it('should create header with toolbar items', () => {
      const toolbarItems = ['<button>Button 1</button>', '<button>Button 2</button>'];
      const header = createHeader('Title', 'Stats', toolbarItems);
      expect(header).toContain('preview-toolbar');
      expect(header).toContain('Button 1');
      expect(header).toContain('Button 2');
    });

    it('should include theme toggle', () => {
      const header = createHeader('Title');
      expect(header).toContain('theme-toggle');
      expect(header).toContain('toggleTheme()');
    });

    it('should handle empty toolbar items array', () => {
      const header = createHeader('Title', 'Stats', []);
      expect(header).not.toContain('preview-toolbar');
    });
  });

  describe('createSearchBox', () => {
    it('should create search input with placeholder', () => {
      const searchBox = createSearchBox('handleSearch()', 'clearSearch()');
      expect(searchBox).toContain('Search... (Ctrl+F)');
      expect(searchBox).toContain('search-input');
    });

    it('should include search icon', () => {
      const searchBox = createSearchBox('handleSearch()', 'clearSearch()');
      expect(searchBox).toContain('🔍');
      expect(searchBox).toContain('search-icon');
    });

    it('should include clear button', () => {
      const searchBox = createSearchBox('handleSearch()', 'clearSearch()');
      expect(searchBox).toContain('search-clear');
      expect(searchBox).toContain('×');
    });

    it('should set oninput handler', () => {
      const searchBox = createSearchBox('myHandler()', 'myClear()');
      expect(searchBox).toContain('oninput="myHandler()"');
    });

    it('should set clear button onclick handler', () => {
      const searchBox = createSearchBox('myHandler()', 'myClear()');
      expect(searchBox).toContain('onclick="myClear()"');
    });
  });

  describe('createButton', () => {
    it('should create button with label', () => {
      const button = createButton('Click Me', 'handleClick()');
      expect(button).toContain('Click Me');
      expect(button).toContain('action-btn');
    });

    it('should set onclick handler', () => {
      const button = createButton('Button', 'myFunction()');
      expect(button).toContain('onclick="myFunction()"');
    });

    it('should include icon when provided', () => {
      const button = createButton('Save', 'save()', '💾');
      expect(button).toContain('💾');
    });

    it('should work without icon', () => {
      const button = createButton('Button', 'click()');
      expect(button).not.toContain('undefined');
    });

    it('should handle empty icon string', () => {
      const button = createButton('Button', 'click()', '');
      expect(button).toContain('Button');
    });
  });

  describe('createFooter', () => {
    it('should include GitHub link', () => {
      const footer = createFooter();
      expect(footer).toContain('github.com/veelenga/preview-skills');
      expect(footer).toContain('Source');
    });

    it('should include license link', () => {
      const footer = createFooter();
      expect(footer).toContain('MIT License');
      expect(footer).toContain('/blob/main/LICENSE');
    });

    it('should include copyright with current year', () => {
      const currentYear = new Date().getFullYear();
      const footer = createFooter();
      expect(footer).toContain(String(currentYear));
    });

    it('should include author link', () => {
      const footer = createFooter();
      expect(footer).toContain('veelenga');
      expect(footer).toContain('github.com/veelenga');
    });

    it('should include heart emoji', () => {
      const footer = createFooter();
      expect(footer).toContain('❤');
    });

    it('should have correct CSS classes', () => {
      const footer = createFooter();
      expect(footer).toContain('preview-footer');
      expect(footer).toContain('footer-links');
      expect(footer).toContain('footer-copyright');
    });
  });

  describe('showStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create status message element', () => {
      showStatus('Test message');
      const statusEl = document.querySelector('.status-message');
      expect(statusEl).not.toBeNull();
      expect(statusEl.textContent).toBe('Test message');
    });

    it('should remove existing status message before showing new one', () => {
      showStatus('First message');
      showStatus('Second message');
      const statusEls = document.querySelectorAll('.status-message');
      expect(statusEls.length).toBe(1);
      expect(statusEls[0].textContent).toBe('Second message');
    });

    it('should remove status message after timeout', () => {
      showStatus('Test');
      expect(document.querySelector('.status-message')).not.toBeNull();

      jest.advanceTimersByTime(2000);
      expect(document.querySelector('.status-message').style.animation).toContain('slideOut');

      jest.advanceTimersByTime(300);
      expect(document.querySelector('.status-message')).toBeNull();
    });
  });

  describe('initSearchShortcut', () => {
    it('should focus search input on Ctrl+F', () => {
      document.body.innerHTML = '<input class="search-input" />';
      const input = document.querySelector('.search-input');
      jest.spyOn(input, 'focus');

      initSearchShortcut('.search-input');

      const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true });
      document.dispatchEvent(event);

      expect(input.focus).toHaveBeenCalled();
    });

    it('should focus search input on Cmd+F (Mac)', () => {
      document.body.innerHTML = '<input class="search-input" />';
      const input = document.querySelector('.search-input');
      jest.spyOn(input, 'focus');

      initSearchShortcut('.search-input');

      const event = new KeyboardEvent('keydown', { key: 'f', metaKey: true });
      document.dispatchEvent(event);

      expect(input.focus).toHaveBeenCalled();
    });

    it('should not focus without modifier key', () => {
      document.body.innerHTML = '<input class="search-input" />';
      const input = document.querySelector('.search-input');
      jest.spyOn(input, 'focus');

      initSearchShortcut('.search-input');

      const event = new KeyboardEvent('keydown', { key: 'f' });
      document.dispatchEvent(event);

      expect(input.focus).not.toHaveBeenCalled();
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard', async () => {
      await copyToClipboard('Test text');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test text');
    });

    it('should show success message', async () => {
      jest.useFakeTimers();
      await copyToClipboard('Test');
      expect(document.querySelector('.status-message').textContent).toBe('Copied to clipboard!');
      jest.useRealTimers();
    });

    it('should show custom success message', async () => {
      jest.useFakeTimers();
      await copyToClipboard('Test', 'Custom message');
      expect(document.querySelector('.status-message').textContent).toBe('Custom message');
      jest.useRealTimers();
    });

    it('should handle empty string', async () => {
      await copyToClipboard('');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });
  });
});
