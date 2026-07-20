import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import HelpTooltip from '../shared/HelpTooltip';

interface OptionItem {
  id: string;
  value: string;
  label: string;
  description?: string;
}

interface OptionsEditorProps {
  options: string[] | OptionItem[];
  onChange: (options: string[] | OptionItem[]) => void;
  fieldType: 'select' | 'multiselect' | 'text' | 'number' | string;
  displayType?: string;
}

const OptionsEditor: React.FC<OptionsEditorProps> = ({ 
  options = [], 
  onChange, 
  fieldType,
  displayType 
}) => {
  const [newOption, setNewOption] = useState('');
  const [editingOption, setEditingOption] = useState<OptionItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkOptionsText, setBulkOptionsText] = useState('');

  // Check if field type supports options
  const supportsOptions = ['select', 'multiselect'].includes(fieldType) || 
                         ['accordion', 'chips', 'pill'].includes(displayType || '');

  // Convert simple string array to OptionItem array if needed
  const normalizedOptions = Array.isArray(options) && options.length > 0 && typeof options[0] === 'string'
    ? (options as string[]).map((opt, index) => ({
        id: `opt_${index}`,
        value: opt,
        label: opt,
      }))
    : options as OptionItem[];

  // Add a new option
  const handleAddOption = useCallback(() => {
    if (newOption.trim()) {
      const newOptionItem: OptionItem = {
        id: `opt_${Date.now()}`,
        value: newOption.trim(),
        label: newOption.trim(),
      };
      
      onChange([...normalizedOptions, newOptionItem]);
      setNewOption('');
    }
  }, [newOption, normalizedOptions, onChange]);

  // Remove an option
  const handleRemoveOption = useCallback((id: string) => {
    const updatedOptions = normalizedOptions.filter(option => option.id !== id);
    onChange(updatedOptions);
  }, [normalizedOptions, onChange]);

  // Open edit dialog
  const handleEditOption = useCallback((option: OptionItem) => {
    setEditingOption(option);
    setEditDialogOpen(true);
  }, []);

  // Save edited option
  const handleSaveEdit = useCallback(() => {
    if (editingOption) {
      const updatedOptions = normalizedOptions.map(option => 
        option.id === editingOption.id ? editingOption : option
      );
      onChange(updatedOptions);
      setEditDialogOpen(false);
      setEditingOption(null);
    }
  }, [editingOption, normalizedOptions, onChange]);

  // Handle bulk options import
  const handleBulkImport = useCallback(() => {
    if (bulkOptionsText.trim()) {
      const lines = bulkOptionsText.split('\n').map(line => line.trim()).filter(line => line);
      const newOptions = lines.map((line, index) => {
        // Check if line is in format "value:label" or "value:label:description"
        const parts = line.split(':');
        if (parts.length >= 2) {
          return {
            id: `opt_${Date.now()}_${index}`,
            value: parts[0],
            label: parts[1],
            description: parts[2] || '',
          };
        } else {
          return {
            id: `opt_${Date.now()}_${index}`,
            value: line,
            label: line,
          };
        }
      });
      
      onChange([...normalizedOptions, ...newOptions]);
      setBulkOptionsText('');
    }
  }, [bulkOptionsText, normalizedOptions, onChange]);

  // Handle key down for adding options
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  // If field doesn't support options, show message
  if (!supportsOptions) {
    return (
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
          border: '1px solid rgba(135, 206, 250, 0.2)',
          boxShadow: '0 4px 16px rgba(135, 206, 250, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: '#4A90E2', fontWeight: 600 }}>
          مدیریت گزینه‌ها
        </Typography>
        <Alert severity="info">
          این نوع فیلد یا نمایش از گزینه‌ها پشتیبانی نمی‌کند. گزینه‌ها تنها برای فیلدهای انتخابی (تک‌انتخابی یا چندانتخابی) و نمایش‌های خاص مانند آکاردئون، چیپ و پِل قابل تعریف هستند.
        </Alert>
      </Paper>
    );
  }

  return (
      <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: (theme) => `1px solid ${theme.palette.primary.main}33`,
          boxShadow: (theme) => `0 4px 16px ${theme.palette.primary.main}1A`,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
        مدیریت گزینه‌ها
      </Typography>

      {/* Add new option */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="گزینه جدید"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="مقدار گزینه را وارد کنید"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddOption}
            disabled={!newOption.trim()}
            sx={{
              height: '100%',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              color: 'white',
              fontWeight: 600,
              boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.5), rgba(203, 213, 225, 0.3))',
                color: 'rgba(255, 255, 255, 0.7)',
                boxShadow: 'none',
              },
            }}
          >
            افزودن گزینه
          </Button>
        </Grid>
      </Grid>

      {/* Bulk import */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            درج گروهی گزینه‌ها
          </Typography>
          <HelpTooltip
            title="درج گروهی"
            description="هر گزینه را در یک خط بنویسید. برای فرمت پیشرفته از value:label یا value:label:description استفاده کنید."
            example="مثلاً: red:قرمز:رنگ قرمز\nblue:آبی:رنگ آبی"
          />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={bulkOptionsText}
          onChange={(e) => setBulkOptionsText(e.target.value)}
          placeholder="هر گزینه را در یک خط بنویسید. مثلاً:
گزینه اول
گزینه دوم
گزینه سوم"
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255, 255, 255, 0.8)',
            },
          }}
        />
        <Button
          variant="outlined"
          onClick={handleBulkImport}
          disabled={!bulkOptionsText.trim()}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: (theme) => `1px solid ${theme.palette.primary.main}4D`,
            color: 'primary.main',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.primary.main + '0D',
              border: (theme) => `1px solid ${theme.palette.primary.main}80`,
            },
            '&:disabled': {
              background: 'rgba(203, 213, 225, 0.3)',
              border: '1px solid rgba(203, 213, 225, 0.3)',
              color: 'rgba(100, 116, 139, 0.7)',
            },
          }}
        >
          درج گروهی
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Options list */}
      {normalizedOptions.length > 0 ? (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
          {normalizedOptions.map((option) => (
            <ListItem 
              key={option.id} 
              sx={{ 
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <DragIcon sx={{ mr: 2, color: 'text.disabled' }} />
              <ListItemText
                primary={option.label}
                secondary={
                  option.value !== option.label || option.description ? (
                    <Box>
                      {option.value !== option.label && (
                        <Chip 
                          label={`مقدار: ${option.value}`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1, mb: 0.5 }} 
                        />
                      )}
                      {option.description && (
                        <Chip 
                          label={option.description} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mb: 0.5 }} 
                        />
                      )}
                    </Box>
                  ) : undefined
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handleEditOption(option)}
                  sx={{ mr: 1 }}
                  aria-label="ویرایش گزینه"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveOption(option.id)}
                  aria-label="حذف گزینه"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          هیچ گزینه‌ای تعریف نشده است. برای شروع گزینه‌هایی اضافه کنید.
        </Alert>
      )}

      {/* Edit Option Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ویرایش گزینه</DialogTitle>
        <DialogContent>
          {editingOption && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="مقدار"
                  value={editingOption.value}
                  onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="برچسب"
                  value={editingOption.label}
                  onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="توضیح (اختیاری)"
                  value={editingOption.description || ''}
                  onChange={(e) => setEditingOption({ ...editingOption, description: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>انصراف</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4A90E2, #7BB3F0)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OptionsEditor;