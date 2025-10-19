import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useDefinitionData, type CategoryDefinition, type TabDefinition } from '@/hooks/useDefinitionData';
import DynamicForm from '@/components/common/DynamicForm';

interface DynamicModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void | Promise<void>;
  categoryType: 'users' | 'resources';
  title?: string;
  initialData?: Record<string, any>;
  mode: 'create' | 'edit';
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dynamic-tabpanel-${index}`}
      aria-labelledby={`dynamic-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

const DynamicModal: React.FC<DynamicModalProps> = ({
  open,
  onClose,
  onSave,
  categoryType,
  title,
  initialData = {},
  mode = 'create',
  maxWidth = 'md'
}) => {
  const { definitionData, loading, error } = useDefinitionData(categoryType);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Debug log
  console.log('DynamicModal state:', { categoryType, definitionData, loading, error, open });
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const softSurface = useMemo(() => {
    const primary = (theme.palette.primary.main || '#4a90e2').toLowerCase();
    const hex = primary.replace('#', '');
    if (hex.includes('10b981') || hex.includes('4caf50') || hex.includes('2e7d32')) return '#f0f4f3';
    if (hex.includes('4a90e2') || hex.includes('1976d2') || hex.includes('2196f3')) return '#f0f4f8';
    if (hex.includes('ef4444') || hex.includes('f44336') || hex.includes('d32f2f')) return '#fbf1f0';
    if (hex.includes('6b21a8') || hex.includes('9c27b0') || hex.includes('673ab7')) return '#22262d';
    if (hex.includes('f59e0b') || hex.includes('ff9800') || hex.includes('fb8c00')) return '#fbf1f1';

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const hexToRgb = (h: string) => {
      const normalized = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const r = parseInt(normalized.substring(0, 2), 16);
      const g = parseInt(normalized.substring(2, 4), 16);
      const b = parseInt(normalized.substring(4, 6), 16);
      return { r, g, b };
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
    const blendWithWhite = (h: string, primaryWeight = 0.1) => {
      const { r, g, b } = hexToRgb(h);
      const wr = 255, wg = 255, wb = 255;
      const w = 1 - primaryWeight;
      const br = wr * w + r * primaryWeight;
      const bg = wg * w + g * primaryWeight;
      const bb = wb * w + b * primaryWeight;
      return rgbToHex(br, bg, bb);
    };
    if (/^[0-9a-f]{3,6}$/.test(hex)) {
      return blendWithWhite(hex, 0.1);
    }
    try {
      const fallback = (theme.palette.primary.light || '#90caf9').toLowerCase().replace('#', '');
      return blendWithWhite(fallback, 0.08);
    } catch {
      return '#f5f7fa';
    }
  }, [theme.palette.primary.main, theme.palette.primary.light]);

  const backdropSx = useMemo(
    () => ({
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
    }),
    []
  );

  // Initialize form when modal opens and definitionData is available
  useEffect(() => {
    if (open && definitionData && !isInitialized) {
      console.log('Initializing form data...');
      const initialFormData: Record<string, any> = {};
      
      // Initialize empty data structure for each tab
      definitionData.tabs.forEach(tab => {
        initialFormData[tab.id] = {};
        tab.fields.forEach(field => {
          // Set proper default values based on field type
          let defaultValue: any = '';
          if (field.type === 'phone' || field.type === 'social') {
            defaultValue = [];
          } else if (field.type === 'multiselect') {
            defaultValue = [];
          } else if (field.type === 'boolean') {
            defaultValue = false;
          }
          initialFormData[tab.id][field.id] = initialData[tab.id]?.[field.id] ?? defaultValue;
        });
      });
      
      console.log('Setting initial form data:', initialFormData);
      setFormData(initialFormData);
      setActiveTab(0);
      setFormErrors({});
      setIsInitialized(true);
    }
  }, [open, definitionData, initialData, isInitialized]);
  
  // Reset initialization when modal closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log('Tab change:', newValue, definitionData?.tabs[newValue]?.name); // Debug log
    console.log('Available tabs:', definitionData?.tabs.length);
    
    if (definitionData && newValue >= 0 && newValue < definitionData.tabs.length) {
      setActiveTab(newValue);
    }
  };

  const handleFieldChange = (tabId: string, fieldId: string, value: any) => {
    console.log('Field change:', tabId, fieldId, value); // Debug log
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [tabId]: {
          ...prev[tabId],
          [fieldId]: value
        }
      };
      console.log('Updated form data:', newData);
      return newData;
    });

    // Clear error for this field if it exists
    const errorKey = `${tabId}.${fieldId}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!definitionData) return false;

    const errors: Record<string, string> = {};
    let isValid = true;

    definitionData.tabs.forEach(tab => {
      tab.fields.forEach(field => {
        if (field.isRequired) {
          const value = formData[tab.id]?.[field.id];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors[`${tab.id}.${field.id}`] = `${field.name} الزامی است`;
            isValid = false;
          }
        }

        // Additional validation rules
        if (field.validationRules && formData[tab.id]?.[field.id]) {
          const value = formData[tab.id][field.id];
          const rules = field.validationRules;

          if (rules.pattern && typeof value === 'string') {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(value)) {
              errors[`${tab.id}.${field.id}`] = `${field.name} فرمت صحیح ندارد`;
              isValid = false;
            }
          }

          if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
            errors[`${tab.id}.${field.id}`] = `${field.name} باید حداقل ${rules.minLength} کاراکتر باشد`;
            isValid = false;
          }

          if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
            errors[`${tab.id}.${field.id}`] = `${field.name} نباید بیش از ${rules.maxLength} کاراکتر باشد`;
            isValid = false;
          }
        }
      });
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving data:', error);
      // Handle error (could show a toast notification)
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = title || `${mode === 'create' ? 'افزودن' : 'ویرایش'} ${categoryType === 'users' ? 'کاربر' : 'منبع'} جدید`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        backdrop: {
          sx: backdropSx,
        },
      }}
      sx={{
        zIndex: 1300,
        '& .MuiDialog-paper': {
          pointerEvents: 'auto',
          borderRadius: isMobile ? 0 : '20px',
          minHeight: isMobile ? '100vh' : '70vh',
          maxHeight: isMobile ? '100vh' : '90vh',
          backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          boxShadow: (theme) => `0 20px 60px ${alpha(theme.palette.primary.light, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: 'none',
          },
        },
        '& .MuiBackdrop-root': {
          backgroundColor: (theme) => `${alpha(theme.palette.primary.light, 0.08)}`,
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: softSurface,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          py: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <PersonIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} sx={{ color: theme.palette.primary.main }}>
          {modalTitle}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            ml: 'auto',
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            backdropFilter: 'blur(8px)',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: alpha(theme.palette.primary.light, 0.2), opacity: 0.6 }} />

      <DialogContent sx={{
        p: 0,
        overflow: 'visible',
        pointerEvents: 'auto',
        height: 'auto',
        maxHeight: '60vh',
        backgroundColor: softSurface,
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              خطا در بارگذاری تعاریف: {error}
            </Alert>
          </Box>
        ) : !definitionData ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="warning">
              تعریفی برای این دسته‌بندی یافت نشد
            </Alert>
          </Box>
        ) : (
          <Box>
            {(() => {
              console.log('Rendering modal content with definitionData:', definitionData);
              return null;
            })()}
            {/* Tabs */}
            <Box
              sx={{
                borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
                px: isMobile ? 2 : 3,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="dynamic form tabs"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 48,
                    minWidth: 120,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    borderRadius: '12px 12px 0 0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                  }
                }}
              >
                {definitionData.tabs.map((tab, index) => (
                  <Tab
                    key={tab.id}
                    label={tab.name}
                    id={`dynamic-tab-${index}`}
                    aria-controls={`dynamic-tabpanel-${index}`}
                    sx={{
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <Box sx={{
              px: isMobile ? 2 : 3,
              py: isMobile ? 2 : 3,
              maxHeight: '50vh',
              overflow: 'auto',
              pointerEvents: 'auto'
            }}>
              {definitionData.tabs.map((tab, index) => (
                <TabPanel key={tab.id} value={activeTab} index={index}>
                  <DynamicForm
                    tab={tab}
                    data={formData[tab.id] || {}}
                    errors={Object.keys(formErrors)
                      .filter(key => key.startsWith(`${tab.id}.`))
                      .reduce((acc, key) => {
                        const fieldKey = key.split('.')[1];
                        acc[fieldKey] = formErrors[key];
                        return acc;
                      }, {} as Record<string, string>)
                    }
                    onChange={(fieldId: string, value: any) => {
                      console.log('DynamicForm onChange called:', tab.id, fieldId, value);
                      handleFieldChange(tab.id, fieldId, value);
                    }}
                    categoryType={categoryType}
                  />
                </TabPanel>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: softSurface,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          p: isMobile ? 2 : 3,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1.5,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748B',
            fontWeight: 600,
            fontSize: isMobile ? '0.8rem' : 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.2)',
            },
          }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={loading || !!error || !definitionData || isSaving}
          sx={{
            borderRadius: '12px',
            px: isMobile ? 2 : 4,
            py: isMobile ? 1 : 1.5,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            fontSize: isMobile ? '0.8rem' : 'inherit',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:disabled': {
              backgroundColor: 'rgba(148, 163, 184, 0.5)',
              color: 'rgba(255, 255, 255, 0.7)',
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicModal;

