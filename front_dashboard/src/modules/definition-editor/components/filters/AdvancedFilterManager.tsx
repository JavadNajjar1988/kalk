import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Menu,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  More as MoreIcon,
  Copy as CopyIcon,
  Share as ShareIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Clear as ClearIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Types
import type {
  FilterGroup,
  FilterCriteria,
  AdvancedFilterConfig,
  SavedFilter,
  FilterOperator,
  FilterFieldDefinition,
} from '../../types/fieldConstructor';
import PersianCalendarField from '@/components/common/PersianCalendarField';

interface AdvancedFilterManagerProps {
  availableFields: FilterFieldDefinition[];
  currentFilter?: AdvancedFilterConfig;
  onFilterChange: (filter: AdvancedFilterConfig) => void;
  onApplyFilter: (filter: AdvancedFilterConfig) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (filter: SavedFilter) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
}

const AdvancedFilterManager: React.FC<AdvancedFilterManagerProps> = ({
  availableFields,
  currentFilter,
  onFilterChange,
  onApplyFilter,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
}) => {
  const [filterConfig, setFilterConfig] = useState<AdvancedFilterConfig>(
    currentFilter || {
      groups: [],
      globalLogicalOperator: 'AND',
      savedFilters: [],
    }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FilterGroup | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Form states for new/edit filter group
  const [groupName, setGroupName] = useState('');
  const [groupOperator, setGroupOperator] = useState<'AND' | 'OR'>('AND');
  const [criteria, setCriteria] = useState<FilterCriteria[]>([]);

  // Save filter form states
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveFilterDescription, setSaveFilterDescription] = useState('');
  const [saveFilterTags, setSaveFilterTags] = useState<string[]>([]);
  const [saveFilterPublic, setSaveFilterPublic] = useState(false);

  // Available operators for different field types
  const getOperatorsForFieldType = (fieldType: string): FilterOperator[] => {
    switch (fieldType) {
      case 'text':
        return [
          '=',
          '!=',
          'contains',
          'not_contains',
          'starts_with',
          'ends_with',
          'exists',
          'not_exists',
        ];
      case 'number':
        return [
          '=',
          '!=',
          '>',
          '<',
          '>=',
          '<=',
          'between',
          'exists',
          'not_exists',
        ];
      case 'date':
        return [
          '=',
          '!=',
          '>',
          '<',
          '>=',
          '<=',
          'between',
          'exists',
          'not_exists',
        ];
      case 'boolean':
        return ['=', '!=', 'exists', 'not_exists'];
      case 'select':
      case 'multiSelect':
        return ['=', '!=', 'in', 'not_in', 'exists', 'not_exists'];
      default:
        return ['=', '!=', 'exists', 'not_exists'];
    }
  };

  // Add new filter group
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupOperator('AND');
    setCriteria([
      {
        id: `criteria_${Date.now()}`,
        field: availableFields[0]?.id || '',
        operator: '=',
        value: '',
        logicalOperator: 'AND',
      },
    ]);
    setDialogOpen(true);
  };

  // Edit existing filter group
  const handleEditGroup = (group: FilterGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupOperator(group.logicalOperator);
    setCriteria([...group.criteria]);
    setDialogOpen(true);
  };

  // Save filter group
  const handleSaveGroup = () => {
    const newGroup: FilterGroup = {
      id: editingGroup?.id || `group_${Date.now()}`,
      name: groupName,
      criteria,
      logicalOperator: groupOperator,
      isActive: true,
    };

    const updatedConfig = {
      ...filterConfig,
      groups: editingGroup
        ? filterConfig.groups.map(g =>
            g.id === editingGroup.id ? newGroup : g
          )
        : [...filterConfig.groups, newGroup],
    };

    setFilterConfig(updatedConfig);
    onFilterChange(updatedConfig);
    setDialogOpen(false);
  };

  // Delete filter group
  const handleDeleteGroup = (groupId: string) => {
    const updatedConfig = {
      ...filterConfig,
      groups: filterConfig.groups.filter(g => g.id !== groupId),
    };
    setFilterConfig(updatedConfig);
    onFilterChange(updatedConfig);
  };

  // Toggle group active state
  const handleToggleGroup = (groupId: string) => {
    const updatedConfig = {
      ...filterConfig,
      groups: filterConfig.groups.map(g =>
        g.id === groupId ? { ...g, isActive: !g.isActive } : g
      ),
    };
    setFilterConfig(updatedConfig);
    onFilterChange(updatedConfig);
  };

  // Add new criteria to current editing group
  const handleAddCriteria = () => {
    const newCriteria: FilterCriteria = {
      id: `criteria_${Date.now()}`,
      field: availableFields[0]?.id || '',
      operator: '=',
      value: '',
      logicalOperator: 'AND',
    };
    setCriteria([...criteria, newCriteria]);
  };

  // Update criteria
  const handleUpdateCriteria = (
    criteriaId: string,
    updates: Partial<FilterCriteria>
  ) => {
    setCriteria(
      criteria.map(c => (c.id === criteriaId ? { ...c, ...updates } : c))
    );
  };

  // Delete criteria
  const handleDeleteCriteria = (criteriaId: string) => {
    setCriteria(criteria.filter(c => c.id !== criteriaId));
  };

  // Save current filter configuration
  const handleSaveFilter = () => {
    if (!onSaveFilter) return;

    const newSavedFilter: SavedFilter = {
      id: `saved_${Date.now()}`,
      name: saveFilterName,
      description: saveFilterDescription,
      config: filterConfig,
      createdAt: new Date(),
      isPublic: saveFilterPublic,
      tags: saveFilterTags,
    };

    onSaveFilter(newSavedFilter);
    setSaveDialogOpen(false);
    setSaveFilterName('');
    setSaveFilterDescription('');
    setSaveFilterTags([]);
    setSaveFilterPublic(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedConfig: AdvancedFilterConfig = {
      groups: [],
      globalLogicalOperator: 'AND',
      savedFilters: [],
    };
    setFilterConfig(clearedConfig);
    onFilterChange(clearedConfig);
  };

  // Export filter configuration
  const handleExportFilter = () => {
    const dataStr = JSON.stringify(filterConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filter-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get field definition by ID
  const getFieldDefinition = (fieldId: string) => {
    return availableFields.find(f => f.id === fieldId);
  };

  // Render criteria value input based on field type
  const renderCriteriaValueInput = (criteria: FilterCriteria) => {
    const field = getFieldDefinition(criteria.field);
    if (!field) return null;

    const commonProps = {
      value: criteria.value || '',
      onChange: (e: any) =>
        handleUpdateCriteria(criteria.id, { value: e.target.value }),
      size: 'small' as const,
      sx: { minWidth: 120 },
    };

    switch (field.type) {
      case 'select':
        return (
          <FormControl {...commonProps}>
            <Select {...commonProps}>
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiSelect':
        return (
          <FormControl {...commonProps}>
            <Select
              {...commonProps}
              multiple
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(value => {
                    const option = field.options?.find(o => o.value === value);
                    return (
                      <Chip
                        key={value}
                        label={option?.label || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max,
            }}
          />
        );

      case 'date':
        return (
          <PersianCalendarField
            value={String(criteria.value || '')}
            onChange={value => handleUpdateCriteria(criteria.id, { value })}
            dateOnly
          />
        );

      case 'boolean':
        return (
          <FormControl {...commonProps}>
            <Select {...commonProps}>
              <MenuItem value={true}>True</MenuItem>
              <MenuItem value={false}>False</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">
          Advanced Filters
          <Badge
            badgeContent={filterConfig.groups.filter(g => g.isActive).length}
            color="primary"
            sx={{ ml: 1 }}
          >
            <FilterIcon />
          </Badge>
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddGroup}
            variant="outlined"
            size="small"
          >
            Add Group
          </Button>

          <IconButton
            onClick={e => setMenuAnchor(e.currentTarget)}
            size="small"
          >
            <MoreIcon />
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setSaveDialogOpen(true);
                setMenuAnchor(null);
              }}
            >
              <SaveIcon fontSize="small" sx={{ mr: 1 }} />
              Save Filter
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleExportFilter();
                setMenuAnchor(null);
              }}
            >
              <ExportIcon fontSize="small" sx={{ mr: 1 }} />
              Export
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClearFilters();
                setMenuAnchor(null);
              }}
            >
              <ClearIcon fontSize="small" sx={{ mr: 1 }} />
              Clear All
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Global Operator */}
      {filterConfig.groups.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small">
            <InputLabel>Group Logic</InputLabel>
            <Select
              value={filterConfig.globalLogicalOperator}
              onChange={e => {
                const updatedConfig = {
                  ...filterConfig,
                  globalLogicalOperator: e.target.value as 'AND' | 'OR',
                };
                setFilterConfig(updatedConfig);
                onFilterChange(updatedConfig);
              }}
            >
              <MenuItem value="AND">AND</MenuItem>
              <MenuItem value="OR">OR</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Filter Groups */}
      <Box sx={{ mb: 2 }}>
        {filterConfig.groups.map((group, index) => (
          <Card
            key={group.id}
            sx={{ mb: 1, opacity: group.isActive ? 1 : 0.6 }}
          >
            <CardContent sx={{ py: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={group.isActive}
                    onChange={() => handleToggleGroup(group.id)}
                    size="small"
                  />
                  <Typography variant="subtitle2">{group.name}</Typography>
                  <Chip
                    label={group.logicalOperator}
                    size="small"
                    variant="outlined"
                  />
                  <Badge
                    badgeContent={group.criteria.length}
                    color="secondary"
                    size="small"
                  >
                    <FilterIcon fontSize="small" />
                  </Badge>
                </Box>

                <Box>
                  <IconButton
                    onClick={() => handleEditGroup(group)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteGroup(group.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Show criteria preview */}
              <Box sx={{ mt: 1 }}>
                {group.criteria.map((criteria, idx) => {
                  const field = getFieldDefinition(criteria.field);
                  return (
                    <Typography
                      key={criteria.id}
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {idx > 0 && ` ${criteria.logicalOperator} `}
                      {field?.name} {criteria.operator} {criteria.value}
                    </Typography>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Apply Button */}
      <Button
        variant="contained"
        onClick={() => onApplyFilter(filterConfig)}
        disabled={filterConfig.groups.filter(g => g.isActive).length === 0}
        fullWidth
      >
        Apply Filters ({filterConfig.groups.filter(g => g.isActive).length}{' '}
        active)
      </Button>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Saved Filters ({savedFilters.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {savedFilters.map(saved => (
                <ListItem key={saved.id}>
                  <ListItemText
                    primary={saved.name}
                    secondary={saved.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => onLoadFilter?.(saved)}
                      size="small"
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => onDeleteFilter?.(saved.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Add/Edit Group Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingGroup ? 'Edit Filter Group' : 'Add Filter Group'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Group Name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Logic Operator</InputLabel>
                <Select
                  value={groupOperator}
                  onChange={e =>
                    setGroupOperator(e.target.value as 'AND' | 'OR')
                  }
                >
                  <MenuItem value="AND">AND</MenuItem>
                  <MenuItem value="OR">OR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Criteria List */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            Filter Criteria
          </Typography>

          {criteria.map((criteriaItem, index) => (
            <Card key={criteriaItem.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Grid container spacing={1} alignItems="center">
                  {index > 0 && (
                    <Grid item xs={12} sm={1}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={criteriaItem.logicalOperator}
                          onChange={e =>
                            handleUpdateCriteria(criteriaItem.id, {
                              logicalOperator: e.target.value as 'AND' | 'OR',
                            })
                          }
                        >
                          <MenuItem value="AND">AND</MenuItem>
                          <MenuItem value="OR">OR</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Field</InputLabel>
                      <Select
                        value={criteriaItem.field}
                        onChange={e =>
                          handleUpdateCriteria(criteriaItem.id, {
                            field: e.target.value,
                          })
                        }
                      >
                        {availableFields.map(field => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={criteriaItem.operator}
                        onChange={e =>
                          handleUpdateCriteria(criteriaItem.id, {
                            operator: e.target.value as FilterOperator,
                          })
                        }
                      >
                        {getOperatorsForFieldType(
                          getFieldDefinition(criteriaItem.field)?.type || 'text'
                        ).map(op => (
                          <MenuItem key={op} value={op}>
                            {op}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    {renderCriteriaValueInput(criteriaItem)}
                  </Grid>

                  <Grid item xs={12} sm={1}>
                    <IconButton
                      onClick={() => handleDeleteCriteria(criteriaItem.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddCriteria}
            variant="outlined"
            size="small"
          >
            Add Criteria
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            disabled={!groupName.trim() || criteria.length === 0}
          >
            Save Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Filter Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Filter Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Filter Name"
                value={saveFilterName}
                onChange={e => setSaveFilterName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={saveFilterDescription}
                onChange={e => setSaveFilterDescription(e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={saveFilterPublic}
                    onChange={e => setSaveFilterPublic(e.target.checked)}
                  />
                }
                label="Make Public"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveFilter}
            variant="contained"
            disabled={!saveFilterName.trim()}
          >
            Save Filter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedFilterManager;
