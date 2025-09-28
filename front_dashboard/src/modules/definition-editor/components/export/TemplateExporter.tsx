// Template Exporter Component
// کامپوننت صادرکننده قالب

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
  Chip,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha
} from '@mui/material';
import {
  Download as DownloadIcon,
  GetApp as GetAppIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  Code as CodeIcon,
  DataObject as DataObjectIcon,
  Transform as TransformIcon
} from '@mui/icons-material';

import type { CustomField } from '../../types/equipment';
import { TemplateExporter as TemplateExporterUtil, type FieldTemplate, type ExportStats } from '../../utils/templateExporter';

interface TemplateExporterProps {
  fields: CustomField[];
  defaultName?: string;
  defaultCategory?: string;
  onExportComplete?: (stats: ExportStats) => void;
}

const TemplateExporter: React.FC<TemplateExporterProps> = ({
  fields,
  defaultName = '',
  defaultCategory = 'general',
  onExportComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [metadata, setMetadata] = useState({
    name: defaultName,
    description: '',
    category: defaultCategory,
    author: ''
  });
  const [exportOptions, setExportOptions] = useState({
    includeConfiguration: true,
    includeLegacyFields: true,
    minifyOutput: false
  });
  const [preview, setPreview] = useState<FieldTemplate | null>(null);
  const [exportStats, setExportStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const steps = [
    'اطلاعات قالب',
    'تنظیمات صادرات',
    'پیش‌نمایش',
    'دانلود'
  ];

  // Analyze fields for preview
  const analyzeFields = useCallback(() => {
    const constructorFields = fields.filter(field => 
      TemplateExporterUtil['isConstructorField']?.(field) ?? false
    );
    const legacyFields = fields.filter(field => 
      !TemplateExporterUtil['isConstructorField']?.(field) ?? true
    );

    const fieldTypes: Record<string, number> = {};
    fields.forEach(field => {
      const type = (field as any).type || 'unknown';
      fieldTypes[type] = (fieldTypes[type] || 0) + 1;
    });

    return {
      total: fields.length,
      constructor: constructorFields.length,
      legacy: legacyFields.length,
      fieldTypes
    };
  }, [fields]);

  // Generate preview
  const generatePreview = useCallback(() => {
    if (!metadata.name.trim()) {
      setError('نام قالب الزامی است');
      return;
    }

    try {
      const template = TemplateExporterUtil.exportTemplate(
        fields,
        metadata,
        exportOptions
      );
      setPreview(template);
      setActiveStep(2);
      setError('');
    } catch (error) {
      setError(`خطا در ایجاد پیش‌نمایش: ${error.message}`);
    }
  }, [fields, metadata, exportOptions]);

  // Handle export
  const handleExport = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const result = await TemplateExporterUtil.exportToFile(
        fields,
        metadata,
        {
          ...exportOptions,
          filename: `${metadata.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_template.json`
        }
      );

      setExportStats(result.stats);
      setActiveStep(3);
      onExportComplete?.(result.stats);
    } catch (error) {
      setError(`خطا در صادرات: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset dialog
  const handleReset = () => {
    setActiveStep(0);
    setPreview(null);
    setExportStats(null);
    setError('');
    setMetadata({
      name: defaultName,
      description: '',
      category: defaultCategory,
      author: ''
    });
    setExportOptions({
      includeConfiguration: true,
      includeLegacyFields: true,
      minifyOutput: false
    });
  };

  // Handle dialog close
  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const analysis = analyzeFields();

  return (
    <>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={() => setIsOpen(true)}
        disabled={fields.length === 0}
        sx={{ borderRadius: 2 }}
      >
        صادرات قالب
      </Button>

      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GetAppIcon color="primary" />
            <Typography variant="h6">صادرات قالب فیلد</Typography>
            <Chip 
              label={`${fields.length} فیلد`} 
              size="small" 
              color="primary" 
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Template Metadata */}
            <Step>
              <StepLabel>اطلاعات قالب</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="نام قالب"
                        value={metadata.name}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        required
                        placeholder="نام منحصر به فرد برای قالب"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="دسته‌بندی"
                        value={metadata.category}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          category: e.target.value
                        }))}
                        placeholder="general, personnel, equipment, ..."
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="نویسنده"
                        value={metadata.author}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          author: e.target.value
                        }))}
                        placeholder="نام نویسنده قالب"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="توضیحات"
                        value={metadata.description}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        multiline
                        rows={3}
                        placeholder="توضیح مختصر درباره کاربرد این قالب"
                      />
                    </Grid>
                  </Grid>

                  {/* Fields Summary */}
                  <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        خلاصه فیلدها
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={`${analysis.total} فیلد کل`} color="primary" />
                        <Chip label={`${analysis.constructor} فیلد جدید`} color="success" />
                        {analysis.legacy > 0 && (
                          <Chip label={`${analysis.legacy} فیلد قدیمی`} color="warning" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        انواع فیلدها: {Object.keys(analysis.fieldTypes).join(', ')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        onClick={() => setActiveStep(1)}
                        variant="contained"
                        disabled={!metadata.name.trim()}
                      >
                        ادامه
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Export Options */}
            <Step>
              <StepLabel>تنظیمات صادرات</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        گزینه‌های صادرات
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportOptions.includeConfiguration}
                              onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                includeConfiguration: e.target.checked
                              }))}
                            />
                          }
                          label="شامل تنظیمات اضافی (فرم، اعتبارسنجی، نمایش)"
                        />

                        {analysis.legacy > 0 && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={exportOptions.includeLegacyFields}
                                onChange={(e) => setExportOptions(prev => ({
                                  ...prev,
                                  includeLegacyFields: e.target.checked
                                }))}
                              />
                            }
                            label={`شامل ${analysis.legacy} فیلد قدیمی`}
                          />
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportOptions.minifyOutput}
                              onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                minifyOutput: e.target.checked
                              }))}
                            />
                          }
                          label="خروجی فشرده (حجم کمتر، خوانایی کمتر)"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        onClick={generatePreview}
                        variant="contained"
                        startIcon={<PreviewIcon />}
                      >
                        ایجاد پیش‌نمایش
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Preview */}
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
                              نام
                            </Typography>
                            <Typography variant="body1">
                              {preview.metadata.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              دسته‌بندی
                            </Typography>
                            <Typography variant="body1">
                              {preview.metadata.category}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای شامل
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={`${preview.fields.length} فیلد جدید`} 
                                color="success" 
                                size="small" 
                              />
                              {preview.legacyFields && (
                                <Chip 
                                  label={`${preview.legacyFields.length} فیلد قدیمی`} 
                                  color="warning" 
                                  size="small" 
                                />
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>لیست فیلدها ({preview.fields.length + (preview.legacyFields?.length || 0)})</Typography>
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
                              {preview.fields.map((field) => (
                                <TableRow key={field.id}>
                                  <TableCell>{field.name}</TableCell>
                                  <TableCell>{field.type}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="small" 
                                      label="جدید" 
                                      color="success" 
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                              {preview.legacyFields?.map((field) => (
                                <TableRow key={field.id}>
                                  <TableCell>{field.name}</TableCell>
                                  <TableCell>{field.type}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      size="small" 
                                      label="قدیمی" 
                                      color="warning" 
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>

                    <Card variant="outlined" sx={{ mt: 2 }}>
                      <CardActions>
                        <Button
                          onClick={handleExport}
                          variant="contained"
                          startIcon={<FileDownloadIcon />}
                          disabled={loading}
                        >
                          دانلود قالب
                        </Button>
                        <Button
                          onClick={() => {
                            const jsonString = JSON.stringify(preview, null, 2);
                            navigator.clipboard.writeText(jsonString);
                          }}
                          startIcon={<CodeIcon />}
                        >
                          کپی JSON
                        </Button>
                      </CardActions>
                    </Card>
                  </Box>
                )}
              </StepContent>
            </Step>

            {/* Step 4: Export Complete */}
            <Step>
              <StepLabel>صادرات کامل</StepLabel>
              <StepContent>
                {exportStats && (
                  <Box sx={{ py: 2 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        صادرات با موفقیت انجام شد!
                      </Typography>
                    </Alert>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          آمار صادرات
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="primary">
                              {exportStats.totalFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              کل فیلدها
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="success.main">
                              {exportStats.constructorFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای جدید
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="warning.main">
                              {exportStats.legacyFields}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              فیلدهای قدیمی
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="h4" color="info.main">
                              {exportStats.exportSize}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              حجم فایل
                            </Typography>
                          </Grid>
                        </Grid>

                        {exportStats.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              هشدارها:
                            </Typography>
                            <List dense>
                              {exportStats.warnings.map((warning, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText primary={warning} />
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

export default TemplateExporter;