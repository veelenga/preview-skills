/* eslint-disable no-unused-vars */
// User code - executes when dynamically loaded
// Get container dimensions
const container = document.querySelector('#visualization');
const rect = container.getBoundingClientRect();
const width = rect.width;
const height = rect.height;
const margin = { top: 40, right: 40, bottom: 40, left: 40 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Sample network data
const nodes = [
  { id: 'Alice', group: 1 },
  { id: 'Bob', group: 1 },
  { id: 'Carol', group: 2 },
  { id: 'David', group: 2 },
  { id: 'Eve', group: 3 },
  { id: 'Frank', group: 3 },
  { id: 'Grace', group: 1 },
  { id: 'Henry', group: 2 },
  { id: 'Iris', group: 3 },
  { id: 'Jack', group: 1 }
];

const links = [
  { source: 'Alice', target: 'Bob', value: 1 },
  { source: 'Alice', target: 'Carol', value: 2 },
  { source: 'Bob', target: 'David', value: 1 },
  { source: 'Carol', target: 'David', value: 3 },
  { source: 'Carol', target: 'Eve', value: 2 },
  { source: 'David', target: 'Frank', value: 1 },
  { source: 'Eve', target: 'Frank', value: 2 },
  { source: 'Grace', target: 'Alice', value: 1 },
  { source: 'Henry', target: 'David', value: 1 },
  { source: 'Iris', target: 'Eve', value: 2 },
  { source: 'Jack', target: 'Bob', value: 1 },
  { source: 'Frank', target: 'Iris', value: 1 }
];

// Create SVG
const svg = d3.select('#visualization')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

const chart = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const colorScale = d3.scaleOrdinal()
  .domain([1, 2, 3])
  .range(['#3498db', '#e74c3c', '#2ecc71']);

const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id).distance(100))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
  .force('collision', d3.forceCollide().radius(30));

const link = chart.selectAll('line')
  .data(links)
  .join('line')
  .attr('stroke', '#999')
  .attr('stroke-opacity', 0.6)
  .attr('stroke-width', d => Math.sqrt(d.value) * 2);

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'd3-tooltip')
  .style('position', 'absolute')
  .style('opacity', 0);

const node = chart.selectAll('circle')
  .data(nodes)
  .join('circle')
  .attr('r', 20)
  .attr('fill', d => colorScale(d.group))
  .attr('stroke', '#fff')
  .attr('stroke-width', 2)
  .style('cursor', 'pointer')
  .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended))
  .on('mouseover', function(event, d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr('r', 25);

    tooltip.transition().duration(200).style('opacity', 1);
    tooltip
      .html(`<strong>${d.id}</strong><br/>Group: ${d.group}`)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  })
  .on('mousemove', function(event) {
    tooltip
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  })
  .on('mouseout', function() {
    d3.select(this)
      .transition()
      .duration(200)
      .attr('r', 20);

    tooltip.transition().duration(200).style('opacity', 0);
  });

const label = chart.selectAll('text.node-label')
  .data(nodes)
  .join('text')
  .attr('class', 'node-label')
  .attr('text-anchor', 'middle')
  .attr('dy', 5)
  .style('font-size', '12px')
  .style('font-weight', 'bold')
  .style('fill', 'white')
  .style('pointer-events', 'none')
  .text(d => d.id.substring(0, 3));

simulation.on('tick', () => {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  node
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

  label
    .attr('x', d => d.x)
    .attr('y', d => d.y);
});

function dragstarted(event) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(event) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

chart.append('text')
  .attr('x', innerWidth / 2)
  .attr('y', 20)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px')
  .style('font-weight', 'bold')
  .style('fill', '#333')
  .text('Interactive Network Graph');

const legend = chart.append('g')
  .attr('transform', `translate(20, 50)`);

[1, 2, 3].forEach((group, i) => {
  const legendRow = legend.append('g')
    .attr('transform', `translate(0, ${i * 25})`);

  legendRow.append('circle')
    .attr('r', 8)
    .attr('fill', colorScale(group))
    .attr('stroke', '#333')
    .attr('stroke-width', 1);

  legendRow.append('text')
    .attr('x', 15)
    .attr('y', 4)
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(`Group ${group}`);
});
