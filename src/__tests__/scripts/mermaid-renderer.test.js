const fs = require('fs');
const path = require('path');

const utilsPath = path.join(
  __dirname,
  '../../../skills/preview-mermaid/templates/scripts/utils.js'
);
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const commonUiPath = path.join(
  __dirname,
  '../../../skills/preview-mermaid/templates/scripts/common-ui.js'
);
const commonUiCode = fs.readFileSync(commonUiPath, 'utf8');
eval(commonUiCode);

global.mermaid = {
  initialize: jest.fn(),
  run: jest.fn(() => Promise.resolve()),
};

global.DIAGRAM_ENCODED = btoa('graph TD\nA-->B');
global.MERMAID_THEME = 'default';

const mermaidRendererPath = path.join(
  __dirname,
  '../../../skills/preview-mermaid/templates/scripts/mermaid-renderer.js'
);

describe('mermaid-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize mermaid with correct config', async () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mermaid.initialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
        fontSize: 20,
        flowchart: {
          useMaxWidth: false,
        },
        sequence: {
          useMaxWidth: false,
        },
      });
    });

    it('should decode diagram content', async () => {
      global.DIAGRAM_ENCODED = btoa('sequenceDiagram\nA->>B: Hello');
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const diagramDiv = document.getElementById('mermaid-diagram');
      expect(diagramDiv.textContent).toBe('sequenceDiagram\nA->>B: Hello');
    });

    it('should render mermaid diagram', async () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mermaid.run).toHaveBeenCalled();
      const callArg = mermaid.run.mock.calls[0][0];
      expect(callArg.nodes).toHaveLength(1);
    });
  });

  describe('stats calculation', () => {
    it('should calculate lines correctly', () => {
      global.DIAGRAM_ENCODED = btoa('graph TD\nA-->B\nB-->C');
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 lines');
    });

    it('should calculate characters correctly', () => {
      global.DIAGRAM_ENCODED = btoa('Test');
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('4 chars');
    });
  });

  describe('toolbar', () => {
    it('should include reset view button', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Reset View');
      expect(container.innerHTML).toContain('resetView()');
    });

    it('should include copy code button', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy Code');
      expect(container.innerHTML).toContain('copyDiagram()');
    });

    it('should include copy SVG button', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy SVG');
      expect(container.innerHTML).toContain('copySVG()');
    });

    it('should include button icons', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('⊙');
      expect(container.innerHTML).toContain('📋');
      expect(container.innerHTML).toContain('🖼️');
    });
  });

  describe('diagram structure', () => {
    it('should create viewport container', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const viewport = document.querySelector('.diagram-viewport');
      expect(viewport).not.toBeNull();
    });

    it('should create wrapper container', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const wrapper = document.querySelector('.diagram-wrapper');
      expect(wrapper).not.toBeNull();
    });

    it('should create mermaid diagram container', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const diagram = document.getElementById('mermaid-diagram');
      expect(diagram).not.toBeNull();
      expect(diagram.classList.contains('mermaid')).toBe(true);
    });

    it('should nest containers correctly', () => {
      const mermaidRendererCode = fs.readFileSync(mermaidRendererPath, 'utf8');
      eval(mermaidRendererCode);

      const viewport = document.querySelector('.diagram-viewport');
      const wrapper = viewport.querySelector('.diagram-wrapper');
      const diagram = wrapper.querySelector('#mermaid-diagram');

      expect(wrapper).not.toBeNull();
      expect(diagram).not.toBeNull();
    });
  });
});
