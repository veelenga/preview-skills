---
name: preview-d3
description: Create interactive 2D data visualizations using D3.js with zoom, pan, and custom rendering
user-invocable: true
commands:
  - preview-d3
---

# Preview D3 Skill

Interactive D3.js visualization viewer that renders custom data visualizations with built-in zoom, pan, and export capabilities.

## Agent Usage

When the user asks to create a D3 visualization, write the D3 code and pipe it to the script. Use the Bash tool to execute this skill's `run.sh` script:

```bash
# Pipe D3 code
cat visualization.js | ./run.sh

# Or from a file
./run.sh chart.d3
```

The script handles all HTML generation and **automatically opens the result in the browser**. Do NOT open the file manually to avoid duplicate tabs.

## Usage

```bash
# Preview a D3 visualization file
/preview-d3 network-graph.d3

# Pipe D3 code (preferred for temporary content)
cat visualization.js | /preview-d3
echo "const svg = d3.select('#visualization').append('svg')..." | /preview-d3
```

**Best Practice:** For temporary or generated visualizations, prefer piping over creating temporary files. This avoids cluttering your filesystem and the content is automatically cleaned up.

## Options

The script works with sensible defaults but supports these flags for flexibility:

- `-o, --output PATH` - Custom output path
- `--no-browser` - Skip browser, output file path only

## Features

- **Universal D3 compatibility** - Works with any D3 code from the web
- **Zoom and pan** - Mouse wheel to zoom (0.5x to 10x), drag to pan
- **Reset zoom** button
- **Code viewer** toggle
- **Export to SVG** functionality
- **Preserves interactions** - Tooltips, draggable nodes, animations all work
- **Automatic container detection** - Works with any selector
- **Responsive design** adapts to screen size

## When to Use This Skill

Use this skill when the user wants to:

- Create custom data visualizations
- Render charts, graphs, and network diagrams
- Visualize hierarchical data
- Create interactive dashboards
- Test D3 code snippets from online examples

## D3 Code Requirements

Your D3 code should be self-contained JavaScript that:

1. Gets container dimensions from the DOM
2. Creates its own SVG element
3. Handles tooltips directly (if needed)
4. Embeds data in the code

## Code Template

```javascript
// Get container dimensions
const container = document.querySelector('#visualization');
const rect = container.getBoundingClientRect();
const width = rect.width;
const height = rect.height;
const margin = { top: 60, right: 40, bottom: 60, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Sample data
const data = [
  { category: 'A', value: 30 },
  { category: 'B', value: 80 },
  { category: 'C', value: 45 },
];

// Create SVG
const svg = d3.select('#visualization').append('svg').attr('width', width).attr('height', height);

const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

// Create scales, axes, and visualization elements
// Your D3 code here...
```

## Complete Example - Bar Chart

```javascript
//Get container dimensions
const container = document.querySelector('#visualization');
const rect = container.getBoundingClientRect();
const width = rect.width;
const height = rect.height;
const margin = { top: 60, right: 40, bottom: 60, left: 60 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Sample data
const data = [
  { category: 'A', value: 30 },
  { category: 'B', value: 80 },
  { category: 'C', value: 45 },
  { category: 'D', value: 60 },
  { category: 'E', value: 20 },
];

// Create SVG
const svg = d3.select('#visualization').append('svg').attr('width', width).attr('height', height);

const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3
  .scaleBand()
  .domain(data.map((d) => d.category))
  .range([0, innerWidth])
  .padding(0.2);

const yScale = d3
  .scaleLinear()
  .domain([0, d3.max(data, (d) => d.value)])
  .nice()
  .range([innerHeight, 0]);

// Axes
chart.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));

chart.append('g').call(d3.axisLeft(yScale));

// Bars with tooltip
const tooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'd3-tooltip')
  .style('position', 'absolute')
  .style('opacity', 0);

chart
  .selectAll('rect')
  .data(data)
  .join('rect')
  .attr('x', (d) => xScale(d.category))
  .attr('y', (d) => yScale(d.value))
  .attr('width', xScale.bandwidth())
  .attr('height', (d) => innerHeight - yScale(d.value))
  .attr('fill', '#3498db')
  .on('mouseover', (event, d) => {
    tooltip.transition().duration(200).style('opacity', 1);
    tooltip
      .html(`<strong>${d.category}</strong><br/>Value: ${d.value}`)
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 10 + 'px');
  })
  .on('mouseout', () => {
    tooltip.transition().duration(200).style('opacity', 0);
  });

// Title
chart
  .append('text')
  .attr('x', innerWidth / 2)
  .attr('y', -20)
  .attr('text-anchor', 'middle')
  .style('font-size', '18px')
  .style('font-weight', 'bold')
  .text('Sample Bar Chart');
```

## Common Patterns

### Line Chart

```javascript
const line = d3
  .line()
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.value));

svg
  .append('path')
  .datum(data)
  .attr('fill', 'none')
  .attr('stroke', '#3498db')
  .attr('stroke-width', 2)
  .attr('d', line);
```

### Scatter Plot

```javascript
svg
  .selectAll('circle')
  .data(data)
  .join('circle')
  .attr('cx', (d) => xScale(d.x))
  .attr('cy', (d) => yScale(d.y))
  .attr('r', 5)
  .attr('fill', '#3498db');
```

### Pie Chart

```javascript
const pie = d3.pie().value((d) => d.value);
const arc = d3.arc().innerRadius(0).outerRadius(radius);

svg
  .selectAll('path')
  .data(pie(data))
  .join('path')
  .attr('d', arc)
  .attr('fill', (d, i) => d3.schemeCategory10[i]);
```

## Execution Context

Your code runs with:

- **D3.js v7** library available as `d3`
- **Container element** `#visualization` ready in the DOM
- **Zoom and pan** automatically added to your SVG

## Built-in Features

- **Zoom** - Mouse wheel (0.5x to 10x range)
- **Pan** - Click and drag on background
- **Reset View** - Button to reset zoom/pan
- **Code Viewer** - Toggle to show/hide source code
- **Export SVG** - Download visualization as SVG file

## Best Practices

1. **Use relative sizing** - Get dimensions from container element
2. **Include margins** - Leave space for axes and labels
3. **Create tooltips** - Append div to body with position: absolute
4. **Embed data** - Include data in the code file
5. **Test in console** - Verify code works before saving

## Troubleshooting

### Visualization doesn't appear

- Check browser console (F12) for JavaScript errors
- Verify SVG element is created in DOM inspector
- Check that selector matches (`#visualization`)
- Ensure data is valid

### Elements in wrong position

- Check transform attributes and translations
- Verify scales have correct domain and range
- Ensure margins are applied consistently

### Tooltips don't work

- Append tooltip div to body, not SVG
- Use `position: absolute` CSS
- Use `event.pageX/pageY` for positioning (not clientX/Y)

### Data doesn't load

- Embed data directly in code (no external files)
- Verify data format matches visualization expectations

## Technical Details

### File Requirements

- File extension: `.d3`
- Maximum size: 10MB (configurable)
- Valid JavaScript code
- Self-contained (no external dependencies)

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- CDN-dependent: D3.js v7 library

## Output

The skill generates a standalone HTML file at:

```
/tmp/preview-skills/preview-d3-{filename}.html
```

## Development

This skill is standalone and includes all dependencies:

- Shared libraries bundled in `lib/`
- Templates bundled in `templates/`
- External CDN dependencies: D3.js v7

To modify the skill:

1. Edit `config.sh` for configuration
2. Edit `templates/scripts/d3-renderer.js` for behavior
3. Edit `templates/styles/d3.css` for styling
4. Run `run.sh` to test changes

## Learn More

- D3.js Gallery: https://observablehq.com/@d3/gallery
- D3.js Documentation: https://d3js.org/
- Examples: https://github.com/d3/d3/wiki/Gallery
