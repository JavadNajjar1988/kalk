import React, { useState, useEffect } from 'react';
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
  
  // Debug log
  console.log('DynamicModal state:', { categoryType, definitionData, loading, error, open });
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
      PaperProps={{
        sx: { 
          borderRadius: 2, 
          minHeight: '70vh',
          maxHeight: '90vh',
          overflow: 'auto'
        }
      }}
      sx={{
        zIndex: 1300, // Ensure proper z-index
        '& .MuiDialog-paper': {
          pointerEvents: 'auto' // Ensure interactions work
        }
      }}
    >
      <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            {modalTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ 
        p: 0, 
        overflow: 'visible',
        pointerEvents: 'auto',
        height: 'auto',
        maxHeight: '60vh'
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
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
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      fontWeight: 600,
                      color: 'primary.main',
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
              px: 3, 
              py: 2,
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

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={loading || !!error || !definitionData || isSaving}
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicModal;