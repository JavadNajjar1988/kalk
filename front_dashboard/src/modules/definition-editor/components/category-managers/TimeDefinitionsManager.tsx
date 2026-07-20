import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadCategoryNodes } from '../../data/loader';

const TimeDefinitionsManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.TIME_DEFINITIONS}
      categoryId="time_definitions"
      categoryName="واحدهای زمان و دوره"
      categoryColor="#F97316"
      maxLevels={5}
      loadNodes={(cid) => loadCategoryNodes(CategoryType.TIME_DEFINITIONS, cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default TimeDefinitionsManager;


