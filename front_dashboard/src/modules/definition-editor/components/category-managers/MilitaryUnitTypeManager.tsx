import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadMilitaryUnitTypeData } from '../../data/loader';

const MilitaryUnitTypeManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.FORCE_TYPE}
      categoryId="force_type"
      categoryName="نوع واحد نظامی"
      categoryColor="#EC4899"
      maxLevels={3}
      loadNodes={(cid) => loadMilitaryUnitTypeData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default MilitaryUnitTypeManager;