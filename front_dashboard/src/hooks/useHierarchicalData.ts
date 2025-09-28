import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadPersonsData } from '@/modules/definition-editor/data/loader';
import { useDefinitionSync } from '@/utils/definitionSync';
import type { DefinitionNode } from '@/modules/definition-editor/types';
import type { FieldDefinition } from './useDefinitionData';
import type { DefinitionChangeEvent } from '@/utils/definitionSync';

export interface HierarchicalNode {
  id: string;
  name: string;
  englishName: string;
  level: number;
  parentId: string | null;
  description?: string;
  children: HierarchicalNode[];
  customFields: FieldDefinition[];
  hasChildren: boolean;
}

export interface HierarchicalPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export interface HierarchicalSelection {
  path: HierarchicalPath[];
  finalNode: HierarchicalNode | null;
  fields: FieldDefinition[];
}

/**
 * Hook برای مدیریت ساختار درختی گره‌های اطلاعات حقوقی با پشتیبانی از real-time sync
 * این hook امکان انتخاب مسیر کامل در ساختار hierarchical و دریافت فیلدهای مربوطه را فراهم می‌کند
 * همچنین به‌طور خودکار با تغییرات definition-editor همگام‌سازی می‌شود
 */
export const useHierarchicalData = (categoryType: 'users' | 'resources', legalInfoTabId?: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootNode, setRootNode] = useState<HierarchicalNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<HierarchicalPath[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // تعیین ID گره اطلاعات حقوقی بر اساس نوع دسته‌بندی
  const legalInfoNodeId = useMemo(() => {
    return categoryType === 'users' ? 'pr-2-3' : 'pr-1-2'; // اطلاعات حقوقی
  }, [categoryType]);

  // تنظیم سیستم real-time sync
  const syncCallback = useCallback((event: DefinitionChangeEvent) => {
    console.log('Received definition change event:', event);
    
    // بررسی اینکه آیا تغییر مربوط به گره‌های ما است یا خیر
    if (event.category === 'persons' && 
        (event.nodeId === legalInfoNodeId || event.nodeId === '*')) {
      console.log('Relevant change detected, refreshing hierarchical data...');
      setLastSyncTime(Date.now());
      setRefreshKey(prev => prev + 1);
    }
  }, [legalInfoNodeId]);

  const syncSystem = useDefinitionSync(
    `hierarchical-${categoryType}-${legalInfoNodeId}`,
    syncCallback,
    ['persons'], // فقط به تغییرات persons گوش دهیم
    [legalInfoNodeId] // فقط به تغییرات گره مربوطه گوش دهیم
  );

  // راه‌اندازی listener در mount
  useEffect(() => {
    syncSystem.addListener();
    return () => {
      syncSystem.removeListener();
    };
  }, [syncSystem]);

  useEffect(() => {
    const loadHierarchicalData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Loading hierarchical data for ${categoryType} (${legalInfoNodeId})...`);

        // بارگذاری داده‌های persons
        const personsData = await loadPersonsData('persons');
        
        if (!personsData || personsData.length === 0) {
          throw new Error('No persons data found');
        }

        // یافتن گره اطلاعات حقوقی
        const legalInfoNode = findNodeById(personsData, legalInfoNodeId);
        
        if (!legalInfoNode) {
          throw new Error(`Legal info node not found: ${legalInfoNodeId}`);
        }

        // تبدیل به ساختار HierarchicalNode
        const hierarchicalRoot = transformToHierarchicalNode(legalInfoNode);
        
        console.log('Hierarchical data loaded successfully:', {
          rootId: hierarchicalRoot.id,
          rootName: hierarchicalRoot.name,
          childrenCount: hierarchicalRoot.children.length,
          syncTime: lastSyncTime
        });
        
        setRootNode(hierarchicalRoot);

      } catch (err) {
        console.error('Error loading hierarchical data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadHierarchicalData();
  }, [legalInfoNodeId, refreshKey, lastSyncTime]);

  /**
   * یافتن گره بر اساس ID
   */
  const findNodeById = (nodes: DefinitionNode[], targetId: string): DefinitionNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * تبدیل DefinitionNode به HierarchicalNode
   */
  const transformToHierarchicalNode = (node: DefinitionNode): HierarchicalNode => {
    const transformedChildren = (node.children || []).map(child => 
      transformToHierarchicalNode(child)
    );

    const transformedFields: FieldDefinition[] = (node.customFields || []).map((field: any) => ({
      id: field.id,
      name: field.name,
      englishName: field.englishName || field.name,
      type: field.type as any,
      isRequired: field.isRequired || false,
      order: field.order || 0,
      options: field.options,
      validationRules: field.validationRules,
      referenceCategory: field.referenceCategory,
      referencePath: field.referencePath,
      referenceDisplayField: field.referenceDisplayField,
      referenceValueField: field.referenceValueField,
    }));

    return {
      id: node.id,
      name: node.name,
      englishName: (node as any).englishName || node.name,
      level: node.level || 0,
      parentId: node.parentId || null,
      description: node.description,
      children: transformedChildren,
      customFields: transformedFields,
      hasChildren: transformedChildren.length > 0
    };
  };

  /**
   * یافتن گره بر اساس مسیر انتخاب شده
   */
  const findNodeByPath = (path: HierarchicalPath[]): HierarchicalNode | null => {
    if (!rootNode || path.length === 0) return null;

    let currentNode: HierarchicalNode | null = rootNode;
    
    for (const pathItem of path) {
      if (!currentNode) return null;
      
      if (currentNode.id === pathItem.nodeId) {
        continue; // اگر گره جاری همان گره مورد نظر است
      }

      // جستجو در فرزندان
      const child: HierarchicalNode | undefined = currentNode.children.find((childNode: HierarchicalNode) => childNode.id === pathItem.nodeId);
      if (!child) return null;
      
      currentNode = child;
    }

    return currentNode;
  };

  /**
   * به‌روزرسانی مسیر انتخاب شده
   */
  const updateSelectedPath = (newPath: HierarchicalPath[]) => {
    console.log('Updating hierarchical path:', newPath);
    setSelectedPath(newPath);
  };

  /**
   * اضافه کردن گره به مسیر انتخاب شده
   */
  const addToPath = (nodeId: string, nodeName: string, level: number) => {
    const newPathItem: HierarchicalPath = { nodeId, nodeName, level };
    
    // حذف گره‌هایی که در سطح مساوی یا بالاتر هستند
    const filteredPath = selectedPath.filter(item => item.level < level);
    
    const newPath = [...filteredPath, newPathItem];
    updateSelectedPath(newPath);
  };

  /**
   * پاک کردن مسیر از سطح مشخص شده
   */
  const clearPathFromLevel = (level: number) => {
    const newPath = selectedPath.filter(item => item.level < level);
    updateSelectedPath(newPath);
  };

  /**
   * بازنشانی کامل مسیر
   */
  const resetPath = () => {
    updateSelectedPath([]);
  };

  /**
   * دریافت گزینه‌های موجود برای سطح مشخص شده
   */
  const getOptionsForLevel = (level: number): HierarchicalNode[] => {
    if (!rootNode) return [];

    if (level === rootNode.level + 1) {
      // سطح اول زیرمجموعه‌ها
      return rootNode.children;
    }

    // یافتن گره والد برای سطح مورد نظر
    const parentPath = selectedPath.filter(item => item.level < level);
    const parentNode = findNodeByPath(parentPath);
    
    return parentNode?.children || [];
  };

  /**
   * دریافت انتخاب نهایی شامل مسیر، گره نهایی و فیلدها
   */
  const getCurrentSelection = useMemo((): HierarchicalSelection => {
    const finalNode = findNodeByPath(selectedPath);
    const fields = finalNode?.customFields || [];

    return {
      path: selectedPath,
      finalNode,
      fields
    };
  }, [selectedPath, rootNode]);

  /**
   * تابع refresh برای به‌روزرسانی داده‌ها (manual و از طریق sync events)
   */
  const refresh = useCallback(() => {
    console.log('Manual refresh triggered for hierarchical data');
    setRefreshKey(prev => prev + 1);
    setSelectedPath([]); // پاک کردن مسیر بدون استفاده از resetPath
  }, []);

  /**
   * تابع برای trigger کردن sync event به‌صورت دستی (مفید برای تست)
   */
  const triggerManualSync = useCallback(() => {
    console.log('Manual sync triggered');
    syncSystem.triggerSync('persons', legalInfoNodeId);
  }, [syncSystem, legalInfoNodeId]);

  /**
   * دریافت اطلاعات آخرین sync
   */
  const getSyncInfo = useCallback(() => {
    return {
      lastSyncTime,
      syncHistory: syncSystem.getHistory().slice(-5), // آخرین 5 event
      isAutoSyncEnabled: true
    };
  }, [lastSyncTime, syncSystem]);

  return {
    // داده‌های اصلی
    rootNode,
    loading,
    error,
    
    // مسیر انتخاب شده
    selectedPath,
    getCurrentSelection,
    
    // عملیات مسیر
    addToPath,
    clearPathFromLevel,
    resetPath,
    updateSelectedPath,
    
    // کمکی
    getOptionsForLevel,
    findNodeByPath,
    
    // به‌روزرسانی و همگام‌سازی
    refresh,
    triggerManualSync,
    getSyncInfo,
    lastSyncTime
  };
};

export default useHierarchicalData;