import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  Background,
  ReactFlow,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  Handle,
  Position,
  NodeResizer,
} from '@xyflow/react';
import * as dagre from '@dagrejs/dagre';
import { Box, Paper, Typography, IconButton, useTheme, Chip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import TimelineIcon from '@mui/icons-material/Timeline';
import LockIcon from '@mui/icons-material/Lock';

import GraphToolbar from './GraphToolbar';
import Breadcrumb from './Breadcrumb';
import ZoomControls from './ZoomControls';
import '@xyflow/react/dist/style.css';
import '../styles/graph.css';

// نوع داده ورودی (همان GeoNode)
interface GeoNode {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  children?: GeoNode[];
}

interface SimpleGraphViewerProps {
  data: GeoNode[];
  selectedNode?: GeoNode | null;
  onNodeSelect?: (node: GeoNode | null) => void;
  onNodeEdit?: (node: GeoNode) => void;
  getLevelName?: (level: number) => string;
  onGraphChange?: (newGeoData: GeoNode[]) => void; // اضافه کردن prop جدید
}

// ایجاد dagreGraph جدید برای هر instance
const createDagreGraph = () => new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const defaultNodeWidth = 140;
const defaultNodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB', spacing: 'compact' | 'normal' | 'wide' = 'normal') => {
  const isHorizontal = direction === 'LR';
  const dagreGraph = createDagreGraph();
  // تنظیم فاصله بر اساس حالت
  let ranksep = 60, nodesep = 30, edgesep = 10;
  if (spacing === 'compact') {
    ranksep = 30; nodesep = 15; edgesep = 5;
  } else if (spacing === 'wide') {
    ranksep = 120; nodesep = 60; edgesep = 20;
  }
  dagreGraph.setGraph({ rankdir: direction, ranksep, nodesep, edgesep });

  nodes.forEach((node) => {
    const width = (node.style?.width as number) || defaultNodeWidth;
    const height = (node.style?.height as number) || defaultNodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.style?.width as number) || defaultNodeWidth;
    const height = (node.style?.height as number) || defaultNodeHeight;
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: (nodeWithPosition.x as number) - width / 2,
        y: (nodeWithPosition.y as number) - height / 2,
      },
    } as any;

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const SimpleGraphViewer: React.FC<SimpleGraphViewerProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  onNodeEdit,
  getLevelName = (level) => `سطح ${level}`,
  onGraphChange
}) => {
  const theme = useTheme();
  // --- useState ها و useNodesState/useEdgesState در ابتدای کامپوننت ---
  const [isResizeEnabled, setIsResizeEnabled] = React.useState(false);
  const [focusedNode, setFocusedNode] = React.useState<GeoNode | null>(null);
  const [isFocusedView, setIsFocusedView] = React.useState(false);
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(new Set());
  const [groups, setGroups] = React.useState<{ id: string, nodeIds: string[], color: string }[]>([]);
  const [showConnections, setShowConnections] = React.useState(true);
  const [spacing, setSpacing] = React.useState<'compact' | 'normal' | 'wide'>('normal');
  const [edgeType, setEdgeType] = React.useState<'smoothstep' | 'straight' | 'step'>('smoothstep');
  const [lockedNodeIds, setLockedNodeIds] = React.useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = React.useState<Node[]>([]);
  // Undo/Redo history
  const [history, setHistory] = React.useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  // فلگ داخلی برای جلوگیری از لوپ هنگام Undo/Redo
  const isUndoRedoing = React.useRef(false);
  

  // تابع تبدیل nodes گراف به ساختار GeoNode
  const convertNodesToGeoNodes = useCallback((graphNodes: Node[], graphEdges: Edge[]): GeoNode[] => {
    const nodeMap = new Map<string, GeoNode>();
    const childrenMap = new Map<string, string[]>();
    
    // ابتدا همه nodes را به GeoNode تبدیل کن
    graphNodes.forEach(node => {
      const nodeData = node.data as any;
      const geoNode: GeoNode = {
        id: node.id,
        name: nodeData?.label || nodeData?.name || 'گره بدون نام',
        level: nodeData?.level || 1,
        description: nodeData?.description,
        coordinates: nodeData?.coordinates,
        children: []
      };
      nodeMap.set(node.id, geoNode);
    });
    
    // روابط parent-child را از edges استخراج کن
    graphEdges.forEach(edge => {
      const parentId = edge.source;
      const childId = edge.target;
      
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(childId);
    });
    
    // ساختار سلسله‌مراتبی را بساز
    const rootNodes: GeoNode[] = [];
    
    nodeMap.forEach((geoNode, nodeId) => {
      const children = childrenMap.get(nodeId) || [];
      geoNode.children = children.map(childId => nodeMap.get(childId)!).filter(Boolean);
      
      // اگر این گره فرزند هیچ گره‌ای نیست، آن را به عنوان ریشه در نظر بگیر
      const isChild = Array.from(childrenMap.values()).some(childList => 
        childList.includes(nodeId)
      );
      
      if (!isChild) {
        rootNodes.push(geoNode);
      }
    });
    
    return rootNodes;
  }, []);

  // --- داده‌های نمایشی و layout ---
  // تابع فیلتر کردن داده‌ها برای نمایش متمرکز
  const getFocusedViewData = useCallback((originalData: GeoNode[], focusNode: GeoNode): GeoNode[] => {
    const result: GeoNode[] = [];
    const findParentAndSiblings = (nodes: GeoNode[], targetId: string, parent?: GeoNode): GeoNode[] => {
      for (const node of nodes) {
        if (node.id === targetId) {
          const focusedNode: GeoNode = {
            ...node,
            children: node.children || []
          };
          if (parent) {
            result.push({ ...parent, children: [focusedNode] });
          } else {
            result.push(focusedNode);
          }
          return result;
        }
        if (node.children) {
          const found = findParentAndSiblings(node.children, targetId, node);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findParentAndSiblings(originalData, focusNode.id);
  }, []);

  // 1. داده‌های ورودی و فیلترشده
  const displayData = useMemo(() => {
    if (isFocusedView && focusedNode) {
      return getFocusedViewData(data, focusedNode);
    }
    return data;
  }, [data, isFocusedView, focusedNode, getFocusedViewData]);

  // 2. تبدیل به nodes و edges اولیه
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const processNode = (geoNode: GeoNode, parentId?: string) => {
      nodes.push({
        id: geoNode.id,
        type: 'geoNode',
        data: {
          label: geoNode.name,
          level: geoNode.level,
          levelName: getLevelName(geoNode.level),
          description: geoNode.description,
          coordinates: geoNode.coordinates,
          isSelected: selectedNode?.id === geoNode.id
        },
        position: { x: 0, y: 0 },
        style: {
          width: defaultNodeWidth,
          height: defaultNodeHeight,
        },
      });
      if (parentId) {
        edges.push({
          id: `${parentId}-${geoNode.id}`,
          source: parentId,
          target: geoNode.id,
          type: edgeType,
          animated: true,
        });
      }
      if (geoNode.children && geoNode.children.length > 0) {
        geoNode.children.forEach((child) => {
          processNode(child, geoNode.id);
        });
      }
    };
    displayData.forEach((rootNode) => {
      processNode(rootNode);
    });
    return { initialNodes: nodes, initialEdges: edges };
  }, [displayData, selectedNode, getLevelName, edgeType]);

  // 3. layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const result = getLayoutedElements(initialNodes || [], initialEdges || [], 'TB', spacing);
    return result;
  }, [initialNodes, initialEdges, spacing]);

  // 4. state اصلی گراف - باید قبل از تعریف توابع باشد
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges || []);
  
  // ReactFlow instance برای کنترل zoom - باید داخل ReactFlowProvider باشد
  // const reactFlowInstance = useReactFlow();
  
  // Search و Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filteredNodes, setFilteredNodes] = React.useState<GeoNode[]>([]);
  
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // حذف useEffect ثبت خودکار history
  // تعریف تابع pushHistory
  const pushHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
      return newHistory;
    });
    setHistoryIndex(idx => idx + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    isUndoRedoing.current = true;
    setHistoryIndex(idx => idx - 1);
    const prev = history[historyIndex - 1];
    if (prev) {
      setNodes(JSON.parse(JSON.stringify(prev.nodes)));
      setEdges(JSON.parse(JSON.stringify(prev.edges)));
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedoing.current = true;
    setHistoryIndex(idx => idx + 1);
    const next = history[historyIndex + 1];
    if (next) {
      setNodes(JSON.parse(JSON.stringify(next.nodes)));
      setEdges(JSON.parse(JSON.stringify(next.edges)));
    }
  }, [history, historyIndex]);



  // onNodesChange با پشتیبانی از جابجایی گروهی و قفل
  // فقط از onNodesChange اصلی استفاده شود

  const onConnect = useCallback(
    (params: any) => {
      const newEdges = addEdge({ ...params, type: 'smoothstep', animated: true }, edges);
      setEdges(newEdges);
      
      // همگام‌سازی با ساختار درختی
      if (onGraphChange) {
        const newGeoData = convertNodesToGeoNodes(nodes, newEdges);
        onGraphChange(newGeoData);
      }
    },
    [edges, setEdges, nodes, onGraphChange, convertNodesToGeoNodes],
  );

  const onLayout = useCallback(
    (direction: 'TB' | 'LR') => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction,
      );

      setNodes(layoutedNodes as any[]);
      setEdges(layoutedEdges);
      
      // همگام‌سازی با ساختار درختی
      if (onGraphChange) {
        const newGeoData = convertNodesToGeoNodes(layoutedNodes, layoutedEdges);
        onGraphChange(newGeoData);
      }
    },
    [nodes, edges, setNodes, setEdges, onGraphChange, convertNodesToGeoNodes],
  );

  // پیدا کردن GeoNode اصلی برای callback
  const findGeoNodeById = useCallback((id: string): GeoNode | null => {
    const search = (nodes: GeoNode[]): GeoNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(data);
  }, [data]);

  const onNodeClick = useCallback((event: any, node: Node) => {
    const geoNode = findGeoNodeById(node.id);
    onNodeSelect?.(geoNode);
    
    // اضافه کردن به انتخاب‌ها
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  }, [findGeoNodeById, onNodeSelect]);

  // انتخاب همه گره‌ها
  const handleSelectAll = useCallback(() => {
    const allNodeIds = nodes.map(node => node.id);
    setSelectedNodes(new Set(allNodeIds));
  }, [nodes]);

  // لغو انتخاب همه
  const handleClearSelection = useCallback(() => {
    setSelectedNodes(new Set());
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // حذف گره‌های انتخاب شده
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.size === 0) return;
    const nodesToKeep = nodes.filter(node => !selectedNodes.has(node.id) || lockedNodeIds.has(node.id));
    const edgesToKeep = edges.filter(edge => 
      !selectedNodes.has(edge.source) && !selectedNodes.has(edge.target)
    );
    setNodes(nodesToKeep);
    setEdges(edgesToKeep);
    setSelectedNodes(new Set());
    pushHistory(nodesToKeep, edgesToKeep);
    
    // همگام‌سازی با ساختار درختی
    if (onGraphChange) {
      const newGeoData = convertNodesToGeoNodes(nodesToKeep, edgesToKeep);
      onGraphChange(newGeoData);
    }
  }, [selectedNodes, nodes, edges, lockedNodeIds, setNodes, setEdges, pushHistory, onGraphChange, convertNodesToGeoNodes]);

  // در پایان drag گره
  const onNodeDragStop = useCallback((event: any, node: any) => {
    pushHistory(nodes, edges);
    
    // همگام‌سازی با ساختار درختی
    if (onGraphChange) {
      const newGeoData = convertNodesToGeoNodes(nodes, edges);
      onGraphChange(newGeoData);
    }
  }, [nodes, edges, pushHistory, onGraphChange, convertNodesToGeoNodes]);

  // در پایان resize گره
  const onNodeResizeStop = useCallback((event: any, node: any) => {
    pushHistory(nodes, edges);
    
    // همگام‌سازی با ساختار درختی
    if (onGraphChange) {
      const newGeoData = convertNodesToGeoNodes(nodes, edges);
      onGraphChange(newGeoData);
    }
  }, [nodes, edges, pushHistory, onGraphChange, convertNodesToGeoNodes]);

  // بعد از تغییر سایز (resize)
  const handleResizeSelected = useCallback((width: number, height: number) => {
    if (selectedNodes.size === 0) return;
    const updatedNodes = nodes.map(node => {
      if (selectedNodes.has(node.id)) {
        return {
          ...node,
          style: {
            ...node.style,
            width,
            height,
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    pushHistory(updatedNodes, edges);
  }, [selectedNodes, nodes, setNodes, edges, pushHistory]);

  // تابع تولید رنگ تصادفی
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // بعد از تغییر رنگ
  const handleChangeColor = useCallback(() => {
    if (selectedNodes.size === 0) return;
    const randomColor = getRandomColor();
    const updatedNodes = nodes.map(node => {
      if (selectedNodes.has(node.id)) {
        return {
          ...node,
          style: {
            ...node.style,
            background: randomColor,
            border: `2px solid ${randomColor}`,
          },
        };
      }
      return node;
    });
    setNodes(updatedNodes);
    pushHistory(updatedNodes, edges);
  }, [selectedNodes, nodes, setNodes, edges, pushHistory]);

  // تابع تغییر نوع خطوط
  const handleChangeEdgeType = useCallback(() => {
    setEdgeType(prev => prev === 'smoothstep' ? 'straight' : prev === 'straight' ? 'step' : 'smoothstep');
  }, []);

  // گروه‌بندی گره‌های انتخاب شده
  const handleGroupSelected = useCallback(() => {
    if (selectedNodes.size < 2) return; // حداقل دو گره برای گروه‌بندی
    const groupId = 'group_' + Math.random().toString(36).substr(2, 6);
    const color = getRandomColor();
    const newGroups = [...groups, { id: groupId, nodeIds: Array.from(selectedNodes), color }];
    setGroups(newGroups);
    pushHistory(nodes, edges);
    
    // همگام‌سازی با ساختار درختی
    if (onGraphChange) {
      const newGeoData = convertNodesToGeoNodes(nodes, edges);
      onGraphChange(newGeoData);
    }
  }, [selectedNodes, groups, nodes, edges, pushHistory, onGraphChange, convertNodesToGeoNodes]);

  // قفل/باز کردن قفل گره‌های انتخاب شده
  const handleToggleLockSelected = useCallback(() => {
    if (selectedNodes.size === 0) return;
    setLockedNodeIds(prev => {
      const newSet = new Set(prev);
      const action = selectedNodes.size === 1 && newSet.has(Array.from(selectedNodes)[0]) ? 'باز کردن قفل' : 'قفل کردن';
      selectedNodes.forEach(id => {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      });
      pushHistory(nodes, edges);
      return newSet;
    });
  }, [selectedNodes, nodes, edges, pushHistory]);

  // کپی گره‌های انتخاب شده
  const handleCopySelected = useCallback(() => {
    if (selectedNodes.size === 0) return;
    const nodesToCopy = nodes.filter(node => selectedNodes.has(node.id) && !lockedNodeIds.has(node.id));
    setClipboard(nodesToCopy);
    console.log('کپی شد:', nodesToCopy);
  }, [selectedNodes, nodes, lockedNodeIds]);

  // چسباندن گره‌های کپی شده
  const handlePasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return;
    console.log('پیست شروع شد. Clipboard:', clipboard);
    
    const newNodes = clipboard.map(node => {
      const newId = 'node_' + Math.random().toString(36).substr(2, 6);
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        selected: false,
        style: { ...node.style },
      };
    });
    
    console.log('گره‌های جدید:', newNodes);
    
    const allNodes = [...nodes, ...newNodes];
    setNodes(allNodes);
    setSelectedNodes(new Set(newNodes.map(n => n.id)));
    pushHistory(allNodes, edges);
    
    // همگام‌سازی با ساختار درختی
    if (onGraphChange) {
      const newGeoData = convertNodesToGeoNodes(allNodes, edges);
      console.log('داده‌های جدید برای درخت:', newGeoData);
      onGraphChange(newGeoData);
    }
  }, [clipboard, nodes, edges, setNodes, pushHistory, onGraphChange, convertNodesToGeoNodes]);

  // پیدا کردن رنگ گروه برای هر گره
  const getNodeGroupColor = useCallback((nodeId: string) => {
    const group = groups.find(g => g.nodeIds.includes(nodeId));
    return group ? group.color : undefined;
  }, [groups]);

  // تابع جستجو در گره‌ها
  const handleSearch = useCallback(() => {
    const term = prompt('جستجو در گره‌ها:');
    if (term === null) return;
    
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredNodes([]);
      return;
    }
    
    const results = data.filter(node => 
      node.name.toLowerCase().includes(term.toLowerCase()) ||
      node.description?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredNodes(results);
    
    if (results.length > 0) {
      // انتخاب اولین نتیجه
      onNodeSelect?.(results[0]);
    }
  }, [data, onNodeSelect]);

  // تابع فیلتر کردن گره‌ها
  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
    if (!isFilterOpen) {
      // نمایش همه گره‌ها
      setFilteredNodes([]);
      setSearchTerm('');
    }
  }, [isFilterOpen]);

  // تابع تنظیمات
  const handleSettings = useCallback(() => {
    const settings = [
      'تغییر اندازه گره‌ها: ' + (isResizeEnabled ? 'فعال' : 'غیرفعال'),
      'نمایش اتصالات: ' + (showConnections ? 'فعال' : 'غیرفعال'),
      'نوع خطوط: ' + edgeType,
      'فاصله‌گذاری: ' + spacing,
      'تعداد گره‌ها: ' + nodes.length,
      'تعداد اتصالات: ' + edges.length,
      'گره‌های انتخاب شده: ' + selectedNodes.size,
      'گروه‌ها: ' + groups.length,
      'گره‌های قفل شده: ' + lockedNodeIds.size
    ];
    
    alert('تنظیمات گراف:\n\n' + settings.join('\n'));
  }, [isResizeEnabled, showConnections, edgeType, spacing, nodes.length, edges.length, selectedNodes.size, groups.length, lockedNodeIds.size]);

  // تابع تست برای بررسی عملکرد کپی و پیست
  const testCopyPaste = useCallback(() => {
    console.log('تست کپی و پیست:');
    console.log('Clipboard:', clipboard);
    console.log('Selected Nodes:', selectedNodes);
    console.log('Current Nodes:', nodes);
    console.log('Current Edges:', edges);
  }, [clipboard, selectedNodes, nodes, edges]);

  // Custom Node Component
  const GeoNodeComponent = useCallback(({ data, selected }: { data: any; selected?: boolean }) => {
    const isSelected = data.isSelected || selected || selectedNodes.has(data.id);
    const groupColor = getNodeGroupColor(data.id);
    const isLocked = lockedNodeIds.has(data.id);
    const colors = {
      primary: theme.palette.primary.main,
      background: theme.palette.background.paper,
      text: theme.palette.text.primary,
      border: groupColor || theme.palette.divider,
      isDark: theme.palette.mode === 'dark'
    };

    return (
      <>
        {/* NodeResizer برای تغییر اندازه */}
        <NodeResizer
          color={colors.primary}
          isVisible={isSelected && isResizeEnabled && !isLocked}
          minWidth={100}
          minHeight={50}
          lineClassName="resize-line"
          handleClassName="resize-handle"
        />

        <div
          style={{
            background: isSelected ? colors.primary : colors.background,
            border: `2px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '12px',
            width: '100%',
            height: '100%',
            color: isSelected ? (colors.isDark ? colors.background : '#ffffff') : colors.text,
            boxShadow: isSelected 
              ? `0 4px 12px ${colors.primary}40` 
              : `0 2px 8px ${colors.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            fontFamily: 'Vazirmatn, Roboto, sans-serif',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Handle برای ورودی (بالا) */}
          <Handle
            type="target"
            position={Position.Top}
            style={{
              background: colors.primary,
              width: '8px',
              height: '8px',
            }}
          />
          
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '4px',
            textAlign: 'center'
          }}>
            {data.label}
          </div>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.8,
            textAlign: 'center'
          }}>
            {data.levelName}
          </div>

          {/* Handle برای خروجی (پایین) */}
          <Handle
            type="source"
            position={Position.Bottom}
            style={{
              background: colors.primary,
              width: '8px',
              height: '8px',
            }}
          />
          <div style={{ position: 'absolute', top: 4, left: 4 }}>
            {isLocked && <LockIcon fontSize="small" style={{ color: colors.primary, opacity: 0.7 }} />}
          </div>
        </div>
      </>
    );
  }, [theme.palette, isResizeEnabled, selectedNodes, groups, getNodeGroupColor, lockedNodeIds]);

  const nodeTypes = useMemo(() => ({
    geoNode: GeoNodeComponent,
  }), [GeoNodeComponent, selectedNodes]);

  // Debug: نمایش داده‌های ورودی
  console.log('SimpleGraphViewer - Input Data:', data);
  console.log('SimpleGraphViewer - Data Length:', data?.length);
  console.log('SimpleGraphViewer - Selected Node:', selectedNode);
  console.log('SimpleGraphViewer - Theme:', theme.palette.mode);

  // Error boundary برای مدیریت خطاها
  if (!data || data.length === 0) {
    return (
      <Box>
        <Paper 
          sx={{ 
            p: 2, 
            minHeight: 200, 
            background: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            هیچ داده‌ای برای نمایش وجود ندارد
          </Typography>
        </Paper>
      </Box>
    );
  }

  const visibleEdges = useMemo(() => showConnections ? edges : [], [showConnections, edges]);

  // آمار
  const stats = useMemo(() => ({
    total: nodes.length,
    selected: selectedNodes.size,
    groups: groups.length,
    locked: lockedNodeIds.size,
  }), [nodes, selectedNodes, groups, lockedNodeIds]);

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumb 
        selectedNode={selectedNode} 
        data={data} 
        onNodeSelect={onNodeSelect} 
      />
      
      {/* نتایج جستجو */}
      {searchTerm && filteredNodes.length > 0 && (
        <Paper sx={{ 
          mb: 2, 
          p: 2, 
          background: theme.palette.info.light, 
          color: theme.palette.info.contrastText,
          borderRadius: '12px'
        }}>
          <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Roboto, sans-serif', mb: 1 }}>
            نتایج جستجو برای "{searchTerm}": {filteredNodes.length} نتیجه
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {filteredNodes.slice(0, 5).map((node) => (
              <Chip
                key={node.id}
                label={node.name}
                size="small"
                onClick={() => onNodeSelect?.(node)}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary
                }}
              />
            ))}
            {filteredNodes.length > 5 && (
              <Chip
                label={`+${filteredNodes.length - 5} بیشتر`}
                size="small"
                variant="outlined"
                sx={{ 
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.secondary
                }}
              />
            )}
          </Box>
        </Paper>
      )}
      
      {/* آمار */}
      <Paper sx={{ mb: 1, p: 1, background: theme.palette.mode === 'dark' ? '#222' : '#f5f5f5', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center', fontFamily: 'Vazirmatn, Roboto, sans-serif', fontSize: 13 }}>
        <span>کل گره‌ها: <b>{stats.total}</b></span>
        <span>انتخاب شده: <b>{stats.selected}</b></span>
        <span>گروه: <b>{stats.groups}</b></span>
        <span>قفل: <b>{stats.locked}</b></span>
      </Paper>
      {/* نوار ابزار */}
      <GraphToolbar
        onLayoutChange={onLayout}
        isResizeEnabled={isResizeEnabled}
        onResizeToggle={() => setIsResizeEnabled(!isResizeEnabled)}
        isFocusedView={isFocusedView}
        onToggleView={() => {
          if (isFocusedView) {
            // بازگشت به نمایش کلی
            setIsFocusedView(false);
            setFocusedNode(null);
          } else if (selectedNode) {
            // رفتن به نمایش متمرکز
            setIsFocusedView(true);
            setFocusedNode(selectedNode);
          } else {
            console.log('ابتدا یک گره را انتخاب کنید');
          }
        }}

        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDeleteSelected={handleDeleteSelected}
        onToggleConnections={() => setShowConnections((prev) => !prev)}
        onChangeColor={handleChangeColor}
        onChangeEdgeType={handleChangeEdgeType}
        edgeType={edgeType}
        onToggleFilter={handleToggleFilter}
        onSearch={handleSearch}
        onSettings={handleSettings}
        onGroupSelected={handleGroupSelected}
        onToggleLock={handleToggleLockSelected}
        onCopySelected={handleCopySelected}
        onPasteClipboard={handlePasteClipboard}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTestCopyPaste={testCopyPaste}
      />

      <Paper 
        sx={{ 
          p: 2, 
          height: 500, 
          background: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes || []}
            edges={visibleEdges || []}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            style={{ 
              width: '100%',
              height: '400px'
            }}
            onNodeDragStop={onNodeDragStop}
          >
            <Background />
            <Panel position="top-right">
              <ZoomControls />
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </Paper>

      {/* اطلاعات نود انتخاب شده */}
      {selectedNode && (
        <Paper sx={{ 
          mt: 2, 
          p: 2, 
          background: theme.palette.primary.main, 
          color: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff',
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${theme.palette.primary.main}40`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Roboto, sans-serif' }}>
                {selectedNode.name}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Roboto, sans-serif', opacity: 0.8 }}>
                {getLevelName(selectedNode.level)} - سطح {selectedNode.level}
              </Typography>
              {selectedNode.description && (
                <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Roboto, sans-serif', mt: 1 }}>
                  {selectedNode.description}
                </Typography>
              )}
              {selectedNode.coordinates && (
                <Typography variant="caption" sx={{ fontFamily: 'Vazirmatn, Roboto, sans-serif', display: 'block', mt: 1 }}>
                  مختصات: {selectedNode.coordinates.lat.toFixed(4)}, {selectedNode.coordinates.lng.toFixed(4)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onNodeEdit && (
                <IconButton
                  size="small"
                  onClick={() => onNodeEdit(selectedNode)}
                  sx={{ color: 'inherit' }}
                >
                  <EditIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => onNodeSelect?.(null)}
                sx={{ color: 'inherit' }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SimpleGraphViewer;