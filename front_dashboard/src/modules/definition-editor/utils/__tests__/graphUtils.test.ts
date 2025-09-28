import { describe, it, expect } from 'vitest';
import { convertNodesToGraphNodes, convertNodesToGraphEdges, calculateLayout } from '../../utils';
import type { DefinitionNode } from '../../types';

describe('graphUtils', () => {
  const sample: DefinitionNode[] = [
    { id: '1', name: 'Root', level: 1, children: [
      { id: '1-1', name: 'Child', level: 2, parentId: '1' }
    ] }
  ];

  it('convertNodesToGraphNodes/Edges should map nodes and edges', () => {
    const nodes = convertNodesToGraphNodes(sample);
    const edges = convertNodesToGraphEdges(sample);
    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);
  });

  it('calculateLayout should assign positions', () => {
    const nodes = convertNodesToGraphNodes(sample);
    const edges = convertNodesToGraphEdges(sample);
    const laidOut = calculateLayout(nodes, edges, {
      nodeShape: 'circle',
      nodeColor: '#000',
      edgeStyle: 'solid',
      layout: 'tree',
      showLabels: true,
      showTooltips: false,
      nodeSize: 1,
      edgeWidth: 1
    } as any);
    expect(laidOut[0].position).toBeDefined();
  });
});


