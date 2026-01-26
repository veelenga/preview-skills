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

const mermaidRendererPath = path.join(
  __dirname,
  '../../../skills/preview-mermaid/templates/scripts/mermaid-renderer.js'
);

// Helper to load renderer with substituted data
function loadMermaidRenderer(diagramCode, theme = 'default') {
  const encoded = btoa(diagramCode);
  let code = fs.readFileSync(mermaidRendererPath, 'utf8');
  code = code.replace(/DIAGRAM_ENCODED/g, encoded);
  code = code.replace(/MERMAID_THEME/g, theme);
  return code;
}

const defaultDiagram = 'graph TD\nA-->B';

describe('mermaid-renderer.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="content"></div>';
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize mermaid with correct config', async () => {
      eval(loadMermaidRenderer(defaultDiagram));

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
      eval(loadMermaidRenderer('sequenceDiagram\nA->>B: Hello'));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const diagramDiv = document.getElementById('mermaid-diagram');
      expect(diagramDiv.textContent).toBe('sequenceDiagram\nA->>B: Hello');
    });

    it('should render mermaid diagram', async () => {
      eval(loadMermaidRenderer(defaultDiagram));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mermaid.run).toHaveBeenCalled();
      const callArg = mermaid.run.mock.calls[0][0];
      expect(callArg.nodes).toHaveLength(1);
    });
  });

  describe('stats calculation', () => {
    it('should calculate lines correctly', () => {
      eval(loadMermaidRenderer('graph TD\nA-->B\nB-->C'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('3 lines');
    });

    it('should calculate characters correctly', () => {
      eval(loadMermaidRenderer('Test'));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('4 chars');
    });
  });

  describe('toolbar', () => {
    it('should include reset view button', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Reset View');
      expect(container.innerHTML).toContain('resetView()');
    });

    it('should include copy code button', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy Code');
      expect(container.innerHTML).toContain('copyDiagram()');
    });

    it('should include copy SVG button', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('Copy SVG');
      expect(container.innerHTML).toContain('copySVG()');
    });

    it('should include button icons', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const container = document.getElementById('content');
      expect(container.innerHTML).toContain('⊙');
      expect(container.innerHTML).toContain('📋');
      expect(container.innerHTML).toContain('🖼️');
    });
  });

  describe('diagram structure', () => {
    it('should create viewport container', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const viewport = document.querySelector('.diagram-viewport');
      expect(viewport).not.toBeNull();
    });

    it('should create wrapper container', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const wrapper = document.querySelector('.diagram-wrapper');
      expect(wrapper).not.toBeNull();
    });

    it('should create mermaid diagram container', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const diagram = document.getElementById('mermaid-diagram');
      expect(diagram).not.toBeNull();
      expect(diagram.classList.contains('mermaid')).toBe(true);
    });

    it('should nest containers correctly', () => {
      eval(loadMermaidRenderer(defaultDiagram));

      const viewport = document.querySelector('.diagram-viewport');
      const wrapper = viewport.querySelector('.diagram-wrapper');
      const diagram = wrapper.querySelector('#mermaid-diagram');

      expect(wrapper).not.toBeNull();
      expect(diagram).not.toBeNull();
    });
  });
});
