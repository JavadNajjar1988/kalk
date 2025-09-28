import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedUser, deleteUser, clearError } from '../store/usersSlice';
import type { User } from '../types';
import { useTranslation } from '@/hooks/useTranslation';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { selectedUser, isLoading, error } = useAppSelector((state) => state.users);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      // TODO: Fetch user by ID or find in current users list
      // For now, we'll simulate finding the user
      const mockUser: User = {
        id: id,
        personalInfo: {
          fullName: 'نمونه کاربر',
          fullNameEn: 'Sample User',
          fatherName: 'نام پدر',
          nationalId: '1234567890',
          nationality: 'ایرانی',
          birthDate: '1990-01-01',
          gender: 'مرد',
          birthPlace: 'تهران',
          maritalStatus: 'متاهل',
        },
        contactInfo: {
          landline: '02112345678',
          mobile: ['09123456789'],
          addresses: 'آدرس نمونه',
          email: 'user@example.com',
          postalCode: '1234567890',
          socialNetworks: [
            { platform: 'Instagram', username: '@sample_user' }
          ],
        },
        legalInfo: {
          status: 'نظامی',
          details: {
            forceType: 'ارتش',
            rank: 'ستوان',
            position: 'افسر اطلاعات',
            serviceNumber: 'A123456',
            unit: 'یگان ویژه',
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      
      dispatch(setSelectedUser(mockUser));
    }
  }, [id, dispatch]);

  const handleBack = () => {
    navigate('/dashboard/users');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setShowEditModal(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedUser && window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      await dispatch(deleteUser(selectedUser.id));
      navigate('/dashboard/users');
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نظامی': return 'success';
      case 'آزاد': return 'info';
      case 'غیرنظامی': return 'warning';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!selectedUser) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          کاربر مورد نظر یافت نشد
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight={600}>
            جزئیات کاربر
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="ویرایش" />
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="حذف" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  fontSize: '3rem',
                  bgcolor: 'primary.main',
                }}
              >
                {selectedUser.personalInfo.fullName.charAt(0)}
              </Avatar>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                {selectedUser.personalInfo.fullName}
              </Typography>
              {selectedUser.personalInfo.fullNameEn && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedUser.personalInfo.fullNameEn}
                </Typography>
              )}
              <Chip
                label={selectedUser.legalInfo.status}
                color={getStatusColor(selectedUser.legalInfo.status) as any}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                شماره ملی: {selectedUser.personalInfo.nationalId}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Details Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    اطلاعات شخصی
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">نام پدر</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo.fatherName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">تاریخ تولد</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo.birthDate}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">جنسیت</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo.gender}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">تابعیت</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo.nationality}</Typography>
                    </Grid>
                    {selectedUser.personalInfo.birthPlace && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">محل تولد</Typography>
                        <Typography variant="body1">{selectedUser.personalInfo.birthPlace}</Typography>
                      </Grid>
                    )}
                    {selectedUser.personalInfo.maritalStatus && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">وضعیت تاهل</Typography>
                        <Typography variant="body1">{selectedUser.personalInfo.maritalStatus}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1 }} />
                    اطلاعات تماس
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedUser.contactInfo.mobile.length > 0 && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">شماره موبایل</Typography>
                        {selectedUser.contactInfo.mobile.map((mobile, index) => (
                          <Typography key={index} variant="body1">{mobile}</Typography>
                        ))}
                      </Grid>
                    )}
                    {selectedUser.contactInfo.landline && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">تلفن ثابت</Typography>
                        <Typography variant="body1">{selectedUser.contactInfo.landline}</Typography>
                      </Grid>
                    )}
                    {selectedUser.contactInfo.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">ایمیل</Typography>
                        <Typography variant="body1">{selectedUser.contactInfo.email}</Typography>
                      </Grid>
                    )}
                    {selectedUser.contactInfo.postalCode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">کد پستی</Typography>
                        <Typography variant="body1">{selectedUser.contactInfo.postalCode}</Typography>
                      </Grid>
                    )}
                    {selectedUser.contactInfo.addresses && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">آدرس</Typography>
                        <Typography variant="body1">{selectedUser.contactInfo.addresses}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Legal Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    اطلاعات حقوقی
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">وضعیت</Typography>
                      <Typography variant="body1">{selectedUser.legalInfo.status}</Typography>
                    </Grid>
                    {selectedUser.legalInfo.status === 'نظامی' && 'forceType' in selectedUser.legalInfo.details && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">نوع نیرو</Typography>
                          <Typography variant="body1">{selectedUser.legalInfo.details.forceType}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">درجه</Typography>
                          <Typography variant="body1">{selectedUser.legalInfo.details.rank}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">سمت</Typography>
                          <Typography variant="body1">{selectedUser.legalInfo.details.position}</Typography>
                        </Grid>
                        {selectedUser.legalInfo.details.serviceNumber && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">شماره خدمتی</Typography>
                            <Typography variant="body1">{selectedUser.legalInfo.details.serviceNumber}</Typography>
                          </Grid>
                        )}
                        {selectedUser.legalInfo.details.unit && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">یگان</Typography>
                            <Typography variant="body1">{selectedUser.legalInfo.details.unit}</Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* TODO: Edit User Modal */}
      {showEditModal && (
        <div>
          {/* DynamicModal will be implemented later */}
          <Typography>Edit User Modal - To be implemented</Typography>
        </div>
      )}
    </Box>
  );
};

export default UserDetailPage;