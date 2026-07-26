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
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import { fetchUserById, deleteUser, updateUser, clearError } from '../store/usersSlice';
import type { User } from '../types';
import { useTranslation } from '@/hooks/useTranslation';
import EditUserModal from '../components/EditUserModal';
import { updateUser as updateAuthenticatedUser } from '@/store/slices/authSlice';
import { canAccessFeature } from '@/security/roleAccess';
import { resolveAvatarSrc } from '../utils/avatarOptions';
import { getAccessLevelColor, getUserInitials } from '../utils/userPresentation';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { t } = useTranslation();

  const { selectedUser, isLoading, error } = useAppSelector((state) => state.users);
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManageUsers = canAccessFeature(currentUser?.role, 'users.manage');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
    }
    return () => {
      dispatch(clearError());
    };
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
  const accessColor = getAccessLevelColor(theme, selectedUser.systemInfo?.accessLevel);

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
        {canManageUsers && <Box>
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
        </Box>}
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', borderTop: `4px solid ${accessColor}`, bgcolor: alpha(accessColor, 0.025) }}>
            <CardContent sx={{ p: 4 }}>
              <Avatar
                src={resolveAvatarSrc(selectedUser.personalInfo?.avatar)}
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  fontSize: '3rem',
                  bgcolor: accessColor,
                }}
              >
                {getUserInitials(selectedUser.personalInfo?.fullName, '؟')}
              </Avatar>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                {selectedUser.personalInfo?.fullName || 'نامشخص'}
              </Typography>
              {selectedUser.personalInfo?.fullNameEn && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedUser.personalInfo.fullNameEn}
                </Typography>
              )}
              <Chip
                label={selectedUser.professionalInfo?.status || 'نامشخص'}
                color={getStatusColor(selectedUser.professionalInfo?.status || '') as any}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                شماره ملی: {selectedUser.personalInfo?.nationalId || 'نامشخص'}
              </Typography>
              {selectedUser.userCode && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  کد کاربری: {selectedUser.userCode}
                </Typography>
              )}
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
                      <Typography variant="body1">{selectedUser.personalInfo?.fatherName || 'نامشخص'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">تاریخ تولد</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo?.birthDate || 'نامشخص'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">جنسیت</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo?.gender || 'نامشخص'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">تابعیت</Typography>
                      <Typography variant="body1">{selectedUser.personalInfo?.nationality || 'نامشخص'}</Typography>
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
                    {selectedUser.contactInfo?.mobile && selectedUser.contactInfo.mobile.length > 0 && (
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

            {/* Professional Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <WorkIcon sx={{ mr: 1 }} />
                    اطلاعات حرفه‌ای
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">وضعیت</Typography>
                      <Typography variant="body1">{selectedUser.professionalInfo?.status || 'نامشخص'}</Typography>
                    </Grid>
                    {selectedUser.professionalInfo?.status === 'نظامی' && selectedUser.professionalInfo.details && 'forceType' in selectedUser.professionalInfo.details && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">نوع نیرو</Typography>
                          <Typography variant="body1">{(selectedUser.professionalInfo.details as any).forceType || 'نامشخص'}</Typography>
                        </Grid>
                        {(selectedUser.professionalInfo.details as any).rank && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">درجه</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).rank}</Typography>
                          </Grid>
                        )}
                        {(selectedUser.professionalInfo.details as any).position && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">سمت</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).position}</Typography>
                          </Grid>
                        )}
                        {(selectedUser.professionalInfo.details as any).serviceNumber && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">شماره خدمتی</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).serviceNumber}</Typography>
                          </Grid>
                        )}
                        {(selectedUser.professionalInfo.details as any).unit && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">یگان</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).unit}</Typography>
                          </Grid>
                        )}
                      </>
                    )}
                    {selectedUser.professionalInfo?.status === 'غیرنظامی' && selectedUser.professionalInfo.details && (
                      <>
                        {(selectedUser.professionalInfo.details as any).organization && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">سازمان</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).organization}</Typography>
                          </Grid>
                        )}
                        {(selectedUser.professionalInfo.details as any).jobTitle && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">سمت</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).jobTitle}</Typography>
                          </Grid>
                        )}
                      </>
                    )}
                    {selectedUser.professionalInfo?.status === 'آزاد' && selectedUser.professionalInfo.details && (
                      <>
                        {(selectedUser.professionalInfo.details as any).businessType && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">نوع کسب و کار</Typography>
                            <Typography variant="body1">{(selectedUser.professionalInfo.details as any).businessType}</Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* System Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    اطلاعات سیستمی
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">نقش</Typography>
                      <Typography variant="body1">{selectedUser.systemInfo?.role || 'نامشخص'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">سطح دسترسی</Typography>
                      <Typography variant="body1">{selectedUser.systemInfo?.accessLevel || 'نامشخص'}</Typography>
                    </Grid>
                    {selectedUser.systemInfo?.permissions && selectedUser.systemInfo.permissions.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>دسترسی‌ها</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedUser.systemInfo.permissions.map((permission, index) => (
                            <Chip key={index} label={permission} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">وضعیت</Typography>
                      <Chip 
                        label={selectedUser.isActive ? 'فعال' : 'غیرفعال'} 
                        color={selectedUser.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </Grid>
                    {selectedUser.systemInfo?.loginCount !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">تعداد ورود</Typography>
                        <Typography variant="body1">{selectedUser.systemInfo.loginCount}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Edit User Modal */}
      {canManageUsers && <EditUserModal
        user={selectedUser}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={async (user, updatedData) => {
          const updatedUser = await dispatch(updateUser({ id: user.id, userData: updatedData })).unwrap();
          if (currentUser?.id === updatedUser.id) {
            dispatch(updateAuthenticatedUser({
              name: updatedUser.personalInfo.fullName,
              avatar: updatedUser.personalInfo.avatar,
            }));
          }
          setShowEditModal(false);
          await dispatch(fetchUserById(user.id));
        }}
        isSaving={isLoading}
      />}
    </Box>
  );
};

export default UserDetailPage;
