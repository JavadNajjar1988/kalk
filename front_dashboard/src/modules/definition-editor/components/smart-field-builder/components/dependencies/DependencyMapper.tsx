import React, { useMemo, useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  AccountTree as TreeIcon,
  Psychology as LogicIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon
} from '@mui/icons-material';
import { SmartFieldConfig } from '../../types/smartFieldTypes';
import { FieldDependency } from './FieldDependencyBuilder';

interface DependencyMapperProps {
  fields: SmartFieldConfig[];
  dependencies: FieldDependency[];
  onDependencyClick?: (dependency: FieldDependency) => void;
  onFieldClick?: (field: SmartFieldConfig) => void;
}

interface Position {
  x: number;
  y: number;
}

interface FieldNode {
  field: SmartFieldConfig;
  position: Position;
  connections: {
    incoming: FieldDependency[];
    outgoing: FieldDependency[];
  };
}

const DependencyMapper: React.FC<DependencyMapperProps> = ({
  fields,
  dependencies,
  onDependencyClick,
  onFieldClick
}) => {
  const theme = useTheme();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Calculate field nodes with positions
  const fieldNodes = useMemo((): FieldNode[] => {
    const nodes: FieldNode[] = [];
    const nodeSpacing = 200;
    const levelHeight = 150;

    // Group fields by dependency levels
    const dependencyLevels: { [level: number]: SmartFieldConfig[] } = {};
    const processedFields = new Set<string>();
    
    // Find root fields (fields with no incoming dependencies)
    const rootFields = fields.filter(field => 
      !dependencies.some(dep => dep.targetFieldId === field.id && dep.enabled)
    );

    // Build dependency levels
    const buildLevels = (fieldsAtLevel: SmartFieldConfig[], level: number) => {
      if (fieldsAtLevel.length === 0) return;
      
      dependencyLevels[level] = fieldsAtLevel;
      fieldsAtLevel.forEach(field => processedFields.add(field.id));

      // Find next level fields
      const nextLevelFields = fields.filter(field => {
        if (processedFields.has(field.id)) return false;
        
        const incomingDeps = dependencies.filter(dep => 
          dep.targetFieldId === field.id && dep.enabled
        );
        
        return incomingDeps.every(dep => 
          processedFields.has(dep.sourceFieldId)
        );
      });

      buildLevels(nextLevelFields, level + 1);
    };

    buildLevels(rootFields.length > 0 ? rootFields : [fields[0]], 0);

    // Position fields
    Object.entries(dependencyLevels).forEach(([levelStr, levelFields]) => {
      const level = parseInt(levelStr);
      const fieldsCount = levelFields.length;
      const startX = fieldsCount > 1 ? -(fieldsCount - 1) * nodeSpacing / 2 : 0;

      levelFields.forEach((field, index) => {
        const position: Position = {
          x: startX + index * nodeSpacing,
          y: level * levelHeight
        };

        const incomingDeps = dependencies.filter(dep => 
          dep.targetFieldId === field.id && dep.enabled
        );
        const outgoingDeps = dependencies.filter(dep => 
          dep.sourceFieldId === field.id && dep.enabled
        );

        nodes.push({
          field,
          position,
          connections: {
            incoming: incomingDeps,
            outgoing: outgoingDeps
          }
        });
      });
    });

    return nodes;
  }, [fields, dependencies]);

  // Calculate SVG viewBox
  const viewBox = useMemo(() => {
    if (fieldNodes.length === 0) return '0 0 800 600';

    const positions = fieldNodes.map(node => node.position);
    const minX = Math.min(...positions.map(p => p.x)) - 100;
    const maxX = Math.max(...positions.map(p => p.x)) + 100;
    const minY = Math.min(...positions.map(p => p.y)) - 100;
    const maxY = Math.max(...positions.map(p => p.y)) + 100;

    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [fieldNodes]);

  // Get dependency line path
  const getDependencyPath = useCallback((sourceDep: FieldDependency): string => {
    const sourceNode = fieldNodes.find(n => n.field.id === sourceDep.sourceFieldId);
    const targetNode = fieldNodes.find(n => n.field.id === sourceDep.targetFieldId);

    if (!sourceNode || !targetNode) return '';

    const sourcePos = sourceNode.position;
    const targetPos = targetNode.position;

    // Create curved path
    const midY = (sourcePos.y + targetPos.y) / 2;
    const controlOffset = Math.abs(targetPos.y - sourcePos.y) * 0.4;

    return `M ${sourcePos.x} ${sourcePos.y + 25} 
            C ${sourcePos.x} ${midY + controlOffset} 
              ${targetPos.x} ${midY - controlOffset} 
              ${targetPos.x} ${targetPos.y - 25}`;
  }, [fieldNodes]);

  // Get dependency color based on type
  const getDependencyColor = useCallback((dependency: FieldDependency): string => {
    switch (dependency.action.type) {
      case 'show':
        return theme.palette.success.main;
      case 'hide':
        return theme.palette.warning.main;
      case 'require':
        return theme.palette.error.main;
      case 'optional':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  }, [theme]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  if (fields.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <TreeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          هیچ فیلدی برای نمایش وجود ندارد
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h6">
          نقشه وابستگی‌ها
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="بزرگ‌نمایی">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="کوچک‌نمایی">
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="بازنشانی نما">
            <IconButton onClick={handleResetView}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          icon={<VisibilityIcon />}
          label="نمایش"
          size="small"
          sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}
        />
        <Chip
          icon={<VisibilityOffIcon />}
          label="مخفی"
          size="small"
          sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1) }}
        />
        <Chip
          icon={<LogicIcon />}
          label="اجباری"
          size="small"
          sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1) }}
        />
        <Chip
          icon={<LinkIcon />}
          label="اختیاری"
          size="small"
          sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
        />
      </Box>

      {/* Dependency Map */}
      <Paper sx={{ 
        height: 600, 
        overflow: 'hidden', 
        position: 'relative',
        border: 1,
        borderColor: 'divider'
      }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            style={{ overflow: 'visible' }}
          >
            {/* Dependency Lines */}
            {dependencies
              .filter(dep => dep.enabled)
              .map(dependency => (
                <g key={dependency.id}>
                  <path
                    d={getDependencyPath(dependency)}
                    stroke={getDependencyColor(dependency)}
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onDependencyClick?.(dependency)}
                  />
                  
                  {/* Dependency label */}
                  <text
                    x={fieldNodes.find(n => n.field.id === dependency.sourceFieldId)?.position.x || 0}
                    y={((fieldNodes.find(n => n.field.id === dependency.sourceFieldId)?.position.y || 0) + 
                       (fieldNodes.find(n => n.field.id === dependency.targetFieldId)?.position.y || 0)) / 2}
                    fill={getDependencyColor(dependency)}
                    fontSize="12"
                    textAnchor="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {dependency.action.type}
                  </text>
                </g>
              ))}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={theme.palette.primary.main}
                />
              </marker>
            </defs>
          </svg>

          {/* Field Nodes */}
          {fieldNodes.map(node => (
            <Card
              key={node.field.id}
              sx={{
                position: 'absolute',
                left: node.position.x - 75,
                top: node.position.y - 25,
                width: 150,
                height: 50,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: 2,
                borderColor: node.connections.incoming.length > 0 ? 'primary.main' : 'divider',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 3,
                  zIndex: 10
                }
              }}
              onClick={() => onFieldClick?.(node.field)}
            >
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" fontWeight={600} noWrap>
                  {node.field.name}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" noWrap>
                  {node.field.baseType}
                </Typography>
                
                {/* Connection indicators */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                  {node.connections.incoming.length > 0 && (
                    <Chip 
                      label={node.connections.incoming.length} 
                      size="small" 
                      color="primary"
                      sx={{ height: 16, fontSize: 10 }}
                    />
                  )}
                  {node.connections.outgoing.length > 0 && (
                    <Chip 
                      label={node.connections.outgoing.length} 
                      size="small" 
                      color="secondary"
                      sx={{ height: 16, fontSize: 10 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`${fields.length} فیلد`}
          icon={<TreeIcon />}
          variant="outlined"
        />
        <Chip
          label={`${dependencies.filter(d => d.enabled).length} وابستگی فعال`}
          icon={<LinkIcon />}
          variant="outlined"
          color="primary"
        />
        <Chip
          label={`${dependencies.filter(d => !d.enabled).length} وابستگی غیرفعال`}
          icon={<VisibilityOffIcon />}
          variant="outlined"
          color="default"
        />
      </Box>
    </Box>
  );
};

export default DependencyMapper;