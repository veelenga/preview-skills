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

// Sample data
const data = [
  { category: 'JavaScript', value: 35, color: '#f7df1e' },
  { category: 'Python', value: 25, color: '#3776ab' },
  { category: 'Java', value: 15, color: '#007396' },
  { category: 'TypeScript', value: 12, color: '#3178c6' },
  { category: 'Go', value: 8, color: '#00add8' },
  { category: 'Other', value: 5, color: '#999999' }
];

// Create SVG
const svg = d3.select('#visualization')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

const chart = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const radius = Math.min(innerWidth, innerHeight) / 2;

const pie = d3.pie()
  .value(d => d.value)
  .sort(null);

const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius - 20);

const labelArc = d3.arc()
  .innerRadius(radius - 60)
  .outerRadius(radius - 60);

const g = chart.append('g')
  .attr('transform', `translate(${innerWidth / 2},${innerHeight / 2})`);

const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'd3-tooltip')
  .style('position', 'absolute')
  .style('opacity', 0);

const slices = g.selectAll('.arc')
  .data(pie(data))
  .join('g')
  .attr('class', 'arc');

slices.append('path')
  .attr('d', arc)
  .attr('fill', d => d.data.color)
  .attr('stroke', 'white')
  .attr('stroke-width', 2)
  .style('cursor', 'pointer')
  .on('mouseover', function(event, d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 10)
      );

    tooltip.transition().duration(200).style('opacity', 1);
    tooltip
      .html(`<strong>${d.data.category}</strong><br/>
       ${d.data.value}% of total<br/>
       ${((d.endAngle - d.startAngle) / (2 * Math.PI) * 360).toFixed(1)}°`)
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
      .attr('d', arc);

    tooltip.transition().duration(200).style('opacity', 0);
  });

slices.append('text')
  .attr('transform', d => `translate(${labelArc.centroid(d)})`)
  .attr('text-anchor', 'middle')
  .attr('fill', 'white')
  .style('font-size', '14px')
  .style('font-weight', 'bold')
  .text(d => d.data.value + '%');

chart.append('text')
  .attr('x', innerWidth / 2)
  .attr('y', 20)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px')
  .style('font-weight', 'bold')
  .style('fill', '#333')
  .text('Programming Languages Distribution');

const legend = chart.append('g')
  .attr('transform', `translate(20, ${innerHeight - 150})`);

data.forEach((d, i) => {
  const legendRow = legend.append('g')
    .attr('transform', `translate(0, ${i * 25})`);

  legendRow.append('rect')
    .attr('width', 18)
    .attr('height', 18)
    .attr('fill', d.color)
    .attr('stroke', '#333')
    .attr('stroke-width', 1);

  legendRow.append('text')
    .attr('x', 25)
    .attr('y', 14)
    .style('font-size', '13px')
    .style('fill', '#333')
    .text(`${d.category} (${d.value}%)`);
});
