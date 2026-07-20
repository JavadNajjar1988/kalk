import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadEquipmentData, loadCategoryLevels } from '../../data/loader';

const EquipmentManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.EQUIPMENT}
      categoryId="equipment"
      categoryName="تجهیزات و سامانه‌ها"
      categoryColor="#F59E0B"
      maxLevels={7}
      loadNodes={loadEquipmentData}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default EquipmentManager;


