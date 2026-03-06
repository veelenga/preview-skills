const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
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

      // Extract output file path and verify it exists (path is relative to skillDir)
      const match = result.match(/Preview created: (.+\.html)/);
      expect(match).not.toBeNull();
      const outputFile = path.resolve(skillDir, match[1].trim());
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
      const outputFile = path.resolve(skillDir, match[1].trim());
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
      const outputFile = path.resolve(skillDir, match[1].trim());
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

  describe('base href for relative paths', () => {
    it('should include base href when previewing a source file', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-markdown');
      const inputFile = path.join(EXAMPLES_DIR, 'markdown/sample.md');
      const outputFile = path.join(os.tmpdir(), 'preview-skills-test', 'base-href-test.html');

      fs.mkdirSync(path.dirname(outputFile), { recursive: true });

      execSync(`./run.sh "${inputFile}" -o "${outputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
      });

      const html = fs.readFileSync(outputFile, 'utf-8');
      const sourceDir = path.dirname(path.resolve(inputFile));
      expect(html).toContain(`<base href="file://${sourceDir}/">`);

      fs.unlinkSync(outputFile);
    });

    it('should not include base href when using piped stdin', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-json');
      const outputFile = path.join(os.tmpdir(), 'preview-skills-test', 'base-href-stdin-test.html');

      fs.mkdirSync(path.dirname(outputFile), { recursive: true });

      execSync(`echo '{"test": "value"}' | ./run.sh -o "${outputFile}" --no-browser`, {
        cwd: skillDir,
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      const html = fs.readFileSync(outputFile, 'utf-8');
      expect(html).not.toContain('<base href=');

      fs.unlinkSync(outputFile);
    });
  });

  describe('-o/--output flag', () => {
    it('should output to custom path', () => {
      const skillDir = path.join(SKILLS_DIR, 'preview-json');
      const inputFile = path.join(EXAMPLES_DIR, 'json/sample.json');
      const outputFile = path.join(os.tmpdir(), 'preview-skills-test', 'custom-output.html');

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
