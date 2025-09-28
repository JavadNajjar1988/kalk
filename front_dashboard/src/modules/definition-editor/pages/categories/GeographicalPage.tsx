import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, GeographicalManager } from '../../components/base';
import { useSelector } from 'react-redux';
import { selectNodesByCurrentCategory } from '../../store/selectors';
import { useNavigate } from 'react-router-dom';
import { DefinitionNode } from '../../types';

const GeographicalPage: React.FC = () => {
  const navigate = useNavigate();
  const nodes: DefinitionNode[] = useSelector(selectNodesByCurrentCategory);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">تقسیمات جغرافیایی</Typography>
          <Typography variant="caption" color="text.secondary">
            دسته‌بندی مناطق جغرافیایی و تقسیمات کشوری
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>

      {/* Levels manager */}
      <Box sx={{ mt: 2 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.GEOGRAPHICAL} maxLevels={9} />
      </Box>

      {/* Data management (single accordion comes from BaseCategoryManager inside GeographicalManager) */}
      <Box sx={{ mt: 3 }}>
        <GeographicalManager />
      </Box>
    </Box>
  );
};

export default GeographicalPage;


