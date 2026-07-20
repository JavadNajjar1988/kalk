import React from 'react';
import { Box, Typography, IconButton, Collapse, Chip } from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
} from '@mui/icons-material';
import { MasterDefinition } from '../../types';

interface LevelBasedTreeViewProps {
  definitions: MasterDefinition[];
  onCreate: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (def: MasterDefinition) => void;
  onAddChild?: (parentId: string) => void;
  getLevelName?: (level: number) => string;
}

const LevelBasedTreeView: React.FC<LevelBasedTreeViewProps> = ({
  definitions,
  onCreate,
  onUpdate,
  onDelete,
  onAddChild,
  getLevelName,
}) => {
  const [expandedLevels, setExpandedLevels] = React.useState<Set<number>>(new Set());

  // گروه‌بندی تعاریف بر اساس سطح
  const groupByLevel = (defs: MasterDefinition[]) => {
    const groups: Record<number, MasterDefinition[]> = {};
    
    const traverse = (items: MasterDefinition[]) => {
      items.forEach(item => {
        const level = item.level || 1;
        if (!groups[level]) {
          groups[level] = [];
        }
        groups[level].push(item);
        
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    
    traverse(defs);
    return groups;
  };

  const levelGroups = groupByLevel(definitions);
  const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  if (sortedLevels.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">هیچ تعریفی یافت نشد</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {sortedLevels.map((level) => {
        const isExpanded = expandedLevels.has(level);
        const items = levelGroups[level];
        
        return (
          <Box key={level} sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1,
                py: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <IconButton
                  size="small"
                  onClick={() => toggleLevel(level)}
                  title={isExpanded ? 'بستن' : 'باز کردن'}
                  sx={{ width: 24, height: 24 }}
                >
                  {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>

                <Chip size="small" label={getLevelName ? getLevelName(level) : `سطح ${level}`} sx={{ height: 20 }} />

                <Typography variant="body2">{getLevelName ? getLevelName(level) : `سطح ${level}`}</Typography>
                
                <Typography variant="caption" color="text.secondary">
                  ({items.length} آیتم)
                </Typography>
              </Box>
            </Box>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 0.75, ml: 3 }}>
                {items.map((def) => (
                  <Box
                    key={def.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1,
                      py: 0.75,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="body2">{def.name}</Typography>
                      {def.parentId && (
                        <Typography variant="caption" color="text.secondary">
                          (والد: {definitions.find(d => d.id === def.parentId)?.name || 'نامشخص'})
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton size="small" title="افزودن زیرمجموعه" onClick={() => onAddChild?.(def.id)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="ویرایش" onClick={() => onUpdate(def.id, def)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="حذف" onClick={() => onDelete(def)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default LevelBasedTreeView;
