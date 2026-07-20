import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadOperationalStatusData } from '../../data/loader';

const OperationalStatusManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.OPERATIONAL_STATUS}
      categoryId="operational_status"
      categoryName="وضعیت عملیاتی"
      categoryColor="#06B6D4"
      maxLevels={12}
      loadNodes={(cid) => loadOperationalStatusData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default OperationalStatusManager;


