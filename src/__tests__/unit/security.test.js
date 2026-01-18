/**
 * Security validation tests
 */

const fs = require('fs');
const path = require('path');

describe('Security Tests', () => {
  describe('SRI Hash Validation', () => {
    const configFiles = [
      'skills/preview-d3/config.sh',
      'skills/preview-threejs/config.sh',
      'skills/preview-mermaid/config.sh',
    ];

    configFiles.forEach((configFile) => {
      test(`${configFile} should have SRI hashes for CDN scripts`, () => {
        const fullPath = path.join(__dirname, '../../..', configFile);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          const cdnScriptMatches = content.match(/CDN_SCRIPTS=\(([\s\S]*?)\)/);
          if (cdnScriptMatches) {
            const scripts = cdnScriptMatches[1];
            const urls = scripts.match(/https:\/\/[^\s"]+/g) || [];

            urls.forEach((url) => {
              const fullLine = scripts.split('\n').find((line) => line.includes(url));
              expect(fullLine).toMatch(/::sha\d{3}-/);
            });
          }
        }
      });
    });
  });

  describe('Path Traversal Protection', () => {
    test('content-utils.sh should have file validation functions', () => {
      const contentUtils = path.join(__dirname, '../core/lib/content-utils.sh');
      if (fs.existsSync(contentUtils)) {
        const content = fs.readFileSync(contentUtils, 'utf8');

        expect(content).toContain('validate_file_size');
        expect(content).toContain('read_file_safely');
        expect(content).toContain('is_binary_file');
      }
    });
  });

  describe('Content Security Policy', () => {
    test('html-generator.sh should include CSP headers', () => {
      const htmlGenerator = path.join(__dirname, '../core/lib/html-generator.sh');
      if (fs.existsSync(htmlGenerator)) {
        const content = fs.readFileSync(htmlGenerator, 'utf8');

        expect(content).toContain('Content-Security-Policy');
        expect(content).toContain("script-src 'self'");
        expect(content).toContain("style-src 'self'");
      }
    });
  });

  describe('Input Validation', () => {
    test('run.sh should have file extension validation in configs', () => {
      const configFiles = [
        'skills/preview-markdown/config.sh',
        'skills/preview-csv/config.sh',
        'skills/preview-json/config.sh',
      ];

      configFiles.forEach((configPath) => {
        const fullPath = path.join(__dirname, '../../..', configPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).toContain('FILE_EXTENSIONS');
        }
      });
    });
  });

  describe('File Permissions', () => {
    test('generated files should have secure permissions', () => {
      const htmlGenerator = path.join(__dirname, '../core/lib/html-generator.sh');
      if (fs.existsSync(htmlGenerator)) {
        const content = fs.readFileSync(htmlGenerator, 'utf8');

        expect(content).toContain('chmod 644');
      }
    });
  });

  describe('CDN Domain Whitelist', () => {
    test('html-generator.sh should have CDN domain whitelist', () => {
      const htmlGenerator = path.join(__dirname, '../core/lib/html-generator.sh');
      if (fs.existsSync(htmlGenerator)) {
        const content = fs.readFileSync(htmlGenerator, 'utf8');

        expect(content).toContain('ALLOWED_CDN_DOMAINS');
        expect(content).toContain('validate_cdn_url');
        expect(content).toContain('cdn.jsdelivr.net');
      }
    });
  });

  describe('Code Injection Prevention', () => {
    test('should not use eval or Function constructor in renderers', () => {
      const rendererFiles = [
        'skills/preview-d3/templates/scripts/d3-renderer.js',
        'skills/preview-threejs/templates/scripts/threejs-renderer.js',
      ];

      rendererFiles.forEach((file) => {
        const fullPath = path.join(__dirname, '../../..', file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          expect(content).not.toMatch(/\beval\s*\(/);
          expect(content).not.toMatch(/new\s+Function\s*\(/);
        }
      });
    });

    test('should use user code template for interactive tools', () => {
      const runScripts = [
        'skills/preview-d3/run.sh',
        'skills/preview-threejs/run.sh',
        'skills/preview-leaflet/run.sh',
      ];

      runScripts.forEach((file) => {
        const fullPath = path.join(__dirname, '../../..', file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Verify user code template handling with separate file
          expect(content).toMatch(/NEEDS_USER_CODE_TEMPLATE/);
          expect(content).toMatch(/user-code-template\.html/);
          expect(content).toMatch(/USER_CODE_FILE=/);
          expect(content).toMatch(/envsubst/);

          // Verify safe content handling (no direct eval/execution)
          expect(content).not.toMatch(/eval\(/);
          expect(content).not.toMatch(/Function\(/);
        }
      });
    });

    test('should use dynamic script loading in renderers', () => {
      const rendererFiles = [
        'skills/preview-d3/templates/scripts/d3-renderer.js',
        'skills/preview-threejs/templates/scripts/threejs-renderer.js',
        'skills/preview-leaflet/templates/scripts/leaflet-renderer.js',
      ];

      rendererFiles.forEach((file) => {
        const fullPath = path.join(__dirname, '../../..', file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Verify dynamic script loading pattern
          expect(content).toMatch(/createElement\(['"]script['"]\)/);
          expect(content).toMatch(/script\.src\s*=/);
          expect(content).toMatch(/document\.head\.appendChild\(script\)/);
        }
      });
    });
  });
});
