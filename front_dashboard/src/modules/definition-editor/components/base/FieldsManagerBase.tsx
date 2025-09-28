import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { CategoryType } from '../../types';
import { loadEquipmentData, loadAmmunitionData, loadPersonsData, loadLogisticsData, loadLogisticsSupplyData, saveCategoryNodes } from '../../data/loader';
import type { DefinitionNode } from '../../types';
import EquipmentFieldsModule from '../EquipmentFieldsModule';
import { TreeNode } from '../../types/equipment';

// تعریف نوع داده برای دسته‌بندی محلی
interface LocalDefinitionCategory {
  id: string;
  name: string;
  englishName: string;
  description?: string;
  icon?: string;
  color?: string;
  maxLevels: number;
  isActive: boolean;
  order: number;
}

interface FieldsManagerBaseProps {
  categoryType: CategoryType;
}

const FieldsManagerBase: React.FC<FieldsManagerBaseProps> = ({ categoryType }) => {
  // حالت‌های کامپوننت
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [category, setCategory] = useState<LocalDefinitionCategory | null>(null);

  // بررسی اینکه آیا این دسته‌بندی از مدیریت فیلدهای تجهیزات پشتیبانی می‌کند
  const supportsEquipmentFields = categoryType === CategoryType.EQUIPMENT || categoryType === CategoryType.AMMUNITION || categoryType === CategoryType.PERSONS || categoryType === CategoryType.LOGISTICS;

  // تنظیم دسته‌بندی بر اساس categoryType
  useEffect(() => {
    const getCategoryConfig = (): LocalDefinitionCategory => {
      switch (categoryType) {
        case CategoryType.EQUIPMENT:
          return {
            id: 'equipment',
            name: 'تجهیزات و سامانه‌ها',
            englishName: 'Equipment & Systems',
            description: 'مدیریت فیلدهای تجهیزات و سامانه‌ها',
            maxLevels: 7,
            isActive: true,
            order: 4
          };
        case CategoryType.AMMUNITION:
          return {
            id: 'ammunition',
            name: 'مهمات',
            englishName: 'Ammunition',
            description: 'مدیریت فیلدهای مهمات و ملزومات رزمی',
            maxLevels: 5,
            isActive: true,
            order: 16
          };
        case CategoryType.MILITARY_RANKS:
          return {
            id: 'personnel',
            name: 'نیروی انسانی',
            englishName: 'Personnel',
            description: 'مدیریت فیلدهای نیروی انسانی',
            maxLevels: 5,
            isActive: true,
            order: 1
          };
        case CategoryType.MILITARY_UNITS:
          return {
            id: 'organization',
            name: 'سازمان‌ها',
            englishName: 'Organizations',
            description: 'مدیریت فیلدهای سازمان‌ها',
            maxLevels: 6,
            isActive: true,
            order: 2
          };
        case CategoryType.GEOGRAPHICAL:
          return {
            id: 'location',
            name: 'مکان‌ها',
            englishName: 'Locations',
            description: 'مدیریت فیلدهای مکان‌ها',
            maxLevels: 4,
            isActive: true,
            order: 3
          };
        case CategoryType.PERSONS:
          return {
            id: 'persons',
            name: 'اشخاص',
            englishName: 'Persons',
            description: 'مدیریت فیلدهای منابع و کاربران',
            maxLevels: 3,
            isActive: true,
            order: 18
          };
        case CategoryType.LOGISTICS:
          return {
            id: 'logistics',
            name: 'لجستیک',
            englishName: 'Logistics',
            description: 'مدیریت فیلدهای تدارکات و لجستیک',
            maxLevels: 5,
            isActive: true,
            order: 18
          };
        default:
          return {
            id: 'default',
            name: 'دسته‌بندی پیش‌فرض',
            englishName: 'Default Category',
            description: 'مدیریت فیلدهای پیش‌فرض',
            maxLevels: 5,
            isActive: true,
            order: 0
          };
      }
    };

    setCategory(getCategoryConfig());
    
    // لود داده‌های واقعی از فایل JSON/کش برای تجهیزات
    const loadTreeData = async () => {
      try {
        if (categoryType === CategoryType.EQUIPMENT) {
          const nodes = await loadEquipmentData('equipment');
          setTreeData((nodes as unknown as TreeNode[]) || []);
          return;
        }
        if (categoryType === CategoryType.AMMUNITION) {
          const nodes = await loadAmmunitionData('ammunition');
          setTreeData((nodes as unknown as TreeNode[]) || []);
          return;
        }
        if (categoryType === CategoryType.PERSONS) {
          const nodes = await loadPersonsData('persons');
          setTreeData((nodes as unknown as TreeNode[]) || []);
          return;
        }
        if (categoryType === CategoryType.LOGISTICS) {
          const nodes = await loadLogisticsSupplyData('logistics');
          setTreeData((nodes as unknown as TreeNode[]) || []);
          return;
        }
        // پیش‌فرض: اگر دسته پشتیبانی نشود، یک ریشه خالی نمایش بده
        const defaultTreeData: TreeNode[] = [
          {
            id: 'root',
            name: 'ریشه',
            englishName: 'Root',
            order: 1,
            children: []
          }
        ];
        setTreeData(defaultTreeData);
      } catch (err) {
        console.error('Error loading tree data:', err);
        setTreeData([]);
      }
    };

    loadTreeData();
  }, [categoryType]);

  // مدیریت تغییرات درخت
  const handleTreeDataChange = async (newTreeData: TreeNode[]) => {
    setTreeData(newTreeData);
    try {
      if (category && categoryType === CategoryType.EQUIPMENT) {
        await saveCategoryNodes(
          CategoryType.EQUIPMENT,
          category.id,
          (newTreeData as unknown as DefinitionNode[])
        );
      } else if (category && categoryType === CategoryType.AMMUNITION) {
        await saveCategoryNodes(
          CategoryType.AMMUNITION,
          category.id,
          (newTreeData as unknown as DefinitionNode[])
        );
      } else if (category && categoryType === CategoryType.PERSONS) {
        await saveCategoryNodes(
          CategoryType.PERSONS,
          category.id,
          (newTreeData as unknown as DefinitionNode[])
        );
      } else if (category && categoryType === CategoryType.LOGISTICS) {
        await saveCategoryNodes(
          CategoryType.LOGISTICS,
          category.id,
          (newTreeData as unknown as DefinitionNode[])
        );
      }
    } catch (err) {
      console.error('Error saving tree data:', err);
    }
  };

  if (!category) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          در حال بارگذاری...
        </Typography>
      </Box>
    );
  }

  // اگر این دسته‌بندی از مدیریت فیلدهای تجهیزات پشتیبانی نمی‌کند، هیچ‌چیزی نمایش نده
  if (!supportsEquipmentFields) {
    return null;
  }

  return (
    <Box>
      <EquipmentFieldsModule
        category={category}
        treeData={treeData}
        onTreeDataChange={handleTreeDataChange}
      />
    </Box>
  );
};

export default FieldsManagerBase;


