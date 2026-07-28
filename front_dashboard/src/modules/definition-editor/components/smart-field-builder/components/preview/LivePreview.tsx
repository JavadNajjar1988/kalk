/**
 * Live Preview Components for Smart Field Builder
 * Provides real-time field preview with validation feedback
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  Switch,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Divider,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { useLivePreview } from '../hooks/useLivePreview';
import { AnimatedProgress } from './animations/EnhancedTransitions';
import PersianCalendarField from '@/components/common/PersianCalendarField';

interface LivePreviewProps {
  config: any;
  onConfigUpdate?: (config: any) => void;
  className?: string;
  updateInterval?: number;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  config,
  onConfigUpdate,
  className,
  updateInterval = 300,
}) => {
  const theme = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const {
    previewState,
    isPreviewVisible,
    previewSize,
    isValidating,
    updateFieldValue,
    getFieldValue,
    getFieldError,
    isFieldTouched,
    validateAllFields,
    resetPreview,
    getPreviewData,
    getPreviewStyles,
    exportPreviewData,
    setIsPreviewVisible,
    setPreviewSize,
  } = useLivePreview(config, updateInterval);

  const previewData = getPreviewData;
  const previewStyles = getPreviewStyles();

  // Render individual field based on type
  const renderField = useCallback(
    (field: any) => {
      const value = getFieldValue(field.name);
      const error = getFieldError(field.name);
      const touched = isFieldTouched(field.name);
      const hasError = error.length > 0 && touched;

      const commonProps = {
        fullWidth: true,
        variant: 'outlined' as const,
        size:
          previewSize === 'small' ? ('small' as const) : ('medium' as const),
        error: hasError,
        helperText: hasError ? error.join(', ') : field.description || '',
        required: field.required,
        disabled: !isPreviewVisible,
      };

      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'url':
          return (
            <TextField
              {...commonProps}
              type={field.type}
              label={field.label}
              placeholder={field.placeholder}
              value={value}
              onChange={e => updateFieldValue(field.name, e.target.value)}
              multiline={field.multiline}
              rows={field.rows || 1}
            />
          );

        case 'number':
          return (
            <TextField
              {...commonProps}
              type="number"
              label={field.label}
              placeholder={field.placeholder}
              value={value}
              onChange={e =>
                updateFieldValue(field.name, parseFloat(e.target.value) || 0)
              }
              inputProps={{
                min: field.min,
                max: field.max,
                step: field.step || 1,
              }}
            />
          );

        case 'select':
          return (
            <FormControl {...commonProps}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={value}
                label={field.label}
                onChange={e => updateFieldValue(field.name, e.target.value)}
              >
                {field.options?.map((option: any) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {hasError && (
                <FormHelperText error>{error.join(', ')}</FormHelperText>
              )}
            </FormControl>
          );

        case 'multiselect':
          return (
            <FormControl {...commonProps}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                multiple
                value={value || []}
                label={field.label}
                onChange={e => updateFieldValue(field.name, e.target.value)}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(val => {
                      const option = field.options?.find(
                        (opt: any) => opt.value === val
                      );
                      return (
                        <Chip
                          key={val}
                          label={option?.label || val}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {field.options?.map((option: any) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {hasError && (
                <FormHelperText error>{error.join(', ')}</FormHelperText>
              )}
            </FormControl>
          );

        case 'checkbox':
          return (
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(value)}
                  onChange={e => updateFieldValue(field.name, e.target.checked)}
                  color="primary"
                  size={previewSize === 'small' ? 'small' : 'medium'}
                />
              }
              label={field.label}
              sx={{ color: hasError ? theme.palette.error.main : 'inherit' }}
            />
          );

        case 'radio':
          return (
            <FormControl component="fieldset" error={hasError}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {field.label}
              </Typography>
              <RadioGroup
                value={value}
                onChange={e => updateFieldValue(field.name, e.target.value)}
              >
                {field.options?.map((option: any) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={
                      <Radio
                        size={previewSize === 'small' ? 'small' : 'medium'}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </RadioGroup>
              {hasError && <FormHelperText>{error.join(', ')}</FormHelperText>}
            </FormControl>
          );

        case 'slider':
          return (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {field.label}: {value || field.min || 0}
              </Typography>
              <Slider
                value={value || field.min || 0}
                onChange={(_, newValue) =>
                  updateFieldValue(field.name, newValue)
                }
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                marks={field.marks}
                valueLabelDisplay="auto"
                size={previewSize === 'small' ? 'small' : 'medium'}
                sx={{
                  color: hasError ? theme.palette.error.main : 'primary.main',
                }}
              />
              {hasError && (
                <Typography variant="caption" color="error">
                  {error.join(', ')}
                </Typography>
              )}
            </Box>
          );

        case 'switch':
          return (
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(value)}
                  onChange={e => updateFieldValue(field.name, e.target.checked)}
                  color="primary"
                  size={previewSize === 'small' ? 'small' : 'medium'}
                />
              }
              label={field.label}
              sx={{ color: hasError ? theme.palette.error.main : 'inherit' }}
            />
          );

        case 'date':
          return (
            <PersianCalendarField
              label={field.label}
              value={String(value || '')}
              onChange={nextValue => updateFieldValue(field.name, nextValue)}
              dateOnly
              required={commonProps.required}
              disabled={commonProps.disabled}
              error={commonProps.error}
              helperText={commonProps.helperText}
            />
          );

        case 'time':
          return (
            <TextField
              {...commonProps}
              type="time"
              label={field.label}
              value={value}
              onChange={e => updateFieldValue(field.name, e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          );

        default:
          return (
            <TextField
              {...commonProps}
              label={field.label}
              placeholder={field.placeholder}
              value={value}
              onChange={e => updateFieldValue(field.name, e.target.value)}
            />
          );
      }
    },
    [
      getFieldValue,
      getFieldError,
      isFieldTouched,
      updateFieldValue,
      previewSize,
      isPreviewVisible,
      theme.palette.error.main,
    ]
  );

  // Handle export
  const handleExport = useCallback(() => {
    const data = exportPreviewData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-preview-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportPreviewData]);

  // Validation progress
  const validationProgress = useMemo(() => {
    if (previewData.totalFields === 0) return 100;
    const validFields = previewData.fields.filter(
      f => !f.hasError && f.touched
    ).length;
    return (validFields / previewData.totalFields) * 100;
  }, [previewData]);

  return (
    <Box className={className}>
      {/* Preview Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            پیش‌نمایش زنده
          </Typography>
          {isValidating && <CircularProgress size={16} />}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Validation Progress */}
          <Tooltip title={`${Math.round(validationProgress)}% فیلدها معتبر`}>
            <Box sx={{ minWidth: 80 }}>
              <AnimatedProgress
                progress={validationProgress}
                color={validationProgress === 100 ? 'success' : 'primary'}
                variant="linear"
                showValue={false}
              />
            </Box>
          </Tooltip>

          {/* Size Controls */}
          <Tooltip title="کوچک">
            <IconButton
              size="small"
              onClick={() => setPreviewSize('small')}
              color={previewSize === 'small' ? 'primary' : 'default'}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="متوسط">
            <IconButton
              size="small"
              onClick={() => setPreviewSize('medium')}
              color={previewSize === 'medium' ? 'primary' : 'default'}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="بزرگ">
            <IconButton
              size="small"
              onClick={() => setPreviewSize('large')}
              color={previewSize === 'large' ? 'primary' : 'default'}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Visibility Toggle */}
          <Tooltip title={isPreviewVisible ? 'پنهان کردن' : 'نمایش'}>
            <IconButton
              size="small"
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
              color={isPreviewVisible ? 'primary' : 'default'}
            >
              {isPreviewVisible ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Reset */}
          <Tooltip title="بازنشانی">
            <IconButton size="small" onClick={resetPreview}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Export */}
          <Tooltip title="دانلود پیش‌نمایش">
            <IconButton size="small" onClick={handleExport}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Preview Content */}
      <Box sx={{ p: 2 }}>
        {/* Validation Summary */}
        {previewData.hasErrors && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={validateAllFields}>
                بررسی مجدد
              </Button>
            }
          >
            {previewData.fields.filter(f => f.hasError).length} فیلد نیاز به
            بررسی دارد
          </Alert>
        )}

        {/* Fields Preview */}
        <Paper
          elevation={0}
          sx={{
            ...previewStyles,
            borderColor: previewData.isValid
              ? alpha(theme.palette.success.main, 0.3)
              : alpha(theme.palette.error.main, 0.3),
            transition: 'all 0.3s ease',
          }}
        >
          {config.fields?.map((field: any, index: number) => (
            <Box key={field.id || field.name || index}>
              {renderField(field)}
            </Box>
          ))}

          {config.fields?.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: theme.palette.text.secondary,
              }}
            >
              <Typography variant="body2">
                هیچ فیلدی برای پیش‌نمایش وجود ندارد
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Preview Stats */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 1,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {previewData.totalFields} فیلد • {previewData.touchedFields} تکمیل
            شده
          </Typography>

          <Typography
            variant="caption"
            color={previewData.isValid ? 'success.main' : 'error.main'}
          >
            {previewData.isValid ? '✓ معتبر' : '⚠ نیاز به بررسی'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Live Preview Panel for Wizard
interface LivePreviewPanelProps {
  wizardState: any;
  onPreviewUpdate?: (data: any) => void;
  isVisible?: boolean;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  wizardState,
  onPreviewUpdate,
  isVisible = true,
}) => {
  const theme = useTheme();

  // Convert wizard state to preview config
  const previewConfig = useMemo(() => {
    const fields = [];

    // Add base field from wizard config
    if (wizardState.config) {
      fields.push({
        id: 'preview_field',
        type: wizardState.config.type || 'text',
        name: wizardState.config.name || 'field_name',
        label: wizardState.config.label || 'نام فیلد',
        description: wizardState.config.description,
        required: wizardState.config.required,
        placeholder: wizardState.config.placeholder,
        defaultValue: wizardState.config.defaultValue,
        options: wizardState.config.options,
        validation: wizardState.config.validation,
      });
    }

    return {
      fields,
      layout: 'vertical',
      showValidation: true,
      compact: true,
    };
  }, [wizardState.config]);

  if (!isVisible || !previewConfig.fields.length) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        height: 'fit-content',
        maxHeight: '70vh',
        overflow: 'auto',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <LivePreview
        config={previewConfig}
        onConfigUpdate={onPreviewUpdate}
        updateInterval={200}
      />
    </Box>
  );
};

export default LivePreview;
