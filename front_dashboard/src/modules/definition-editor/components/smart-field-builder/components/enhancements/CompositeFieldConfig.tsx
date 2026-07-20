import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Typography,
  Grid,
  Divider,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface CompositePart {
  id: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: string[];
}

interface CompositeConfig {
  parts: CompositePart[];
  displayFormat?: string;
}

interface CompositeFieldConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: CompositeConfig) => void;
  initialConfig?: CompositeConfig;
}

const CompositeFieldConfig: React.FC<CompositeFieldConfigProps> = ({
  open,
  onClose,
  onSave,
  initialConfig
}) => {
  const [parts, setParts] = useState<CompositePart[]>(initialConfig?.parts || [
    { id: 'part1', label: 'بخش اول', type: 'text', required: true }
  ]);


  // اضافه کردن بخش جدید
  const addPart = () => {
    const newPart: CompositePart = {
      id: `part${parts.length + 1}`,
      label: `بخش ${parts.length + 1}`,
      type: 'text',
      required: false // Default value, but won't be shown in UI
    };
    setParts([...parts, newPart]);
  };

  // حذف بخش
  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_: CompositePart, i: number) => i !== index));
    }
  };

  // به‌روزرسانی بخش
  const updatePart = (index: number, field: keyof CompositePart, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  // ذخیره کانفیگ
  const handleSave = () => {
    // Clean up parts by filtering empty options only when saving
    const cleanedParts = parts.map(part => ({
      ...part,
      options: part.options ? part.options.filter(opt => opt.trim().length > 0) : undefined
    }));
    
    const config: CompositeConfig = {
      parts: cleanedParts,
      displayFormat: parts.map((_: CompositePart, i: number) => `{${i}}`).join('\n')
    };
    onSave(config);
    onClose();
  };




  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">تنظیمات فیلد ترکیبی</Typography>
        <Typography variant="body2" color="text.secondary">
          فیلد ترکیبی را از چندین بخش تشکیل دهید
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>


        {/* لیست بخش‌ها */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              بخش‌های فیلد ترکیبی
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addPart}
              size="small"
              variant="outlined"
            >
              افزودن بخش
            </Button>
          </Box>

          {parts.map((part: CompositePart, index: number) => (
            <Box
              key={part.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2,
                backgroundColor: 'grey.50'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="عنوان بخش"
                    value={part.label}
                    onChange={(e) => updatePart(index, 'label', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>نوع فیلد</InputLabel>
                    <Select
                      value={part.type}
                      label="نوع فیلد"
                      onChange={(e) => updatePart(index, 'type', e.target.value)}
                    >
                      <MenuItem value="text">متن</MenuItem>
                      <MenuItem value="select">انتخابی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <IconButton
                    onClick={() => removePart(index)}
                    disabled={parts.length === 1}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
              
              {/* گزینه‌ها برای فیلد انتخابی */}
              {part.type === 'select' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="گزینه‌ها (هر گزینه در یک خط)"
                    value={(part.options || []).join('\n')}
                    onChange={(e) => {
                      const optionsText = e.target.value;
                      // Don't filter empty lines during typing to allow natural input
                      const optionsArray = optionsText.split('\n').map((s: string) => s.trim());
                      updatePart(index, 'options', optionsArray);
                    }}
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    placeholder="گزینه ۱\nگزینه ۲\nگزینه ۳"
                    helperText="هر گزینه را در یک خط جداگانه بنویسید (می‌توانید از هر کاراکتری استفاده کنید)"
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* پیش‌نمایش */}
        <Box sx={{ p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            پیش‌نمایش:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {parts.map((part: CompositePart) => (
              <Chip
                key={part.id}
                label={part.label}
                variant="outlined"
                size="small"
                color="primary"
                sx={{ alignSelf: 'flex-start' }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          انصراف
        </Button>
        <Button onClick={handleSave} variant="contained">
          ذخیره تنظیمات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompositeFieldConfig;