import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase, MilitaryRanksManager } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const MilitaryRanksPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">درجات نظامی</Typography>
          <Typography variant="caption" color="text.secondary">
            سلسله مراتب درجات نظامی و رتبه‌های مختلف
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.MILITARY_RANKS} />
      <Box sx={{ mt: 3 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.MILITARY_RANKS} maxLevels={9} />
      </Box>
      <Box sx={{ mt: 3 }}>
        <MilitaryRanksManager />
      </Box>
    </Box>
  );
};

export default MilitaryRanksPage;


