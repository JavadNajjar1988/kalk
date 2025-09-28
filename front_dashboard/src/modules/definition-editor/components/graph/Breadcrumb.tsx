import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChevronRight as ChevronRightIcon, Home as HomeIcon } from '@mui/icons-material';

interface GeoNode {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  children?: GeoNode[];
}

interface BreadcrumbProps {
  selectedNode: GeoNode | null;
  data: GeoNode[];
  onNodeSelect: (node: GeoNode | null) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ selectedNode, data, onNodeSelect }) => {
  const theme = useTheme();

  // پیدا کردن مسیر کامل از ریشه تا گره انتخاب شده
  const getBreadcrumbPath = (targetNode: GeoNode, allNodes: GeoNode[]): GeoNode[] => {
    const path: GeoNode[] = [targetNode];
    
    const findParent = (nodeId: string, nodes: GeoNode[]): GeoNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findParent(nodeId, node.children);
          if (found) return found;
        }
      }
      return null;
    };

    let current = targetNode;
    while (current.parentId) {
      const parent = findParent(current.parentId, allNodes);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return path;
  };

  if (!selectedNode) {
    return (
      <Box sx={{ 
        p: 2, 
        mb: 2,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <HomeIcon sx={{ color: theme.palette.text.secondary }} />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'Vazirmatn, Roboto, sans-serif' }}>
          هیچ گره‌ای انتخاب نشده است
        </Typography>
      </Box>
    );
  }

  const breadcrumbPath = getBreadcrumbPath(selectedNode, data);

  return (
    <Box sx={{ 
      p: 2, 
      mb: 2,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      flexWrap: 'wrap'
    }}>
      <IconButton
        size="small"
        onClick={() => onNodeSelect(null)}
        sx={{ 
          color: theme.palette.text.secondary,
          '&:hover': { color: theme.palette.primary.main }
        }}
      >
        <HomeIcon fontSize="small" />
      </IconButton>
      
      {breadcrumbPath.map((node, index) => (
        <React.Fragment key={node.id}>
          {index > 0 && (
            <ChevronRightIcon 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '1rem'
              }} 
            />
          )}
          <Chip
            label={node.name}
            size="small"
            clickable
            onClick={() => onNodeSelect(node)}
            sx={{
              backgroundColor: index === breadcrumbPath.length - 1 
                ? theme.palette.primary.main 
                : theme.palette.action.hover,
              color: index === breadcrumbPath.length - 1 
                ? theme.palette.primary.contrastText 
                : theme.palette.text.primary,
              fontFamily: 'Vazirmatn, Roboto, sans-serif',
              fontSize: '0.75rem',
              '&:hover': {
                backgroundColor: index === breadcrumbPath.length - 1 
                  ? theme.palette.primary.dark 
                  : theme.palette.action.selected,
              }
            }}
          />
        </React.Fragment>
      ))}
      
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ 
          color: theme.palette.text.secondary,
          fontFamily: 'Vazirmatn, Roboto, sans-serif'
        }}>
          سطح {selectedNode.level}
        </Typography>
        {selectedNode.coordinates && (
          <Typography variant="caption" sx={{ 
            color: theme.palette.text.secondary,
            fontFamily: 'Vazirmatn, Roboto, sans-serif'
          }}>
            • {selectedNode.coordinates.lat.toFixed(4)}, {selectedNode.coordinates.lng.toFixed(4)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Breadcrumb; 