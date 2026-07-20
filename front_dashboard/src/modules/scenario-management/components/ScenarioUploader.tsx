/**
 * ScenarioUploader Component
 * کامپوننت بارگذاری سناریو از فایل یا URL
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Link as LinkIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ScenarioUploaderProps } from '../types';

const ScenarioUploader: React.FC<ScenarioUploaderProps> = ({
  onUpload,
  onUrlLoad,
  loading = false,
  error,
  className,
  variant = 'both',
  acceptedTypes = ['.json', 'application/json']
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState('');

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      return;
    }
    
    onUpload(file);
  }, [onUpload]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // URL upload handlers
  const handleUrlSubmit = () => {
    if (!urlValue.trim()) {
      setUrlError('لطفاً URL را وارد کنید');
      return;
    }

    try {
      new URL(urlValue);
      setUrlError('');
      onUrlLoad?.(urlValue);
      setUrlDialogOpen(false);
      setUrlValue('');
    } catch {
      setUrlError('URL وارد شده معتبر نیست');
    }
  };

  const handleUrlDialogClose = () => {
    setUrlDialogOpen(false);
    setUrlValue('');
    setUrlError('');
  };

  if (variant === 'url') {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          border: `2px dashed ${theme.palette.divider}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: theme.palette.action.hover
          }
        }}
        className={className}
        onClick={() => setUrlDialogOpen(true)}
      >
        <LinkIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1 }} />
        <Typography variant="body1" color="text.primary">
          بارگذاری از URL
        </Typography>
        <Typography variant="body2" color="text.secondary">
          کلیک کنید تا لینک سناریو را وارد کنید
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      {/* File Upload Area */}
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: `2px dashed ${
            dragOver ? theme.palette.primary.main : theme.palette.divider
          }`,
          bgcolor: dragOver ? theme.palette.action.hover : 'transparent',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: theme.palette.action.hover
          }
        }}
        className={className}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          />
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: theme.palette.text.secondary, 
            mb: 2 
          }} 
        />
        
        <Typography variant="h6" color="text.primary" gutterBottom>
          فایل را اینجا بکشید یا کلیک کنید
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          فایل‌های JSON سناریو پشتیبانی می‌شوند
        </Typography>

        {variant === 'both' && onUrlLoad && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setUrlDialogOpen(true);
              }}
              size="small"
            >
              یا از URL بارگذاری کنید
            </Button>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* URL Dialog */}
      <Dialog
        open={urlDialogOpen}
        onClose={handleUrlDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          بارگذاری سناریو از URL
          <IconButton onClick={handleUrlDialogClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="URL سناریو"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            error={!!urlError}
            helperText={urlError || 'لینک فایل JSON سناریو را وارد کنید'}
            placeholder="https://example.com/scenario.json"
            sx={{ mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUrlSubmit();
              }
            }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleUrlDialogClose}>انصراف</Button>
          <Button 
            onClick={handleUrlSubmit} 
            variant="contained"
            disabled={!urlValue.trim()}
          >
            بارگذاری
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScenarioUploader;