import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  CheckCircle as RequiredIcon,
  Assignment as ValueIcon,
  List as OptionsIcon,
  Security as ValidationIcon,
  Lock as ReadonlyIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { 
  FieldDependency, 
  DependencyType, 
  ConditionOperator, 
  ActionType,
  DependencyPatterns,
  DEPENDENCY_PATTERNS
} from './types';
import DependencyManager from './DependencyManager';

interface DependencyConfigPanelProps {
  fieldId: string;
  availableFields: Array<{ id: string; label: string; type: string }>;
  onDependenciesChange?: (dependencies: FieldDependency[]) => void;
  isVisible?: boolean;
}

const DependencyConfigPanel: React.FC<DependencyConfigPanelProps> = ({
  fieldId,
  availableFields,
  onDependenciesChange,
  isVisible = true
}) => {
  const dependencyManager = useMemo(() => DependencyManager.getInstance(), []);
  const [dependencies, setDependencies] = useState<FieldDependency[]>(() => 
    dependencyManager.getDependencies(fieldId)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [editingDependency, setEditingDependency] = useState<FieldDependency | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>('');

  // Dependency type icons and colors
  const typeConfig = useMemo(() => ({
    [DependencyType.VISIBILITY]: { icon: VisibilityIcon, color: '#2196f3', label: 'Visibility' },
    [DependencyType.REQUIRED]: { icon: RequiredIcon, color: '#f44336', label: 'Required' },
    [DependencyType.VALUE]: { icon: ValueIcon, color: '#4caf50', label: 'Value' },
    [DependencyType.OPTIONS]: { icon: OptionsIcon, color: '#ff9800', label: 'Options' },
    [DependencyType.VALIDATION]: { icon: ValidationIcon, color: '#9c27b0', label: 'Validation' },
    [DependencyType.READONLY]: { icon: ReadonlyIcon, color: '#607d8b', label: 'Readonly' }
  }), []);

  const handleAddDependency = useCallback(() => {
    setIsCreating(true);
    setEditingDependency(null);
  }, []);

  const handleEditDependency = useCallback((dependency: FieldDependency) => {
    setEditingDependency(dependency);
    setIsCreating(true);
  }, []);

  const handleDeleteDependency = useCallback((dependencyId: string) => {
    dependencyManager.removeDependency(dependencyId, fieldId);
    const updatedDependencies = dependencyManager.getDependencies(fieldId);
    setDependencies(updatedDependencies);
    onDependenciesChange?.(updatedDependencies);
  }, [dependencyManager, fieldId, onDependenciesChange]);

  const handleSaveDependency = useCallback((dependency: FieldDependency) => {
    dependencyManager.addDependency(dependency);
    const updatedDependencies = dependencyManager.getDependencies(fieldId);
    setDependencies(updatedDependencies);
    setIsCreating(false);
    setEditingDependency(null);
    onDependenciesChange?.(updatedDependencies);
  }, [dependencyManager, fieldId, onDependenciesChange]);

  const handleCreateFromPattern = useCallback((patternKey: string) => {
    if (!selectedPattern) return;
    
    const pattern = DependencyPatterns[patternKey as keyof typeof DependencyPatterns];
    if (!pattern) return;

    const newDependency = dependencyManager.createFromPattern(
      patternKey as keyof typeof DependencyPatterns,
      '', // Will be set in the edit dialog
      fieldId
    );
    
    setEditingDependency(newDependency);
    setIsCreating(true);
    setSelectedPattern('');
  }, [dependencyManager, fieldId, selectedPattern]);

  if (!isVisible) {
    return null;
  }

  return (
    <Paper 
      elevation={2}
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Field Dependencies
        </Typography>
        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Quick Pattern</InputLabel>
            <Select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              label="Quick Pattern"
            >
              {Object.entries(DependencyPatterns).map(([key, pattern]) => (
                <MenuItem key={key} value={key}>
                  {key.replace(/_/g, ' ').toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            disabled={!selectedPattern}
            onClick={() => handleCreateFromPattern(selectedPattern)}
            sx={{ minWidth: 'auto' }}
          >
            Use Pattern
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDependency}
            size="small"
          >
            Add Dependency
          </Button>
        </Box>
      </Box>

      {dependencies.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No dependencies configured for this field. Add dependencies to create dynamic behavior based on other field values.
        </Alert>
      ) : (
        <List sx={{ mt: 2 }}>
          {dependencies.map((dependency) => {
            const TypeIcon = typeConfig[dependency.type].icon;
            return (
              <ListItem
                key={dependency.id}
                sx={{
                  mb: 1,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 1,
                  background: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <Box display="flex" alignItems="center" mr={2}>
                  <TypeIcon 
                    sx={{ 
                      color: typeConfig[dependency.type].color,
                      fontSize: 20 
                    }} 
                  />
                </Box>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={typeConfig[dependency.type].label}
                        size="small"
                        sx={{ 
                          backgroundColor: typeConfig[dependency.type].color + '20',
                          color: typeConfig[dependency.type].color,
                          fontWeight: 600
                        }}
                      />
                      <Typography variant="body2">
                        {dependency.description || `${dependency.type} dependency`}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Source: {dependency.sourceFieldId} • Priority: {dependency.priority}
                      {!dependency.enabled && ' • Disabled'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit dependency">
                      <IconButton
                        size="small"
                        onClick={() => handleEditDependency(dependency)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete dependency">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDependency(dependency.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}

      {/* Dependency Statistics */}
      {dependencies.length > 0 && (
        <Box mt={3} p={2} bgcolor="rgba(0, 0, 0, 0.02)" borderRadius={1}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Statistics: {dependencies.length} dependencies • {dependencies.filter(d => d.enabled).length} enabled
          </Typography>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <DependencyEditDialog
        open={isCreating}
        dependency={editingDependency}
        targetFieldId={fieldId}
        availableFields={availableFields}
        onSave={handleSaveDependency}
        onClose={() => {
          setIsCreating(false);
          setEditingDependency(null);
        }}
      />
    </Paper>
  );
};

// Dependency Edit Dialog Component
interface DependencyEditDialogProps {
  open: boolean;
  dependency: FieldDependency | null;
  targetFieldId: string;
  availableFields: Array<{ id: string; label: string; type: string }>;
  onSave: (dependency: FieldDependency) => void;
  onClose: () => void;
}

const DependencyEditDialog: React.FC<DependencyEditDialogProps> = ({
  open,
  dependency,
  targetFieldId,
  availableFields,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<FieldDependency>>({});

  React.useEffect(() => {
    if (dependency) {
      setFormData(dependency);
    } else {
      setFormData({
        sourceFieldId: '',
        targetFieldId,
        type: DependencyType.VISIBILITY,
        condition: {
          sourceFieldId: '',
          operator: ConditionOperator.EQUALS,
          targetValue: '',
          value: '',
          valueType: 'string' as any
        },
        action: {
          type: ActionType.SHOW,
          config: {}
        },
        enabled: true,
        priority: 100,
        description: ''
      });
    }
  }, [dependency, targetFieldId]);

  const handleSave = useCallback(() => {
    if (!formData.sourceFieldId || !formData.condition || !formData.action) return;

    const newDependency: FieldDependency = {
      id: dependency?.id || `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceFieldId: formData.sourceFieldId!,
      targetFieldId,
      type: formData.type!,
      condition: {
        ...formData.condition,
        sourceFieldId: formData.sourceFieldId!
      },
      action: formData.action,
      enabled: formData.enabled ?? true,
      priority: formData.priority ?? 100,
      description: formData.description || ''
    };

    onSave(newDependency);
  }, [formData, dependency, targetFieldId, onSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {dependency ? 'Edit Dependency' : 'Create New Dependency'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Source Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Source Field</InputLabel>
              <Select
                value={formData.sourceFieldId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceFieldId: e.target.value }))}
                label="Source Field"
              >
                {availableFields.filter(f => f.id !== targetFieldId).map(field => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.label} ({field.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Dependency Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Dependency Type</InputLabel>
              <Select
                value={formData.type || DependencyType.VISIBILITY}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DependencyType }))}
                label="Dependency Type"
              >
                {Object.values(DependencyType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Condition Operator */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={formData.condition?.operator || ConditionOperator.EQUALS}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  condition: { 
                    ...prev.condition!, 
                    operator: e.target.value as ConditionOperator 
                  } 
                }))}
                label="Condition"
              >
                {Object.values(ConditionOperator).map(op => (
                  <MenuItem key={op} value={op}>
                    {op.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Target Value */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Target Value"
              value={formData.condition?.targetValue || formData.condition?.value || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                condition: { 
                  ...prev.condition!, 
                  targetValue: e.target.value,
                  value: e.target.value
                } 
              }))}
              placeholder="Enter comparison value"
            />
          </Grid>

          {/* Action Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={formData.action?.type || ActionType.SHOW}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  action: { 
                    ...prev.action!, 
                    type: e.target.value as ActionType 
                  } 
                }))}
                label="Action"
              >
                {Object.values(ActionType).map(action => (
                  <MenuItem key={action} value={action}>
                    {action.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Priority"
              value={formData.priority || 100}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              inputProps={{ min: 1, max: 1000 }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this dependency"
            />
          </Grid>

          {/* Enabled Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled ?? true}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Enable this dependency"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={!formData.sourceFieldId}
        >
          {dependency ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependencyConfigPanel;