import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadWeatherData } from '../../data/loader';

const WeatherManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.WEATHER}
      categoryId="weather"
      categoryName="آب و هوا"
      categoryColor="#60a5fa"
      maxLevels={6}
      loadNodes={(cid) => loadWeatherData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default WeatherManager;


