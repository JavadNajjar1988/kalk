import { createSelector } from '@reduxjs/toolkit';
import { DefinitionNode } from '../types';
import { buildTreeFromFlatArray } from '../utils';

const emptyNodes: DefinitionNode[] = [];

export const selectDefinitionEditorState = (state: any) => state.definitionEditor;

export const selectCurrentCategoryId = createSelector(selectDefinitionEditorState, (de: any) => de.currentCategory?.id || null);

export const selectNodesByCurrentCategory = createSelector(
  [(state: any) => state.definitionEditor.nodesByCategory, selectCurrentCategoryId],
  (nodesByCategory: Record<string, DefinitionNode[]>, catId: string | null) => (catId ? nodesByCategory[catId] || emptyNodes : emptyNodes)
);

export const selectTreeDataMemo = createSelector([selectNodesByCurrentCategory], (nodes: DefinitionNode[]) => (nodes.length ? buildTreeFromFlatArray(nodes) : emptyNodes));

export const selectFilteredTreeData = (query: string) =>
  createSelector([selectTreeDataMemo], (tree: DefinitionNode[]) => {
    if (!query.trim()) return tree;

    function filterNode(node: DefinitionNode): DefinitionNode | null {
      const q = query.toLowerCase();
      const matches =
        node.name.toLowerCase().includes(q) ||
        (node.description && node.description.toLowerCase().includes(q));
      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(Boolean) as DefinitionNode[];
      return matches || filteredChildren.length
        ? { ...node, children: filteredChildren }
        : null;
    }

    return tree.map(filterNode).filter(Boolean) as DefinitionNode[];
  });



