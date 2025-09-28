import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadOperationalEnvironmentData } from '../../data/loader';

const OperationalEnvironmentManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.OPERATIONAL_ENVIRONMENT}
      categoryId="operational_environment"
      categoryName="محیط عملیاتی"
      categoryColor="#84CC16"
      maxLevels={12}
      loadNodes={(cid) => loadOperationalEnvironmentData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default OperationalEnvironmentManager;


