import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadLogisticsData } from '../../data/loader';

const LogisticsStatusManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.LOGISTICS_STATUS}
      categoryId="logistics_status"
      categoryName="وضعیت لجستیکی"
      categoryColor="#D97706"
      maxLevels={12}
      loadNodes={(cid) => loadLogisticsData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default LogisticsStatusManager;


