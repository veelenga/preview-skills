const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../../../skills/preview-csv/templates/scripts/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

describe('utils.js', () => {
  describe('base64DecodeUnicode', () => {
    it('should decode simple ASCII base64 string', () => {
      const encoded = btoa('Hello World');
      expect(base64DecodeUnicode(encoded)).toBe('Hello World');
    });

    it('should decode UTF-8 encoded string with Unicode characters', () => {
      const text = 'Hello 世界 🌍';
      const encoded = btoa(unescape(encodeURIComponent(text)));
      expect(base64DecodeUnicode(encoded)).toBe(text);
    });

    it('should handle empty string', () => {
      const encoded = btoa('');
      expect(base64DecodeUnicode(encoded)).toBe('');
    });

    it('should decode string with special characters', () => {
      const text = 'Test<>&"\'';
      const encoded = btoa(unescape(encodeURIComponent(text)));
      expect(base64DecodeUnicode(encoded)).toBe(text);
    });

    it('should decode multi-byte Unicode characters correctly', () => {
      const text = '日本語テスト';
      const encoded = btoa(unescape(encodeURIComponent(text)));
      expect(base64DecodeUnicode(encoded)).toBe(text);
    });

    it('should handle emojis', () => {
      const text = '😀😃😄😁';
      const encoded = btoa(unescape(encodeURIComponent(text)));
      expect(base64DecodeUnicode(encoded)).toBe(text);
    });
  });

  describe('getElement', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="test-element">Test</div>';
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should return element when it exists', () => {
      const element = getElement('test-element');
      expect(element).not.toBeNull();
      expect(element.id).toBe('test-element');
    });

    it('should return null when element does not exist', () => {
      const element = getElement('non-existent');
      expect(element).toBeNull();
    });

    it('should return correct element by ID', () => {
      const element = getElement('test-element');
      expect(element.textContent).toBe('Test');
    });
  });

  describe('setContent', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="test-element"></div>';
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should set innerHTML when element exists', () => {
      setContent('test-element', '<p>New Content</p>');
      const element = document.getElementById('test-element');
      expect(element.innerHTML).toBe('<p>New Content</p>');
    });

    it('should not throw error when element does not exist', () => {
      expect(() => setContent('non-existent', '<p>Content</p>')).not.toThrow();
    });

    it('should handle empty content', () => {
      setContent('test-element', '');
      const element = document.getElementById('test-element');
      expect(element.innerHTML).toBe('');
    });

    it('should handle HTML with special characters', () => {
      const html = '<div>Test &amp; &lt;script&gt;</div>';
      setContent('test-element', html);
      const element = document.getElementById('test-element');
      expect(element.innerHTML).toBe(html);
    });

    it('should replace existing content', () => {
      const element = document.getElementById('test-element');
      element.innerHTML = '<span>Old</span>';
      setContent('test-element', '<span>New</span>');
      expect(element.innerHTML).toBe('<span>New</span>');
    });

    it('should handle complex HTML structures', () => {
      const html = '<div><h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul></div>';
      setContent('test-element', html);
      const element = document.getElementById('test-element');
      expect(element.innerHTML).toBe(html);
    });
  });
});
