import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { CategoryType } from '../../types';
import { FieldsManagerBase, HierarchyLevelsManagerBase } from '../../components/base';
import { useNavigate } from 'react-router-dom';

const ThreatTypePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      {/* Header with title/description and back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">نوع تهدید</Typography>
          <Typography variant="caption" color="text.secondary">
            انواع مختلف تهدیدات نظامی
          </Typography>
        </Box>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>بازگشت</Button>
      </Box>
      <FieldsManagerBase categoryType={CategoryType.THREAT_TYPE} />
      <Box sx={{ mt: 3 }}>
        <HierarchyLevelsManagerBase categoryType={CategoryType.THREAT_TYPE} maxLevels={9} />
      </Box>
    </Box>
  );
};

export default ThreatTypePage;


