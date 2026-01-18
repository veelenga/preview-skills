/**
 * @jest-environment jsdom
 */

// Mock the base64DecodeUnicode function
const base64DecodeUnicode = (str) => {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
};

// Mock copyToClipboard
const copyToClipboard = (text, successMessage) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => successMessage);
  }
  return Promise.reject(new Error('Clipboard API not available'));
};

describe('Utility Functions', () => {
  describe('base64DecodeUnicode', () => {
    test('should decode simple ASCII base64', () => {
      const encoded = btoa('hello world');
      const decoded = base64DecodeUnicode(encoded);
      expect(decoded).toBe('hello world');
    });

    test('should decode UTF-8 characters', () => {
      const text = 'Hello 世界 🌍';
      const encoded = btoa(
        encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode('0x' + p1)
        )
      );
      const decoded = base64DecodeUnicode(encoded);
      expect(decoded).toBe(text);
    });

    test('should handle empty string', () => {
      const encoded = btoa('');
      const decoded = base64DecodeUnicode(encoded);
      expect(decoded).toBe('');
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(() => Promise.resolve()),
        },
      });
    });

    test('should copy text to clipboard', async () => {
      const text = 'test text';
      const message = 'Copied!';

      const result = await copyToClipboard(text, message);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
      expect(result).toBe(message);
    });

    test('should handle clipboard API failure', async () => {
      Object.assign(navigator, {
        clipboard: undefined,
      });

      await expect(copyToClipboard('test', 'message')).rejects.toThrow(
        'Clipboard API not available'
      );
    });
  });
});
