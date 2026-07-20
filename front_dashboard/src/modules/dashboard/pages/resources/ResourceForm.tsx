import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  addResource,
  updateResource,
  selectResources,
  selectResourceTemplates,
  selectCustomFieldDefinitions,
} from '../../../../store/slices/resourcesSlice';

import {
  BaseResource,
  Resource,
  PersonResource,
  EquipmentResource,
  UnitResource,
  LocationResource,
  ResourceReference,
  CustomFieldDefinition,
} from '../../../../types/resources';

interface ResourceFormProps {
  resource?: Resource;
  onSave?: (resource: Resource) => void;
  onCancel?: () => void;
  open: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  type: BaseResource['metadata']['type'];
  status: BaseResource['metadata']['status'];
  references: ResourceReference[];
  customFields: Record<string, any>;
  // فیلدهای خاص هر نوع
  personFields?: PersonResource['personFields'];
  equipmentFields?: EquipmentResource['equipmentFields'];
  unitFields?: UnitResource['unitFields'];
  locationFields?: LocationResource['locationFields'];
}

const ResourceForm: React.FC<ResourceFormProps> = ({
  resource,
  onSave,
  onCancel,
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  // const categories = useAppSelector(selectCategories); // Removed master-definitions dependency
  const resourceTemplates = useAppSelector(selectResourceTemplates);
  const customFieldDefinitions = useAppSelector(selectCustomFieldDefinitions);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'person',
    status: 'active',
    references: [],
    customFields: {},
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // مقداردهی اولیه فرم
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        description: resource.description || '',
        type: resource.metadata.type,
        status: resource.metadata.status,
        references: resource.references,
        customFields: resource.customFields,
        personFields: (resource as PersonResource).personFields,
        equipmentFields: (resource as EquipmentResource).equipmentFields,
        unitFields: (resource as UnitResource).unitFields,
        locationFields: (resource as LocationResource).locationFields,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'person',
        status: 'active',
        references: [],
        customFields: {},
      });
    }
    setErrors({});
  }, [resource, open]);

  // دریافت تعاریف بر اساس دسته‌بندی
  // const getDefinitionsByCategory = (categoryId: string) => {
  //   return useAppSelector(state => selectDefinitionsByCategory(state, categoryId));
  // }; // Removed master-definitions dependency

  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام منبع الزامی است';
    }

    if (formData.references.length === 0) {
      newErrors.references = 'حداقل یک ارجاع به تعاریف پایه الزامی است';
    }

    // اعتبارسنجی فیلدهای خاص هر نوع
    if (formData.type === 'person') {
      if (!formData.personFields?.nationalId) {
        newErrors.nationalId = 'شماره ملی الزامی است';
      }
    }

    if (formData.type === 'equipment') {
      if (!formData.equipmentFields?.serialNumber) {
        newErrors.serialNumber = 'شماره سریال الزامی است';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ذخیره منبع
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const baseResource: BaseResource = {
        id: resource?.id || `resource-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        references: formData.references,
        customFields: formData.customFields,
        metadata: {
          type: formData.type,
          status: formData.status,
          createdAt: resource?.metadata.createdAt || now,
          updatedAt: now,
        },
      };

      let newResource: Resource;

      switch (formData.type) {
        case 'person':
          newResource = {
            ...baseResource,
            metadata: { ...baseResource.metadata, type: 'person' },
            personFields: formData.personFields || {},
          } as PersonResource;
          break;

        case 'equipment':
          newResource = {
            ...baseResource,
            metadata: { ...baseResource.metadata, type: 'equipment' },
            equipmentFields: formData.equipmentFields || {},
          } as EquipmentResource;
          break;

        case 'unit':
          newResource = {
            ...baseResource,
            metadata: { ...baseResource.metadata, type: 'unit' },
            unitFields: formData.unitFields || {},
          } as UnitResource;
          break;

        case 'location':
          newResource = {
            ...baseResource,
            metadata: { ...baseResource.metadata, type: 'location' },
            locationFields: formData.locationFields || {},
          } as LocationResource;
          break;

        default:
          throw new Error('نوع منبع نامعتبر است');
      }

      if (resource) {
        dispatch(updateResource({ id: resource.id, updates: newResource }));
      } else {
        dispatch(addResource(newResource));
      }

      onSave?.(newResource);
      onClose();
    } catch (error) {
      console.error('خطا در ذخیره منبع:', error);
      setErrors({ general: 'خطا در ذخیره منبع' });
    } finally {
      setLoading(false);
    }
  };

  // افزودن ارجاع جدید
  const handleAddReference = () => {
    const newReference: ResourceReference = {
      categoryId: '',
      definitionId: '',
      level: 1,
    };
    setFormData({
      ...formData,
      references: [...formData.references, newReference],
    });
  };

  // حذف ارجاع
  const handleRemoveReference = (index: number) => {
    setFormData({
      ...formData,
      references: formData.references.filter((_, i) => i !== index),
    });
  };

  // به‌روزرسانی ارجاع
  const handleUpdateReference = (index: number, field: keyof ResourceReference, value: string | number) => {
    const updatedReferences = [...formData.references];
    updatedReferences[index] = {
      ...updatedReferences[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      references: updatedReferences,
    });
  };

  // به‌روزرسانی فیلدهای سفارشی
  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldId]: value,
      },
    });
  };

  // رندر فیلد سفارشی
  const renderCustomField = (field: CustomFieldDefinition) => {
    const value = formData.customFields[field.id] || field.defaultValue;

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <TextField
            key={field.id}
            label={field.name}
            value={value || ''}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            multiline={field.type === 'textarea'}
            rows={field.type === 'textarea' ? 3 : 1}
            fullWidth
            required={field.isRequired}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
          />
        );

      case 'number':
        return (
          <TextField
            key={field.id}
            label={field.name}
            type="number"
            value={value || ''}
            onChange={(e) => handleCustomFieldChange(field.id, parseFloat(e.target.value) || 0)}
            fullWidth
            required={field.isRequired}
            error={!!errors[field.id]}
            helperText={errors[field.id]}
          />
        );

      case 'select':
        return (
          <FormControl key={field.id} fullWidth required={field.isRequired} error={!!errors[field.id]}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              label={field.name}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl key={field.id} fullWidth required={field.isRequired} error={!!errors[field.id]}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value || false}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              label={field.name}
            >
              <MenuItem value={true}>بله</MenuItem>
              <MenuItem value={false}>خیر</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return null;
    }
  };

  // رندر فیلدهای خاص هر نوع
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'person':
        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography>اطلاعات پرسنلی</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="شماره ملی"
                    value={formData.personFields?.nationalId || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      personFields: { ...formData.personFields, nationalId: e.target.value }
                    })}
                    fullWidth
                    required
                    error={!!errors.nationalId}
                    helperText={errors.nationalId}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="شماره خدمت"
                    value={formData.personFields?.serviceInfo?.serviceNumber || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      personFields: {
                        ...formData.personFields,
                        serviceInfo: { ...formData.personFields?.serviceInfo, serviceNumber: e.target.value }
                      }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="تخصص"
                    value={formData.personFields?.specialty || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      personFields: { ...formData.personFields, specialty: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="تلفن"
                    value={formData.personFields?.contactInfo?.phone || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      personFields: {
                        ...formData.personFields,
                        contactInfo: { ...formData.personFields?.contactInfo, phone: e.target.value }
                      }
                    })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );

      case 'equipment':
        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <BuildIcon sx={{ mr: 1 }} />
              <Typography>اطلاعات تجهیزات</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="شماره سریال"
                    value={formData.equipmentFields?.serialNumber || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipmentFields: { ...formData.equipmentFields, serialNumber: e.target.value }
                    })}
                    fullWidth
                    required
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="سازنده"
                    value={formData.equipmentFields?.manufacturer || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipmentFields: { ...formData.equipmentFields, manufacturer: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="مدل"
                    value={formData.equipmentFields?.model || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipmentFields: { ...formData.equipmentFields, model: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="سال ساخت"
                    type="number"
                    value={formData.equipmentFields?.yearOfManufacture || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      equipmentFields: { ...formData.equipmentFields, yearOfManufacture: parseInt(e.target.value) || undefined }
                    })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );

      case 'unit':
        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <BusinessIcon sx={{ mr: 1 }} />
              <Typography>اطلاعات واحد</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="کد واحد"
                    value={formData.unitFields?.unitCode || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      unitFields: { ...formData.unitFields, unitCode: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="فرمانده"
                    value={formData.unitFields?.commander || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      unitFields: { ...formData.unitFields, commander: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="نیروی مجاز"
                    type="number"
                    value={formData.unitFields?.strength?.authorized || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      unitFields: {
                        ...formData.unitFields,
                        strength: { ...formData.unitFields?.strength, authorized: parseInt(e.target.value) || undefined }
                      }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="نیروی موجود"
                    type="number"
                    value={formData.unitFields?.strength?.actual || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      unitFields: {
                        ...formData.unitFields,
                        strength: { ...formData.unitFields?.strength, actual: parseInt(e.target.value) || undefined }
                      }
                    })}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );

      case 'location':
        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <LocationIcon sx={{ mr: 1 }} />
              <Typography>اطلاعات مکان</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="آدرس"
                    value={formData.locationFields?.address || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      locationFields: { ...formData.locationFields, address: e.target.value }
                    })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="ظرفیت"
                    type="number"
                    value={formData.locationFields?.capacity || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      locationFields: { ...formData.locationFields, capacity: parseInt(e.target.value) || undefined }
                    })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>نوع مکان</InputLabel>
                    <Select
                      value={formData.locationFields?.type || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        locationFields: { ...formData.locationFields, type: e.target.value as any }
                      })}
                      label="نوع مکان"
                    >
                      <MenuItem value="base">پایگاه</MenuItem>
                      <MenuItem value="camp">اردوگاه</MenuItem>
                      <MenuItem value="facility">تسهیلات</MenuItem>
                      <MenuItem value="checkpoint">پست بازرسی</MenuItem>
                      <MenuItem value="observation_post">پست مشاهده</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { direction: 'rtl' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {resource ? 'ویرایش منبع' : 'افزودن منبع جدید'}
          </Typography>
          <IconButton onClick={onClose}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* اطلاعات پایه */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              اطلاعات پایه
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="نام منبع"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.type}>
                  <InputLabel>نوع منبع</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    label="نوع منبع"
                  >
                    <MenuItem value="person">پرسنل</MenuItem>
                    <MenuItem value="equipment">تجهیزات</MenuItem>
                    <MenuItem value="unit">واحد</MenuItem>
                    <MenuItem value="location">مکان</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>وضعیت</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label="وضعیت"
                  >
                    <MenuItem value="active">فعال</MenuItem>
                    <MenuItem value="inactive">غیرفعال</MenuItem>
                    <MenuItem value="archived">آرشیو شده</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="توضیحات"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ارجاعات به تعاریف پایه */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                ارجاعات به تعاریف پایه
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddReference}
                size="small"
              >
                افزودن ارجاع
              </Button>
            </Box>

            {formData.references.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                هیچ ارجاعی تعریف نشده است
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {formData.references.map((reference, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>دسته‌بندی</InputLabel>
                      <Select
                        value={reference.categoryId}
                        onChange={(e) => handleUpdateReference(index, 'categoryId', e.target.value)}
                        label="دسته‌بندی"
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>تعریف</InputLabel>
                      <Select
                        value={reference.definitionId}
                        onChange={(e) => handleUpdateReference(index, 'definitionId', e.target.value)}
                        label="تعریف"
                        disabled={!reference.categoryId}
                      >
                        {reference.categoryId &&
                          getDefinitionsByCategory(reference.categoryId).map((definition) => (
                            <MenuItem key={definition.id} value={definition.id}>
                              {definition.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="سطح"
                      type="number"
                      value={reference.level}
                      onChange={(e) => handleUpdateReference(index, 'level', parseInt(e.target.value) || 1)}
                      sx={{ width: 100 }}
                      inputProps={{ min: 1 }}
                    />

                    <IconButton
                      onClick={() => handleRemoveReference(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {errors.references && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                {errors.references}
              </Typography>
            )}
          </Paper>

          {/* فیلدهای خاص هر نوع */}
          {renderTypeSpecificFields()}

          {/* فیلدهای سفارشی */}
          {customFieldDefinitions[formData.type] && customFieldDefinitions[formData.type].length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  <Typography>فیلدهای سفارشی</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {customFieldDefinitions[formData.type]
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <Grid item xs={12} md={6} key={field.id}>
                          {renderCustomField(field)}
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'در حال ذخیره...' : (resource ? 'ذخیره تغییرات' : 'افزودن منبع')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResourceForm; 