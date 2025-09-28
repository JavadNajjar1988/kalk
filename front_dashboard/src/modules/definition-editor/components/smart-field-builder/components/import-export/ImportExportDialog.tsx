/**
 * Import/Export UI Components
 * Provides user interface for field configuration import and export
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  TextField,
  Alert,
  LinearProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Settings as SettingsIcon,
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Backup as BackupIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useFieldImportExport } from '../../hooks/useFieldImportExport';
import { AnimatedProgress } from '../animations/EnhancedTransitions';

interface ImportExportDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  fields: any[];
  onImport?: (fields: any[]) => void;
  onExport?: (data: string) => void;
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onClose,
  mode,
  fields,
  onImport,
  onExport
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isExporting,
    isImporting,
    exportProgress,
    importProgress,
    exportFields,
    importFields,
    downloadExport,
    createBackup,
    validateFieldConfig
  } = useFieldImportExport();

  // Export state
  const [exportOptions, setExportOptions] = useState({
    format: 'json' as 'json' | 'csv' | 'xlsx',
    includeMetadata: true,
    includeValidation: true,
    includeEnhancements: true,
    compression: false
  });

  // Import state
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    validateOnImport: true,
    createBackup: true,
    mergeStrategy: 'append' as 'replace' | 'merge' | 'append'
  });

  const [importData, setImportData] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const data = await exportFields(fields, exportOptions);
      
      if (onExport) {
        onExport(data);
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `field-config-${timestamp}.${exportOptions.format}`;
      
      downloadExport(data, filename, exportOptions.format);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [fields, exportOptions, exportFields, onExport, downloadExport, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        
        // Preview import data
        try {
          const parsed = JSON.parse(content);
          if (parsed.fields && Array.isArray(parsed.fields)) {
            setImportPreview(parsed.fields.slice(0, 5)); // Show first 5 fields
            
            // Validate fields
            const errors: string[] = [];
            parsed.fields.forEach((field: any, index: number) => {
              const fieldErrors = validateFieldConfig(field);
              if (fieldErrors.length > 0) {
                errors.push(`Field ${index + 1}: ${fieldErrors.join(', ')}`);
              }
            });
            setValidationErrors(errors);
          }
        } catch (error) {
          setValidationErrors(['Invalid JSON format']);
        }
      };
      reader.readAsText(file);
    }
  }, [validateFieldConfig]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!importData) return;

    try {
      // Create backup if requested
      if (importOptions.createBackup && fields.length > 0) {
        await createBackup(fields);
      }

      const importedFields = await importFields(importData, importOptions);
      
      if (onImport) {
        onImport(importedFields);
      }
      
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Import failed']);
    }
  }, [importData, importOptions, fields, importFields, createBackup, onImport, onClose]);

  const renderExportOptions = () => (
    <Box sx={{ space: 3 }}>
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">فرمت خروجی</FormLabel>
        <RadioGroup
          value={exportOptions.format}
          onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
          row
        >
          <FormControlLabel value="json" control={<Radio />} label="JSON" />
          <FormControlLabel value="csv" control={<Radio />} label="CSV" />
          <FormControlLabel value="xlsx" control={<Radio />} label="Excel" />
        </RadioGroup>
      </FormControl>

      <Typography variant="subtitle2" gutterBottom>
        گزینه‌های اضافی
      </Typography>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={exportOptions.includeMetadata}
            onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
          />
        }
        label="شامل اطلاعات متا"
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={exportOptions.includeValidation}
            onChange={(e) => setExportOptions(prev => ({ ...prev, includeValidation: e.target.checked }))}
          />
        }
        label="شامل قوانین اعتبارسنجی"
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={exportOptions.includeEnhancements}
            onChange={(e) => setExportOptions(prev => ({ ...prev, includeEnhancements: e.target.checked }))}
          />
        }
        label="شامل بهبودها"
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={exportOptions.compression}
            onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
          />
        }
        label="فشرده‌سازی (JSON)"
      />

      <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          📊 تعداد فیلدها: {fields.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📁 فرمت: {exportOptions.format.toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );

  const renderImportOptions = () => (
    <Box sx={{ space: 3 }}>
      {/* File Upload */}
      <Box sx={{ mb: 3 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.xlsx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          sx={{ mb: 2 }}
        >
          انتخاب فایل
        </Button>
        
        {importFile && (
          <Chip
            label={importFile.name}
            onDelete={() => {
              setImportFile(null);
              setImportData('');
              setImportPreview([]);
              setValidationErrors([]);
            }}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Import Options */}
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">استراتژی ادغام</FormLabel>
        <RadioGroup
          value={importOptions.mergeStrategy}
          onChange={(e) => setImportOptions(prev => ({ ...prev, mergeStrategy: e.target.value as any }))}
        >
          <FormControlLabel value="append" control={<Radio />} label="اضافه کردن (حفظ موجودی)" />
          <FormControlLabel value="merge" control={<Radio />} label="ادغام (بروزرسانی موجودی)" />
          <FormControlLabel value="replace" control={<Radio />} label="جایگزینی (حذف همه)" />
        </RadioGroup>
      </FormControl>

      <FormControlLabel
        control={
          <Checkbox
            checked={importOptions.validateOnImport}
            onChange={(e) => setImportOptions(prev => ({ ...prev, validateOnImport: e.target.checked }))}
          />
        }
        label="اعتبارسنجی در هنگام ورود"
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={importOptions.createBackup}
            onChange={(e) => setImportOptions(prev => ({ ...prev, createBackup: e.target.checked }))}
          />
        }
        label="ایجاد پشتیبان قبل از ورود"
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            خطاهای اعتبارسنجی:
          </Typography>
          <List dense>
            {validationErrors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon>
                  <ErrorIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Import Preview */}
      {importPreview.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              پیش‌نمایش فیلدها ({importPreview.length} نمونه)
            </Typography>
            <List dense>
              {importPreview.map((field, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={field.name}
                    secondary={`نوع: ${field.type} | ID: ${field.id}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const isInProgress = isExporting || isImporting;
  const progress = mode === 'export' ? exportProgress : importProgress;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
        }}
      >
        {mode === 'export' ? <ExportIcon color="primary" /> : <ImportIcon color="primary" />}
        <Typography variant="h6" component="h2">
          {mode === 'export' ? 'خروجی تنظیمات فیلدها' : 'ورود تنظیمات فیلدها'}
        </Typography>
        
        <Box sx={{ flex: 1 }} />
        
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {isInProgress && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2">
                {mode === 'export' ? 'در حال خروجی...' : 'در حال ورود...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <AnimatedProgress progress={progress} showValue={false} />
          </Box>
        )}

        {mode === 'export' ? renderExportOptions() : renderImportOptions()}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          انصراف
        </Button>
        
        {mode === 'export' ? (
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={isExporting || fields.length === 0}
          >
            خروجی گرفتن
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            startIcon={<UploadIcon />}
            disabled={isImporting || !importData || validationErrors.length > 0}
          >
            وارد کردن
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Quick action buttons for import/export
interface ImportExportButtonsProps {
  fields: any[];
  onImport: (fields: any[]) => void;
  onExport: (data: string) => void;
}

export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  fields,
  onImport,
  onExport
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'import' | 'export'>('export');

  const handleOpenExport = () => {
    setDialogMode('export');
    setDialogOpen(true);
  };

  const handleOpenImport = () => {
    setDialogMode('import');
    setDialogOpen(true);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="خروجی تنظیمات">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            onClick={handleOpenExport}
            disabled={fields.length === 0}
          >
            خروجی
          </Button>
        </Tooltip>
        
        <Tooltip title="ورود تنظیمات">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ImportIcon />}
            onClick={handleOpenImport}
          >
            ورود
          </Button>
        </Tooltip>
      </Box>

      <ImportExportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
        fields={fields}
        onImport={onImport}
        onExport={onExport}
      />
    </>
  );
};

export default ImportExportDialog;