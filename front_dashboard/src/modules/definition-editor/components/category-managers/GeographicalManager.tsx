import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadGeographicalData, loadCategoryLevels } from '../../data/loader';

const GeographicalManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.GEOGRAPHICAL}
      categoryId="geographical"
      categoryName="تقسیمات جغرافیایی"
      categoryColor="#3B82F6"
      maxLevels={9}
      loadNodes={loadGeographicalData}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default GeographicalManager;


