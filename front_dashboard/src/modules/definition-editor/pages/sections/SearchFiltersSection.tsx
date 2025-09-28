import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { setFilters, clearFilters } from '../../store/definitionEditorSlice';
import { SearchFilters, CategoryType } from '../../types';
// import { filterNodes } from '../../utils';
import './SearchFiltersSection.css';

interface SearchFiltersSectionProps {
  className?: string;
  onFiltersChange?: (filteredData: any[]) => void;
}

// Memoized selector for search filters
const selectSearchFiltersState = createSelector(
  [(state: any) => state.definitionEditor],
  (definitionEditor) => ({
    filters: definitionEditor.filters,
    currentCategory: definitionEditor.currentCategory,
    nodes: definitionEditor.nodes
  })
);

const SearchFiltersSection: React.FC<SearchFiltersSectionProps> = ({ 
  className = '',
  onFiltersChange 
}) => {
  const dispatch = useDispatch();
  const { filters, currentCategory, nodes } = useSelector(selectSearchFiltersState);
  
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local filters when Redux filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Apply filters and notify parent
  useEffect(() => {
    if (onFiltersChange && nodes) {
      onFiltersChange(nodes);
    }
  }, [localFilters, nodes, onFiltersChange]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(localFilters));
  };

  const handleClearAllFilters = () => {
    const emptyFilters: SearchFilters = {
      query: '',
      searchIn: 'both',
      levelRange: [1, 10],
      hasChildren: 'all',
      hasCoordinates: 'all',
      country: '',
      hasNatoEquivalent: 'all',
      nodeType: 'all',
      specialty: '',
      icon: ''
    };
    setLocalFilters(emptyFilters);
    dispatch(clearFilters());
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  const getCategorySpecificFields = () => {
    switch (currentCategory?.type) {
      case CategoryType.GEOGRAPHICAL:
        return ['coordinates', 'country'];
      case CategoryType.MILITARY_RANKS:
        return ['natoEquivalent', 'specialty'];
      case CategoryType.EQUIPMENT:
        return ['nodeType', 'icon'];
      case CategoryType.LOGISTICS_STATUS:
        return ['nodeType', 'specialty'];
      default:
        return [];
    }
  };

  const categoryFields = getCategorySpecificFields();

  return (
    <div className={`search-filters-section ${className}`}>
      <div className="filters-header">
        <div className="filters-title">
          <i className="fas fa-filter"></i>
          <span>فیلترهای جستجو</span>
        </div>
        <div className="filters-controls">
          <button
            type="button"
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'بستن فیلترها' : 'باز کردن فیلترها'}
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClearAllFilters}
              title="پاک کردن همه فیلترها"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            {/* Basic Search */}
            <div className="filter-group">
              <label htmlFor="search-query" className="filter-label">
                جستجو:
              </label>
              <input
                id="search-query"
                type="text"
                value={localFilters.query || ''}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="جستجو در نام و توضیحات..."
                className="filter-input"
              />
            </div>

            {/* Level Filter (single-level maps to [level, level]) */}
            <div className="filter-group">
              <label htmlFor="level-filter" className="filter-label">
                سطح:
              </label>
              <select
                id="level-filter"
                value={(localFilters.levelRange && localFilters.levelRange[0] === localFilters.levelRange[1]) ? String(localFilters.levelRange[0]) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    handleFilterChange('levelRange', [1, 10]);
                  } else {
                    const num = Number(val);
                    handleFilterChange('levelRange', [num, num]);
                  }
                }}
                className="filter-select"
              >
                <option value="">همه سطوح</option>
                <option value="1">سطح 1</option>
                <option value="2">سطح 2</option>
                <option value="3">سطح 3</option>
                <option value="4">سطح 4</option>
                <option value="5">سطح 5</option>
              </select>
            </div>

            {/* Children Filter */}
            <div className="filter-group">
              <label htmlFor="children-filter" className="filter-label">
                فرزندان:
              </label>
              <select
                id="children-filter"
                value={localFilters.hasChildren || 'all'}
                onChange={(e) => handleFilterChange('hasChildren', e.target.value || 'all')}
                className="filter-select"
              >
                <option value="all">همه</option>
                <option value="has">دارای فرزند</option>
                <option value="no">بدون فرزند</option>
              </select>
            </div>

            {/* Category-specific fields */}
            {categoryFields.includes('coordinates') && (
              <div className="filter-group">
                <label htmlFor="coordinates-filter" className="filter-label">
                  مختصات:
                </label>
                <select
                  id="coordinates-filter"
                  value={localFilters.hasCoordinates || 'all'}
                  onChange={(e) => handleFilterChange('hasCoordinates', e.target.value || 'all')}
                  className="filter-select"
                >
                  <option value="all">همه</option>
                  <option value="with">دارای مختصات</option>
                  <option value="without">بدون مختصات</option>
                </select>
              </div>
            )}

            {categoryFields.includes('country') && (
              <div className="filter-group">
                <label htmlFor="country-filter" className="filter-label">
                  کشور:
                </label>
                <input
                  id="country-filter"
                  type="text"
                  value={localFilters.country || ''}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  placeholder="نام کشور..."
                  className="filter-input"
                />
              </div>
            )}

            {categoryFields.includes('natoEquivalent') && (
              <div className="filter-group">
                <label htmlFor="nato-filter" className="filter-label">
                  معادل ناتو:
                </label>
                <select
                  id="nato-filter"
                  value={localFilters.hasNatoEquivalent || 'all'}
                  onChange={(e) => handleFilterChange('hasNatoEquivalent', e.target.value || 'all')}
                  className="filter-select"
                >
                  <option value="all">همه</option>
                  <option value="with">دارای معادل</option>
                  <option value="without">بدون معادل</option>
                </select>
              </div>
            )}

            {categoryFields.includes('specialty') && (
              <div className="filter-group">
                <label htmlFor="specialty-filter" className="filter-label">
                  تخصص:
                </label>
                <input
                  id="specialty-filter"
                  type="text"
                  value={localFilters.specialty || ''}
                  onChange={(e) => handleFilterChange('specialty', e.target.value)}
                  placeholder="تخصص..."
                  className="filter-input"
                />
              </div>
            )}

            {categoryFields.includes('icon') && (
              <div className="filter-group">
                <label htmlFor="icon-filter" className="filter-label">
                  آیکون:
                </label>
                <input
                  id="icon-filter"
                  type="text"
                  value={localFilters.icon || ''}
                  onChange={(e) => handleFilterChange('icon', e.target.value)}
                  placeholder="نام آیکون..."
                  className="filter-input"
                />
              </div>
            )}

            {/* فیلتر تخصص در فاز بعد اضافه می‌شود */}

            {categoryFields.includes('nodeType') && (
              <div className="filter-group">
                <label htmlFor="type-filter" className="filter-label">
                  نوع:
                </label>
                <select
                  id="type-filter"
                  value={localFilters.nodeType || ''}
                  onChange={(e) => handleFilterChange('nodeType', e.target.value)}
                  className="filter-select"
                >
                  <option value="">همه انواع</option>
                  <option value="equipment">تجهیزات</option>
                  <option value="vehicle">خودرو</option>
                  <option value="weapon">سلاح</option>
                  <option value="logistics">تدارکات</option>
                </select>
              </div>
            )}

            {/* فیلتر آیکون در فاز بعد اضافه می‌شود */}
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="apply-btn"
              onClick={handleApplyFilters}
              disabled={!hasActiveFilters}
            >
              <i className="fas fa-check"></i>
              اعمال فیلترها
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFiltersSection;
