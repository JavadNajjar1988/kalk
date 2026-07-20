import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '../resourcesDialogStyles';
import { useTranslation } from '@/hooks/useTranslation';
import AmmunitionHierarchicalSelector from '@/components/common/AmmunitionHierarchicalSelector';
import type { AmmunitionPath, AmmunitionFieldDefinition } from '@/hooks/useAmmunitionHierarchy';
import PrimaryImageField from '../components/PrimaryImageField';
import type { PrimaryImageChanges } from '../components/primaryImageHelpers';

interface AmmunitionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any, imageChanges?: PrimaryImageChanges) => void;
  ammunition?: any;
}

const AmmunitionModal: React.FC<AmmunitionModalProps> = ({
  open,
  onClose,
  onSave,
  ammunition,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [formData, setFormData] = useState<any>({});
  const [selectedAmmunitionPath, setSelectedAmmunitionPath] = useState<AmmunitionPath[]>([]);
  const [ammunitionHierarchyFields, setAmmunitionHierarchyFields] = useState<AmmunitionFieldDefinition[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState<boolean>(false);

  useEffect(() => {
    if (ammunition) {
      setFormData(ammunition);
      if (ammunition.ammunitionPath) {
        setSelectedAmmunitionPath(ammunition.ammunitionPath);
      }
      if (ammunition.ammunitionHierarchyFields) {
        setAmmunitionHierarchyFields(ammunition.ammunitionHierarchyFields);
      }
    } else {
      setFormData({});
      setSelectedAmmunitionPath([]);
      setAmmunitionHierarchyFields([]);
    }
    setSelectedFile(null);
    setClearExisting(false);
  }, [ammunition, open]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = () => {
    const finalData = {
      ...formData,
      ammunitionPath: selectedAmmunitionPath,
      ammunitionHierarchyFields,
    };

    ammunitionHierarchyFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        finalData[field.id] = formData[field.id];
      }
    });

    onSave(finalData, { selectedFile, clearExisting });
  };

  const handleAmmunitionPathChange = (path: AmmunitionPath[], _finalNodeId?: string) => {
    setSelectedAmmunitionPath(path);
  };

  const handleAmmunitionFieldsChange = (fields: AmmunitionFieldDefinition[]) => {
    setAmmunitionHierarchyFields(fields);
  };

  const renderAmmunitionField = (field: AmmunitionFieldDefinition) => {
    const commonProps = {
      fullWidth: true,
      variant: 'outlined' as const,
      size: 'small' as const,
      required: field.isRequired,
    };

    switch (field.type) {
      case 'select':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            {field.options?.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'multiselect':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            select
            label={field.name}
            SelectProps={{ multiple: true }}
            value={formData[field.id] || []}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            {field.options?.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'number':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            type="number"
            label={`${field.name}${field.unit ? ` (${field.unit})` : ''}`}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value ? Number(e.target.value) : '')}
          />
        );
      case 'date':
        return (
          <TextField
            {...commonProps}
            key={field.id}
            type="date"
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField
            {...commonProps}
            key={field.id}
            label={field.name}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={buildResourcesFormDialogSx(theme)}
    >
      <DialogTitle sx={resourcesDialogTitleSx(theme)}>
        {ammunition ? t('resources.ammunition.editTitle') : t('resources.ammunition.addTitle')}
      </DialogTitle>

      <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <AmmunitionHierarchicalSelector
              value={selectedAmmunitionPath}
              onChange={handleAmmunitionPathChange}
              onFieldsChange={handleAmmunitionFieldsChange}
            />
          </Grid>

          <Grid item xs={12}>
            <PrimaryImageField
              primaryMediaId={formData.primaryMediaId}
              selectedFile={selectedFile}
              clearExisting={clearExisting}
              onChange={({ selectedFile: f, clearExisting: c }) => {
                setSelectedFile(f);
                setClearExisting(c);
              }}
            />
          </Grid>

          {ammunitionHierarchyFields.map((field: AmmunitionFieldDefinition) => (
            <Grid
              item
              xs={12}
              sm={field.type === 'text' || field.type === 'number' ? 6 : 12}
              key={field.id}
            >
              {renderAmmunitionField(field)}
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={resourcesDialogActionsSx(theme)}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={resourcesOutlinedCancelButtonSx(theme)}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, px: 3 }}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AmmunitionModal;
