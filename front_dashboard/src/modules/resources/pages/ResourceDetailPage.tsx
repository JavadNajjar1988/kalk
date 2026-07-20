import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/store';

const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const resource = useAppSelector((state) => 
    state.resourcesModule.resources.find(r => r.id === id)
  );

  const handleBack = () => {
    navigate('/dashboard/resources');
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit resource:', id);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete resource:', id);
  };

  if (!resource) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          منبع مورد نظر یافت نشد
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          بازگشت به لیست منابع
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'اشخاص کلیدی': return 'primary';
      case 'نظامی': return 'success';
      case 'غیرنظامی': return 'warning';
      default: return 'default';
    }
  };

  const getSubStatusColor = (subStatus: string) => {
    switch (subStatus) {
      case 'زنده': return 'success';
      case 'شهید': return 'error';
      case 'آسیب دیده': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight={600}>
            جزئیات منبع
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            ویرایش
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            حذف
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Grid container spacing={3}>
        {/* اطلاعات شخصی */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                اطلاعات شخصی
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>نام و نام خانوادگی:</strong> {resource.personalInfo?.fullName || 'نامشخص'}
                </Typography>
                <Typography variant="body1">
                  <strong>تاریخ تولد:</strong> {resource.personalInfo?.birthDate || 'نامشخص'}
                </Typography>
                <Typography variant="body1">
                  <strong>جنسیت:</strong> {resource.personalInfo?.gender || 'نامشخص'}
                </Typography>
                <Typography variant="body1">
                  <strong>تابعیت:</strong> {resource.personalInfo?.nationality || 'نامشخص'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* وضعیت */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                وضعیت
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    وضعیت اصلی:
                  </Typography>
                  <Chip
                    label={resource.legalInfo.status}
                    color={getStatusColor(resource.legalInfo.status) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    وضعیت فرعی:
                  </Typography>
                  <Chip
                    label={resource.legalInfo.subStatus}
                    color={getSubStatusColor(resource.legalInfo.subStatus) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    وضعیت فعالیت:
                  </Typography>
                  <Chip
                    label={resource.isActive ? 'فعال' : 'غیرفعال'}
                    color={resource.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* اطلاعات اضافی */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                اطلاعات تکمیلی
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                تاریخ ایجاد: {new Date(resource.createdAt).toLocaleDateString('fa-IR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                آخرین بروزرسانی: {new Date(resource.updatedAt).toLocaleDateString('fa-IR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResourceDetailPage;