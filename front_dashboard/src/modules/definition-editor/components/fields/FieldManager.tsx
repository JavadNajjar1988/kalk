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
  Badge
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
import { SmartFieldBuilder, SmartFieldConfig, BaseFieldType } from '../smart-field-builder';

// Import the standardized conversion utility
import { convertSmartFieldToCustomField } from '../smart-field-builder/utils/fieldConverter';

// Reference Data Hook
import { useAvailableReferenceCategories, type ReferenceSections } from '@/hooks/useReferenceData';

interface FieldManagerProps {
  nodeId: string;
  fields: CustomField[];
  onFieldsChange?: (fields: CustomField[]) => void;
  title?: string;
  description?: string;
  nodeName?: string;
  enableSmartFieldBuilder?: boolean;  // Smart Field Builder system
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
  const convertSmartFieldToCustom = (smartField: SmartFieldConfig): CustomField => {
    // Use the standardized utility function
    return convertSmartFieldToCustomField(smartField);
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
    if (enableSmartFieldBuilder) {
      // Use Smart Field Builder
      setEditingField({
        order: fields.length + 1,
        isRequired: false
      });
      setShowSmartFieldBuilder(true);
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
    if (enableSmartFieldBuilder) {
      // Convert CustomField to SmartFieldConfig for editing
      const smartConfig: SmartFieldConfig = {
        id: field.id,
        name: field.name,
        englishName: field.englishName,
        baseType: convertToBaseType(field.type),
        enhancements: [],
        validation: [],
        isRequired: field.isRequired,
        order: field.order,
        description: ''
      };
      
      setEditingField(smartConfig);
      setShowSmartFieldBuilder(true);
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
        return <TextFieldsIcon fontSize="small" />;
      case 'number':
        return <NumbersIcon fontSize="small" />;
      case 'date':
        return <CalendarTodayIcon fontSize="small" />;
      case 'email':
        return <EmailIcon fontSize="small" />;
      case 'password':
        return <LockIcon fontSize="small" />;
      case 'textarea':
        return <NotesIcon fontSize="small" />;
      case 'phone':
        return <PhoneIcon fontSize="small" />;
      case 'social':
        return <ShareIcon fontSize="small" />;
      case 'select':
      case 'multiselect':
        return <ListIcon fontSize="small" />;
      case 'boolean':
        return <CheckBoxIcon fontSize="small" />;
      case 'file':
        return <AttachFileIcon fontSize="small" />;
      case 'reference':
        return <LinkIcon fontSize="small" />;
      default:
        return <TextFieldsIcon fontSize="small" />;
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
        p: 2, 
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
          alignItems: 'flex-start'
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
            {nodeName && ` - ${nodeName}`}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<BuildIcon />}
            onClick={handleAddField}
          >
            ساخت فیلد هوشمند
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
                  align: 'center' 
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
                    }
                  }}
                >
                  <ListItemIcon>
                    {getFieldTypeIcon(field.type || 'text')}
                  </ListItemIcon>
                  
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="span">
                        <Typography variant="body1">
                          {field.name}
                        </Typography>
                        {field.isRequired && (
                          <Chip 
                            label="الزامی"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }} component="span">
                        <Typography variant="caption" color="text.secondary">
                          {field.englishName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={getFieldTypeName(field.type || 'text')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {field.unit && (
                            <Chip 
                              label={`واحد: ${field.unit}`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {field.options && field.options.length > 0 && (
                            <Chip 
                              label={`${field.options.length} گزینه`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {field?.type === 'reference' && field.referenceCategory && (
                            <Chip 
                              label={`مرجع: ${field.referenceCategory}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => moveField(field.id, 'up')}
                      color="default"
                      size="small"
                      disabled={index === 0}
                      sx={{ mr: 0.5 }}
                    >
                      <KeyboardArrowUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => moveField(field.id, 'down')}
                      color="default"
                      size="small"
                      disabled={index === fields.length - 1}
                      sx={{ mr: 1 }}
                    >
                      <KeyboardArrowDownIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleEditField(field)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteField(field.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
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
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle>
          {editingField.id ? 'ویرایش فیلد' : 'افزودن فیلد جدید'}
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              sx={{ direction: 'rtl' }}
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
            />
            
            <FormControl fullWidth required error={!!formErrors.type}>
              <InputLabel id="field-type-label">نوع فیلد</InputLabel>
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
              {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingField.isRequired || false}
                  onChange={(e) => setEditingField({ ...editingField, isRequired: e.target.checked })}
                  color="primary"
                />
              }
              label="فیلد الزامی است"
            />
            
            {(editingField.type === 'number') && (
              <TextField
                label="واحد (اختیاری)"
                value={editingField.unit || ''}
                onChange={(e) => setEditingField({ ...editingField, unit: e.target.value })}
                fullWidth
                placeholder="مثال: کیلوگرم، متر، درصد"
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
              />
            )}
            
            {/* پیکربندی فیلدهای پیشرفته */}
            {editingField.type === 'conditional-national-id' && (
              <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="حداقل تعداد آیتم"
                  type="number"
                  value={editingField.minItems || 1}
                  onChange={(e) => setEditingField({ ...editingField, minItems: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 0, max: 10 }}
                  helperText="حداقل تعداد آیتم‌های مورد نیاز در آرایه"
                />
                <TextField
                  label="حداکثر تعداد آیتم"
                  type="number"
                  value={editingField.maxItems || 5}
                  onChange={(e) => setEditingField({ ...editingField, maxItems: parseInt(e.target.value) || 5 })}
                  inputProps={{ min: 1, max: 20 }}
                  helperText="حداکثر تعداد آیتم‌های مجاز در آرایه"
                />
                {editingField.type === 'phone-array' && (
                  <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
                  <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="دسته‌بندی جغرافیایی"
                  value={editingField.hierarchicalCategory || 'geographical'}
                  onChange={(e) => setEditingField({ ...editingField, hierarchicalCategory: e.target.value })}
                  placeholder="نام دسته‌بندی جغرافیایی مرجع"
                  helperText="دسته‌بندی مرجع برای انتخاب موقعیت جغرافیایی"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingField.allowFreeText || false}
                      onChange={(e) => setEditingField({ ...editingField, allowFreeText: e.target.checked })}
                    />
                  }
                  label="اجازه متن آزاد برای آدرس"
                />
                <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
              <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
              <FormHelperText sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
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
                    <InputLabel id="reference-sections-label">بخش نمایش</InputLabel>
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
                    {formErrors.referenceSections && <FormHelperText>{formErrors.referenceSections}</FormHelperText>}
                    
                    {/* راهنمای بخش‌ها */}
                    {editingField.referenceCategory && (
                      <FormHelperText>
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
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setIsFormOpen(false)}
            variant="outlined"
          >
            انصراف
          </Button>
          <Button 
            onClick={handleSaveField} 
            variant="contained"
            color="primary"
          >
            {editingField.id ? 'ذخیره تغییرات' : 'افزودن فیلد'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* دیالوگ تأیید حذف */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          تأیید حذف
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف این فیلد اطمینان دارید؟ این عمل قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)} color="primary">
            انصراف
          </Button>
          <Button onClick={confirmDeleteField} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Smart Field Builder Dialog */}
      <SmartFieldBuilder
        open={showSmartFieldBuilder}
        onClose={() => setShowSmartFieldBuilder(false)}
        onSave={handleSmartFieldSave}
        existingFields={fields.map(field => ({
          id: field.id,
          name: field.name,
          englishName: field.englishName,
          baseType: field.type as BaseFieldType,
          isRequired: field.isRequired,
          order: field.order,
          enhancements: [],
          validation: []
        }))}
        editingField={editingField.id ? {
          id: editingField.id,
          name: editingField.name || '',
          englishName: editingField.englishName || '',
          baseType: (editingField.type?.split('-')[0] || 'text') as BaseFieldType,
          order: editingField.order || fields.length + 1,
          isRequired: editingField.isRequired || false,
          enhancements: [],
          validation: []
        } as SmartFieldConfig : null}
        categoryContext={nodeName}
      />
    </Paper>
  );
};

export default FieldManager;
