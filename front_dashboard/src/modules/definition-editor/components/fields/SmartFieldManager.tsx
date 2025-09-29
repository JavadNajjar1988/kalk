import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Fab,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  AutoFixHigh as SmartIcon
} from '@mui/icons-material';

// Smart Field Builder disabled
type SmartFieldConfig = never;

// Legacy field type (for compatibility)
import { CustomField } from '../../types/equipment';

interface SmartFieldManagerProps {
  nodeId: string;
  fields: CustomField[];
  onFieldsChange?: (fields: CustomField[]) => void;
  title?: string;
  description?: string;
  nodeName?: string;
  categoryContext?: string;
}

const SmartFieldManager: React.FC<SmartFieldManagerProps> = ({
  nodeId,
  fields,
  onFieldsChange,
  title = 'مدیریت فیلدهای هوشمند',
  description = 'با ابزار ساخت فیلد هوشمند، فیلدهای پیشرفته ایجاد کنید',
  nodeName,
  categoryContext
}) => {
  const theme = useTheme();
  
  // State management
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  // Convert CustomField to SmartFieldConfig for editing
  const convertCustomFieldToSmart = (customField: CustomField): SmartFieldConfig => {
    return {
      id: customField.id,
      name: customField.name,
      englishName: customField.englishName,
      description: '', // CustomField doesn't have description
      baseType: mapCustomFieldTypeToBaseType(customField.type),
      enhancements: [], // Will be populated based on custom field properties
      dataSource: customField.referenceCategory ? {
        type: 'category' as any,
        config: {
          categoryId: customField.referenceCategory
        }
      } : undefined,
      validation: customField.validationRules ? Object.entries(customField.validationRules).map(([key, value]) => ({
        id: `${key}_rule`,
        type: key as any,
        config: { value },
        message: `Invalid ${key}`,
        enabled: true
      })) : [],
      isRequired: customField.isRequired,
      order: customField.order,
      placeholder: '', // CustomField doesn't have placeholder
      helpText: '', // CustomField doesn't have helpText
      generatedConfig: {
        // Store original custom field data for compatibility
        originalType: customField.type,
        options: customField.options,
        referenceCategory: customField.referenceCategory,
        referenceSections: customField.referenceSections
      }
    };
  };

  // Convert SmartFieldConfig to CustomField for saving
  const convertSmartFieldToCustom = (smartField: SmartFieldConfig): CustomField => {
    // Store enhancement configurations as JSON in defaultValue
    const enhancementConfigs = smartField.enhancements?.reduce((acc, enhancement) => {
      if (enhancement.enabled) {
        acc[enhancement.type] = enhancement.config;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Use finalSettings from generatedConfig if available (from Preview step Final Settings)
    const finalSettings = smartField.generatedConfig?.finalSettings;
    
    // Store all smart field metadata including Final Settings
    const smartFieldMetadata = {
      // Store enhancement configurations
      enhancements: enhancementConfigs,
      // Store Final Settings from Preview step
      finalSettings: {
        placeholder: finalSettings?.placeholder || smartField.placeholder,
        helpText: finalSettings?.helpText || smartField.helpText,
        name: finalSettings?.name || smartField.name,
        englishName: finalSettings?.englishName || smartField.englishName,
        isRequired: finalSettings?.isRequired ?? smartField.isRequired,
        order: finalSettings?.order || smartField.order
      },
      // Store base field configuration
      baseType: smartField.baseType,
      dataSource: smartField.dataSource
    };
    
    return {
      id: smartField.id,
      name: finalSettings?.name || smartField.name,
      englishName: finalSettings?.englishName || smartField.englishName,
      type: mapBaseTypeToCustomFieldType(smartField.baseType, smartField.enhancements) as any,
      isRequired: finalSettings?.isRequired ?? smartField.isRequired,
      order: finalSettings?.order || smartField.order,
      defaultValue: JSON.stringify(smartFieldMetadata),
      validationRules: {},
      // Enhanced field properties
      allowFreeText: hasEnhancement(smartField, 'free_text')
    } as CustomField;
  };

  // Helper function to map custom field types to base types
  const mapCustomFieldTypeToBaseType = (customType: string): any => {
    const typeMapping: Record<string, any> = {
      'text': 'text',
      'textarea': 'text',
      'number': 'number',
      'select': 'choice',
      'multiselect': 'choice',
      'reference': 'reference',
      'hierarchical_reference': 'reference'
    };
    return typeMapping[customType] || 'text';
  };

  // Helper function to map base types back to custom field types
  const mapBaseTypeToCustomFieldType = (baseType: any, enhancements: any[]): string => {
    if (baseType === 'text') {
      return hasEnhancement({ enhancements } as any, 'multiline') ? 'textarea' : 'text';
    }
    if (baseType === 'choice') {
      return hasEnhancement({ enhancements } as any, 'multiple') ? 'multiselect' : 'select';
    }
    if (baseType === 'reference') {
      return hasEnhancement({ enhancements } as any, 'hierarchical') ? 'hierarchical_reference' : 'reference';
    }
    return baseType;
  };

  // Helper function to check if field has specific enhancement
  const hasEnhancement = (field: { enhancements: any[] }, enhancementType: string): boolean => {
    return field.enhancements.some(e => e.type === enhancementType && e.enabled);
  };

  // Helper function to extract enhancement configuration
  const extractEnhancementConfig = (field: SmartFieldConfig, enhancementType: string): any => {
    const enhancement = field.enhancements.find(e => e.type === enhancementType && e.enabled);
    return enhancement?.config;
  };

  // Get existing field IDs for validation
  const existingFieldIds = fields.map(field => field.englishName);

  // Handle add new field
  const handleAddField = () => {
    setEditingField(null);
    setIsBuilderOpen(true);
  };

  // Handle edit existing field
  const handleEditField = (field: CustomField) => {
    // disabled
    setEditingField(null);
    setIsBuilderOpen(false);
  };

  // Handle field save from builder
  const handleFieldSave = useCallback((config: SmartFieldConfig | SmartFieldConfig[]) => {
    // disabled
    setIsBuilderOpen(false);
    setEditingField(null);
  }, [editingField, fields, onFieldsChange]);

  // Handle builder close
  const handleBuilderClose = () => {
    setIsBuilderOpen(false);
    setEditingField(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} color="primary.main">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
        {nodeName && (
          <Typography variant="body2" color="text.secondary">
            گره: {nodeName}
          </Typography>
        )}
      </Box>

      {/* Fields List */}
      {fields.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          {fields.map((field, index) => (
            <Box
              key={field.id}
              sx={{
                p: 2,
                mb: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 1,
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {field.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {field.englishName} • {field.type} • ترتیب: {field.order}
                  {field.isRequired && ' • اجباری'}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => handleEditField(field)}
                startIcon={<SmartIcon />}
              >
                ویرایش هوشمند
              </Button>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: alpha(theme.palette.info.main, 0.05),
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}`,
            mb: 3
          }}
        >
          <SmartIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            هنوز فیلدی ایجاد نشده
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            با ابزار ساخت فیلد هوشمند، اولین فیلد خود را ایجاد کنید
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddField}
          >
            ایجاد فیلد هوشمند
          </Button>
        </Box>
      )}

      {/* Add Field FAB */}
      {fields.length > 0 && (
        <Fab
          color="primary"
          aria-label="add field"
          onClick={handleAddField}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Smart Field Builder disabled */}
    </Box>
  );
};

export default SmartFieldManager;