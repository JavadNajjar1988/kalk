// Template Importer Component
// کامپوننت وارد کننده قالب

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  FormControlLabel,
  Checkbox,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  FileUpload as FileUploadIcon,
  Merge as MergeIcon,
  Transform as TransformIcon
} from '@mui/icons-material';

import type { FieldTemplate } from '../../utils/templateExporter';
import type { FieldConstructorConfig } from '../../types/fieldConstructor';
import type { CustomField } from '../../types/equipment';
import { TemplateImporter as TemplateImporterUtil, type ImportOptions, type ImportResult } from '../../utils/templateImporter';

interface TemplateImporterProps {
  onImportComplete?: (result: ImportResult) => void;
  existingFields?: FieldConstructorConfig[];
  allowMerge?: boolean;
  maxFileSize?: number; // in MB
}

const TemplateImporter: React.FC<TemplateImporterProps> = ({
  onImportComplete,
  existingFields = [],
  allowMerge = true,
  maxFileSize = 10
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<FieldTemplate | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mergeDuplicates: true,
    updateExisting: false,
    skipInvalidFields: true,
    convertLegacyFields: true,
    preserveIds: false,
    idPrefix: ''
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  const steps = [
    'انتخاب فایل',
    'پیش‌نمایش قالب',
    'تنظیمات ورود',
    'تأیید و ورود'
  ];

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`حجم فایل نباید بیشتر از ${maxFileSize} مگابایت باشد`);
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('فقط فایل‌های JSON پشتیبانی می‌شوند');
      return;
    }

    setSelectedFile(file);
    setError('');
    processFile(file);
  }, [maxFileSize]);

  // Process selected file
  const processFile = async (file: File) => {
    setLoading(true);
    try {
      const content = await readFileContent(file);
      const parsedTemplate: FieldTemplate = JSON.parse(content);
      
      // Preview template
      const previewData = await TemplateImporterUtil.previewTemplate(parsedTemplate);
      
      setTemplate(parsedTemplate);
      setPreview(previewData);
      
      if (previewData.isValid) {
        setActiveStep(1);
      } else {
        setError('قالب انتخاب شده معتبر نیست: ' + previewData.validation.errors.join(', '));
      }
    } catch (error) {
      setError(`خطا در خواندن فایل: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
      reader.readAsText(file);
    });
  };

  // Handle import
  const handleImport = async () => {
    if (!template) return;

    setLoading(true);
    try {
      const result = await TemplateImporterUtil.importTemplate(template, importOptions);
      setImportResult(result);
      
      if (result.success) {
        setActiveStep(3);
        onImportComplete?.(result);
      } else {
        setError('خطا در ورود قالب: ' + result.errors.join(', '));
      }
    } catch (error) {
      setError(`خطا در ورود قالب: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset dialog
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setTemplate(null);
    setPreview(null);
    setImportResult(null);
    setError('');
    setImportOptions({
      mergeDuplicates: true,
      updateExisting: false,
      skipInvalidFields: true,
      convertLegacyFields: true,
      preserveIds: false,
      idPrefix: ''
    });
  };

  // Handle dialog close
  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        onClick={() => setIsOpen(true)}
        sx={{ borderRadius: 2 }}
      >
        ورود قالب
      </Button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon color="primary" />
            <Typography variant="h6">ورود قالب فیلد</Typography>
          </Box>
          {loading && <LinearProgress sx={{ mt: 1 }} />}
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: File Selection */}
            <Step>
              <StepLabel>انتخاب فایل قالب</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="template-file-input"
                  />
                  <label htmlFor="template-file-input">
                    <Card
                      sx={{
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        backgroundColor: alpha('rgb(25, 118, 210)', 0.04),
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: alpha('rgb(25, 118, 210)', 0.08)
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <FileUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          فایل قالب JSON را انتخاب کنید
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          حداکثر حجم: {maxFileSize} مگابایت
                        </Typography>
                        {selectedFile && (
                          <Chip
                            label={selectedFile.name}
                            color="primary"
                            sx={{ mt: 2 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </label>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Template Preview */}
            <Step>
              <StepLabel>پیش‌نمایش قالب</StepLabel>
              <StepContent>
                {preview && (
                  <Box sx={{ py: 2 }}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          اطلاعات قالب
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              نام قالب
                            </Typography>
                            <Typography variant="body1">
                              {template?.metadata.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              دسته‌بندی
                            </Typography>
                            <Typography variant="body1">
                              {template?.metadata.category}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              توضیحات
                            </Typography>
                            <Typography variant="body1">
                              {template?.metadata.description || 'توضیحی ارائه نشده'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          خلاصه فیلدها
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={`${preview.summary.totalFields} فیلد کل`}
                            color="primary"
                          />
                          <Chip
                            label={`${preview.summary.constructorFields} فیلد جدید`}
                            color="success"
                          />
                          {preview.summary.legacyFields > 0 && (
                            <Chip
                              label={`${preview.summary.legacyFields} فیلد قدیمی`}
                              color="warning"
                            />
                          )}
                        </Box>

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>لیست فیلدها</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>نام</TableCell>
                                    <TableCell>نوع</TableCell>
                                    <TableCell>وضعیت</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {preview.fieldList.map((field: any) => (
                                    <TableRow key={field.id}>
                                      <TableCell>{field.name}</TableCell>
                                      <TableCell>{field.type}</TableCell>
                                      <TableCell>
                                        <Chip
                                          size="small"
                                          label={field.isEnhanced ? 'جدید' : 'قدیمی'}
                                          color={field.isEnhanced ? 'success' : 'warning'}
                                        />
                                        {!field.isEnhanced && field.canConvert && (
                                          <Chip
                                            size="small"
                                            label="قابل تبدیل"
                                            color="info"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>

                        {preview.validation.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              هشدارها:
                            </Typography>
                            <List dense>
                              {preview.validation.warnings.map((warning: string, index: number) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText primary={warning} />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          onClick={() => setActiveStep(2)}
                          variant="contained"
                          disabled={!preview.isValid}
                        >
                          ادامه
                        </Button>
                      </CardActions>
                    </Card>
                  </Box>
                )}
              </StepContent>
            </Step>

            {/* Step 3: Import Options */}
            <Step>
              <StepLabel>تنظیمات ورود</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        گزینه‌های ورود
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={importOptions.convertLegacyFields}
                              onChange={(e) => setImportOptions(prev => ({
                                ...prev,
                                convertLegacyFields: e.target.checked
                              }))}
                            />
                          }
                          label="تبدیل فیلدهای قدیمی به فیلدهای جدید"
                        />

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={importOptions.skipInvalidFields}
                              onChange={(e) => setImportOptions(prev => ({
                                ...prev,
                                skipInvalidFields: e.target.checked
                              }))}
                            />
                          }
                          label="رد کردن فیلدهای نامعتبر"
                        />

                        {allowMerge && existingFields.length > 0 && (
                          <>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={importOptions.updateExisting}
                                  onChange={(e) => setImportOptions(prev => ({
                                    ...prev,
                                    updateExisting: e.target.checked
                                  }))}
                                />
                              }
                              label="به‌روزرسانی فیلدهای موجود"
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={importOptions.preserveIds}
                                  onChange={(e) => setImportOptions(prev => ({
                                    ...prev,
                                    preserveIds: e.target.checked
                                  }))}
                                />
                              }
                              label="حفظ شناسه‌های اصلی فیلدها"
                            />
                          </>
                        )}

                        <TextField
                          label="پیشوند شناسه فیلدها"
                          value={importOptions.idPrefix || ''}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            idPrefix: e.target.value
                          }))}
                          placeholder="imported_"
                          size="small"
                          helperText="برای جلوگیری از تداخل شناسه‌ها"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        onClick={handleImport}
                        variant="contained"
                        disabled={loading}
                        startIcon={<TransformIcon />}
                      >
                        ورود قالب
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Import Result */}
            <Step>
              <StepLabel>نتیجه ورود</StepLabel>
              <StepContent>
                {importResult && (
                  <Box sx={{ py: 2 }}>
                    <Alert
                      severity={importResult.success ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h6">
                        {importResult.success ? 'ورود موفقیت‌آمیز بود!' : 'ورود با خطا مواجه شد'}
                      </Typography>
                    </Alert>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          آمار ورود
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="primary">
                              {importResult.stats.totalImported}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              کل فیلدهای وارد شده
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="success.main">
                              {importResult.stats.constructorFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای جدید
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="warning.main">
                              {importResult.stats.legacyFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای قدیمی
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="error.main">
                              {importResult.stats.skippedFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای رد شده
                            </Typography>
                          </Grid>
                        </Grid>

                        {importResult.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              هشدارها:
                            </Typography>
                            <List dense>
                              {importResult.warnings.map((warning, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText primary={warning} />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                        {importResult.errors.length > 0 && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              خطاها:
                            </Typography>
                            <List dense>
                              {importResult.errors.map((error, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText primary={error} />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleReset} disabled={loading}>
            شروع مجدد
          </Button>
          <Button onClick={handleClose} disabled={loading}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateImporter;