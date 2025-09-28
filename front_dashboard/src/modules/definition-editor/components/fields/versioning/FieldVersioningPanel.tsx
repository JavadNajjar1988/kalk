import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  Badge
} from '@mui/material';
import {
  History as HistoryIcon,
  Compare as CompareIcon,
  Restore as RestoreIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccountTree as BranchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Drafts as DraftIcon,
  Label as TagIcon
} from '@mui/icons-material';
import { 
  FieldVersioningEngine 
} from './FieldVersioningEngine';
import { 
  FieldVersion, 
  VersionBranch, 
  VersionComparison,
  VersionHistoryQuery
} from './types';

interface FieldVersioningPanelProps {
  fieldId: string;
  fieldName: string;
  onVersionRestore?: (version: FieldVersion) => void;
  onVersionCompare?: (comparison: VersionComparison) => void;
  className?: string;
}

const FieldVersioningPanel: React.FC<FieldVersioningPanelProps> = ({
  fieldId,
  fieldName,
  onVersionRestore,
  onVersionCompare,
  className
}) => {
  const versioningEngine = useMemo(() => FieldVersioningEngine.getInstance(), []);
  
  const [versions, setVersions] = useState<FieldVersion[]>([]);
  const [branches, setBranches] = useState<VersionBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Load versions and branches
  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: VersionHistoryQuery = {
        fieldId,
        branchName: selectedBranch,
        includeDrafts: true,
        includeArchived: false,
        sortBy: 'version',
        sortOrder: 'desc'
      };
      
      const fieldVersions = versioningEngine.getFieldVersions(fieldId, query);
      const fieldBranches = versioningEngine.getBranches(fieldId);
      
      setVersions(fieldVersions);
      setBranches(fieldBranches);
      
      // Set default branch if none selected
      if (!selectedBranch && fieldBranches.length > 0) {
        const defaultBranch = fieldBranches.find(b => b.isDefault) || fieldBranches[0];
        setSelectedBranch(defaultBranch.name);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fieldId, selectedBranch, versioningEngine]);

  // Initial load
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Handle version selection for comparison
  const handleVersionSelect = useCallback((version: number) => {
    setSelectedVersions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version);
      } else if (prev.length < 2) {
        return [...prev, version].sort((a, b) => a - b);
      } else {
        // Replace the older selection
        return [prev[1], version].sort((a, b) => a - b);
      }
    });
  }, []);

  // Create new version
  const handleCreateVersion = useCallback(() => {
    if (!newVersionName.trim()) return;
    
    try {
      const newVersion = versioningEngine.createVersion(fieldId, {
        // This would typically come from the current field configuration
        type: 'text',
        label: fieldName,
        required: false
      }, {
        name: newVersionName,
        description: newVersionDescription,
        createdBy: 'current_user',
        isDraft: isDraft,
        branchName: selectedBranch
      });
      
      setVersions(prev => [newVersion, ...prev]);
      setShowCreateDialog(false);
      setNewVersionName('');
      setNewVersionDescription('');
      setIsDraft(false);
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  }, [fieldId, fieldName, newVersionName, newVersionDescription, isDraft, selectedBranch, versioningEngine]);

  // Compare selected versions
  const handleCompareVersions = useCallback(() => {
    if (selectedVersions.length !== 2) return;
    
    try {
      const comparison = versioningEngine.compareVersions(
        fieldId,
        selectedVersions[0],
        selectedVersions[1]
      );
      
      onVersionCompare?.(comparison);
      setShowCompareDialog(true);
    } catch (error) {
      console.error('Failed to compare versions:', error);
    }
  }, [fieldId, selectedVersions, versioningEngine, onVersionCompare]);

  // Restore version
  const handleRestoreVersion = useCallback((version: number) => {
    try {
      const restored = versioningEngine.restoreVersion(fieldId, version, {
        createNewVersion: true,
        restoreAsDraft: true
      });
      
      if (restored) {
        onVersionRestore?.(restored);
        loadVersions(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  }, [fieldId, versioningEngine, onVersionRestore, loadVersions]);

  // Archive version
  const handleArchiveVersion = useCallback((version: number) => {
    try {
      const success = versioningEngine.archiveVersion(fieldId, version);
      if (success) {
        setVersions(prev => prev.map(v => 
          v.version === version ? { ...v, isArchived: true } : v
        ));
      }
    } catch (error) {
      console.error('Failed to archive version:', error);
    }
  }, [fieldId, versioningEngine]);

  // Delete version
  const handleDeleteVersion = useCallback((version: number) => {
    try {
      const success = versioningEngine.deleteVersion(fieldId, version);
      if (success) {
        setVersions(prev => prev.filter(v => v.version !== version));
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  }, [fieldId, versioningEngine]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      className={className}
      sx={{ 
        p: 3, 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Version History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fieldName} ({fieldId})
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Create New Version">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              New Version
            </Button>
          </Tooltip>
          
          <Tooltip title="Version Settings">
            <IconButton onClick={() => setShowSettingsDialog(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Branch Selector */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            label="Branch"
          >
            {branches.map(branch => (
              <MenuItem key={branch.id} value={branch.name}>
                <Box display="flex" alignItems="center" gap={1}>
                  <BranchIcon fontSize="small" />
                  {branch.name}
                  {branch.isDefault && (
                    <Chip 
                      label="Default" 
                      size="small" 
                      variant="outlined" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<BranchIcon />}
          onClick={() => {
            // Create new branch logic would go here
          }}
        >
          New Branch
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
        <Tab label="Compare" icon={<CompareIcon />} iconPosition="start" />
        <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
      </Tabs>

      {/* Version List */}
      {activeTab === 0 && (
        <Box>
          {versions.length === 0 ? (
            <Alert severity="info">
              No versions found for this field. Create your first version to get started.
            </Alert>
          ) : (
            <List>
              {versions.map((version, index) => (
                <React.Fragment key={version.id}>
                  <ListItem
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: 1,
                      mb: 1,
                      background: selectedVersions.includes(version.version) 
                        ? 'rgba(25, 118, 210, 0.1)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.9)'
                      }
                    }}
                    onClick={() => Number(activeTab) === 1 && handleVersionSelect(version.version)}
                  >
                    <Box display="flex" alignItems="center" mr={2}>
                      {version.isDraft ? (
                        <DraftIcon color="warning" />
                      ) : (
                        <CheckIcon color="success" />
                      )}
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            v{version.version} - {version.name}
                          </Typography>
                          {version.isDraft && (
                            <Chip 
                              label="Draft" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                            />
                          )}
                          {version.isArchived && (
                            <Chip 
                              label="Archived" 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Created by {version.createdBy} on {version.createdAt.toLocaleDateString()}
                          </Typography>
                          {version.description && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {version.description}
                            </Typography>
                          )}
                          {version.tags.length > 0 && (
                            <Box display="flex" gap={0.5} mt={1}>
                              {version.tags.map(tag => (
                                <Chip 
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  icon={<TagIcon />}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Restore Version">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(version.version);
                            }}
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Archive Version">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveVersion(version.version);
                            }}
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Version">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVersion(version.version);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < versions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Compare Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body1">
              {selectedVersions.length === 0 
                ? 'Select two versions to compare' 
                : selectedVersions.length === 1
                  ? 'Select one more version to compare'
                  : `Comparing v${selectedVersions[0]} and v${selectedVersions[1]}`}
            </Typography>
            
            <Button
              variant="contained"
              disabled={selectedVersions.length !== 2}
              onClick={handleCompareVersions}
              startIcon={<CompareIcon />}
            >
              Compare
            </Button>
          </Box>
          
          {selectedVersions.length === 2 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Click "Compare" to see detailed differences between these versions
            </Alert>
          )}
          
          {/* Version list for selection */}
          <List>
            {versions.map((version, index) => (
              <ListItem
                key={version.id}
                button
                selected={selectedVersions.includes(version.version)}
                onClick={() => handleVersionSelect(version.version)}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 1,
                  mb: 1,
                  background: selectedVersions.includes(version.version) 
                    ? 'rgba(25, 118, 210, 0.1)' 
                    : 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <ListItemText
                  primary={`v${version.version} - ${version.name}`}
                  secondary={`Created ${version.createdAt.toLocaleDateString()} by ${version.createdBy}`}
                />
                {selectedVersions.includes(version.version) && (
                  <CheckIcon color="primary" />
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Settings Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Versioning Settings
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-save drafts"
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable branching"
              sx={{ ml: 4 }}
            />
            
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Max versions per field"
                type="number"
                defaultValue={50}
                InputProps={{ inputProps: { min: 1, max: 1000 } }}
                sx={{ width: 200 }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Create New Version</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Version Name"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={newVersionDescription}
              onChange={(e) => setNewVersionDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                />
              }
              label="Save as draft"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateVersion}
            disabled={!newVersionName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)}>
        <DialogTitle>Versioning Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-save drafts every 30 seconds"
            />
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable branching"
              sx={{ ml: 4 }}
            />
            
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Max versions per field"
                type="number"
                defaultValue={50}
                InputProps={{ inputProps: { min: 1, max: 1000 } }}
                sx={{ width: 200 }}
              />
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Retention Policy
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                label="Keep versions"
                type="number"
                defaultValue={20}
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                sx={{ width: 150 }}
              />
              
              <TextField
                label="Archive after (days)"
                type="number"
                defaultValue={90}
                InputProps={{ inputProps: { min: 1, max: 365 } }}
                sx={{ width: 150 }}
              />
              
              <TextField
                label="Delete after (days)"
                type="number"
                defaultValue={365}
                InputProps={{ inputProps: { min: 30, max: 3650 } }}
                sx={{ width: 150 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowSettingsDialog(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FieldVersioningPanel;