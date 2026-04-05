import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
  useTheme,
  ThemeProvider,
} from '@mui/material';
import { alpha, createTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TableView as TableViewIcon,
  ViewModule as CardViewIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchUsers, setFilters, clearFilters, setPagination, clearError, createUser, setViewMode, updateUser, deleteUser, performQuickAction } from '../store/usersSlice';
import type { User, UserFilters, QuickActionPayload } from '../types';
import { useTranslation } from '@/hooks/useTranslation';
import { UsersTableView, UsersCardView, QuickActionsModal, UserDetailsModal, EditUserModal, DeleteConfirmationModal } from '../components';
import {
  buildResourcesFormDialogSx,
  resourcesDialogTitleSx,
  resourcesDialogContentDividersSx,
  resourcesDialogActionsSx,
  resourcesOutlinedCancelButtonSx,
} from '@/modules/dashboard/pages/resources/resourcesDialogStyles';

const UsersListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();
  const unifiedAccent = theme.palette.primary.main;
  const unifiedSurface = `linear-gradient(135deg, ${alpha(unifiedAccent, 0.07)}, ${alpha(unifiedAccent, 0.04)})`;
  const unifiedSurfaceSx = {
    background: unifiedSurface,
    border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
    boxShadow: 'none',
  };
  const sectionTheme = useMemo(
    () =>
      createTheme(theme, {
        components: {
          MuiDialog: {
            styleOverrides: {
              paper: {
                background: unifiedSurface,
                border: `1px solid ${alpha(unifiedAccent, 0.24)}`,
                borderRadius: 14,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                borderTop: `1px solid ${alpha(unifiedAccent, 0.18)}`,
              },
            },
          },
        },
      }),
    [theme, unifiedSurface, unifiedAccent]
  );
  
  const {
    users,
    roles,
    accessLevels,
    filters,
    viewMode,
    isLoading,
    error,
    pagination,
  } = useAppSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [selectedUserForQuickActions, setSelectedUserForQuickActions] = useState<User | null>(null);
  
  // Modal states for CRUD operations
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    username: string;
    userCode: string;
    temporaryPassword: string;
  } | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    nationalId: '',
    gender: 'مرد' as 'مرد' | 'زن',
    nationality: 'ایرانی' as 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف',
    mobile: '',
    role: 'مهمان',
    accessLevel: 'سطح 4 - دسترسی مهمان',
    status: 'آزاد' as 'آزاد' | 'نظامی' | 'غیرنظامی',
  });

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchUsers());
  }, [dispatch, filters, pagination.page]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ search: value }));
  };

  const handleFilterChange = (filterKey: keyof UserFilters, value: any) => {
    dispatch(setFilters({ [filterKey]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(clearFilters());
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(setPagination({ page: value }));
  };

  const handleAddUser = () => {
    setShowAddModal(true);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: 'table' | 'card') => {
    if (newViewMode !== null) {
      dispatch(setViewMode({ type: newViewMode }));
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleQuickAction = (user: User) => {
    setSelectedUserForQuickActions(user);
    setShowQuickActionsModal(true);
  };

  const handleQuickActionExecute = async (payload: QuickActionPayload) => {
    try {
      await dispatch(performQuickAction(payload));
      setShowQuickActionsModal(false);
      setSelectedUserForQuickActions(null);
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      const userCode = `USR${Date.now().toString().slice(-6)}`;

      const professionalDetails: User['professionalInfo']['details'] =
        newUserForm.status === 'نظامی'
          ? { forceType: 'ارتش' as const, rank: 'سرباز', position: 'کارمند' }
          : newUserForm.status === 'غیرنظامی'
            ? { occupation: 'نامشخص' }
            : { businessType: 'کسب و کار آزاد', expertise: 'عمومی' };

      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
        userCode,
        personalInfo: {
          fullName: newUserForm.fullName || 'کاربر جدید',
          fatherName: '',
          nationalId: newUserForm.nationalId || `${Date.now().toString().slice(-10)}`,
          nationality: newUserForm.nationality,
          birthDate: new Date().toISOString(),
          gender: newUserForm.gender,
        },
        contactInfo: {
          mobile: [newUserForm.mobile || `0912${Date.now().toString().slice(-7)}`],
        },
        professionalInfo: {
          status: newUserForm.status,
          details: professionalDetails,
        },
        systemInfo: {
          role: newUserForm.role,
          accessLevel: newUserForm.accessLevel,
          permissions: ['مشاهده محدود'],
          loginCount: 0,
        },
        isActive: true,
      };

      const resultAction = await dispatch(createUser(userData));
      if (createUser.fulfilled.match(resultAction)) {
        const { user, temporaryPassword } = resultAction.payload;
        setShowAddModal(false);
        setNewUserForm({
          fullName: '',
          nationalId: '',
          gender: 'مرد',
          nationality: 'ایرانی',
          mobile: '',
          role: 'مهمان',
          accessLevel: 'سطح 4 - دسترسی مهمان',
          status: 'آزاد',
        });
        if (temporaryPassword) {
          setTempPasswordInfo({
            username: user.username || user.userCode,
            userCode: user.userCode,
            temporaryPassword,
          });
        }
        dispatch(fetchUsers());
      }
    } catch (error) {
      console.error('Error in handleSaveUser:', error);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!tempPasswordInfo) return;
    try {
      await navigator.clipboard.writeText(tempPasswordInfo.temporaryPassword);
      // می‌توان در آینده نوتیفیکیشن موفقیت هم اضافه کرد
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  // Handle edit user
  const handleSaveEditUser = async (user: User, updatedData: Partial<User>) => {
    try {
      await dispatch(updateUser({ id: user.id, userData: updatedData }));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Handle delete user
  const handleConfirmDelete = async (user: User) => {
    try {
      await dispatch(deleteUser(user.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle modal close functions
  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  if (error) {
    const isForbidden =
      typeof error === 'string' &&
      (error.toLowerCase().includes('permission') || error.toLowerCase().includes('insufficient'));
    const message = isForbidden
      ? 'دسترسی غیرمجاز. مشاهده لیست کاربران فقط برای مدیر سیستم و فرمانده امکان‌پذیر است.'
      : error;
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {message}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={sectionTheme}>
      <Box
        sx={{
          p: 3,
          '& .MuiCard-root': {
            ...unifiedSurfaceSx,
          },
          '& .MuiPaper-root': {
            borderColor: alpha(unifiedAccent, 0.2),
          },
        }}
      >
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          مدیریت کاربران
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode.type}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table">
              <Tooltip title="نمایش جدولی">
                <TableViewIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="card">
              <Tooltip title="نمایش کارتی">
                <CardViewIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            افزودن کاربر جدید
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            فیلترها و جستجو
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="جستجو در کاربران..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="وضعیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="نظامی">نظامی</MenuItem>
                  <MenuItem value="آزاد">آزاد</MenuItem>
                  <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>نقش</InputLabel>
                <Select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  label="نقش"
                >
                  <MenuItem value="">همه</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>جنسیت</InputLabel>
                <Select
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  label="جنسیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="مرد">مرد</MenuItem>
                  <MenuItem value="زن">زن</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>فعالیت</InputLabel>
                <Select
                  value={filters.isActive !== undefined ? (filters.isActive ? 'active' : 'inactive') : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleFilterChange('isActive', undefined);
                    } else {
                      handleFilterChange('isActive', value === 'active');
                    }
                  }}
                  label="فعالیت"
                >
                  <MenuItem value="">همه</MenuItem>
                  <MenuItem value="active">فعال</MenuItem>
                  <MenuItem value="inactive">غیرفعال</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ height: '100%' }}
              >
                پاک کردن فیلترها
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Display */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              هیچ کاربری یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Object.keys(filters).length > 0 ? 'برای نمایش کاربران، فیلترها را تغییر دهید' : 'برای افزودن کاربر جدید روی دکمه "افزودن کاربر جدید" کلیک کنید'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography component="div" variant="body2" color="text.secondary">
              {pagination.total} کاربر یافت شد
              {Object.keys(filters).length > 0 && (
                <Chip 
                  label={`${Object.keys(filters).length} فیلتر فعال`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ ml: 1 }}
                  onDelete={handleClearFilters}
                />
              )}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {viewMode.type === 'table' ? (
              <UsersTableView
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onQuickAction={handleQuickAction}
              />
            ) : (
              <UsersCardView
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onQuickAction={handleQuickAction}
              />
            )}
          </Box>
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add user"
        onClick={handleAddUser}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="md"
        fullWidth
        sx={buildResourcesFormDialogSx(theme)}
      >
        <DialogTitle sx={{ ...resourcesDialogTitleSx(theme), pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '999px',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 2,
                  fontSize: 18,
                }}
              >
                <PersonIcon fontSize="inherit" />
              </Box>
              <Box>
                <Typography component="h2" variant="h6" fontWeight={600}>
                  افزودن کاربر جدید
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  اطلاعات پایه، تماس و سطح دسترسی کاربر را تکمیل کنید.
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ ...resourcesDialogContentDividersSx(theme), pt: 2.5 }}>
          <Grid container spacing={3}>
            {/* اطلاعات شخصی */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                اطلاعات شخصی
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="نام و نام خانوادگی"
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="کد ملی"
                    value={newUserForm.nationalId}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>جنسیت</InputLabel>
                    <Select
                      value={newUserForm.gender}
                      label="جنسیت"
                      onChange={(e) =>
                        setNewUserForm((prev) => ({ ...prev, gender: e.target.value as 'مرد' | 'زن' }))
                      }
                    >
                      <MenuItem value="مرد">مرد</MenuItem>
                      <MenuItem value="زن">زن</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>تابعیت</InputLabel>
                    <Select
                      value={newUserForm.nationality}
                      label="تابعیت"
                      onChange={(e) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          nationality: e.target.value as 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف',
                        }))
                      }
                    >
                      <MenuItem value="ایرانی">ایرانی</MenuItem>
                      <MenuItem value="غیرایرانی">غیرایرانی</MenuItem>
                      <MenuItem value="تبعه مضاعف">تبعه مضاعف</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* اطلاعات تماس و حرفه‌ای */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                اطلاعات تماس
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="شماره موبایل"
                    value={newUserForm.mobile}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, mobile: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                وضعیت حرفه‌ای
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>وضعیت حرفه‌ای</InputLabel>
                    <Select
                      value={newUserForm.status}
                      label="وضعیت حرفه‌ای"
                      onChange={(e) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          status: e.target.value as 'آزاد' | 'نظامی' | 'غیرنظامی',
                        }))
                      }
                    >
                      <MenuItem value="آزاد">آزاد</MenuItem>
                      <MenuItem value="نظامی">نظامی</MenuItem>
                      <MenuItem value="غیرنظامی">غیرنظامی</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* اطلاعات سیستمی */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                اطلاعات سیستمی
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>نقش سیستمی</InputLabel>
                    <Select
                      value={newUserForm.role}
                      label="نقش سیستمی"
                      onChange={(e) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          role: e.target.value as string,
                        }))
                      }
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.name}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>سطح دسترسی</InputLabel>
                    <Select
                      value={newUserForm.accessLevel}
                      label="سطح دسترسی"
                      onChange={(e) =>
                        setNewUserForm((prev) => ({
                          ...prev,
                          accessLevel: e.target.value as string,
                        }))
                      }
                    >
                      {accessLevels.map((level) => (
                        <MenuItem key={level.id} value={level.name}>
                          {level.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    رمز عبور اولیه این کاربر به‌صورت خودکار توسط سامانه تنظیم می‌شود و در صورت نیاز می‌توانید بعداً از طریق «اقدامات سریع» آن را تغییر دهید.
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={resourcesDialogActionsSx(theme)}>
          <Button
            onClick={() => setShowAddModal(false)}
            variant="outlined"
            color="inherit"
            sx={{ ...resourcesOutlinedCancelButtonSx(theme), minWidth: 120 }}
          >
            انصراف
          </Button>
          <Button variant="contained" color="primary" onClick={handleSaveUser} sx={{ borderRadius: 2, minWidth: 140, px: 3 }}>
            ذخیره کاربر
          </Button>
        </DialogActions>
      </Dialog>

      {/* Temporary Password Modal */}
      <Dialog
        open={!!tempPasswordInfo}
        onClose={() => setTempPasswordInfo(null)}
        maxWidth="sm"
        fullWidth
        sx={buildResourcesFormDialogSx(theme)}
      >
        <DialogTitle sx={resourcesDialogTitleSx(theme)}>رمز عبور اولیه کاربر</DialogTitle>
        <DialogContent dividers sx={resourcesDialogContentDividersSx(theme)}>
          {tempPasswordInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                این رمز فقط همین‌حال حاضر نمایش داده می‌شود. حتماً آن را در یک کانال امن به کاربر منتقل کنید.
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', border: 1, borderColor: 'grey.200' }}>
                <Typography variant="body2">
                  <strong>نام کاربری:</strong> {tempPasswordInfo.username}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>کد کاربری:</strong> {tempPasswordInfo.userCode}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  <strong>رمز عبور اولیه:</strong>{' '}
                  <Box
                    component="span"
                    sx={{
                      fontFamily: 'monospace',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'grey.300',
                    }}
                  >
                    {tempPasswordInfo.temporaryPassword}
                  </Box>
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                پس از اولین ورود، توصیه می‌شود کاربر رمز عبور خود را از طریق «تغییر رمز عبور» به‌روزرسانی کند.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={resourcesDialogActionsSx(theme)}>
          <Button
            onClick={handleCopyTempPassword}
            variant="outlined"
            color="inherit"
            sx={resourcesOutlinedCancelButtonSx(theme)}
          >
            کپی رمز
          </Button>
          <Button onClick={() => setTempPasswordInfo(null)} variant="contained" color="primary" sx={{ borderRadius: 2, px: 3 }}>
            متوجه شدم
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions Modal */}
      <QuickActionsModal
        user={selectedUserForQuickActions}
        open={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        onAction={handleQuickActionExecute}
        roles={roles}
        accessLevels={accessLevels}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        open={showViewModal}
        onClose={handleCloseModals}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        open={showEditModal}
        onClose={handleCloseModals}
        onSave={handleSaveEditUser}
        isSaving={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        user={selectedUser}
        open={showDeleteModal}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        isDeleting={isLoading}
      />
      </Box>
    </ThemeProvider>
  );
};

export default UsersListPage;
