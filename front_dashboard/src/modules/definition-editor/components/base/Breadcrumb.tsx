import React from 'react';
import { Box, Typography } from '@mui/material';
import { CategoryType } from '../../types';

interface BreadcrumbProps {
  categoryType: CategoryType;
  path?: string[];
}

const labels: Record<CategoryType, string> = {
  geographical: 'تقسیمات جغرافیایی',
  military_ranks: 'درجات نظامی',
  unit_structures: 'ساختار رده‌های نظامی',
  equipment: 'تجهیزات و سامانه‌ها',
  mission_type: 'نوع مأموریت',
  operational_status: 'وضعیت عملیاتی',
  operational_environment: 'محیط عملیاتی',
  time_definitions: 'واحدهای زمان و دوره',
  coding_classification: 'تعاریف فنی و کدگذاری',
  force_type: 'نوع واحد نظامی',
  organizational_affiliation: 'وابستگی سازمانی',

  threat_type: 'نوع تهدید',
  info_classification: 'سطح طبقه‌بندی اطلاعات',
  logistics_status: 'وضعیت لجستیکی',
  logistics: 'لجستیک',
  ammunition: 'مهمات',
  weather: 'آب و هوا',
  persons: 'اشخاص',
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ categoryType, path = [] }) => {
  const items = [labels[categoryType], ...path];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
      {items.map((p, i) => (
        <React.Fragment key={`${p}-${i}`}>
          <Typography variant="caption" color={i === items.length - 1 ? 'text.primary' : 'text.secondary'}>
            {p}
          </Typography>
          {i < items.length - 1 && <Typography variant="caption">/</Typography>}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default Breadcrumb;


