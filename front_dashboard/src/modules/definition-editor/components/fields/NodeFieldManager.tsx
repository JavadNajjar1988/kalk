import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { setCustomFieldDefinitions } from '../../store/equipmentFieldsSlice';
import { CustomFieldDefinition } from '../../types/equipment';
import FieldEditDialog from './dialog/FieldEditDialog';
import VirtualizedFieldList from './performance/VirtualizedFieldList';
import { ExtendedCustomFieldDefinition, NodeFieldManagerProps } from './types/FieldEditTypes';
import { getFieldTypeLabel } from './utils/fieldTypeUtils';

// Helper function to convert field type while preserving relevant properties
const convertFieldType = (field: ExtendedCustomFieldDefinition, newType: string): ExtendedCustomFieldDefinition => {
  const baseField: ExtendedCustomFieldDefinition = {
    ...field,
    type: newType as any,
  };

  // Preserve options for select/multiselect types or display types that support options
  const supportsOptions = newType === 'select' || newType === 'multiselect' || 
                         (field.displayType && ['accordion', 'chips', 'pill'].includes(field.displayType));
  
  if (!supportsOptions) {
    // Remove options for types that don't support them
    delete baseField.options;
  } else if (!baseField.options) {
    // Initialize options array for types that support them
    baseField.options = [];
  }

  // Handle type-specific property adjustments
  switch (newType) {
    case 'number':
      // Remove text-specific properties
      delete baseField.placeholder;
      delete baseField.helpText;
      delete baseField.direction;
      delete baseField.minLength;
      delete baseField.maxLength;
      delete baseField.allowedCharset;
      delete baseField.caseTransform;
      delete baseField.characterControl;
      delete baseField.trimExtraSpaces;
      delete baseField.convertNumbers;
      delete baseField.fixHalfSpace;
      delete baseField.allowEmoji;
      delete baseField.allowMarkdown;
      break;
      
    case 'select':
    case 'multiselect':
      // These types can keep most text properties but might need specific adjustments
      break;
      
    case 'boolean':
      // Remove properties not relevant for boolean
      delete baseField.placeholder;
      delete baseField.helpText;
      delete baseField.direction;
      delete baseField.minLength;
      delete baseField.maxLength;
      delete baseField.allowedCharset;
      delete baseField.caseTransform;
      delete baseField.characterControl;
      delete baseField.trimExtraSpaces;
      delete baseField.convertNumbers;
      delete baseField.fixHalfSpace;
      delete baseField.allowEmoji;
      delete baseField.allowMarkdown;
      break;
      
    default:
      // For text and other types, keep text properties
      break;
  }

  return baseField;
};

const NodeFieldManager: React.FC<NodeFieldManagerProps> = ({
  nodeId,
  nodeName,
  fields = [],
}) => {
  const dispatch = useDispatch();
  const [localFields, setLocalFields] = useState<ExtendedCustomFieldDefinition[]>(fields);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingField, setEditingField] = useState<ExtendedCustomFieldDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync fields when props change
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  // Handle adding new field
  const handleAddField = () => {
    setEditingField({
      id: '',
      name: '',
      englishName: '',
      type: 'text',
      isRequired: false,
      defaultValue: '',
      order: localFields.length + 1,
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Handle editing existing field
  const handleEditField = (field: ExtendedCustomFieldDefinition) => {
    setEditingField({ ...field });
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Handle deleting field
  const handleDeleteField = (fieldId: string) => {
    const newFields = localFields.filter(f => f.id !== fieldId);
    setLocalFields(newFields);
    dispatch(setCustomFieldDefinitions({ nodeId, fields: newFields }));
  };

  // Handle saving field
  const handleSaveField = (field: ExtendedCustomFieldDefinition) => {
    let newFields: ExtendedCustomFieldDefinition[];
    
    if (isEditing) {
      // Check if field type has changed
      const existingField = localFields.find(f => f.id === field.id);
      if (existingField && existingField.type !== field.type) {
        // Convert field type while preserving relevant properties
        const convertedField = convertFieldType(field, field.type as any);
        newFields = localFields.map(f => f.id === field.id ? convertedField : f);
      } else {
        newFields = localFields.map(f => f.id === field.id ? field : f);
      }
    } else {
      // Generate unique ID for new field
      const newId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newField = { ...field, id: newId };
      newFields = [...localFields, newField];
    }
    
    // Convert ExtendedCustomFieldDefinition to CustomFieldDefinition for Redux storage
    const reduxFields = newFields.map(field => {
      // Create a copy of the field to avoid modifying the original
      const fieldCopy: any = { ...field };
      
      // Remove the toggle enablers that are only used in the modal
      delete fieldCopy.enablePlaceholder;
      delete fieldCopy.enableDefaultValue;
      delete fieldCopy.enableHelpText;
      delete fieldCopy.enableLengthLimits;
      delete fieldCopy.enableCharsetControl;
      delete fieldCopy.enableCaseTransform;
      delete fieldCopy.enableCustomRegex;
      delete fieldCopy.enableWhitespaceControl;
      delete fieldCopy.enableDigitNormalization;
      delete fieldCopy.enableZWNJPolicy;
      delete fieldCopy.enableEmojiPolicy;
      delete fieldCopy.enableHTMLPolicy;
      delete fieldCopy.enableMarkdownPolicy;
      delete fieldCopy.enableSuggestions;
      delete fieldCopy.enableAutoComplete;
      delete fieldCopy.enableMultiValue;
      delete fieldCopy.enableSpellcheck;
      delete fieldCopy.enableVariant;
      delete fieldCopy.enableSelectionAid;
      delete fieldCopy.enableVisualEnhancements;
      delete fieldCopy.enableStyleConfig;
      
      // Ensure all actual field properties are preserved
      // Return the fieldCopy with all actual field properties
      return fieldCopy as CustomFieldDefinition;
    });
    
    setLocalFields(newFields);
    dispatch(setCustomFieldDefinitions({ nodeId, fields: reduxFields }));
    setOpenDialog(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            مدیریت فیلدهای گره: {nodeName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            تعداد فیلدهای تعریف شده: {localFields.length}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddField}
          sx={{ minWidth: 150 }}
        >
          افزودن فیلد جدید
        </Button>
      </Box>

      {/* Fields List */}
      {localFields.length === 0 ? (
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            هیچ فیلدی تعریف نشده است
          </Typography>
          <Typography variant="body2">
            برای شروع، فیلد جدیدی اضافه کنید
          </Typography>
        </Alert>
      ) : (
        <VirtualizedFieldList
          fields={localFields}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
        />
      )}

      {/* Field Edit Dialog */}
      <FieldEditDialog
        open={openDialog}
        field={editingField}
        isEditing={isEditing}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveField}
      />
    </Box>
  );
};

export default NodeFieldManager;