import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FileUpload as FileUploadIcon,
  GetApp as GetAppIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useOrbatIntegration } from '../../hooks/useOrbatIntegration';

interface ExportImportDialogsProps {
  open: boolean;
  mode: 'export' | 'import';
  scenarioId: string | null;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

interface ExportOptions {
  format: 'json' | 'kml' | 'geojson' | 'csv';
  includeMetadata: boolean;
  includeTimeline: boolean;
  includeUnits: boolean;
  includeFeatures: boolean;
  compressData: boolean;
  splitFiles: boolean;
}

interface ImportOptions {
  format: 'json' | 'kml' | 'geojson' | 'csv';
  mergeWithExisting: boolean;
  validateData: boolean;
  createBackup: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '16px' }}>
    {value === index && children}
  </div>
);

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  includeMetadata: true,
  includeTimeline: true,
  includeUnits: true,
  includeFeatures: true,
  compressData: false,
  splitFiles: false
};

const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  format: 'json',
  mergeWithExisting: false,
  validateData: true,
  createBackup: true
};

const ExportImportDialogs: React.FC<ExportImportDialogsProps> = ({
  open,
  mode,
  scenarioId,
  onClose,
  onComplete
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [importOptions, setImportOptions] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [exportResult, setExportResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { orbatInstance } = useOrbatIntegration();

  const handleExport = async () => {
    if (!scenarioId || !orbatInstance) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await orbatInstance.exportScenario(scenarioId, exportOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(result, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenario-${scenarioId}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportResult(result);
      onComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }

    setLoading(false);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0 || !orbatInstance) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const file = selectedFiles[0];
      const fileContent = await file.text();
      
      let data;
      try {
        data = JSON.parse(fileContent);
      } catch {
        throw new Error('Invalid file format. Please select a valid JSON file.');
      }

      const result = await orbatInstance.importScenario(data, importOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setImportResult(result);
      onComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }

    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError(null);
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const updateExportOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const updateImportOption = (key: keyof ImportOptions, value: any) => {
    setImportOptions(prev => ({ ...prev, [key]: value }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {mode === 'export' ? <DownloadIcon /> : <UploadIcon />}
            <Typography variant="h6">
              {mode === 'export' ? 'Export Scenario' : 'Import Scenario'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {mode === 'export' ? (
          // Export UI
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Export your scenario data to various formats for backup, sharing, or use in other applications.
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Export Options</Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportOptions.format}
                  onChange={(e) => updateExportOption('format', e.target.value)}
                >
                  <MenuItem value="json">JSON (Complete Data)</MenuItem>
                  <MenuItem value="kml">KML (Google Earth)</MenuItem>
                  <MenuItem value="geojson">GeoJSON (Geographic Data)</MenuItem>
                  <MenuItem value="csv">CSV (Tabular Data)</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Include Data</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => updateExportOption('includeMetadata', e.target.checked)}
                    />
                  }
                  label="Metadata"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeUnits}
                      onChange={(e) => updateExportOption('includeUnits', e.target.checked)}
                    />
                  }
                  label="Units"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeFeatures}
                      onChange={(e) => updateExportOption('includeFeatures', e.target.checked)}
                    />
                  }
                  label="Map Features"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeTimeline}
                      onChange={(e) => updateExportOption('includeTimeline', e.target.checked)}
                    />
                  }
                  label="Timeline Events"
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Options</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.compressData}
                      onChange={(e) => updateExportOption('compressData', e.target.checked)}
                    />
                  }
                  label="Compress Data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.splitFiles}
                      onChange={(e) => updateExportOption('splitFiles', e.target.checked)}
                    />
                  }
                  label="Split into Multiple Files"
                />
              </Box>
            </Paper>

            {loading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Exporting scenario data... {progress}%
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}

            {exportResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Export completed successfully! File has been downloaded.
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          // Import UI
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Import scenario data from previously exported files or other compatible formats.
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Select Files</Typography>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.kml,.geojson,.csv"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <Button
                variant="outlined"
                startIcon={<FileUploadIcon />}
                onClick={handleBrowseFiles}
                sx={{ mb: 2 }}
              >
                Browse Files
              </Button>

              {selectedFiles.length > 0 && (
                <List>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                      <Chip label={file.type || 'Unknown'} size="small" />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Import Options</Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Format</InputLabel>
                <Select
                  value={importOptions.format}
                  onChange={(e) => updateImportOption('format', e.target.value)}
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="kml">KML</MenuItem>
                  <MenuItem value="geojson">GeoJSON</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.mergeWithExisting}
                      onChange={(e) => updateImportOption('mergeWithExisting', e.target.checked)}
                    />
                  }
                  label="Merge with Existing Data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.validateData}
                      onChange={(e) => updateImportOption('validateData', e.target.checked)}
                    />
                  }
                  label="Validate Data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.createBackup}
                      onChange={(e) => updateImportOption('createBackup', e.target.checked)}
                    />
                  }
                  label="Create Backup Before Import"
                />
              </Box>
            </Paper>

            {loading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Importing scenario data... {progress}%
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}

            {importResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Import completed successfully! {importResult.unitsImported || 0} units and {importResult.featuresImported || 0} features imported.
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {mode === 'export' ? (
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<GetAppIcon />}
            disabled={loading || !scenarioId}
          >
            Export Data
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={loading || selectedFiles.length === 0}
          >
            Import Data
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportImportDialogs;