"use client";
import React, { useRef, useEffect, useState } from 'react';

type AdvancedD3VisualizerProps = {
  type: 'network' | 'hierarchy' | 'force-directed' | 'heatmap' | 'sankey' | 'contour';
  config?: {
    network?: {
      nodes: number;
      links: number;
    };
    hierarchy?: {
      data: any;
      type: 'tree' | 'treemap' | 'partition';
    };
    force?: {
      charge: number;
      linkDistance: number;
    };
    heatmap?: {
      rows: number;
      cols: number;
    };
    sankey?: {
      nodes: number;
      links: number;
    };
    contour?: {
      function: string;
      levels: number;
    };
  };
  width?: number;
  height?: number;
};

export default function AdvancedD3Visualizer({ 
  type, 
  config = {}, 
  width = 400, 
  height = 300 
}: AdvancedD3VisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Dynamic import of D3 to avoid SSR issues
    import('d3').then((d3) => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove(); // Clear previous content

      switch (type) {
        case 'network':
          createNetworkVisualization(svg, config.network || { nodes: 20, links: 30 }, d3);
          break;
        case 'hierarchy':
          createHierarchyVisualization(svg, config.hierarchy, d3);
          break;
        case 'force-directed':
          createForceDirectedGraph(svg, config.force, d3);
          break;
        case 'heatmap':
          createHeatmap(svg, config.heatmap || { rows: 10, cols: 10 }, d3);
          break;
        case 'sankey':
          createSankeyDiagram(svg, config.sankey || { nodes: 5, links: 8 }, d3);
          break;
        case 'contour':
          createContourPlot(svg, config.contour || { function: 'sin(x)*cos(y)', levels: 5 }, d3);
          break;
        default:
          createBasicVisualization(svg, d3);
      }
    }).catch((error) => {
      console.error('Failed to load D3:', error);
      // Fallback to basic visualization
      if (svgRef.current) {
        svgRef.current.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">D3.js visualization loading...</text>';
      }
    });
  }, [type, config, width, height]);

  const createNetworkVisualization = (svg: any, config: any, d3: any) => {
    const { nodes: nodeCount = 20, links: linkCount = 30 } = config;
    
    // Generate random data
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      group: Math.floor(Math.random() * 3),
      x: Math.random() * width,
      y: Math.random() * height
    }));

    const links = Array.from({ length: linkCount }, () => ({
      source: Math.floor(Math.random() * nodeCount),
      target: Math.floor(Math.random() * nodeCount),
      value: Math.random()
    }));

    // Create links
    svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 2)
      .attr('x1', (d: any) => nodes[d.source].x)
      .attr('y1', (d: any) => nodes[d.source].y)
      .attr('x2', (d: any) => nodes[d.target].x)
      .attr('y2', (d: any) => nodes[d.target].y);

    // Create nodes
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', (d: any) => color(d.group.toString()))
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);
  };

  const createHierarchyVisualization = (svg: any, config: any, d3: any) => {
    const { type: hierarchyType = 'tree' } = config || {};
    
    // Sample hierarchical data
    const data = {
      name: 'Root',
      children: [
        {
          name: 'Branch A',
          children: [
            { name: 'Leaf A1', value: 10 },
            { name: 'Leaf A2', value: 20 }
          ]
        },
        {
          name: 'Branch B',
          children: [
            { name: 'Leaf B1', value: 15 },
            { name: 'Leaf B2', value: 25 }
          ]
        }
      ]
    };

    if (hierarchyType === 'tree') {
      const root = d3.hierarchy(data);
      const treeLayout = d3.tree().size([width - 40, height - 40]);
      treeLayout(root);

      // Create links
      svg.append('g')
        .selectAll('path')
        .data(root.links())
        .enter()
        .append('path')
        .attr('d', d3.linkVertical()
          .x((d: any) => d.x + 20)
          .y((d: any) => d.y + 20))
        .attr('fill', 'none')
        .attr('stroke', '#ccc');

      // Create nodes
      svg.append('g')
        .selectAll('circle')
        .data(root.descendants())
        .enter()
        .append('circle')
        .attr('cx', (d: any) => d.x + 20)
        .attr('cy', (d: any) => d.y + 20)
        .attr('r', 4)
        .attr('fill', '#3b82f6');

      // Add labels
      svg.append('g')
        .selectAll('text')
        .data(root.descendants())
        .enter()
        .append('text')
        .attr('x', (d: any) => d.x + 25)
        .attr('y', (d: any) => d.y + 20)
        .attr('dy', '0.35em')
        .text((d: any) => d.data.name)
        .style('font-size', '12px')
        .style('fill', '#374151');
    }
  };

  const createForceDirectedGraph = (svg: any, config: any, d3: any) => {
    const { charge = -300, linkDistance = 30 } = config || {};
    
    const nodes = Array.from({ length: 15 }, (_, i) => ({ id: i }));
    const links = Array.from({ length: 20 }, () => ({
      source: Math.floor(Math.random() * 15),
      target: Math.floor(Math.random() * 15)
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(charge))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#3b82f6')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const createHeatmap = (svg: any, config: any, d3: any) => {
    const { rows = 10, cols = 10 } = config;
    
    const data = Array.from({ length: rows }, (_, i) =>
      Array.from({ length: cols }, (_, j) => ({
        row: i,
        col: j,
        value: Math.random()
      }))
    ).flat();

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1]);

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => d.col * cellWidth)
      .attr('y', (d: any) => d.row * cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', (d: any) => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  };

  const createSankeyDiagram = (svg: any, config: any, d3: any) => {
    const { nodes: nodeCount = 5, links: linkCount = 8 } = config;
    
    // Simple Sankey-like visualization
    const nodeWidth = 20;
    const nodeSpacing = height / nodeCount;
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const y = i * nodeSpacing + nodeSpacing / 2;
      
      // Left side nodes
      svg.append('rect')
        .attr('x', 50)
        .attr('y', y - 10)
        .attr('width', nodeWidth)
        .attr('height', 20)
        .attr('fill', '#3b82f6');
      
      // Right side nodes
      svg.append('rect')
        .attr('x', width - 70)
        .attr('y', y - 10)
        .attr('width', nodeWidth)
        .attr('height', 20)
        .attr('fill', '#10b981');
    }

    // Create links (simplified)
    for (let i = 0; i < linkCount; i++) {
      const sourceY = (Math.random() * nodeCount) * nodeSpacing + nodeSpacing / 2;
      const targetY = (Math.random() * nodeCount) * nodeSpacing + nodeSpacing / 2;
      
      svg.append('path')
        .attr('d', `M 70 ${sourceY} Q ${width / 2} ${(sourceY + targetY) / 2} ${width - 70} ${targetY}`)
        .attr('stroke', '#8b5cf6')
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('opacity', 0.6);
    }
  };

  const createContourPlot = (svg: any, config: any, d3: any) => {
    const { function: func = 'sin(x)*cos(y)', levels = 5 } = config;
    
    const n = 100;
    const data = [];
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = (i / n) * 4 - 2;
        const y = (j / n) * 4 - 2;
        let z = 0;
        
        try {
          // Simple function evaluation
          if (func.includes('sin(x)*cos(y)')) {
            z = Math.sin(x) * Math.cos(y);
          } else if (func.includes('x^2+y^2')) {
            z = x * x + y * y;
          } else {
            z = Math.sin(x) * Math.cos(y); // fallback
          }
        } catch (e) {
          z = 0;
        }
        
        data.push([x, y, z]);
      }
    }

    const xScale = d3.scaleLinear().domain([-2, 2]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-2, 2]).range([height, 0]);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([-1, 1]);

    // Create simplified contour visualization
    const cellWidth = width / n;
    const cellHeight = height / n;
    
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_: any, i: number) => (i % n) * cellWidth)
      .attr('y', (_: any, i: number) => Math.floor(i / n) * cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('fill', (d: any) => colorScale(d[2]))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);
  };

  const createBasicVisualization = (svg: any, d3: any) => {
    // Simple bar chart as fallback
    const data = [10, 20, 15, 25, 30, 20, 15];
    const xScale = d3.scaleBand().domain(data.map((_, i) => i.toString())).range([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, d3.max(data) || 0]).range([height, 0]);

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_: any, i: number) => xScale(i.toString()) || 0)
      .attr('y', (d: any) => yScale(d))
      .attr('width', xScale.bandwidth())
      .attr('height', (d: any) => height - yScale(d))
      .attr('fill', '#3b82f6');
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-700 capitalize">
        {type.replace('-', ' ')} Visualization
      </div>
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        className="rounded-lg border border-gray-200 bg-white"
      />
    </div>
  );
}
