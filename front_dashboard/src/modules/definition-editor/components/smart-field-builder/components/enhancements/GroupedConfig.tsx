import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

interface GroupConfig {
  id: string;
  name: string;
  description?: string;
  options: string[]; // Added options array
}

interface GroupedConfigData {
  groups: GroupConfig[];
  showGroupHeaders: boolean;
  allowUngrouped: boolean;
  groupSortOrder: 'alphabetical' | 'custom';
  ungroupedOptions?: string[]; // Added ungrouped options
}

interface GroupedConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: GroupedConfigData) => void;
  initialConfig?: GroupedConfigData;
  availableOptions?: string[]; // Added available options prop
}

const GroupedConfig: React.FC<GroupedConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig,
  availableOptions = ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴', 'گزینه ۵']
}) => {
  const [config, setConfig] = useState<GroupedConfigData>({
    groups: [],
    showGroupHeaders: true,
    allowUngrouped: true,
    groupSortOrder: 'alphabetical',
    ungroupedOptions: [],
    ...initialConfig
  });

  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
    }
    // Initialize ungrouped options if not set
    if (!initialConfig?.ungroupedOptions) {
      const allGroupedOptions = (initialConfig?.groups || []).flatMap(g => g.options || []);
      const ungroupedOptions = availableOptions.filter(opt => !allGroupedOptions.includes(opt));
      setConfig(prev => ({ ...prev, ungroupedOptions }));
    }
  }, [initialConfig, availableOptions]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (config.groups.length === 0) {
      newErrors.groups = 'حداقل یک گروه باید تعریف شود';
    }

    if (newGroup.name.trim() && config.groups.some(g => g.name === newGroup.name.trim())) {
      newErrors.newGroup = 'نام گروه تکراری است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfigChange = (field: keyof GroupedConfigData, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addGroup = () => {
    if (newGroup.name.trim() && !config.groups.some(g => g.name === newGroup.name.trim())) {
      const newGroupObj = {
        id: `group_${Date.now()}`,
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        options: [] // Initialize with empty options array
      };
      const newGroups = [...config.groups, newGroupObj];
      setConfig(prev => ({
        ...prev,
        groups: newGroups
      }));
      setNewGroup({ name: '', description: '' });
      setSelectedGroupId(newGroupObj.id); // Auto-select the new group
    }
  };

  const removeGroup = (groupId: string) => {
    const groupToRemove = config.groups.find(g => g.id === groupId);
    if (groupToRemove) {
      // Move group options back to ungrouped
      const updatedUngroupedOptions = [...(config.ungroupedOptions || []), ...(groupToRemove.options || [])];
      const newGroups = config.groups.filter(g => g.id !== groupId);
      setConfig(prev => ({
        ...prev,
        groups: newGroups,
        ungroupedOptions: updatedUngroupedOptions
      }));
      if (selectedGroupId === groupId) {
        setSelectedGroupId('');
      }
    }
  };

  // Add option to a group
  const addOptionToGroup = (groupId: string, option: string) => {
    const updatedGroups = config.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          options: [...(group.options || []), option]
        };
      }
      return group;
    });
    
    // Remove from ungrouped options
    const updatedUngroupedOptions = (config.ungroupedOptions || []).filter(opt => opt !== option);
    
    setConfig(prev => ({
      ...prev,
      groups: updatedGroups,
      ungroupedOptions: updatedUngroupedOptions
    }));
  };

  // Remove option from group
  const removeOptionFromGroup = (groupId: string, option: string) => {
    const updatedGroups = config.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          options: (group.options || []).filter(opt => opt !== option)
        };
      }
      return group;
    });
    
    // Add back to ungrouped options
    const updatedUngroupedOptions = [...(config.ungroupedOptions || []), option];
    
    setConfig(prev => ({
      ...prev,
      groups: updatedGroups,
      ungroupedOptions: updatedUngroupedOptions
    }));
  };

  // Get available options for a group (not assigned to other groups)
  const getAvailableOptionsForGroup = (excludeGroupId?: string) => {
    const assignedOptions = config.groups
      .filter(g => g.id !== excludeGroupId)
      .flatMap(g => g.options || []);
    return availableOptions.filter(opt => !assignedOptions.includes(opt));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGroup();
    }
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to initial config
    if (initialConfig) {
      setConfig({ ...initialConfig });
    } else {
      const ungroupedOptions = availableOptions;
      setConfig({
        groups: [],
        showGroupHeaders: true,
        allowUngrouped: true,
        groupSortOrder: 'alphabetical',
        ungroupedOptions
      });
    }
    setNewGroup({ name: '', description: '' });
    setErrors({});
    setCurrentTab(0);
    setSelectedGroupId('');
    onClose();
  };

  useEffect(() => {
    validateConfig();
  }, [config, newGroup]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات گروه‌بندی</Typography>
        <Typography variant="body2" color="text.secondary">
          تعریف گروه‌ها برای سازماندهی بهتر گزینه‌ها
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          گروه‌بندی به کاربران کمک می‌کند تا گزینه‌ها را بهتر سازماندهی و پیدا کنند. شما می‌توانید گزینه‌ها را به گروه‌ها اختصاص دهید.
        </Alert>

        {/* Tab Navigation */}
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="تعریف گروه‌ها" />
          <Tab label="تخصیص گزینه‌ها" disabled={config.groups.length === 0} />
          <Tab label="تنظیمات نمایش" />
        </Tabs>

        {/* Tab 1: Group Definition */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                تعریف گروه‌ها
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="نام گروه"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  size="small"
                  sx={{ flex: 1 }}
                  error={!!errors.newGroup}
                  helperText={errors.newGroup}
                />
                <TextField
                  label="توضیحات (اختیاری)"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  onClick={addGroup}
                  variant="outlined"
                  disabled={!newGroup.name.trim()}
                  startIcon={<AddIcon />}
                >
                  افزودن
                </Button>
              </Box>

              {errors.groups && (
                <Alert severity="error" sx={{ mb: 2 }}>{errors.groups}</Alert>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {config.groups.map((group) => (
                  <Chip
                    key={group.id}
                    label={`${group.name} (${(group.options || []).length} گزینه)`}
                    onDelete={() => removeGroup(group.id)}
                    color={selectedGroupId === group.id ? "primary" : "default"}
                    variant={selectedGroupId === group.id ? "filled" : "outlined"}
                    onClick={() => setSelectedGroupId(group.id)}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Option Assignment */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                انتخاب گروه
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>گروه مورد نظر</InputLabel>
                <Select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  label="گروه مورد نظر"
                >
                  {config.groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name} ({(group.options || []).length} گزینه)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedGroupId && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    افزودن گزینه به گروه
                  </Typography>
                  <Autocomplete
                    size="small"
                    options={getAvailableOptionsForGroup(selectedGroupId)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="انتخاب گزینه"
                        placeholder="گزینه مورد نظر را انتخاب کنید"
                      />
                    )}
                    onChange={(_, value) => {
                      if (value && selectedGroupId) {
                        addOptionToGroup(selectedGroupId, value);
                      }
                    }}
                    value={null}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              {selectedGroupId && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    گزینه‌های گروه {config.groups.find(g => g.id === selectedGroupId)?.name}
                  </Typography>
                  <List dense>
                    {(config.groups.find(g => g.id === selectedGroupId)?.options || []).map((option, index) => (
                      <ListItem key={index}>
                        <DragIcon sx={{ mr: 1, color: 'text.disabled' }} />
                        <ListItemText primary={option} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => removeOptionFromGroup(selectedGroupId, option)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {(config.groups.find(g => g.id === selectedGroupId)?.options || []).length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="هیچ گزینه‌ای تعریف نشده"
                          sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {/* Ungrouped Options */}
              {config.allowUngrouped && (config.ungroupedOptions || []).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    گزینه‌های بدون گروه
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(config.ungroupedOptions || []).map((option) => (
                      <Chip
                        key={option}
                        label={option}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Display Settings */}
        {currentTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>ترتیب نمایش گروه‌ها</InputLabel>
                <Select
                  value={config.groupSortOrder}
                  label="ترتیب نمایش گروه‌ها"
                  onChange={(e) => handleConfigChange('groupSortOrder', e.target.value)}
                >
                  <MenuItem value="alphabetical">الفبایی</MenuItem>
                  <MenuItem value="custom">سفارشی</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                تنظیمات نمایش
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.showGroupHeaders}
                      onChange={(e) => handleConfigChange('showGroupHeaders', e.target.checked)}
                    />
                  }
                  label="نمایش عنوان گروه‌ها"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allowUngrouped}
                      onChange={(e) => handleConfigChange('allowUngrouped', e.target.checked)}
                    />
                  }
                  label="اجازه گزینه‌های بدون گروه"
                />
              </Box>
            </Grid>
          </Grid>
        )}

        <Divider sx={{ my: 3 }} />

        {/* پیش‌نمایش */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <FormControl fullWidth size="small">
              <InputLabel>نمونه فیلد</InputLabel>
              <Select label="نمونه فیلد" defaultValue="">
                {config.groups.map((group) => [
                  config.showGroupHeaders && (
                    <MenuItem key={`header-${group.id}`} disabled sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {group.name}
                    </MenuItem>
                  ),
                  ...(group.options || []).map((option) => (
                    <MenuItem key={`${group.id}-${option}`} value={option} sx={{ pl: config.showGroupHeaders ? 4 : 2 }}>
                      {option}
                    </MenuItem>
                  ))
                ]).flat().filter(Boolean)}
                {config.allowUngrouped && (config.ungroupedOptions || []).length > 0 && [
                  config.showGroupHeaders && config.groups.length > 0 && (
                    <MenuItem key="ungrouped-header" disabled sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      بدون گروه
                    </MenuItem>
                  ),
                  ...(config.ungroupedOptions || []).map((option) => (
                    <MenuItem key={`ungrouped-${option}`} value={option} sx={{ pl: config.showGroupHeaders && config.groups.length > 0 ? 4 : 2 }}>
                      {option}
                    </MenuItem>
                  ))
                ].filter(Boolean)}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {config.groups.length} گروه | 
              {config.groups.reduce((sum, group) => sum + (group.options || []).length, 0)} گزینه گروه‌بندی‌شده |
              {(config.ungroupedOptions || []).length} گزینه بدون گروه
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          انصراف
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={Object.keys(errors).length > 0}
        >
          ذخیره تنظیمات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupedConfig;