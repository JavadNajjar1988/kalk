import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface ExportImportProps {
  open: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  onExport?: (format: string) => void;
  onImport?: (file: File) => void;
}

const ExportImport: React.FC<ExportImportProps> = ({
  open,
  onClose,
  mode,
  onExport,
  onImport,
}) => {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile && onImport) {
      onImport(selectedFile);
      onClose();
    }
  };

  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}`,
          backdropFilter: 'blur(8px)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            {mode === 'export' ? 'صادرات داده‌ها' : 'واردات داده‌ها'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {mode === 'export' ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              فرمت مورد نظر برای صادرات را انتخاب کنید:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExport('json')}
                sx={{ borderRadius: 2 }}
              >
                JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExport('csv')}
                sx={{ borderRadius: 2 }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExport('excel')}
                sx={{ borderRadius: 2 }}
              >
                Excel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              فایل مورد نظر برای واردات را انتخاب کنید:
            </Typography>
            
            <Box
              sx={{
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderColor: theme.palette.primary.main,
                },
              }}
              component="label"
            >
              <input
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <FileUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
                کلیک کنید یا فایل را اینجا بکشید
              </Typography>
              <Typography variant="body2" color="text.secondary">
                پشتیبانی از فرمت‌های JSON، CSV و Excel
              </Typography>
              {selectedFile && (
                <Typography variant="body2" color="primary.main" sx={{ mt: 2 }}>
                  فایل انتخاب شده: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          انصراف
        </Button>
        {mode === 'import' && selectedFile && (
          <Button
            onClick={handleImport}
            variant="contained"
            startIcon={<FileUploadIcon />}
            sx={{ borderRadius: 2 }}
          >
            واردات
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportImport;
