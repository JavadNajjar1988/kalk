import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadMilitaryUnitsData } from '../../data/loader';

const MilitaryUnitsManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.MILITARY_UNITS}
      categoryId="unit_structures"
      categoryName="ساختار رده‌های نظامی"
      categoryColor="#10B981"
      maxLevels={11}
      loadNodes={(cid) => loadMilitaryUnitsData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default MilitaryUnitsManager;


