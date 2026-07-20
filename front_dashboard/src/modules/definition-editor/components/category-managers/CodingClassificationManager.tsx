import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadCodingClassificationData } from '../../data/loader';

const CodingClassificationManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.CODING_CLASSIFICATION}
      categoryId="coding_classification"
      categoryName="تعاریف فنی و کدگذاری"
      categoryColor="#6366F1"
      maxLevels={5}
      loadNodes={(cid) => loadCodingClassificationData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default CodingClassificationManager;


