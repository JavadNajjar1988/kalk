import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  IconButton,
  Button,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  AccountTree as ChartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  ExpandMore as ExpandIcon,
  ChevronRight as CollapseIcon
} from '@mui/icons-material';
import { EnhancedScenario } from '../../../../types';

interface ChartEditorViewProps {
  scenario: EnhancedScenario;
}

// Mock organizational data
interface OrgNode {
  id: string;
  name: string;
  type: string;
  children?: OrgNode[];
  expanded?: boolean;
  commander?: string;
  personnel?: number;
}

const mockOrgData: OrgNode = {
  id: 'root',
  name: 'فرماندهی کل',
  type: 'فرماندهی',
  commander: 'سرلشکر احمدی',
  personnel: 10000,
  expanded: true,
  children: [
    {
      id: 'div1',
      name: 'لشکر 21 زرهی',
      type: 'لشکر',
      commander: 'سرهنگ محمدی',
      personnel: 3000,
      expanded: true,
      children: [
        {
          id: 'brig1',
          name: 'تیپ 1 زرهی',
          type: 'تیپ',
          commander: 'سرهنگ رضایی',
          personnel: 1500,
          expanded: false,
          children: [
            { id: 'bat1', name: 'گردان 1 تانک', type: 'گردان', commander: 'سرهنگ علیزاده', personnel: 500 },
            { id: 'bat2', name: 'گردان 2 مکانیزه', type: 'گردان', commander: 'سرهنگ حسینی', personnel: 450 }
          ]
        },
        {
          id: 'brig2',
          name: 'تیپ 2 مکانیزه',
          type: 'تیپ',
          commander: 'سرهنگ یوسفی',
          personnel: 1500,
          expanded: false,
          children: []
        }
      ]
    },
    {
      id: 'div2',
      name: 'لشکر 42 پیاده',
      type: 'لشکر',
      commander: 'سرهنگ نوروزی',
      personnel: 2500,
      expanded: false,
      children: []
    }
  ]
};

const ChartEditorView: React.FC<ChartEditorViewProps> = ({ scenario }) => {
  const [orgData, setOrgData] = useState<OrgNode>(mockOrgData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const toggleNodeExpanded = (nodeId: string) => {
    const updateNode = (node: OrgNode): OrgNode => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode)
        };
      }
      return node;
    };
    
    setOrgData(updateNode(orgData));
  };

  const renderOrgNode = (node: OrgNode, level: number = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <Box key={node.id} sx={{ ml: level * 3 }}>
        {/* Node Card */}
        <Card 
          sx={{ 
            mb: 1, 
            cursor: 'pointer',
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? 'primary.main' : 'divider',
            '&:hover': { 
              boxShadow: 2,
              borderColor: 'primary.light'
            }
          }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasChildren && (
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeExpanded(node.id);
                  }}
                >
                  {node.expanded ? <ExpandIcon /> : <CollapseIcon />}
                </IconButton>
              )}
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {node.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {node.type} {node.commander && `• ${node.commander}`}
                </Typography>
                {node.personnel && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    پرسنل: {node.personnel.toLocaleString('fa-IR')} نفر
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="افزودن زیرمجموعه">
                  <IconButton size="small" color="primary">
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="حذف واحد">
                  <IconButton size="small" color="error">
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Children Nodes */}
        {hasChildren && node.expanded && (
          <Box sx={{ ml: 2, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
            {node.children!.map(child => renderOrgNode(child, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ChartIcon color="primary" />
          <Typography variant="h5" sx={{ fontFamily: 'Vazirmatn, sans-serif' }}>
            حالت ویرایش چارت سازمانی
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ویرایش ساختار سلسله مراتبی واحدها و روابط فرماندهی
        </Typography>
      </Paper>

      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
            >
              افزودن واحد
            </Button>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="بزرگ‌نمایی">
              <IconButton 
                size="small"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 2))}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="کوچک‌نمایی">
              <IconButton 
                size="small"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="مرکز نمودن">
              <IconButton 
                size="small"
                onClick={() => setZoomLevel(1)}
              >
                <CenterIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              زوم: {Math.round(zoomLevel * 100)}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Main Chart Area */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
        {/* Chart Container */}
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent 
            sx={{ 
              flex: 1, 
              p: 2, 
              overflow: 'auto',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left'
            }}
          >
            {renderOrgNode(orgData)}
          </CardContent>
        </Card>

        {/* Properties Panel */}
        {selectedNodeId && (
          <Card sx={{ width: 300 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ویژگی‌های واحد
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  اطلاعات واحد انتخاب شده در اینجا نمایش داده می‌شود
                </Typography>
                <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                  شناسه: {selectedNodeId}
                </Typography>
              </Box>
              
              {/* TODO: Add form fields for editing unit properties */}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Status Bar */}
      <Paper elevation={1} sx={{ p: 1, mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          سناریو: {scenario.name} | 
          واحد انتخاب شده: {selectedNodeId || 'هیچ'} | 
          زوم: {Math.round(zoomLevel * 100)}%
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChartEditorView;