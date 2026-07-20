import { describe, it, expect } from 'vitest';
import { buildTreeFromFlatArray, flattenTreeToArray } from '../../utils';
import type { DefinitionNode } from '../../types';

describe('treeOperations', () => {
  const flat: DefinitionNode[] = [
    { id: '1', name: 'Root', level: 1 },
    { id: '1-1', name: 'Child A', level: 2, parentId: '1' },
    { id: '1-2', name: 'Child B', level: 2, parentId: '1' },
    { id: '1-1-1', name: 'Leaf', level: 3, parentId: '1-1' },
  ];

  it('buildTreeFromFlatArray should create hierarchy', () => {
    const tree = buildTreeFromFlatArray(flat);
    expect(tree.length).toBe(1);
    expect(tree[0].children?.length).toBe(2);
  });

  it('flattenTreeToArray should return original count', () => {
    const tree = buildTreeFromFlatArray(flat);
    const back = flattenTreeToArray(tree);
    expect(back.length).toBe(flat.length);
  });
});


