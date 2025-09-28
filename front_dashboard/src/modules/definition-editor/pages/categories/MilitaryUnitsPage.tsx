import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, MilitaryUnitsManager } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const MilitaryUnitsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">ساختار رده‌های نظامی</Typography>
          <Typography variant="caption" color="text.secondary">
            ساختار سازمانی یگان‌های نظامی و رده‌های مختلف
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.MILITARY_UNITS} />
      <Box sx={{ mt: 3 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.MILITARY_UNITS} maxLevels={11} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <MilitaryUnitsManager />
      </Box>
    </Box>
  );
};

export default MilitaryUnitsPage;


