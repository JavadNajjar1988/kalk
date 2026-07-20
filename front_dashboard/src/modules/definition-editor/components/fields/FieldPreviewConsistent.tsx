import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Divider,
  alpha,
  Alert
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import { CustomField } from '../../types/equipment';
import FieldRenderer from './FieldRenderer';

interface FieldPreviewConsistentProps {
  fields: CustomField[];
  title?: string;
  description?: string;
  nodeName?: string;
}

const FieldPreviewConsistent: React.FC<FieldPreviewConsistentProps> = ({
  fields,
  title = 'پیش‌نمایش فرم',
  description = 'نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده',
  nodeName,
}) => {

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
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon color="primary" />
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
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* فرم پیش‌نمایش */}
      <Grid container spacing={3}>
        {fields.length === 0 ? (
          <Grid item xs={12}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.05)
              }}
            >
              <Typography color="text.secondary">
                هیچ فیلدی برای نمایش وجود ندارد. ابتدا فیلدهای مورد نیاز را تعریف کنید.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          [...fields].sort((a, b) => a.order - b.order)
            .map((field) => (
              <Grid item xs={12} sm={6} key={field.id}>
                <FieldRenderer 
                  field={field} 
                />
              </Grid>
            ))
        )}
      </Grid>
    </Paper>
  );
};

export default FieldPreviewConsistent;