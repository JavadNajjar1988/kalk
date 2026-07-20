import React from 'react';
import BaseCategoryManager from './BaseCategoryManager';
import { CategoryType } from '../../types';
import { loadCategoryLevels, loadOrganizationalAffiliationData } from '../../data/loader';

const OrganizationalAffiliationManager: React.FC = () => {
  return (
    <BaseCategoryManager
      categoryType={CategoryType.ORGANIZATIONAL_AFFILIATION}
      categoryId="organizational_affiliation"
      categoryName="وابستگی سازمانی"
      categoryColor="#6B7280"
      maxLevels={3}
      loadNodes={(cid) => loadOrganizationalAffiliationData(cid)}
      loadLevels={loadCategoryLevels}
    />
  );
};

export default OrganizationalAffiliationManager;


