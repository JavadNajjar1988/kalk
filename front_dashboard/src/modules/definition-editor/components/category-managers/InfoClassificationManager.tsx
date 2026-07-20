import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadInfoClassificationData } from '../../data/loader';

const InfoClassificationManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.INFO_CLASSIFICATION}
      categoryId="info_classification"
      categoryName="سطح طبقه‌بندی اطلاعات"
      categoryColor="#7C3AED"
      maxLevels={12}
      loadNodes={(cid) => loadInfoClassificationData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default InfoClassificationManager;


