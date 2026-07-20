import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadThreatTypeData } from '../../data/loader';

const ThreatTypeManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.THREAT_TYPE}
      categoryId="threat_type"
      categoryName="نوع تهدید"
      categoryColor="#DC2626"
      maxLevels={12}
      loadNodes={(cid) => loadThreatTypeData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default ThreatTypeManager;


