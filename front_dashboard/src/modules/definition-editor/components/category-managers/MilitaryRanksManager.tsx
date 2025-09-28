import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadMilitaryRanksData, loadCategoryLevels } from '../../data/loader';

const MilitaryRanksManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.MILITARY_RANKS}
      categoryId="military_ranks"
      categoryName="درجات نظامی"
      categoryColor="#EF4444"
      maxLevels={9}
      loadNodes={loadMilitaryRanksData}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default MilitaryRanksManager;


