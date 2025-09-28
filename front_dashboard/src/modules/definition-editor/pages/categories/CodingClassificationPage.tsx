import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, CodingClassificationManager } from '../../components/base';
import { useNavigate } from 'react-router-dom';
import { clearCategoryCache } from '../../data/loader';

const CodingClassificationPage: React.FC = () => {
  const navigate = useNavigate();

  // اطمینان از لود پیش‌فرض‌ها از JSON (پاکسازی کش و localStorage مرتبط با این دسته)
  React.useEffect(() => {
    try {
      const storageKey = `definition_editor_${CategoryType.CODING_CLASSIFICATION}_coding_classification`;
      localStorage.removeItem(storageKey);
      clearCategoryCache(CategoryType.CODING_CLASSIFICATION);
    } catch {}
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">تعاریف فنی و کدگذاری</Typography>
          <Typography variant="caption" color="text.secondary">
            کدها و طبقه‌بندی‌های فنی نظامی
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>

      {/* آکاردئون مدیریت سطوح سلسله‌مراتبی */}
      <Box sx={{ mt: 2 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.CODING_CLASSIFICATION} maxLevels={5} />
      </Box>

      {/* آکاردئون مدیریت داده‌های دسته‌بندی */}
      <Box sx={{ mt: 3 }}>
        <CodingClassificationManager />
      </Box>
    </Box>
  );
};

export default CodingClassificationPage;


