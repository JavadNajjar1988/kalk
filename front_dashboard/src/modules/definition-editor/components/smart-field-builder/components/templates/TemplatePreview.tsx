/**
 * Template Preview Component with Live Field Rendering
 * Provides interactive preview of field templates before selection
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { FieldTemplate } from './CriticalFieldTemplates';

interface TemplatePreviewProps {
  open: boolean;
  onClose: () => void;
  template: FieldTemplate | null;
  onSelect?: (template: FieldTemplate) => void;
}

interface PreviewFieldProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
}

const PreviewField: React.FC<PreviewFieldProps> = ({ field, value, onChange }) => {
  const theme = useTheme();

  const renderFieldByType = () => {
    switch (field.baseType) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.name}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.isRequired}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
            size="medium"
            multiline={field.enhancements?.some(e => e.type === 'MULTILINE')}
            rows={field.enhancements?.find(e => e.type === 'MULTILINE')?.config?.rows || 1}
          />
        );

      case 'choice':
        if (field.enhancements?.some(e => e.type === 'SINGLE')) {
          const singleConfig = field.enhancements.find(e => e.type === 'SINGLE')?.config;
          const options = field.dataSource?.config?.items || [];

          if (singleConfig?.displayStyle === 'radio') {
            return (
              <FormControl component="fieldset">
                <Typography variant="subtitle2" gutterBottom>
                  {field.name}
                </Typography>
                <RadioGroup
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                >
                  {options.map((option: any) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.label}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            );
          }

          if (singleConfig?.displayStyle === 'button') {
            return (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {field.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {options.map((option: any) => (
                    <Button
                      key={option.id}
                      variant={value === option.label ? 'contained' : 'outlined'}
                      onClick={() => onChange(option.label)}
                      size="small"
                    >
                      {option.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            );
          }

          // Default dropdown
          return (
            <FormControl fullWidth>
              <InputLabel>{field.name}</InputLabel>
              <Select
                value={value || ''}
                label={field.name}
                onChange={(e) => onChange(e.target.value)}
              >
                {options.map((option: any) => (
                  <MenuItem key={option.id} value={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        break;

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.name}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.isRequired}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.name}
            placeholder={field.placeholder}
            helperText={field.helpText}
            required={field.isRequired}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            variant="outlined"
          />
        );
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {renderFieldByType()}
      
      {/* Field metadata */}
      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={field.baseType.toUpperCase()}
          sx={{ fontSize: '0.6rem', height: 18 }}
        />
        {field.isRequired && (
          <Chip
            size="small"
            label="اجباری"
            color="error"
            sx={{ fontSize: '0.6rem', height: 18 }}
          />
        )}
        {field.enhancements?.map((enhancement: any) => (
          enhancement.enabled && (
            <Chip
              key={enhancement.type}
              size="small"
              label={enhancement.type}
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 18 }}
            />
          )
        ))}
      </Box>
    </Box>
  );
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  open,
  onClose,
  template,
  onSelect
}) => {
  const theme = useTheme();
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
  const [showCode, setShowCode] = useState(false);

  // Reset preview values when template changes
  React.useEffect(() => {
    setPreviewValues({});
  }, [template]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setPreviewValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const generatedCode = useMemo(() => {
    if (!template) return '';
    
    return JSON.stringify({
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
        fields: template.fields.map(field => ({
          id: field.id,
          name: field.name,
          englishName: field.englishName,
          baseType: field.baseType,
          isRequired: field.isRequired,
          currentValue: previewValues[field.id] || null
        }))
      }
    }, null, 2);
  }, [template, previewValues]);

  if (!template) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: alpha(template.color, 0.1),
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            {template.icon}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              پیش‌نمایش قالب: {template.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {template.description}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="نمایش کد تولید شده">
            <IconButton
              onClick={() => setShowCode(!showCode)}
              color={showCode ? 'primary' : 'default'}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Grid container spacing={3}>
          {/* Live Preview */}
          <Grid item xs={12} md={showCode ? 6 : 12}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PlayIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    پیش‌نمایش تعاملی
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                  {template.fields.map((field, index) => (
                    <PreviewField
                      key={field.id}
                      field={field}
                      value={previewValues[field.id]}
                      onChange={(value) => handleFieldChange(field.id, value)}
                    />
                  ))}
                </Box>

                {/* Template metadata */}
                <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" gutterBottom>
                    مشخصات قالب
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${template.fields.length} فیلد`}
                      color="primary"
                    />
                    <Chip
                      size="small"
                      label={template.complexity === 'simple' ? 'ساده' : 
                            template.complexity === 'intermediate' ? 'متوسط' : 'پیشرفته'}
                      color={template.complexity === 'simple' ? 'success' : 
                            template.complexity === 'intermediate' ? 'warning' : 'error'}
                    />
                    {template.isCritical && (
                      <Chip
                        size="small"
                        label="حیاتی"
                        sx={{
                          backgroundColor: '#FF5722',
                          color: 'white'
                        }}
                      />
                    )}
                    {template.isMultiField && (
                      <Chip
                        size="small"
                        label="چندتایی"
                        color="secondary"
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Code Preview */}
          {showCode && (
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CodeIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      کد تولید شده
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: alpha(theme.palette.grey[900], 0.95),
                      color: theme.palette.grey[100],
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxHeight: '50vh',
                      overflow: 'auto',
                      borderRadius: 1
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {generatedCode}
                    </pre>
                  </Paper>

                  {/* Usage Examples */}
                  {template.examples && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        مثال‌های استفاده
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {template.examples.map((example, index) => (
                          <Typography
                            key={index}
                            variant="caption"
                            sx={{
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              p: 0.5,
                              borderRadius: 0.5,
                              fontFamily: 'monospace'
                            }}
                          >
                            {example}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Best Practices */}
        {template.bestPractices && template.bestPractices.length > 0 && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon color="info" />
                <Typography variant="subtitle1" fontWeight={600}>
                  بهترین شیوه‌ها
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {template.bestPractices.map((practice, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'info.main',
                        mt: 1,
                        flexShrink: 0
                      }}
                    />
                    {practice}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          بستن
        </Button>
        {onSelect && (
          <Button
            onClick={() => {
              onSelect(template);
              onClose();
            }}
            variant="contained"
            startIcon={<PlayIcon />}
          >
            انتخاب این قالب
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TemplatePreview;