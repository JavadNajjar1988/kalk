// صفحه اصلی Definition Editor

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { 
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  fetchNodes, 
  fetchLevels, 
  setCurrentCategory,
  setSearchTerm,
  setSelectedStatus,
  setSelectedCategoryFilter,
  setSortOption,
  clearError
} from '../store/definitionEditorSlice';
import { useNavigate } from 'react-router-dom';
import { CategoryType, DefinitionCategory } from '../types';
import CategoryCard from '../components/CategoryCard';
import SearchAndFilter from '../components/SearchAndFilter';
import CategoryEditModal from '../components/dialogs/CategoryEditModal';
import { loadCategoryNodes, loadCategoryLevels } from '../data/loader';

// Categories are now loaded from JSON metadata instead of hardcoded array

// Memoized selector
const selectDefinitionEditorPageState = createSelector(
  [(state: any) => state.definitionEditor || {}],
  (definitionEditor) => ({
    loadingStatus: definitionEditor.loadingStatus,
    error: definitionEditor.error,
    searchTerm: definitionEditor.searchTerm,
    selectedStatus: definitionEditor.selectedStatus,
    selectedCategoryFilter: definitionEditor.selectedCategoryFilter,
    sortOption: definitionEditor.sortOption,
    currentCategory: definitionEditor.currentCategory
  })
);

interface DefinitionEditorPageProps {
  categoryType?: CategoryType;
}

const DefinitionEditorPage: React.FC<DefinitionEditorPageProps> = ({
  categoryType = CategoryType.GEOGRAPHICAL
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const {
    loadingStatus,
    error,
    searchTerm,
    selectedStatus,
    selectedCategoryFilter,
    sortOption,
    currentCategory
  } = useSelector(selectDefinitionEditorPageState);

  // Local state - load categories from JSON metadata
  const [categories, setCategories] = React.useState<DefinitionCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);

  // Load categories from metadata on mount
  React.useEffect(() => {
    const loadCategoriesFromMetadata = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);
        
        const module = await import('@/modules/definition-editor/data/json/categories-metadata.json');
        const metadata = module.default || module;
        
        // Convert metadata to DefinitionCategory format
        const categoriesArray: DefinitionCategory[] = Object.values(metadata).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          englishName: cat.englishName,
          description: cat.description,
          icon: cat.icon?.replace(/[🗺️🎖️🎯📊🌍⏰💻🛡️🏢🎓⚠️🔒📦🌤️]/g, '') || 'category', // Convert emoji to string
          color: cat.color,
          maxLevels: cat.maxLevels,
          isActive: cat.isActive,
          order: cat.order,
          type: getCategoryTypeFromId(cat.id) // Helper function to map ID to CategoryType
        })).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setCategories(categoriesArray);
      } catch (err) {
        console.error('Failed to load categories metadata:', err);
        setCategoriesError('خطا در بارگذاری دسته‌بندی‌ها');
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategoriesFromMetadata();
  }, []);
  
  // Helper function to map category ID to CategoryType enum
  const getCategoryTypeFromId = (id: string): CategoryType => {
    const mapping: Record<string, CategoryType> = {
      'geographical': CategoryType.GEOGRAPHICAL,
      'military_ranks': CategoryType.MILITARY_RANKS,
      'military_units': CategoryType.MILITARY_UNITS,
      'equipment': CategoryType.EQUIPMENT,
      'mission_type': CategoryType.MISSION_TYPE,
      'operational_status': CategoryType.OPERATIONAL_STATUS,
      'operational_environment': CategoryType.OPERATIONAL_ENVIRONMENT,
      'time_definitions': CategoryType.TIME_DEFINITIONS,
      'coding_classification': CategoryType.CODING_CLASSIFICATION,
      'force_type': CategoryType.FORCE_TYPE,
      'organizational_affiliation': CategoryType.ORGANIZATIONAL_AFFILIATION,
      'threat_type': CategoryType.THREAT_TYPE,
      'info_classification': CategoryType.INFO_CLASSIFICATION,
      'logistics_status': CategoryType.LOGISTICS_STATUS,
      'ammunition': CategoryType.AMMUNITION,
      'weather': CategoryType.WEATHER,
      'persons': CategoryType.PERSONS,
      'logistics': CategoryType.LOGISTICS // Map logistics to new LOGISTICS type
    };
    return mapping[id] || CategoryType.GEOGRAPHICAL;
  };

  // تنظیم دسته‌بندی فعلی
  useEffect(() => {
    const category = categories.find(cat => cat.type === categoryType);
    if (category) {
      dispatch(setCurrentCategory(category));
    }
  }, [categoryType, dispatch]);

  // لود داده‌ها
  useEffect(() => {
    const category = categories.find(cat => cat.type === categoryType);
    if (category) {
      dispatch(fetchNodes({
        categoryType: category.type,
        categoryId: category.id
      }));
      dispatch(fetchLevels(category.type));
    }
  }, [categoryType, dispatch]);

  // prefetch سبک برای دسته‌بندی‌های دیگر جهت کاهش زمان انتظار در تغییر دسته
  useEffect(() => {
    const others = categories.filter(cat => cat.type !== categoryType);
    others.forEach((cat) => {
      // prefetch levels and nodes; خطاها نادیده گرفته می‌شوند
      loadCategoryLevels(cat.type).catch(() => {});
      loadCategoryNodes(cat.type, cat.id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryType]);

  // Event handlers
  const handleCategorySelect = (category: DefinitionCategory) => {
    dispatch(setCurrentCategory(category));
    // ناوبری به صفحه اختصاصی دسته‌بندی
    const map: Record<string, string> = {
      geographical: 'geographical',
      military_ranks: 'military-ranks',
      military_units: 'military-units',
      equipment: 'equipment',
      mission_type: 'mission-type',
      operational_status: 'operational-status',
      operational_environment: 'operational-environment',
      time_definitions: 'time-definitions',
      coding_classification: 'coding-classification',
      force_type: 'force-type',
      organizational_affiliation: 'organizational-affiliation',
      specialty_training: 'specialty-training',
      threat_type: 'threat-type',
      info_classification: 'info-classification',
      logistics_status: 'logistics-status',
      ammunition: 'ammunition',
      weather: 'weather',
      persons: 'persons',
      logistics: 'logistics',
    };
    const path = map[category.id] || '';
    if (path) {
      navigate(`/dashboard/definition-editor/${path}`);
    }
  };

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<DefinitionCategory | undefined>(undefined);

  const handleCategoryEdit = (category: DefinitionCategory) => {
    setEditingCategory(category);
    setEditOpen(true);
  };

  const handleCategoryDelete = (category: DefinitionCategory) => {
    // TODO: Implement category delete
    console.log('Delete category:', category);
  };

  const handleSearchChange = (term: string) => {
    dispatch(setSearchTerm(term));
  };

  const handleStatusChange = (status: string) => {
    dispatch(setSelectedStatus(status));
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    dispatch(setSelectedCategoryFilter(categoryId));
  };

  const handleSortChange = (option: string) => {
    dispatch(setSortOption(option));
  };

  // حذف منطق انتخاب دسته‌ها و عملیات گروهی

  // Filter data based on search and filters
  const filteredCategories = categories.filter(category => {
    const matchesSearch = searchTerm === '' || 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.englishName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && category.isActive) ||
      (selectedStatus === 'inactive' && !category.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const sortedCategories = filteredCategories.slice().sort((a, b) => {
    if (sortOption === 'order') return a.order - b.order;
    if (sortOption === 'name') return a.name.localeCompare(b.name, 'fa');
    return 0;
  });

  if (categoriesLoading || (loadingStatus === 'fetching' && !currentCategory)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            در حال بارگذاری...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (categoriesError || error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: '3rem', color: 'error.main', mb: 2 }}>
            ⚠️
          </Box>
          <Alert severity="error" sx={{ maxWidth: 400 }} onClose={() => dispatch(clearError())}>
            {categoriesError || error}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* بخش اصلی صفحه */}
      <Box sx={{ p: 3 }}>
        {/* هدر و توضیحات */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
            مدیریت تعاریف پایه
          </Typography>
        </Box>
        
        {/* نمایش دسته‌بندی‌ها */}
        <Box>
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
              selectedCategory={selectedCategoryFilter}
              onCategoryChange={handleCategoryFilterChange}
              categories={categories}
              isDefinitionView={false}
              sortOption={sortOption}
              onSortChange={handleSortChange}
            />
            
            <Grid container spacing={3}>
              {sortedCategories.map((category) => (
                <Grid item xs={12} md={6} lg={4} key={category.id}>
                  <CategoryCard
                    category={category}
                    onEdit={handleCategoryEdit}
                    onDelete={handleCategoryDelete}
                    onSelect={handleCategorySelect}
                  />
                </Grid>
              ))}
            </Grid>
        </Box>

        {/* حالت خالی */}
        {categories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }}>
              📁
            </Box>
            <Typography variant="h6" color="text.primary" gutterBottom>
              هیچ دسته‌بندی‌ای یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary">
              دسته‌بندی‌های پیش‌فرض در حال بارگذاری هستند...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Category Edit Modal */}
      <CategoryEditModal
        open={editOpen}
        category={editingCategory}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => {
          if (!editingCategory) { setEditOpen(false); return; }
          setCategories(prev => prev.map(cat => (
            cat.id === editingCategory.id
              ? { ...cat, ...data }
              : cat
          )));
          setEditOpen(false);
        }}
      />
    </>
  );
};

export default DefinitionEditorPage;
