const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../../skills');
const EXAMPLES_DIR = path.join(__dirname, '../../../examples');

describe('run.sh integration tests', () => {
  describe('--no-browser flag', () => {
    it('should create preview without opening browser for JSON', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-json');
      const inputFile = path.join(EXAMPLES_DIR, 'json/sample.json');

      const result = execSync(`./run.sh "${inputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
      });

      expect(result).toContain('Preview created:');
      expect(result).toContain('.html');

      // Extract output file path and verify it exists
      const match = result.match(/Preview created: (.+\.html)/);
      expect(match).not.toBeNull();
      const outputFile = match[1].trim();
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should create preview without opening browser for CSV', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-csv');
      const inputFile = path.join(EXAMPLES_DIR, 'csv/employees.csv');

      const result = execSync(`./run.sh "${inputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
      });

      expect(result).toContain('Preview created:');

      const match = result.match(/Preview created: (.+\.html)/);
      expect(match).not.toBeNull();
      const outputFile = match[1].trim();
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should create preview without opening browser for Markdown', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-markdown');
      const inputFile = path.join(EXAMPLES_DIR, 'markdown/sample.md');

      const result = execSync(`./run.sh "${inputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
      });

      expect(result).toContain('Preview created:');

      const match = result.match(/Preview created: (.+\.html)/);
      expect(match).not.toBeNull();
      const outputFile = match[1].trim();
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should work with piped input', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-json');

      const result = execSync(`echo '{"test": "value"}' | ./run.sh --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      expect(result).toContain('Preview created:');
    });
  });

  describe('-o/--output flag', () => {
    it('should output to custom path', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-json');
      const inputFile = path.join(EXAMPLES_DIR, 'json/sample.json');
      const outputFile = '/tmp/preview-skills-test/custom-output.html';

      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputFile), { recursive: true });

      const result = execSync(`./run.sh "${inputFile}" -o "${outputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
      });

      expect(result).toContain('Preview created:');
      expect(result).toContain(outputFile);
      expect(fs.existsSync(outputFile)).toBe(true);

      // Cleanup
      fs.unlinkSync(outputFile);
    });
  });
});
