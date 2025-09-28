// Utilities برای عملیات درخت

import { DefinitionNode } from '../types';

// تبدیل آرایه مسطح به ساختار درخت
export function buildTreeFromFlatArray(nodes: DefinitionNode[]): DefinitionNode[] {
  const nodeMap = new Map<string, DefinitionNode>();
  const rootNodes: DefinitionNode[] = [];

  // ابتدا تمام نودها را در Map قرار می‌دهیم
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // سپس روابط parent-child را برقرار می‌کنیم
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id)!;
    
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parentNode = nodeMap.get(node.parentId)!;
      parentNode.children!.push(currentNode);
    } else {
      rootNodes.push(currentNode);
    }
  });

  return rootNodes;
}

// تبدیل ساختار درخت به آرایه مسطح
export function flattenTreeToArray(nodes: DefinitionNode[]): DefinitionNode[] {
  const result: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    const { children, ...nodeWithoutChildren } = node;
    result.push(nodeWithoutChildren);
    
    if (children && children.length > 0) {
      children.forEach(child => traverse(child));
    }
  }

  nodes.forEach(node => traverse(node));
  return result;
}

// پیدا کردن نود بر اساس ID
export function findNodeById(nodes: DefinitionNode[], id: string): DefinitionNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  
  return null;
}

// پیدا کردن مسیر نود (از ریشه تا نود مورد نظر)
export function findNodePath(nodes: DefinitionNode[], targetId: string): DefinitionNode[] {
  const path: DefinitionNode[] = [];

  function traverse(node: DefinitionNode): boolean {
    path.push(node);
    
    if (node.id === targetId) {
      return true;
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (traverse(child)) {
          return true;
        }
      }
    }
    
    path.pop();
    return false;
  }

  for (const node of nodes) {
    if (traverse(node)) {
      break;
    }
  }

  return path;
}

// پیدا کردن تمام فرزندان یک نود
export function getAllChildren(node: DefinitionNode): DefinitionNode[] {
  const children: DefinitionNode[] = [];

  function traverse(currentNode: DefinitionNode) {
    if (currentNode.children && currentNode.children.length > 0) {
      currentNode.children.forEach(child => {
        children.push(child);
        traverse(child);
      });
    }
  }

  traverse(node);
  return children;
}

// پیدا کردن تمام والدین یک نود
export function getAllParents(nodes: DefinitionNode[], targetId: string): DefinitionNode[] {
  const path = findNodePath(nodes, targetId);
  return path.slice(0, -1); // حذف خود نود از مسیر
}

// بررسی اینکه آیا یک نود فرزند نود دیگر است
export function isDescendant(nodes: DefinitionNode[], parentId: string, childId: string): boolean {
  const parent = findNodeById(nodes, parentId);
  if (!parent) return false;

  const allChildren = getAllChildren(parent);
  return allChildren.some(child => child.id === childId);
}

// پیدا کردن تمام نودهای سطح خاص
export function getNodesByLevel(nodes: DefinitionNode[], level: number): DefinitionNode[] {
  const result: DefinitionNode[] = [];

  function traverse(node: DefinitionNode) {
    if (node.level === level) {
      result.push(node);
    }
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child));
    }
  }

  nodes.forEach(node => traverse(node));
  return result;
}

// پیدا کردن عمیق‌ترین سطح در درخت
export function getMaxLevel(nodes: DefinitionNode[]): number {
  let maxLevel = 0;

  function traverse(node: DefinitionNode) {
    maxLevel = Math.max(maxLevel, node.level);
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child));
    }
  }

  nodes.forEach(node => traverse(node));
  return maxLevel;
}

// شمارش تعداد نودها در هر سطح
export function countNodesByLevel(nodes: DefinitionNode[]): Record<number, number> {
  const counts: Record<number, number> = {};

  function traverse(node: DefinitionNode) {
    counts[node.level] = (counts[node.level] || 0) + 1;
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child));
    }
  }

  nodes.forEach(node => traverse(node));
  return counts;
}

// مرتب‌سازی نودها بر اساس سطح و نام
export function sortNodes(nodes: DefinitionNode[]): DefinitionNode[] {
  function sortNodeArray(nodeArray: DefinitionNode[]): DefinitionNode[] {
    return nodeArray.sort((a, b) => {
      // ابتدا بر اساس سطح
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      // سپس بر اساس نام
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: node.children ? sortNodeArray(node.children) : []
    }));
  }

  return sortNodeArray(nodes);
}

// کپی کردن درخت
export function cloneTree(nodes: DefinitionNode[]): DefinitionNode[] {
  function cloneNode(node: DefinitionNode): DefinitionNode {
    return {
      ...node,
      children: node.children ? node.children.map(cloneNode) : []
    };
  }

  return nodes.map(cloneNode);
}

// فیلتر کردن درخت بر اساس شرط
export function filterTree(
  nodes: DefinitionNode[], 
  predicate: (node: DefinitionNode) => boolean
): DefinitionNode[] {
  function filterNode(node: DefinitionNode): DefinitionNode | null {
    const filteredChildren = node.children 
      ? node.children.map(filterNode).filter(Boolean) as DefinitionNode[]
      : [];

    if (predicate(node) || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
  }

  return nodes.map(filterNode).filter(Boolean) as DefinitionNode[];
}

// تبدیل درخت به ساختار قابل نمایش در جدول
export function treeToTableData(nodes: DefinitionNode[]): DefinitionNode[] {
  const result: DefinitionNode[] = [];

  function traverse(node: DefinitionNode, depth: number = 0) {
    result.push({
      ...node,
      metadata: {
        ...node.metadata
      }
    });

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  }

  nodes.forEach(node => traverse(node));
  return result;
}

// بررسی اعتبار ساختار درخت
export function validateTreeStructure(nodes: DefinitionNode[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  function traverse(node: DefinitionNode, parentLevel: number = 0) {
    // بررسی تکراری نبودن ID
    if (nodeIds.has(node.id)) {
      errors.push(`نود با ID تکراری یافت شد: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }

    // بررسی سطح
    if (node.level <= parentLevel) {
      errors.push(`سطح نود ${node.id} نامعتبر است`);
    }

    // بررسی parentId
    if (node.parentId && !nodeIds.has(node.parentId)) {
      errors.push(`parentId نامعتبر برای نود ${node.id}: ${node.parentId}`);
    }

    // بررسی فرزندان
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child, node.level));
    }
  }

  nodes.forEach(node => traverse(node));

  return {
    isValid: errors.length === 0,
    errors
  };
}
