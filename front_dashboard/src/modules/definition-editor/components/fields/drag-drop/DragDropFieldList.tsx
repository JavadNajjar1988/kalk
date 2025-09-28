import React, { useState, useCallback } from 'react';
import {
  List,
  ListItem,
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon
} from '@mui/icons-material';

import { DragDropProvider } from './DragDropContext';
import { DraggableField } from './DraggableField';
import { DroppableContainer } from './DroppableContainer';

interface FieldItem {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  order: number;
  groupId?: string;
}

interface FieldGroup {
  id: string;
  name: string;
  description?: string;
  collapsed: boolean;
  order: number;
}

interface DragDropFieldListProps {
  fields: FieldItem[];
  groups?: FieldGroup[];
  onFieldReorder: (sourceIndex: number, targetIndex: number) => void;
  onFieldMove: (fieldId: string, targetGroupId: string | null, position: number) => void;
  onFieldEdit?: (field: FieldItem) => void;
  onGroupToggle?: (groupId: string) => void;
  onAddField?: (groupId?: string) => void;
  enableGrouping?: boolean;
  readOnly?: boolean;
}

export const DragDropFieldList: React.FC<DragDropFieldListProps> = ({
  fields,
  groups = [],
  onFieldReorder,
  onFieldMove,
  onFieldEdit,
  onGroupToggle,
  onAddField,
  enableGrouping = true,
  readOnly = false
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter(g => !g.collapsed).map(g => g.id))
  );

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  // Group fields by group ID
  const groupedFields = sortedFields.reduce((acc, field) => {
    const groupId = field.groupId || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(field);
    return acc;
  }, {} as Record<string, FieldItem[]>);

  // Sort groups by order
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const handleGroupToggle = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
    onGroupToggle?.(groupId);
  }, [onGroupToggle]);

  const handleFieldMove = useCallback((fieldId: string, targetGroupId: string, position: number) => {
    onFieldMove(fieldId, targetGroupId === 'ungrouped' ? null : targetGroupId, position);
  }, [onFieldMove]);

  const handleDrop = useCallback((sourceId: string, targetId: string, position?: string) => {
    // Convert position to number, default to 0
    const numPosition = position ? parseInt(position, 10) || 0 : 0;
    handleFieldMove(sourceId, targetId, numPosition);
  }, [handleFieldMove]);

  const renderField = (field: FieldItem, index: number) => (
    <DraggableField
      key={field.id}
      id={field.id}
      index={index}
      data={field}
      disabled={readOnly}
    >
      <ListItem
        sx={{
          mb: 1,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 1,
          background: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.9)',
            transform: 'translateX(4px)'
          },
          transition: 'all 0.2s ease',
          pl: 4 // Space for drag handle
        }}
        onClick={() => onFieldEdit?.(field)}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {field.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {field.type} • {field.category}
          </Typography>
          {field.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {field.description}
            </Typography>
          )}
        </Box>
      </ListItem>
    </DraggableField>
  );

  const renderGroup = (group: FieldGroup) => {
    const groupFields = groupedFields[group.id] || [];
    const isExpanded = expandedGroups.has(group.id);

    return (
      <Paper
        key={group.id}
        elevation={1}
        sx={{
          mb: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 2
        }}
      >
        {/* Group Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={2}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.02)'
            }
          }}
          onClick={() => handleGroupToggle(group.id)}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {group.name}
              </Typography>
              {group.description && (
                <Typography variant="caption" color="text.secondary">
                  {group.description}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {groupFields.length} fields
            </Typography>
            {!readOnly && (
              <Tooltip title="Add field to group">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddField?.(group.id);
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Group Fields */}
        <Collapse in={isExpanded}>
          <DroppableContainer
            id={group.id}
            type="group"
            accepts={['field']}
            onDrop={handleDrop}
            disabled={readOnly}
            placeholder={
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  Drop fields here or click + to add
                </Typography>
              </Box>
            }
          >
            <List sx={{ p: 2, pt: 0 }}>
              {groupFields.map((field, index) => renderField(field, index))}
            </List>
          </DroppableContainer>
        </Collapse>
      </Paper>
    );
  };

  const ungroupedFields = groupedFields.ungrouped || [];

  return (
    <DragDropProvider
      onFieldReorder={onFieldReorder}
      onFieldMove={handleFieldMove}
    >
      <Box>
        {/* Grouped Fields */}
        {enableGrouping && sortedGroups.map(renderGroup)}

        {/* Ungrouped Fields */}
        {ungroupedFields.length > 0 && (
          <Paper
            elevation={1}
            sx={{
              mb: 2,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={2}
              borderBottom="1px solid rgba(0, 0, 0, 0.1)"
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {enableGrouping ? 'Ungrouped Fields' : 'All Fields'}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  {ungroupedFields.length} fields
                </Typography>
                {!readOnly && (
                  <Tooltip title="Add field">
                    <IconButton size="small" onClick={() => onAddField?.()}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            <DroppableContainer
              id="ungrouped"
              type="container"
              accepts={['field']}
              onDrop={handleDrop}
              disabled={readOnly}
              placeholder={
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="text.secondary">
                    {ungroupedFields.length === 0 
                      ? 'No fields yet. Click + to add your first field.'
                      : 'Drop fields here to ungroup them'
                    }
                  </Typography>
                </Box>
              }
            >
              <List sx={{ p: 2 }}>
                {ungroupedFields.map((field, index) => renderField(field, index))}
              </List>
            </DroppableContainer>
          </Paper>
        )}

        {/* Empty State */}
        {fields.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '2px dashed rgba(0, 0, 0, 0.1)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Fields Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Create your first field to get started
            </Typography>
            {!readOnly && (
              <IconButton
                size="large"
                onClick={() => onAddField?.()}
                sx={{
                  background: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    background: 'primary.dark'
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            )}
          </Paper>
        )}
      </Box>
    </DragDropProvider>
  );
};