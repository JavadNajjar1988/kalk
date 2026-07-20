/**
 * Keyboard Shortcuts Help Component
 * Shows available keyboard shortcuts in Smart Field Builder
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  // Save & Close
  { key: 'Ctrl+S', description: 'ذخیره فیلد', category: 'عمومی' },
  { key: 'Cmd+S', description: 'ذخیره فیلد (Mac)', category: 'عمومی' },
  { key: 'Ctrl+Enter', description: 'ذخیره سریع', category: 'عمومی' },
  { key: 'Esc', description: 'بستن مودال', category: 'عمومی' },

  // Navigation
  { key: '→', description: 'مرحله بعدی', category: 'ناوبری' },
  { key: '←', description: 'مرحله قبلی', category: 'ناوبری' },
  { key: 'Ctrl+Tab', description: 'تغییر حالت', category: 'ناوبری' },
  { key: 'Tab', description: 'انتقال فکوس', category: 'ناوبری' },

  // Editing
  { key: 'Ctrl+Z', description: 'برگرداندن', category: 'ویرایش' },
  { key: 'Ctrl+Y', description: 'تکرار', category: 'ویرایش' },
  { key: 'Ctrl+C', description: 'کپی', category: 'ویرایش' },
  { key: 'Ctrl+V', description: 'چسباندن', category: 'ویرایش' },

  // Quick Access
  { key: 'Alt+1', description: 'حالت راهنما', category: 'دسترسی سریع' },
  { key: 'Alt+2', description: 'حالت قالب', category: 'دسترسی سریع' },
  { key: 'Ctrl+F', description: 'جستجو', category: 'دسترسی سریع' },
  { key: 'F1', description: 'راهنما', category: 'دسترسی سریع' }
];

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ open, onClose }) => {
  const theme = useTheme();

  const categories = [...new Set(shortcuts.map(s => s.category))];

  const formatKey = (key: string) => {
    return key.split('+').map((part, index, array) => (
      <React.Fragment key={part}>
        <Chip
          label={part}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: alpha(theme.palette.grey[800], 0.08),
            color: theme.palette.text.primary,
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
        {index < array.length - 1 && (
          <Typography component="span" sx={{ mx: 0.5, fontSize: '0.75rem' }}>
            +
          </Typography>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
        }}
      >
        <KeyboardIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" component="h2">
          میانبرهای صفحه‌کلید
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button
            onClick={onClose}
            size="small"
            sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          از میانبرهای زیر برای دسترسی سریع و بهتر به امکانات ساخت فیلد هوشمند استفاده کنید:
        </Typography>

        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} key={category}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main
                    }}
                  />
                  {category}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {shortcuts
                    .filter(shortcut => shortcut.category === category)
                    .map((shortcut, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          px: 1.5,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.grey[50], 0.5),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {shortcut.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {formatKey(shortcut.key)}
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            💡 نکته:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            میانبرهای صفحه‌کلید فقط زمانی که فکوس روی مودال قرار دارد کار می‌کنند. 
            در حین تایپ در فیلدهای متنی، میانبرها غیرفعال هستند.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          متوجه شدم
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShortcutsHelp;