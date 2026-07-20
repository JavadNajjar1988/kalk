import React, { useState } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  CenterFocusStrong as CenterFocusIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Hub as HubIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { CategoryType, DefinitionNode, ViewMode } from '../../types';

interface GraphViewBaseProps {
  categoryType: CategoryType;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onAdd?: (parentId?: string) => void;
  onEditNode?: (node: DefinitionNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  nodes?: DefinitionNode[];
  loading?: boolean;
  error?: string | null;
}

const GraphViewBase: React.FC<GraphViewBaseProps> = ({ categoryType, viewMode, onViewModeChange, onAdd, onEditNode, onDeleteNode, nodes = [], loading, error }) => {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(viewMode || ViewMode.GRAPH);
  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState<{x:number;y:number}>({ x: 0, y: 0 });

  const handleViewMode = (_: any, val: ViewMode | null) => {
    if (!val) return;
    if (onViewModeChange) onViewModeChange(val);
    else setInternalViewMode(val);
  };

  const currentView = viewMode ?? internalViewMode;

  // چیدمان ساده: براساس level، در عرض پخش می‌شوند
  const levelsMap = new Map<number, DefinitionNode[]>();
  nodes.forEach(n => {
    const bucket = levelsMap.get(n.level) || [];
    bucket.push(n);
    levelsMap.set(n.level, bucket);
  });
  const sortedLevels = Array.from(levelsMap.keys()).sort((a,b) => a-b);
  const width = 900;
  const height = Math.max(420, sortedLevels.length * 120);
  const levelGap = sortedLevels.length > 1 ? (height - 80) / (sortedLevels.length - 1) : 0;

  const nodePositions = new Map<string, {x:number;y:number;node:DefinitionNode}>();
  sortedLevels.forEach((lvl, idx) => {
    const row = levelsMap.get(lvl) || [];
    const gap = row.length > 1 ? (width - 160) / (row.length - 1) : 0;
    row.forEach((n, i) => {
      const x = row.length === 1 ? width/2 : (80 + i * gap);
      const y = 40 + idx * levelGap;
      nodePositions.set(n.id, { x, y, node: n });
    });
  });

  return (
    <Box>
      {/* Loading & Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">در حال بارگذاری...</Typography>
        </Box>
      )}
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {/* نمایش: درختی/گرافی */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1">نمایش:</Typography>
          <ToggleButtonGroup size="small" exclusive value={currentView} onChange={handleViewMode} aria-label="view mode">
            <ToggleButton value={ViewMode.TREE} aria-label="درختی">
              <AccountTreeIcon />
              <Box sx={{ ml: 1 }}>درختی</Box>
            </ToggleButton>
            <ToggleButton value={ViewMode.GRAPH} aria-label="گرافی">
              <HubIcon />
              <Box sx={{ ml: 1 }}>گرافی</Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Controls */}
        <Tooltip title="مرکز">
          <IconButton size="small" onClick={() => { setTranslate({ x: 0, y: 0 }); setScale(1); }}><CenterFocusIcon /></IconButton>
        </Tooltip>
        <Tooltip title="زوم +">
          <IconButton size="small" onClick={() => setScale(s => Math.min(2.5, s + 0.1))}><ZoomInIcon /></IconButton>
        </Tooltip>
        <Tooltip title="زوم -">
          <IconButton size="small" onClick={() => setScale(s => Math.max(0.4, s - 0.1))}><ZoomOutIcon /></IconButton>
        </Tooltip>
        <Tooltip title="به‌روزرسانی چیدمان">
          <IconButton size="small" onClick={() => { /* placeholder for recompute */ }}><RefreshIcon /></IconButton>
        </Tooltip>

        {/* افزودن */}
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => onAdd && onAdd()}>افزودن</Button>
      </Box>

      {/* گراف SVG یا Empty */}
      <Box sx={{ p: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', height: height + 40, overflow: 'hidden' }}>
        {nodes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">داده‌ای برای نمایش وجود ندارد</Typography>
          </Box>
        ) : (
        <svg width="100%" height={height + 40} viewBox={`0 0 ${width} ${height + 40}`}>
          <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
            {/* Edges */}
            {nodes.map(child => {
              if (!child.parentId) return null;
              const p = nodePositions.get(child.parentId);
              const c = nodePositions.get(child.id);
              if (!p || !c) return null;
              return (
                <line key={`e-${child.id}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="#9ca3af" strokeWidth={1.5} />
              );
            })}
            {/* Nodes */}
            {Array.from(nodePositions.values()).map(({ x, y, node }) => (
              <g key={node.id} transform={`translate(${x},${y})`}>
                <circle r={16} fill={categoryType === 'geographical' ? '#3B82F6' : '#64748B'} opacity={0.15} />
                <circle r={14} fill="#ffffff" stroke={categoryType === 'geographical' ? '#3B82F6' : '#64748B'} strokeWidth={1.5} />
                <text textAnchor="middle" y={5} fontSize={10} fill="#1f2937">
                  {node.name.length > 8 ? node.name.slice(0,8) + '…' : node.name}
                </text>
                {/* Actions */}
                <g transform="translate(20,-18)">
                  <title>افزودن زیرمجموعه</title>
                  <rect x={-8} y={-8} width={16} height={16} fill="transparent" onClick={() => onAdd && onAdd(node.id)} />
                  <text x={0} y={4} textAnchor="middle" fontSize={12} fill="#10b981">+</text>
                </g>
                <g transform="translate(20,0)">
                  <title>ویرایش</title>
                  <rect x={-8} y={-8} width={16} height={16} fill="transparent" onClick={() => onEditNode && onEditNode(node)} />
                  <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#6b7280">✎</text>
                </g>
                <g transform="translate(20,18)">
                  <title>حذف</title>
                  <rect x={-8} y={-8} width={16} height={16} fill="transparent" onClick={() => onDeleteNode && onDeleteNode(node.id)} />
                  <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#ef4444">×</text>
                </g>
              </g>
            ))}
          </g>
        </svg>
        )}
      </Box>
    </Box>
  );
};

export default GraphViewBase;


