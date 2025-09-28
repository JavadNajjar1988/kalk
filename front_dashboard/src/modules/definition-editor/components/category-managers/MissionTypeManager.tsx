import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadMissionTypeData } from '../../data/loader';

const MissionTypeManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.MISSION_TYPE}
      categoryId="mission_type"
      categoryName="نوع مأموریت"
      categoryColor="#8B5CF6"
      maxLevels={5}
      loadNodes={(cid) => loadMissionTypeData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default MissionTypeManager;


