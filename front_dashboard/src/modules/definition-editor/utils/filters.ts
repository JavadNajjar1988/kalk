// Utilities برای فیلترها

import { DefinitionNode, SearchFilters } from '../types';

// فیلتر کردن نودها بر اساس فیلترهای جستجو
export function filterNodes(nodes: DefinitionNode[], filters: SearchFilters): DefinitionNode[] {
  return nodes.filter(node => {
    // فیلتر بر اساس جستجو
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const nameMatch = node.name.toLowerCase().includes(query);
      const descriptionMatch = node.description?.toLowerCase().includes(query) || false;
      
      if (filters.searchIn === 'name' && !nameMatch) return false;
      if (filters.searchIn === 'description' && !descriptionMatch) return false;
      if (filters.searchIn === 'both' && !nameMatch && !descriptionMatch) return false;
    }

    // فیلتر بر اساس سطح
    if (node.level < filters.levelRange[0] || node.level > filters.levelRange[1]) {
      return false;
    }

    // فیلتر بر اساس زیرمجموعه‌ها
    const hasChildren = node.children && node.children.length > 0;
    if (filters.hasChildren === 'with' && !hasChildren) return false;
    if (filters.hasChildren === 'without' && hasChildren) return false;

    // فیلتر بر اساس مختصات
    if (filters.hasCoordinates !== 'all') {
      const hasCoordinates = node.coordinates && 
        (node.coordinates.lat !== 0 || node.coordinates.lng !== 0);
      
      if (filters.hasCoordinates === 'with' && !hasCoordinates) return false;
      if (filters.hasCoordinates === 'without' && hasCoordinates) return false;
    }

    // فیلتر بر اساس کشور
    if (filters.country && node.country) {
      if (!node.country.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
    }

    // فیلتر بر اساس معادل ناتو
    if (filters.hasNatoEquivalent !== 'all') {
      const hasNatoEquivalent = node.natoEquivalent && node.natoEquivalent.trim().length > 0;
      if (filters.hasNatoEquivalent === 'with' && !hasNatoEquivalent) return false;
      if (filters.hasNatoEquivalent === 'without' && hasNatoEquivalent) return false;
    }

    // فیلتر بر اساس نوع نود
    if (filters.nodeType === 'countries' && node.level !== 1) return false;
    if (filters.nodeType === 'ranks' && node.level !== 2) return false;

    return true;
  });
}

// فیلتر کردن درخت بر اساس فیلترهای جستجو
export function filterTree(nodes: DefinitionNode[], filters: SearchFilters): DefinitionNode[] {
  function filterNode(node: DefinitionNode): DefinitionNode | null {
    // فیلتر کردن فرزندان
    const filteredChildren = node.children 
      ? node.children.map(filterNode).filter(Boolean) as DefinitionNode[]
      : [];

    // بررسی اینکه آیا نود فعلی یا فرزندانش با فیلترها مطابقت دارند
    const nodeMatches = filterNodes([node], filters).length > 0;
    const hasMatchingChildren = filteredChildren.length > 0;

    if (nodeMatches || hasMatchingChildren) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
  }

  return nodes.map(filterNode).filter(Boolean) as DefinitionNode[];
}

// جستجوی پیشرفته در نودها
export function searchNodes(
  nodes: DefinitionNode[], 
  searchTerm: string, 
  searchFields: ('name' | 'description' | 'country' | 'natoEquivalent')[] = ['name', 'description']
): DefinitionNode[] {
  if (!searchTerm.trim()) {
    return nodes;
  }

  const term = searchTerm.toLowerCase();
  const results: DefinitionNode[] = [];

  function searchInNode(node: DefinitionNode) {
    let matches = false;

    // جستجو در فیلدهای مشخص شده
    if (searchFields.includes('name') && node.name.toLowerCase().includes(term)) {
      matches = true;
    }

    if (searchFields.includes('description') && node.description?.toLowerCase().includes(term)) {
      matches = true;
    }

    if (searchFields.includes('country') && node.country?.toLowerCase().includes(term)) {
      matches = true;
    }

    if (searchFields.includes('natoEquivalent') && node.natoEquivalent?.toLowerCase().includes(term)) {
      matches = true;
    }

    if (matches) {
      results.push(node);
    }

    // جستجو در فرزندان
    if (node.children && node.children.length > 0) {
      node.children.forEach(searchInNode);
    }
  }

  nodes.forEach(searchInNode);
  return results;
}

// فیلتر بر اساس سطح
export function filterByLevel(nodes: DefinitionNode[], level: number): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.level === level) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس محدوده سطح
export function filterByLevelRange(nodes: DefinitionNode[], minLevel: number, maxLevel: number): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.level >= minLevel && node.level <= maxLevel) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس کشور
export function filterByCountry(nodes: DefinitionNode[], country: string): DefinitionNode[] {
  if (!country.trim()) {
    return nodes;
  }

  const countryTerm = country.toLowerCase();
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.country && node.country.toLowerCase().includes(countryTerm)) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس معادل ناتو
export function filterByNatoEquivalent(nodes: DefinitionNode[], hasNatoEquivalent: boolean): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    const hasNato = node.natoEquivalent && node.natoEquivalent.trim().length > 0;
    
    if (hasNato === hasNatoEquivalent) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس وجود مختصات
export function filterByCoordinates(nodes: DefinitionNode[], hasCoordinates: boolean): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    const hasCoords = node.coordinates && 
      (node.coordinates.lat !== 0 || node.coordinates.lng !== 0);
    
    if (hasCoords === hasCoordinates) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس وجود فرزندان
export function filterByChildren(nodes: DefinitionNode[], hasChildren: boolean): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    const hasKids = node.children && node.children.length > 0;
    
    if (hasKids === hasChildren) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس تخصص
export function filterBySpecialty(nodes: DefinitionNode[], specialty: string): DefinitionNode[] {
  if (!specialty.trim()) {
    return nodes;
  }

  const specialtyTerm = specialty.toLowerCase();
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.specialty && node.specialty.toLowerCase().includes(specialtyTerm)) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس آیکون
export function filterByIcon(nodes: DefinitionNode[], icon: string): DefinitionNode[] {
  if (!icon.trim()) {
    return nodes;
  }

  const iconTerm = icon.toLowerCase();
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.icon && node.icon.toLowerCase().includes(iconTerm)) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// ترکیب چندین فیلتر
export function combineFilters(
  nodes: DefinitionNode[], 
  filters: Array<(nodes: DefinitionNode[]) => DefinitionNode[]>
): DefinitionNode[] {
  return filters.reduce((filteredNodes, filter) => filter(filteredNodes), nodes);
}

// فیلتر بر اساس تاریخ ایجاد/ویرایش (اگر metadata موجود باشد)
export function filterByDateRange(
  nodes: DefinitionNode[], 
  startDate: Date, 
  endDate: Date
): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    const anyMeta: any = node.metadata as any;
    if (anyMeta?.createdAt || anyMeta?.updatedAt) {
      const nodeDate = new Date(anyMeta.updatedAt || anyMeta.createdAt!);
      
      if (nodeDate >= startDate && nodeDate <= endDate) {
        results.push(node);
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس اولویت (اگر metadata موجود باشد)
export function filterByPriority(
  nodes: DefinitionNode[], 
  minPriority: number, 
  maxPriority: number
): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.metadata?.priority !== undefined) {
      const priority = node.metadata.priority;
      
      if (priority >= minPriority && priority <= maxPriority) {
        results.push(node);
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس تگ‌ها (اگر metadata موجود باشد)
export function filterByTags(nodes: DefinitionNode[], tags: string[]): DefinitionNode[] {
  if (tags.length === 0) {
    return nodes;
  }

  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.metadata?.tags) {
      const nodeTags = node.metadata.tags;
      const hasMatchingTag = tags.some(tag => nodeTags.includes(tag));
      
      if (hasMatchingTag) {
        results.push(node);
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}

// فیلتر بر اساس قالب (اگر metadata موجود باشد)
export function filterByTemplate(nodes: DefinitionNode[], isTemplate: boolean): DefinitionNode[] {
  const results: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.metadata?.isTemplate === isTemplate) {
      results.push(node);
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return results;
}
