// Utilities برای عملیات گراف

import { DefinitionNode, GraphNode, GraphEdge, GraphConfig } from '../types';
import { flattenTreeToArray } from './treeOperations';

// تبدیل نودهای درخت به نودهای گراف
export function convertNodesToGraphNodes(nodes: DefinitionNode[]): GraphNode[] {
  const flatNodes = flattenTreeToArray(nodes);
  
  return flatNodes.map(node => ({
    id: node.id,
    label: node.name,
    data: node,
    position: undefined, // موقعیت توسط layout engine تعیین می‌شود
    style: {
      backgroundColor: getNodeColorByLevel(node.level),
      borderColor: '#374151',
      borderWidth: 2,
      borderRadius: 8,
      fontSize: 14,
      fontColor: '#ffffff',
      fontWeight: '600',
      padding: 8,
      width: 120,
      height: 60,
      icon: node.icon,
      iconColor: '#ffffff',
      iconSize: 16
    },
    metadata: {
      level: node.level,
      parentId: node.parentId,
      childrenCount: node.children?.length || 0
    }
  }));
}

// تبدیل نودهای درخت به لبه‌های گراف
export function convertNodesToGraphEdges(nodes: DefinitionNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  function traverse(node: DefinitionNode) {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          style: {
            color: '#6B7280',
            width: 2,
            style: 'solid'
          }
        });
        
        traverse(child);
      });
    }
  }
  
  nodes.forEach(traverse);
  return edges;
}

// تولید رنگ بر اساس سطح نود
export function getNodeColorByLevel(level: number): string {
  const colors = [
    '#3B82F6', // آبی - سطح 1
    '#EF4444', // قرمز - سطح 2
    '#10B981', // سبز - سطح 3
    '#F59E0B', // نارنجی - سطح 4
    '#8B5CF6', // بنفش - سطح 5
    '#06B6D4', // آبی روشن - سطح 6
    '#F97316', // نارنجی تیره - سطح 7
    '#84CC16', // سبز روشن - سطح 8
    '#EC4899', // صورتی - سطح 9
    '#6366F1'  // بنفش روشن - سطح 10
  ];
  
  return colors[(level - 1) % colors.length];
}

// تولید رنگ بر اساس نوع دسته‌بندی
export function getNodeColorByCategory(categoryType: string): string {
  const colorMap: Record<string, string> = {
    'geographical': '#3B82F6',
    'military_ranks': '#EF4444',
    'military_units': '#10B981',
    'equipment': '#F59E0B',
    'mission_type': '#8B5CF6',
    'operational_status': '#06B6D4',
    'logistics_status': '#F97316',
    'operational_environment': '#84CC16',
    'time_definitions': '#EC4899',
    'technical_codes': '#6366F1',
    'force_type': '#14B8A6',
    'organizational_affiliation': '#F43F5E',
    'specialty_training': '#A855F7',
    'threat_type': '#EAB308',
    'info_classification': '#22C55E'
  };
  
  return colorMap[categoryType] || '#6B7280';
}

// محاسبه موقعیت نودها برای layout درختی
export function calculateTreeLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[]
): GraphNode[] {
  const nodeMap = new Map<string, GraphNode>();
  const childrenMap = new Map<string, string[]>();
  const levelMap = new Map<number, string[]>();
  
  // ایجاد map از نودها
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // ایجاد map از فرزندان
  edges.forEach(edge => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
  });
  
  // گروه‌بندی نودها بر اساس سطح
  nodes.forEach(node => {
    const level = node.data?.level || 1;
    const levelNodes = levelMap.get(level) || [];
    levelNodes.push(node.id);
    levelMap.set(level, levelNodes);
  });
  
  // محاسبه موقعیت‌ها
  const levelSpacing = 200;
  const nodeSpacing = 150;
  
  levelMap.forEach((nodeIds, level) => {
    const y = level * levelSpacing;
    const totalWidth = (nodeIds.length - 1) * nodeSpacing;
    const startX = -totalWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position = {
          x: startX + index * nodeSpacing,
          y: y
        };
      }
    });
  });
  
  return nodes;
}

// محاسبه موقعیت نودها برای layout دایره‌ای
export function calculateCircularLayout(
  nodes: GraphNode[]
): GraphNode[] {
  const centerX = 0;
  const centerY = 0;
  const radius = 300;
  
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    node.position = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
  
  return nodes;
}

// محاسبه موقعیت نودها برای layout نیرو
export function calculateForceLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[]
): GraphNode[] {
  // این یک پیاده‌سازی ساده است
  // در عمل، از کتابخانه‌هایی مثل d3-force استفاده می‌شود
  
  const iterations = 100;
  const springLength = 100;
  const springCoeff = 0.1;
  const damping = 0.9;
  
  // مقداردهی اولیه موقعیت‌ها
  nodes.forEach(node => {
    if (!node.position) {
      node.position = {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400
      };
    }
  });
  
  // شبیه‌سازی نیرو
  for (let i = 0; i < iterations; i++) {
    const forces = new Map<string, { x: number; y: number }>();
    
    // مقداردهی اولیه نیروها
    nodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });
    
    // محاسبه نیروهای فنر بین نودهای متصل
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (source?.position && target?.position) {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = (distance - springLength) * springCoeff;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          const sourceForce = forces.get(source.id)!;
          const targetForce = forces.get(target.id)!;
          
          sourceForce.x -= fx;
          sourceForce.y -= fy;
          targetForce.x += fx;
          targetForce.y += fy;
        }
      }
    });
    
    // اعمال نیروها
    nodes.forEach(node => {
      const force = forces.get(node.id)!;
      if (node.position) {
        node.position.x += force.x * damping;
        node.position.y += force.y * damping;
      }
    });
  }
  
  return nodes;
}

// محاسبه موقعیت نودها برای layout سلسله‌مراتبی
export function calculateHierarchicalLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[]
): GraphNode[] {
  const nodeMap = new Map<string, GraphNode>();
  const childrenMap = new Map<string, string[]>();
  const levelMap = new Map<number, string[]>();
  
  // ایجاد map از نودها
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // ایجاد map از فرزندان
  edges.forEach(edge => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
  });
  
  // گروه‌بندی نودها بر اساس سطح
  nodes.forEach(node => {
    const level = node.data?.level || 1;
    const levelNodes = levelMap.get(level) || [];
    levelNodes.push(node.id);
    levelMap.set(level, levelNodes);
  });
  
  // محاسبه موقعیت‌ها

  const levelSpacing = 150;
  const nodeSpacing = 120;
  
  levelMap.forEach((nodeIds, level) => {
    const y = level * levelSpacing;
    const totalWidth = (nodeIds.length - 1) * nodeSpacing;
    const startX = -totalWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position = {
          x: startX + index * nodeSpacing,
          y: y
        };
      }
    });
  });
  
  return nodes;
}

// محاسبه layout بر اساس نوع
export function calculateLayout(
  nodes: GraphNode[], 
  edges: GraphEdge[], 
  config: GraphConfig
): GraphNode[] {
  switch (config.layout) {
    case 'hierarchical':
      return calculateHierarchicalLayout(nodes, edges);
    case 'tree':
      return calculateTreeLayout(nodes, edges);
    case 'force':
      return calculateForceLayout(nodes, edges);
    case 'circular':
      return calculateCircularLayout(nodes);
    default:
      return calculateHierarchicalLayout(nodes, edges);
  }
}

// محاسبه مرکز گراف
export function calculateGraphCenter(nodes: GraphNode[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const positions = nodes
    .map(node => node.position)
    .filter(Boolean) as { x: number; y: number }[];
  
  if (positions.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const sumX = positions.reduce((sum, pos) => sum + pos.x, 0);
  const sumY = positions.reduce((sum, pos) => sum + pos.y, 0);
  
  return {
    x: sumX / positions.length,
    y: sumY / positions.length
  };
}

// محاسبه محدوده گراف
export function calculateGraphBounds(nodes: GraphNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  const positions = nodes
    .map(node => node.position)
    .filter(Boolean) as { x: number; y: number }[];
  
  if (positions.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  const xCoords = positions.map(pos => pos.x);
  const yCoords = positions.map(pos => pos.y);
  
  return {
    minX: Math.min(...xCoords),
    minY: Math.min(...yCoords),
    maxX: Math.max(...xCoords),
    maxY: Math.max(...yCoords)
  };
}

// محاسبه فاصله بین دو نود
export function calculateDistance(node1: GraphNode, node2: GraphNode): number {
  if (!node1.position || !node2.position) {
    return 0;
  }
  
  const dx = node2.position.x - node1.position.x;
  const dy = node2.position.y - node1.position.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}

// پیدا کردن نزدیک‌ترین نود به یک نقطه
export function findNearestNode(
  nodes: GraphNode[], 
  point: { x: number; y: number }
): GraphNode | null {
  if (nodes.length === 0) {
    return null;
  }
  
  let nearestNode: GraphNode | null = null;
  let minDistance = Infinity;
  
  nodes.forEach(node => {
    if (node.position) {
      const distance = Math.sqrt(
        Math.pow(point.x - node.position.x, 2) + 
        Math.pow(point.y - node.position.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
  });
  
  return nearestNode;
}

// پیدا کردن نودهای در محدوده
export function findNodesInRange(
  nodes: GraphNode[], 
  center: { x: number; y: number }, 
  radius: number
): GraphNode[] {
  return nodes.filter(node => {
    if (!node.position) {
      return false;
    }
    
    const distance = Math.sqrt(
      Math.pow(center.x - node.position.x, 2) + 
      Math.pow(center.y - node.position.y, 2)
    );
    
    return distance <= radius;
  });
}
