import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { CategoryType, DefinitionNode, SearchFilters, TreeDisplayMode, ViewMode } from '../../types';
import TreeViewBase from './TreeViewBase';
import GraphViewBase from './GraphViewBase';
import Breadcrumb from './Breadcrumb';
import { setFilters, setTreeDisplayMode, setViewMode, setExpandedNodes } from '../../store/definitionEditorSlice';

interface CategoryViewProps {
  categoryType: CategoryType;
  maxLevel?: number;
}

const CategoryView: React.FC<CategoryViewProps> = ({ categoryType, maxLevel = 9 }) => {
  const dispatch = useDispatch<any>();
  const {
    viewMode,
    treeDisplayMode,
    filters,
    loadingStatus,
    nodesByCategory,
    expandedNodes,
  } = useSelector((s: any) => s.definitionEditor);

  const loading = loadingStatus === 'fetching';
  const error: string | null = null;
  const nodes: DefinitionNode[] = nodesByCategory?.[String(categoryType)] || [];

  const handleViewModeChange = (mode: ViewMode) => dispatch(setViewMode(mode));
  const handleTreeDisplayModeChange = (mode: TreeDisplayMode) => dispatch(setTreeDisplayMode(mode));
  const handleFiltersChange = (f: Partial<SearchFilters>) => dispatch(setFilters({ ...filters, ...f }));

  const baseProps = {
    categoryType,
    loading,
    error,
  };

  return (
    <Box>
      <Breadcrumb categoryType={categoryType} />
      {viewMode === ViewMode.TREE ? (
        <TreeViewBase
          {...baseProps}
          viewMode={viewMode}
          treeDisplayMode={treeDisplayMode}
          filters={filters}
          onViewModeChange={handleViewModeChange}
          onTreeDisplayModeChange={handleTreeDisplayModeChange}
          onFiltersChange={handleFiltersChange}
          nodes={nodes}
          maxLevel={maxLevel}
          expandedNodes={expandedNodes}
          onToggleExpand={(id, open) => {
            const set = new Set(expandedNodes || []);
            if (open) set.add(id); else set.delete(id);
            dispatch(setExpandedNodes(Array.from(set)));
          }}
          onAdd={(parentId?: string) => console.log('add child under', parentId)}
          onEditNode={(node) => console.log('edit node', node)}
          onDeleteNode={(id) => console.log('delete node', id)}
        />
      ) : (
        <GraphViewBase
          {...baseProps}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          nodes={nodes}
          onAdd={(parentId?: string) => console.log('graph add under', parentId)}
          onEditNode={(node) => console.log('graph edit', node)}
          onDeleteNode={(id) => console.log('graph delete', id)}
        />
      )}
    </Box>
  );
};

export default CategoryView;


