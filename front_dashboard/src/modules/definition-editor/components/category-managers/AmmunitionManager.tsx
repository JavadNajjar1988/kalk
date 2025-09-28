import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadAmmunitionData } from '../../data/loader';

const AmmunitionManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.AMMUNITION}
      categoryId="ammunition"
      categoryName="مهمات"
      categoryColor="#a855f7"
      maxLevels={3}
      loadNodes={(cid) => loadAmmunitionData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default AmmunitionManager;


