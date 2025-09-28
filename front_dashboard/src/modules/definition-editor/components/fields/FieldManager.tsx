import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  alpha,
  SelectChangeEvent,
  Badge,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ListIcon from '@mui/icons-material/List';
import NumbersIcon from '@mui/icons-material/Numbers';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import NotesIcon from '@mui/icons-material/Notes';
import PhoneIcon from '@mui/icons-material/Phone';
import ShareIcon from '@mui/icons-material/Share';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LinkIcon from '@mui/icons-material/Link';
import BuildIcon from '@mui/icons-material/Build';

// Redux
import { 
  addCustomFieldDefinition, 
  updateCustomFieldDefinition, 
  deleteCustomFieldDefinition
} from '../../store/equipmentFieldsSlice';

// Types
import { CustomField } from '../../types/equipment';

// Components
import ReferenceCategorySelector from './ReferenceCategorySelector';
import EnhancedReferenceFieldRenderer from './EnhancedReferenceFieldRenderer';
// SmartFieldBuilder system disabled
type SmartFieldConfig = never;
enum BaseFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CHOICE = 'choice',
  REFERENCE = 'reference'
}

// Import the standardized conversion utility
// SmartFieldBuilder conversion disabled
const convertSmartFieldToCustomField = (_smartField: any) => { throw new Error('SmartFieldBuilder disabled'); };

// Reference Data Hook
import { useAvailableReferenceCategories, type ReferenceSections } from '@/hooks/useReferenceData';

interface FieldManagerProps {
  nodeId: string;
  fields: CustomField[];
  onFieldsChange?: (fields: CustomField[]) => void;
  title?: string;
  description?: string;
  nodeName?: string;
  enableSmartFieldBuilder?: boolean;  // Deprecated
}

interface FieldFormErrors {
  name?: string;
  englishName?: string;
  type?: string;
  options?: string;
  referenceCategory?: string;
  referenceSections?: string; // Keep as string for error messages
  [key: string]: string | undefined;
}

const FieldManager: React.FC<FieldManagerProps> = ({
  nodeId,
  fields,
  onFieldsChange,
  title = 'مدیریت فیلدها',
  description = 'فیلدهای سفارشی را مدیریت کنید',
  nodeName,
  enableSmartFieldBuilder = true  // Enable by default
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Hook for reference categories
  const { categories: referenceCategories, getAvailableSections } = useAvailableReferenceCategories();
  
  // حالت‌های کامپوننت
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<Partial<CustomField>>({});
  const [formErrors, setFormErrors] = useState<FieldFormErrors>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [optionsText, setOptionsText] = useState<string>('');
  
  // Smart Field Builder states
  const [showSmartFieldBuilder, setShowSmartFieldBuilder] = useState<boolean>(false);
  
  // تنظیم گزینه‌ها هنگام ویرایش
  useEffect(() => {
    if (editingField.options && editingField.options.length > 0) {
      setOptionsText(editingField.options.join('\n'));
    } else {
      setOptionsText('');
    }
  }, [editingField.options]);
  
  // Helper function to convert SmartFieldConfig to CustomField (same as SmartFieldManager)
  const convertSmartFieldToCustom = (_smartField: SmartFieldConfig): CustomField => {
    throw new Error('SmartFieldBuilder disabled');
  };

  // Handle Smart Field Builder save
  const handleSmartFieldSave = (config: SmartFieldConfig | SmartFieldConfig[]) => {
    const configs = Array.isArray(config) ? config : [config];
    
    configs.forEach((smartConfig) => {
      // Use the same conversion logic as SmartFieldManager
      const customField = convertSmartFieldToCustom(smartConfig);
      
      if (editingField.id) {
        // Update existing field
        dispatch(updateCustomFieldDefinition({ nodeId, fieldId: editingField.id, updates: customField }));
        
        if (onFieldsChange) {
          const updatedFields = fields.map(field => 
            field.id === editingField.id ? customField : field
          );
          onFieldsChange(updatedFields);
        }
      } else {
        // Add new field
        dispatch(addCustomFieldDefinition({ nodeId, field: customField }));
        
        if (onFieldsChange) {
          onFieldsChange([...fields, customField]);
        }
      }
    });
    
    setShowSmartFieldBuilder(false);
    setEditingField({});
  };

  // افزودن فیلد جدید
  const handleAddField = () => {
    if (false) {
      // disabled
    } else {
      // Legacy simple mode
      setEditingField({
        order: fields.length + 1,
        isRequired: false,
        type: 'text'
      });
      setFormErrors({});
      setOptionsText('');
      setIsFormOpen(true);
    }
  };
  
  // Convert CustomField type to BaseFieldType
  const convertToBaseType = (customType: string): BaseFieldType => {
    switch (customType) {
      case 'text':
      case 'email':
      case 'password':
      case 'phone':
      case 'social':
      case 'textarea':
      case 'text-english':
      case 'text-numeric':
      case 'text-persian':
      case 'full-name-dual':
        return BaseFieldType.TEXT;
      case 'number':
        return BaseFieldType.NUMBER;
      case 'select':
      case 'multiselect':
      case 'boolean':
        return BaseFieldType.CHOICE;
      case 'reference':
        return BaseFieldType.REFERENCE;
      default:
        return BaseFieldType.TEXT;
    }
  };

  // ویرایش فیلد
  const handleEditField = (field: CustomField) => {
    if (false) {
      // disabled
    } else {
      // Legacy simple mode
      setEditingField(field);
      setFormErrors({});
      setIsFormOpen(true);
    }
  };
  
  // حذف فیلد
  const handleDeleteField = (fieldId: string) => {
    setFieldToDelete(fieldId);
    setIsDeleteConfirmOpen(true);
  };
  
  // تأیید حذف فیلد
  const confirmDeleteField = () => {
    if (fieldToDelete) {
      dispatch(deleteCustomFieldDefinition({ nodeId, fieldId: fieldToDelete }));
      
      // اطلاع‌رسانی به کامپوننت والد
      if (onFieldsChange) {
        const updatedFields = fields.filter(field => field.id !== fieldToDelete);
        onFieldsChange(updatedFields);
      }
      
      setIsDeleteConfirmOpen(false);
      setFieldToDelete(null);
    }
  };

  // تغییر ترتیب فیلد
  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      // جابجایی فیلدها
      [newFields[currentIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[currentIndex]];

      // بروزرسانی ترتیب
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        order: index + 1
      }));

      // اطلاع‌رسانی به کامپوننت والد
      if (onFieldsChange) {
        onFieldsChange(updatedFields);
      }
    }
  };
  
  // ذخیره فیلد (افزودن یا ویرایش)
  const handleSaveField = () => {
    if (validateForm()) {
      // تبدیل گزینه‌ها از متن به آرایه
      let options: string[] | undefined;
      if (
        (editingField.type === 'select' || editingField.type === 'multiselect') && 
        optionsText.trim()
      ) {
        options = optionsText
          .split('\n')
          .map(opt => opt.trim())
          .filter(opt => opt.length > 0);
      }
      
      const fieldData: CustomField = {
        id: editingField.id || `field_${Date.now()}`,
        name: editingField.name || '',
        englishName: editingField.englishName || '',
        type: editingField.type as 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'file' | 'email' | 'password' | 'textarea' | 'phone' | 'social' | 'reference',
        isRequired: editingField.isRequired || false,
        order: editingField.order || 1,
        unit: editingField.unit,
        options,
        defaultValue: editingField.defaultValue,
        validationRules: editingField.validationRules,
        // Reference field properties
        referenceCategory: editingField.referenceCategory,
        referenceSections: editingField.referenceSections
      };
      
      if (editingField.id) {
        // ویرایش فیلد موجود
        dispatch(updateCustomFieldDefinition({ 
          nodeId, 
          fieldId: editingField.id, 
          updates: fieldData 
        }));
      } else {
        // افزودن فیلد جدید
        dispatch(addCustomFieldDefinition({ 
          nodeId, 
          field: fieldData 
        }));
      }
      
      // اطلاع‌رسانی به کامپوننت والد
      if (onFieldsChange) {
        let updatedFields;
        if (editingField.id) {
          updatedFields = fields.map(field => 
            field.id === editingField.id ? fieldData : field
          );
        } else {
          updatedFields = [...fields, fieldData];
        }
        onFieldsChange(updatedFields);
      }
      
      setIsFormOpen(false);
      setEditingField({});
    }
  };
  
  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const errors: FieldFormErrors = {};
    
    if (!editingField.name?.trim()) {
      errors.name = 'نام فیلد الزامی است';
    }
    
    if (!editingField.englishName?.trim()) {
      errors.englishName = 'نام انگلیسی فیلد الزامی است';
    }
    
    if (!editingField.type) {
      errors.type = 'نوع فیلد الزامی است';
    }
    
    if (
      (editingField.type === 'select' || editingField.type === 'multiselect') && 
      !optionsText.trim()
    ) {
      errors.options = 'حداقل یک گزینه وارد کنید';
    }
    
    // اعتبارسنجی فیلدهای Reference
    if (editingField.type === 'reference') {
      if (!editingField.referenceCategory?.trim()) {
        errors.referenceCategory = 'انتخاب دسته‌بندی مرجع الزامی است';
      }
      
      if (!editingField.referenceSections?.trim()) {
        errors.referenceSections = 'انتخاب بخش نمایش الزامی است';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // نمایش آیکون مناسب برای نوع فیلد
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TextFieldsIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'number':
        return <NumbersIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'date':
        return <CalendarTodayIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'email':
        return <EmailIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'password':
        return <LockIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'textarea':
        return <NotesIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'phone':
        return <PhoneIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'social':
        return <ShareIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'select':
      case 'multiselect':
        return <ListIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'boolean':
        return <CheckBoxIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'file':
        return <AttachFileIcon fontSize={isMobile ? "small" : "medium"} />;
      case 'reference':
        return <LinkIcon fontSize={isMobile ? "small" : "medium"} />;
      default:
        return <TextFieldsIcon fontSize={isMobile ? "small" : "medium"} />;
    }
  };
  
  // نمایش نام فارسی نوع فیلد
  const getFieldTypeName = (type: string) => {
    switch (type) {
      case 'text':
        return 'متن';
      case 'number':
        return 'عدد';
      case 'date':
        return 'تاریخ';
      case 'email':
        return 'ایمیل';
      case 'password':
        return 'رمز عبور';
      case 'textarea':
        return 'متن طولانی';
      case 'phone':
        return 'شماره تلفن';
      case 'social':
        return 'شبکه‌های اجتماعی';
      case 'select':
        return 'انتخاب تکی';
      case 'multiselect':
        return 'انتخاب چندتایی';
      case 'boolean':
        return 'بله/خیر';
      case 'file':
        return 'فایل';
      case 'reference':
        return 'مرجع';
      default:
        return type;
    }
  };
  
  return (
    <Paper 
      sx={{ 
        p: isMobile ? 1 : 2, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box 
        sx={{ 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'flex-start',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            fontWeight={600}
            sx={{ fontSize: isMobile ? '1.1rem' : undefined }}
          >
            {title}
            {nodeName && ` - ${nodeName}`}
          </Typography>
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 0.5,
                fontSize: isMobile ? '0.8rem' : undefined
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mt: isMobile ? 1 : 0,
          width: isMobile ? '100%' : 'auto'
        }}>
          <Button
            variant="contained"
            startIcon={<BuildIcon />}
            onClick={handleAddField}
            fullWidth={isMobile}
            sx={{ 
              fontSize: isMobile ? '0.8rem' : undefined,
              py: isMobile ? 0.5 : undefined
            }}
          >
            {isMobile ? 'ساخت فیلد' : 'ساخت فیلد هوشمند'}
          </Button>
        </Box>
      </Box>
      
      {/* لیست فیلدها */}
      <Paper 
        variant="outlined" 
        sx={{ 
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <List dense>
          {fields.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="هیچ فیلدی تعریف نشده است"
                primaryTypographyProps={{ 
                  color: 'text.secondary',
                  align: 'center',
                  fontSize: isMobile ? '0.9rem' : undefined
                }}
              />
            </ListItem>
          ) : (
            fields
              .filter((field): field is CustomField => field != null && typeof field === 'object' && field.type != null)
              .slice().sort((a, b) => a.order - b.order)
              .map((field, index) => (
                <ListItem
                  key={field.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none'
                    },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    },
                    px: isMobile ? 1 : 2
                  }}
                >
                  <ListItemIcon sx={{ minWidth: isMobile ? 30 : 40 }}>
                    {getFieldTypeIcon(field.type || 'text')}
                  </ListItemIcon>
                  
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        flexWrap: 'wrap'
                      }} component="span">
                        <Typography 
                          variant={isMobile ? "body2" : "body1"}
                          sx={{ fontSize: isMobile ? '0.9rem' : undefined }}
                        >
                          {field.name}
                        </Typography>
                        {field.isRequired && (
                          <Chip 
                            label="الزامی"
                            size={isMobile ? "small" : "medium"}
                            color="error"
                            variant="outlined"
                            sx={{ 
                              height: isMobile ? 18 : 24,
                              fontSize: isMobile ? '0.6rem' : '0.7rem'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        mt: 0.5,
                        gap: 0.5
                      }} component="span">
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: isMobile ? '0.7rem' : undefined }}
                        >
                          {field.englishName}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5, 
                          mt: 0.5,
                          flexWrap: 'wrap'
                        }}>
                          <Chip 
                            label={getFieldTypeName(field.type || 'text')}
                            size={isMobile ? "small" : "medium"}
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              height: isMobile ? 18 : 24,
                              fontSize: isMobile ? '0.6rem' : '0.7rem'
                            }}
                          />
                          {field.unit && (
                            <Chip 
                              label={`واحد: ${field.unit}`}
                              size={isMobile ? "small" : "medium"}
                              color="info"
                              variant="outlined"
                              sx={{ 
                                height: isMobile ? 18 : 24,
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            />
                          )}
                          {field.options && field.options.length > 0 && (
                            <Chip 
                              label={`${field.options.length} گزینه`}
                              size={isMobile ? "small" : "medium"}
                              color="success"
                              variant="outlined"
                              sx={{ 
                                height: isMobile ? 18 : 24,
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            />
                          )}
                          {field?.type === 'reference' && field.referenceCategory && (
                            <Chip 
                              label={`مرجع: ${field.referenceCategory}`}
                              size={isMobile ? "small" : "medium"}
                              color="secondary"
                              variant="outlined"
                              sx={{ 
                                height: isMobile ? 18 : 24,
                                fontSize: isMobile ? '0.6rem' : '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction sx={{ 
                    right: isMobile ? 8 : 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 0.5 : 1
                  }}>
                    <IconButton 
                      edge="end" 
                      onClick={() => moveField(field.id, 'up')}
                      color="default"
                      size={isMobile ? "small" : "medium"}
                      disabled={index === 0}
                      sx={{ 
                        p: isMobile ? 0.5 : 1,
                        '&.Mui-disabled': {
                          opacity: 0.3
                        }
                      }}
                    >
                      <KeyboardArrowUpIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => moveField(field.id, 'down')}
                      color="default"
                      size={isMobile ? "small" : "medium"}
                      disabled={index === fields.length - 1}
                      sx={{ 
                        p: isMobile ? 0.5 : 1,
                        '&.Mui-disabled': {
                          opacity: 0.3
                        }
                      }}
                    >
                      <KeyboardArrowDownIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleEditField(field)}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        p: isMobile ? 0.5 : 1,
                        mr: isMobile ? 0.5 : 1
                      }}
                    >
                      <EditIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteField(field.id)}
                      color="error"
                      size={isMobile ? "small" : "medium"}
                      sx={{ 
                        p: isMobile ? 0.5 : 1
                      }}
                    >
                      <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
          )}
        </List>
      </Paper>
      
      {/* دیالوگ افزودن/ویرایش فیلد */}
      <Dialog 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        maxWidth={isMobile ? "xs" : "sm"}
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            direction: 'rtl',
            m: isMobile ? 0 : undefined
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: isMobile ? '1.2rem' : undefined,
          p: isMobile ? 2 : undefined
        }}>
          {editingField.id ? 'ویرایش فیلد' : 'افزودن فیلد جدید'}
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ 
          pt: isMobile ? 2 : 3,
          px: isMobile ? 1 : undefined
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? 1 : 2,
            px: isMobile ? 1 : undefined
          }}>
            <TextField
              label="نام فیلد (فارسی)"
              value={editingField.name || ''}
              onChange={(e) => {
                setEditingField({ ...editingField, name: e.target.value });
                if (formErrors.name) {
                  setFormErrors({ ...formErrors, name: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ 
                direction: 'rtl',
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.7rem' : undefined
                }
              }}
              inputProps={{
                style: { fontSize: isMobile ? '0.9rem' : undefined }
              }}
              InputLabelProps={{
                style: { fontSize: isMobile ? '0.9rem' : undefined }
              }}
            />
            
            <TextField
              label="نام فیلد (انگلیسی)"
              value={editingField.englishName || ''}
              onChange={(e) => {
                setEditingField({ ...editingField, englishName: e.target.value });
                if (formErrors.englishName) {
                  setFormErrors({ ...formErrors, englishName: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.englishName}
              helperText={formErrors.englishName}
              inputProps={{
                style: { fontSize: isMobile ? '0.9rem' : undefined }
              }}
              InputLabelProps={{
                style: { fontSize: isMobile ? '0.9rem' : undefined }
              }}
              sx={{
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.7rem' : undefined
                }
              }}
            />
            
            <FormControl fullWidth required error={!!formErrors.type}>
              <InputLabel 
                id="field-type-label"
                sx={{ fontSize: isMobile ? '0.9rem' : undefined }}
              >
                نوع فیلد
              </InputLabel>
              <Select
                labelId="field-type-label"
                value={editingField.type || ''}
                label="نوع فیلد"
                onChange={(e: SelectChangeEvent) => {
                  setEditingField({ ...editingField, type: e.target.value as any });
                  if (formErrors.type) {
                    setFormErrors({ ...formErrors, type: undefined });
                  }
                }}
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: isMobile ? '0.9rem' : undefined
                  }
                }}
              >
                {/* فیلدهای پایه */}
                <MenuItem value="text">متن (Text)</MenuItem>
                <MenuItem value="number">عدد (Number)</MenuItem>
                <MenuItem value="date">تاریخ (Date)</MenuItem>
                <MenuItem value="email">ایمیل (Email)</MenuItem>
                <MenuItem value="password">رمز عبور (Password)</MenuItem>
                <MenuItem value="textarea">متن طولانی (Textarea)</MenuItem>
                
                {/* فیلدهای پیشرفته با اعتبارسنجی */}
                <MenuItem value="text-english">متن انگلیسی (English Text Only)</MenuItem>
                <MenuItem value="text-numeric">متن عددی (Numeric Text Only)</MenuItem>
                
                {/* فیلدهای شرطی */}
                <MenuItem value="conditional-national-id">کد ملی شرطی (Conditional National ID)</MenuItem>
                
                {/* فیلدهای مرکب */}
                <MenuItem value="name-split">تفکیک نام (Split Name)</MenuItem>
                <MenuItem value="full-name-dual">نام دوزبانه (Dual Language Name)</MenuItem>
                
                {/* فیلدهای آرایه‌ای */}
                <MenuItem value="phone-array">آرایه شماره تلفن (Phone Array)</MenuItem>
                <MenuItem value="address-array">آرایه آدرس (Address Array)</MenuItem>
                
                {/* فیلدهای سلسله‌مراتبی */}
                <MenuItem value="hierarchical-address">آدرس سلسله‌مراتبی (Hierarchical Address)</MenuItem>
                
                {/* فیلدهای قدیمی */}
                <MenuItem value="phone">شماره تلفن (Phone Numbers)</MenuItem>
                <MenuItem value="social">شبکه‌های اجتماعی (Social Networks)</MenuItem>
                <MenuItem value="select">انتخاب تکی (Select)</MenuItem>
                <MenuItem value="multiselect">انتخاب چندتایی (Multiselect)</MenuItem>
                <MenuItem value="boolean">بله/خیر (Boolean)</MenuItem>
                <MenuItem value="file">فایل (File)</MenuItem>
                <MenuItem value="reference">مرجع (فیلد وابسته به دسته‌بندی دیگر)</MenuItem>
              </Select>
              {formErrors.type && <FormHelperText sx={{ fontSize: isMobile ? '0.7rem' : undefined }}>{formErrors.type}</FormHelperText>}
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingField.isRequired || false}
                  onChange={(e) => setEditingField({ ...editingField, isRequired: e.target.checked })}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                />
              }
              label={
                <Typography sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                  فیلد الزامی است
                </Typography>
              }
            />
            
            {(editingField.type === 'number') && (
              <TextField
                label="واحد (اختیاری)"
                value={editingField.unit || ''}
                onChange={(e) => setEditingField({ ...editingField, unit: e.target.value })}
                fullWidth
                placeholder="مثال: کیلوگرم، متر، درصد"
                inputProps={{
                  style: { fontSize: isMobile ? '0.9rem' : undefined }
                }}
                InputLabelProps={{
                  style: { fontSize: isMobile ? '0.9rem' : undefined }
                }}
              />
            )}
            
            {(editingField.type === 'select' || editingField.type === 'multiselect') && (
              <TextField
                label="گزینه‌ها"
                value={optionsText}
                onChange={(e) => {
                  setOptionsText(e.target.value);
                  if (formErrors.options) {
                    setFormErrors({ ...formErrors, options: undefined });
                  }
                }}
                fullWidth
                required
                multiline
                rows={4}
                placeholder="هر گزینه را در یک خط بنویسید"
                error={!!formErrors.options}
                helperText={formErrors.options || 'هر گزینه را در یک خط جداگانه وارد کنید'}
                inputProps={{
                  style: { fontSize: isMobile ? '0.9rem' : undefined }
                }}
                InputLabelProps={{
                  style: { fontSize: isMobile ? '0.9rem' : undefined }
                }}
                sx={{
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.7rem' : undefined
                  }
                }}
              />
            )}
            
            {/* پیکربندی فیلدهای پیشرفته */}
            {editingField.type === 'conditional-national-id' && (
              <FormHelperText sx={{ 
                bgcolor: 'info.light', 
                p: isMobile ? 1 : 2, 
                borderRadius: 1,
                fontSize: isMobile ? '0.8rem' : undefined
              }}>
                <Typography variant="body2">
                  <strong>کد ملی شرطی:</strong> این فیلد بر اساس فیلد تابعیت، نوع اعتبارسنجی کد ملی را تشخیص می‌دهد.
                  <br />
                  • ایرانی: کد ملی 10 رقمی با الگوریتم چک‌سام
                  <br />
                  • لبنانی: شماره شناسایی 11 رقمی
                  <br />
                  • عراقی: شماره شناسایی 12 رقمی
                  <br />
                  • قطری: شماره شناسایی 11 رقمی
                </Typography>
              </FormHelperText>
            )}
            
            {(editingField.type === 'phone-array' || editingField.type === 'address-array') && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? 1 : 2 
              }}>
                <TextField
                  label="حداقل تعداد آیتم"
                  type="number"
                  value={editingField.minItems || 1}
                  onChange={(e) => setEditingField({ ...editingField, minItems: parseInt(e.target.value) || 1 })}
                  inputProps={{ 
                    min: 0, 
                    max: 10,
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  InputLabelProps={{
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  helperText="حداقل تعداد آیتم‌های مورد نیاز در آرایه"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      fontSize: isMobile ? '0.7rem' : undefined
                    }
                  }}
                />
                <TextField
                  label="حداکثر تعداد آیتم"
                  type="number"
                  value={editingField.maxItems || 5}
                  onChange={(e) => setEditingField({ ...editingField, maxItems: parseInt(e.target.value) || 5 })}
                  inputProps={{ 
                    min: 1, 
                    max: 20,
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  InputLabelProps={{
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  helperText="حداکثر تعداد آیتم‌های مجاز در آرایه"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      fontSize: isMobile ? '0.7rem' : undefined
                    }
                  }}
                />
                {editingField.type === 'phone-array' && (
                  <FormHelperText sx={{ 
                    bgcolor: 'info.light', 
                    p: isMobile ? 1 : 2, 
                    borderRadius: 1,
                    fontSize: isMobile ? '0.8rem' : undefined
                  }}>
                    <Typography variant="body2">
                      <strong>آرایه شماره تلفن:</strong> امکان اضافه کردن چندین شماره تلفن با برچسب‌های مختلف
                      <br />
                      • انواع برچسب: موبایل، منزل، محل کار، اضطراری، فکس، سایر
                      <br />
                      • یکی از شماره‌ها باید به عنوان اصلی انتخاب شود
                    </Typography>
                  </FormHelperText>
                )}
                {editingField.type === 'address-array' && (
                  <FormHelperText sx={{ 
                    bgcolor: 'info.light', 
                    p: isMobile ? 1 : 2, 
                    borderRadius: 1,
                    fontSize: isMobile ? '0.8rem' : undefined
                  }}>
                    <Typography variant="body2">
                      <strong>آرایه آدرس:</strong> امکان اضافه کردن چندین آدرس با برچسب‌های مختلف
                      <br />
                      • انواع برچسب: منزل، محل کار، محل تولد، موقت، سایر
                      <br />
                      • هر آدرس شامل انتخاب سلسله‌مراتبی و آدرس دقیق
                    </Typography>
                  </FormHelperText>
                )}
              </Box>
            )}
            
            {editingField.type === 'hierarchical-address' && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? 1 : 2 
              }}>
                <TextField
                  label="دسته‌بندی جغرافیایی"
                  value={editingField.hierarchicalCategory || 'geographical'}
                  onChange={(e) => setEditingField({ ...editingField, hierarchicalCategory: e.target.value })}
                  placeholder="نام دسته‌بندی جغرافیایی مرجع"
                  inputProps={{
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  InputLabelProps={{
                    style: { fontSize: isMobile ? '0.9rem' : undefined }
                  }}
                  helperText="دسته‌بندی مرجع برای انتخاب موقعیت جغرافیایی"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      fontSize: isMobile ? '0.7rem' : undefined
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingField.allowFreeText || false}
                      onChange={(e) => setEditingField({ ...editingField, allowFreeText: e.target.checked })}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: isMobile ? '0.9rem' : undefined }}>
                      اجازه متن آزاد برای آدرس
                    </Typography>
                  }
                />
                <FormHelperText sx={{ 
                  bgcolor: 'info.light', 
                  p: isMobile ? 1 : 2, 
                  borderRadius: 1,
                  fontSize: isMobile ? '0.8rem' : undefined
                }}>
                  <Typography variant="body2">
                    <strong>آدرس سلسله‌مراتبی:</strong> انتخاب آدرس از درخت جغرافیایی + آدرس دقیق
                    <br />
                    • انتخاب استان، شهر، منطقه از درخت
                    <br />
                    • امکان وارد کردن آدرس دقیق
                    <br />
                    • امکان ثبت کد پستی و مختصات جغرافیایی
                  </Typography>
                </FormHelperText>
              </Box>
            )}
            
            {(editingField.type === 'name-split' || editingField.type === 'full-name-dual') && (
              <FormHelperText sx={{ 
                bgcolor: 'info.light', 
                p: isMobile ? 1 : 2, 
                borderRadius: 1,
                fontSize: isMobile ? '0.8rem' : undefined
              }}>
                <Typography variant="body2">
                  {editingField.type === 'name-split' ? (
                    <>
                      <strong>تفکیک نام:</strong> تفکیک نام و نام خانوادگی در فیلدهای جداگانه
                      <br />
                      • فیلد نام (اجباری)
                      <br />
                      • فیلد نام خانوادگی (اجباری)
                      <br />
                      • اعتبارسنجی فقط حروف فارسی یا انگلیسی
                    </>
                  ) : (
                    <>
                      <strong>نام دوزبانه:</strong> امکان وارد کردن نام به دو زبان فارسی و انگلیسی
                      <br />
                      • نام فارسی (اجباری)
                      <br />
                      • نام انگلیسی (اختیاری)
                      <br />
                      • اعتبارسنجی زبان برای هر فیلد
                    </>
                  )}
                </Typography>
              </FormHelperText>
            )}
            
            {(editingField.type === 'text-english' || editingField.type === 'text-numeric') && (
              <FormHelperText sx={{ 
                bgcolor: 'info.light', 
                p: isMobile ? 1 : 2, 
                borderRadius: 1,
                fontSize: isMobile ? '0.8rem' : undefined
              }}>
                <Typography variant="body2">
                  {editingField.type === 'text-english' ? (
                    <>
                      <strong>متن انگلیسی:</strong> فقط حروف انگلیسی مجاز است
                      <br />
                      • a-z, A-Z, فاصله، خط فاصله، آپوستروف
                      <br />
                      • اعتبارسنجی خودکار ورودی
                    </>
                  ) : (
                    <>
                      <strong>متن عددی:</strong> فقط اعداد مجاز است
                      <br />
                      • 0-9
                      <br />
                      • اعتبارسنجی خودکار ورودی
                    </>
                  )}
                </Typography>
              </FormHelperText>
            )}
          
          {/* پیکربندی Reference Fields */}
          {editingField.type === 'reference' && (
            <>
              <ReferenceCategorySelector
                value={editingField.referenceCategory || ''}
                onChange={(categoryId) => {
                  setEditingField({ 
                    ...editingField, 
                    referenceCategory: categoryId,
                    // Reset sections when category changes
                    referenceSections: undefined
                  });
                  if (formErrors.referenceCategory) {
                    setFormErrors({ ...formErrors, referenceCategory: undefined });
                  }
                }}
                error={formErrors.referenceCategory}
                label="دسته‌بندی مرجع"
              />
              
              {editingField.referenceCategory && (
                <FormControl fullWidth required error={!!formErrors.referenceSections}>
                  <InputLabel 
                    id="reference-sections-label"
                    sx={{ fontSize: isMobile ? '0.9rem' : undefined }}
                  >
                    بخش نمایش
                  </InputLabel>
                  <Select
                    labelId="reference-sections-label"
                    value={editingField.referenceSections || ''}
                    label="بخش نمایش"
                    onChange={(e: SelectChangeEvent) => {
                      setEditingField({ ...editingField, referenceSections: e.target.value as ReferenceSections });
                      if (formErrors.referenceSections) {
                        setFormErrors({ ...formErrors, referenceSections: undefined });
                      }
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '0.9rem' : undefined
                      }
                    }}
                  >
                    {(() => {
                      const availableSections = getAvailableSections(editingField.referenceCategory!);
                      const options = [];
                      
                      if (availableSections.includes('hierarchy')) {
                        options.push(
                          <MenuItem key="hierarchy" value="hierarchy">
                            مدیریت سطوح سلسله مراتبی
                          </MenuItem>
                        );
                      }
                      
                      if (availableSections.includes('data')) {
                        options.push(
                          <MenuItem key="data" value="data">
                            مدیریت داده‌های دسته‌بندی
                          </MenuItem>
                        );
                      }
                      
                      if (availableSections.includes('both')) {
                        options.push(
                          <MenuItem key="both" value="both">
                            هر دو بخش (سطوح + داده‌ها)
                          </MenuItem>
                        );
                      }
                      
                      return options;
                    })()} 
                  </Select>
                  {formErrors.referenceSections && <FormHelperText sx={{ fontSize: isMobile ? '0.7rem' : undefined }}>{formErrors.referenceSections}</FormHelperText>}
                  
                  {/* راهنمای بخش‌ها */}
                  {editingField.referenceCategory && (
                    <FormHelperText sx={{ fontSize: isMobile ? '0.7rem' : undefined }}>
                      {(() => {
                        const category = referenceCategories.find(cat => cat.id === editingField.referenceCategory);
                        if (!category) return '';
                        
                        if (category.hasHierarchy && category.hasData) {
                          return 'این دسته‌بندی دارای هر دو بخش سطوح سلسله‌مراتبی و داده‌ها است';
                        } else if (category.hasHierarchy && !category.hasData) {
                          return 'این دسته‌بندی فقط دارای بخش سطوح سلسله‌مراتبی است';
                        } else {
                          return 'این دسته‌بندی دارای ساختار خاص است';
                        }
                      })()} 
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            </>
          )}
          
          <TextField
            label="ترتیب نمایش"
            type="number"
            value={editingField.order || ''}
            onChange={(e) => {
              const order = parseInt(e.target.value);
              setEditingField({ ...editingField, order: isNaN(order) ? 1 : order });
            }}
            fullWidth
            InputProps={{ 
              inputProps: { 
                min: 1,
                style: { fontSize: isMobile ? '0.9rem' : undefined }
              } 
            }}
            InputLabelProps={{
              style: { fontSize: isMobile ? '0.9rem' : undefined }
            }}
          />
        </Box>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ 
        p: isMobile ? 2 : 2, 
        gap: isMobile ? 1 : 1,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Button 
          onClick={() => setIsFormOpen(false)}
          variant="outlined"
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : undefined,
            py: isMobile ? 1 : undefined
          }}
        >
          انصراف
        </Button>
        <Button 
          onClick={handleSaveField} 
          variant="contained"
          color="primary"
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : undefined,
            py: isMobile ? 1 : undefined
          }}
        >
          {editingField.id ? 'ذخیره تغییرات' : 'افزودن فیلد جدید'}
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* دیالوگ تأیید حذف */}
    <Dialog
      open={isDeleteConfirmOpen}
      onClose={() => setIsDeleteConfirmOpen(false)}
      PaperProps={{
        sx: { 
          direction: 'rtl',
          m: isMobile ? 0 : undefined
        }
      }}
      fullScreen={isMobile}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: isMobile ? '1.2rem' : undefined,
          p: isMobile ? 2 : undefined
        }}
      >
        <WarningIcon color="warning" />
        تأیید حذف
      </DialogTitle>
      <DialogContent
        sx={{
          fontSize: isMobile ? '0.9rem' : undefined,
          p: isMobile ? 2 : undefined
        }}
      >
        <Typography>
          آیا از حذف این فیلد اطمینان دارید؟ این عمل قابل بازگشت نیست.
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          p: isMobile ? 2 : undefined,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : undefined
        }}
      >
        <Button 
          onClick={() => setIsDeleteConfirmOpen(false)} 
          color="primary"
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : undefined,
            py: isMobile ? 1 : undefined
          }}
        >
          انصراف
        </Button>
        <Button 
          onClick={confirmDeleteField} 
          color="error" 
          variant="contained"
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '0.9rem' : undefined,
            py: isMobile ? 1 : undefined
          }}
        >
          حذف
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Smart Field Builder Dialog */}
    {/* SmartFieldBuilder disabled */}
  </Paper>
);
};

export default FieldManager;
