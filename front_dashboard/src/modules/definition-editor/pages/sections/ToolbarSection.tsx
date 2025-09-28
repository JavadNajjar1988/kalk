import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { 
  setViewMode, 
  setTreeDisplayMode, 
  clearFilters,
  resetView 
} from '../../store/definitionEditorSlice';
import { ViewMode, TreeDisplayMode, CategoryType } from '../../types';
import './ToolbarSection.css';

interface ToolbarSectionProps {
  className?: string;
  onCategoryChange?: (category: CategoryType) => void;
}

// Memoized selector to prevent unnecessary re-renders
const selectDefinitionEditorState = createSelector(
  [(state: any) => state.definitionEditor],
  (definitionEditor) => ({
    viewMode: definitionEditor.viewMode,
    treeDisplayMode: definitionEditor.treeDisplayMode,
    currentCategory: definitionEditor.currentCategory,
    filters: definitionEditor.filters
  })
);

const ToolbarSection: React.FC<ToolbarSectionProps> = ({ className = '', onCategoryChange }) => {
  const dispatch = useDispatch();
  const { 
    viewMode, 
    treeDisplayMode, 
    currentCategory,
    filters 
  } = useSelector(selectDefinitionEditorState);

  // Memoize the hasActiveFilters calculation
  const hasActiveFilters = useMemo(() => 
    Object.values(filters || {}).some(value => 
      value !== undefined && value !== null && value !== ''
    ), 
    [filters]
  );

  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
  };

  const handleTreeDisplayModeChange = (mode: TreeDisplayMode) => {
    dispatch(setTreeDisplayMode(mode));
  };

  const handleCategoryChange = (category: CategoryType) => {
    onCategoryChange?.(category);
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handleResetView = () => {
    dispatch(resetView());
  };

  return (
    <div className={`toolbar-section ${className}`}>
      <div className="toolbar-left">
        {/* Category Selector */}
        <div className="toolbar-group">
          <label htmlFor="category-select" className="toolbar-label">
            دسته‌بندی:
          </label>
          <select
            id="category-select"
            value={currentCategory?.type}
            onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
            className="toolbar-select"
          >
            <option value={CategoryType.GEOGRAPHICAL}>جغرافیایی</option>
            <option value={CategoryType.MILITARY_RANKS}>درجات نظامی</option>
            <option value={CategoryType.TIME_DEFINITIONS}>تعاریف زمانی</option>
            <option value={CategoryType.EQUIPMENT}>تجهیزات</option>
            <option value={CategoryType.LOGISTICS_STATUS}>تدارکات</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="toolbar-group">
          <label className="toolbar-label">نمایش:</label>
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === ViewMode.TREE ? 'active' : ''}`}
              onClick={() => handleViewModeChange(ViewMode.TREE)}
              title="نمایش درختی"
            >
              <i className="fas fa-sitemap"></i>
              درخت
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === ViewMode.GRAPH ? 'active' : ''}`}
              onClick={() => handleViewModeChange(ViewMode.GRAPH)}
              title="نمایش گرافی"
            >
              <i className="fas fa-project-diagram"></i>
              گراف
            </button>
          </div>
        </div>

        {/* Tree Display Mode (only when in tree view) */}
        {viewMode === ViewMode.TREE && (
          <div className="toolbar-group">
            <label className="toolbar-label">حالت درخت:</label>
            <div className="tree-mode-toggle">
              <button
                type="button"
                className={`tree-mode-btn ${treeDisplayMode === TreeDisplayMode.HIERARCHY ? 'active' : ''}`}
                onClick={() => handleTreeDisplayModeChange(TreeDisplayMode.HIERARCHY)}
                title="نمایش گسترده"
              >
                <i className="fas fa-expand-arrows-alt"></i>
                گسترده
              </button>
              <button
                type="button"
                className={`tree-mode-btn ${treeDisplayMode === TreeDisplayMode.LEVEL ? 'active' : ''}`}
                onClick={() => handleTreeDisplayModeChange(TreeDisplayMode.LEVEL)}
                title="نمایش فشرده"
              >
                <i className="fas fa-compress-arrows-alt"></i>
                فشرده
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        {/* Action Buttons */}
        <div className="toolbar-actions">
          {hasActiveFilters && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-secondary"
              onClick={handleClearFilters}
              title="پاک کردن فیلترها"
            >
              <i className="fas fa-filter"></i>
              پاک کردن فیلترها
            </button>
          )}
          
          <button
            type="button"
            className="toolbar-btn toolbar-btn-secondary"
            onClick={handleResetView}
            title="بازنشانی نمایش"
          >
            <i className="fas fa-redo"></i>
            بازنشانی
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolbarSection;
