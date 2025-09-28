import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadEquipmentData } from '@/modules/definition-editor/data/loader';
import { useDefinitionSync } from '@/utils/definitionSync';
import type { DefinitionNode } from '@/modules/definition-editor/types';
import type { DefinitionChangeEvent } from '@/utils/definitionSync';

export interface EquipmentNode {
  id: string;
  name: string;
  englishName?: string;
  level: number;
  parentId?: string | null;
  description?: string;
  children: EquipmentNode[];
  customFields: EquipmentFieldDefinition[];
  hasChildren: boolean;
  order?: number;
  isActive?: boolean;
}

export interface EquipmentFieldDefinition {
  id: string;
  name: string;
  englishName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  isRequired: boolean;
  order: number;
  options?: string[];
  unit?: string;
}

export interface EquipmentPath {
  nodeId: string;
  nodeName: string;
  level: number;
}

export interface EquipmentSelection {
  path: EquipmentPath[];
  finalNode: EquipmentNode | null;
  fields: EquipmentFieldDefinition[];
}

/**
 * Hook برای مدیریت ساختار درختی تجهیزات از ماژول ویرایشگر تعاریف
 * این hook امکان انتخاب مسیر کامل در ساختار equipment و دریافت فیلدهای مربوطه را فراهم می‌کند
 * همچنین به‌طور خودکار با تغییرات definition-editor همگام‌سازی می‌شود
 */
export const useEquipmentHierarchy = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rootNodes, setRootNodes] = useState<EquipmentNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<EquipmentPath[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // تنظیم سیستم real-time sync
  const syncCallback = useCallback((event: DefinitionChangeEvent) => {
    console.log('Equipment hierarchy received sync event:', event);
    
    // بررسی اینکه آیا تغییر مربوط به equipment است یا خیر
    if (event.category === 'equipment') {
      console.log('Equipment change detected, refreshing equipment hierarchy data...');
      setLastSyncTime(Date.now());
      setRefreshKey(prev => prev + 1);
    }
  }, []);

  const syncSystem = useDefinitionSync(
    'equipment-hierarchy',
    syncCallback,
    ['equipment'], // فقط به تغییرات equipment گوش دهیم
    ['*'] // به تغییرات همه گره‌ها گوش دهیم
  );

  // راه‌اندازی listener در mount
  useEffect(() => {
    syncSystem.addListener();
    return () => {
      syncSystem.removeListener();
    };
  }, [syncSystem]);

  useEffect(() => {
    const loadEquipmentHierarchy = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading equipment hierarchy data...');

        // بارگذاری داده‌های تجهیزات از definition-editor
        const equipmentData = await loadEquipmentData('equipment');
        
        if (!equipmentData || equipmentData.length === 0) {
          throw new Error('No equipment data found');
        }

        // تبدیل به ساختار EquipmentNode
        const transformedNodes = equipmentData.map(node => 
          transformToEquipmentNode(node)
        );
        
        console.log('Equipment hierarchy loaded successfully:', {
          rootNodesCount: transformedNodes.length,
          syncTime: lastSyncTime
        });
        
        setRootNodes(transformedNodes);

      } catch (err) {
        console.error('Error loading equipment hierarchy:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadEquipmentHierarchy();
  }, [refreshKey, lastSyncTime]);

  /**
   * تبدیل DefinitionNode به EquipmentNode
   */
  const transformToEquipmentNode = (node: DefinitionNode): EquipmentNode => {
    const transformedChildren = (node.children || []).map(child => 
      transformToEquipmentNode(child)
    );

    const transformedFields: EquipmentFieldDefinition[] = (node.customFields || []).map((field: any) => ({
      id: field.id,
      name: field.name,
      englishName: field.englishName || field.name,
      type: field.type as any,
      isRequired: field.isRequired || false,
      order: field.order || 0,
      options: field.options,
      unit: field.unit,
    }));

    return {
      id: node.id,
      name: node.name,
      englishName: (node as any).englishName || node.name,
      level: node.level || 1,
      parentId: node.parentId || null,
      description: node.description,
      children: transformedChildren,
      customFields: transformedFields,
      hasChildren: transformedChildren.length > 0,
      order: (node as any).order || 0,
      isActive: (node as any).isActive !== false,
    };
  };

  /**
   * یافتن گره بر اساس مسیر انتخاب شده
   */
  const findNodeByPath = useCallback((path: EquipmentPath[]): EquipmentNode | null => {
    if (path.length === 0) return null;

    let currentNodes = rootNodes;
    let currentNode: EquipmentNode | null = null;
    
    for (const pathItem of path) {
      const foundNode = currentNodes.find(node => node.id === pathItem.nodeId);
      if (!foundNode) return null;
      
      currentNode = foundNode;
      currentNodes = foundNode.children;
    }

    return currentNode;
  }, [rootNodes]);

  /**
   * به‌روزرسانی مسیر انتخاب شده
   */
  const updateSelectedPath = useCallback((newPath: EquipmentPath[]) => {
    console.log('Updating equipment path:', newPath);
    setSelectedPath(newPath);
  }, []);

  /**
   * اضافه کردن گره به مسیر انتخاب شده
   */
  const addToPath = useCallback((nodeId: string, nodeName: string, level: number) => {
    const newPathItem: EquipmentPath = { nodeId, nodeName, level };
    
    // حذف گره‌هایی که در سطح مساوی یا بالاتر هستند
    const filteredPath = selectedPath.filter(item => item.level < level);
    
    const newPath = [...filteredPath, newPathItem];
    updateSelectedPath(newPath);
  }, [selectedPath, updateSelectedPath]);

  /**
   * پاک کردن مسیر از سطح مشخص شده
   */
  const clearPathFromLevel = useCallback((level: number) => {
    const newPath = selectedPath.filter(item => item.level < level);
    updateSelectedPath(newPath);
  }, [selectedPath, updateSelectedPath]);

  /**
   * بازنشانی کامل مسیر
   */
  const resetPath = useCallback(() => {
    updateSelectedPath([]);
  }, [updateSelectedPath]);

  /**
   * دریافت گزینه‌های موجود برای سطح مشخص شده
   */
  const getOptionsForLevel = useCallback((level: number): EquipmentNode[] => {
    if (level === 1) {
      // سطح اول: root nodes
      return rootNodes;
    }

    // یافتن گره والد برای سطح مورد نظر
    const parentPath = selectedPath.filter(item => item.level < level);
    const parentNode = findNodeByPath(parentPath);
    
    return parentNode?.children || [];
  }, [rootNodes, selectedPath, findNodeByPath]);

  /**
   * دریافت انتخاب نهایی شامل مسیر، گره نهایی و فیلدها
   */
  const getCurrentSelection = useMemo((): EquipmentSelection => {
    const finalNode = findNodeByPath(selectedPath);
    const fields = finalNode?.customFields || [];

    return {
      path: selectedPath,
      finalNode,
      fields
    };
  }, [selectedPath, findNodeByPath]);

  /**
   * تابع refresh برای به‌روزرسانی داده‌ها
   */
  const refresh = useCallback(() => {
    console.log('Manual refresh triggered for equipment hierarchy');
    setRefreshKey(prev => prev + 1);
  }, []);

  // تابع برای trigger کردن sync event به‌صورت دستی
  const triggerManualSync = useCallback(() => {
    console.log('Manual sync triggered for equipment hierarchy');
    syncSystem.triggerSync('equipment');
  }, [syncSystem]);

  return {
    // داده‌های اصلی
    rootNodes,
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
    
    // به‌روزرسانی
    refresh,
    triggerManualSync,
    lastSyncTime
  };
};