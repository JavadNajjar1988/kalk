import { CustomField, TreeNode } from '../types/equipment';

// تولید ID منحصر به فرد برای فیلد
export const generateFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// تولید ID منحصر به فرد برای گره
export const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// بررسی اعتبارسنجی فیلد
export const validateField = (field: Partial<CustomField>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!field.name?.trim()) {
    errors.push('نام فیلد الزامی است');
  }

  if (!field.englishName?.trim()) {
    errors.push('نام انگلیسی فیلد الزامی است');
  }

  if (!field.type) {
    errors.push('نوع فیلد الزامی است');
  }

  if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
    errors.push('حداقل یک گزینه برای فیلدهای انتخاب الزامی است');
  }

  if (field.order && field.order < 1) {
    errors.push('ترتیب نمایش باید بزرگتر از صفر باشد');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// اعتبارسنجی مقدار فیلد
export const validateFieldValue = (field: CustomField, value: any): { isValid: boolean; error?: string } => {
  // بررسی فیلدهای اجباری
  if (field.isRequired) {
    if (value === undefined || value === null || value === '') {
      return { isValid: false, error: 'این فیلد الزامی است' };
    }
  }

  // اگر مقدار خالی است و اجباری نیست، معتبر است
  if (value === undefined || value === null || value === '') {
    return { isValid: true };
  }

  // بررسی قوانین اعتبارسنجی
  if (field.validationRules) {
    if (field.type === 'text') {
      if (field.validationRules.minLength && value.length < field.validationRules.minLength) {
        return { 
          isValid: false, 
          error: `حداقل ${field.validationRules.minLength} کاراکتر وارد کنید` 
        };
      }
      
      if (field.validationRules.maxLength && value.length > field.validationRules.maxLength) {
        return { 
          isValid: false, 
          error: `حداکثر ${field.validationRules.maxLength} کاراکتر مجاز است` 
        };
      }
    }

    if (field.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: 'مقدار وارد شده عددی نیست' };
      }

      if (field.validationRules.minValue && numValue < field.validationRules.minValue) {
        return { 
          isValid: false, 
          error: `حداقل مقدار مجاز ${field.validationRules.minValue} است` 
        };
      }

      if (field.validationRules.maxValue && numValue > field.validationRules.maxValue) {
        return { 
          isValid: false, 
          error: `حداکثر مقدار مجاز ${field.validationRules.maxValue} است` 
        };
      }
    }

    if (field.validationRules.pattern && !new RegExp(field.validationRules.pattern).test(value)) {
      return { isValid: false, error: 'فرمت وارد شده صحیح نیست' };
    }
  }

  return { isValid: true };
};

// پیدا کردن گره در درخت بر اساس ID
export const findNodeById = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
};

// پیدا کردن مسیر کامل به گره
export const findNodePath = (nodes: TreeNode[], nodeId: string): string[] => {
  const findPath = (nodes: TreeNode[], targetId: string, currentPath: string[] = []): string[] | null => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      
      if (node.id === targetId) {
        return newPath;
      }
      
      if (node.children) {
        const found = findPath(node.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  return findPath(nodes, nodeId) || [];
};

// دریافت نام‌های فارسی مسیر
export const getPathNames = (nodes: TreeNode[], path: string[]): string => {
  if (!path.length) return '';
  
  const findNodeName = (id: string): string => {
    const node = findNodeById(nodes, id);
    return node ? node.name : id;
  };
  
  return path.map(findNodeName).join(' > ');
};

// مرتب‌سازی فیلدها بر اساس ترتیب
export const sortFieldsByOrder = (fields: CustomField[]): CustomField[] => {
  return [...fields].sort((a, b) => a.order - b.order);
};

// کپی عمیق درخت
export const deepCloneTree = (nodes: TreeNode[]): TreeNode[] => {
  return nodes.map(node => ({
    ...node,
    children: node.children ? deepCloneTree(node.children) : undefined,
    customFields: node.customFields ? [...node.customFields] : undefined
  }));
};

// بررسی تکراری بودن نام فیلد
export const isFieldNameDuplicate = (fields: CustomField[], fieldName: string, excludeId?: string): boolean => {
  return fields.some(field => 
    field.name.toLowerCase() === fieldName.toLowerCase() && 
    field.id !== excludeId
  );
};

// بررسی تکراری بودن نام انگلیسی فیلد
export const isFieldEnglishNameDuplicate = (fields: CustomField[], englishName: string, excludeId?: string): boolean => {
  return fields.some(field => 
    field.englishName.toLowerCase() === englishName.toLowerCase() && 
    field.id !== excludeId
  );
};
