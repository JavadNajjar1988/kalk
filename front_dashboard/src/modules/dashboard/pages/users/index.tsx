import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  alpha,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  PersonAdd,
  FilterList,
  Delete,
  Close,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectUser } from '@/store/slices/authSlice';
import { 
  showSuccessNotification,
  showErrorNotification,
} from '@/store/slices/uiSlice';

import { UserProfile } from './types';

// تعریف نوع برای فیلتر نقش
type RoleFilterType = 'all' | 'admin' | 'commander' | 'operator' | 'viewer';
import { generateStrongPassword } from './utils/validators';
import { UserCard } from './components/UserCard';
import { UserStats } from './components/UserStats';
import { UserDialog } from './components/UserDialog';

// Mock data for testing
const mockUsers: UserProfile[] = [
  {
    id: '1',
    name: 'علی محمدی',
    nameEn: 'Ali Mohammadi',
    username: 'ali.mohammadi',
    email: 'ali.mohammadi@example.com',
    role: 'admin',
    avatar: 'avatar1',
    department: 'فناوری اطلاعات',
    position: 'مدیر IT',
    phoneNumber: '+989123456789',
    nationality: 'iranian',
    nationalId: '0123456789',
    permissions: ['dashboard_view', 'users_manage', 'system_config'],
    securityClearance: 'top_secret',
    isActive: true,
    loginCount: 120,
    lastLogin: new Date('2023-08-10T08:30:00'),
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2023-08-10'),
  },
  {
    id: '2',
    name: 'سارا احمدی',
    nameEn: 'Sara Ahmadi',
    username: 'sara.ahmadi',
    email: 'sara.ahmadi@example.com',
    role: 'operator',
    avatar: 'avatar2',
    department: 'عملیات',
    position: 'تحلیلگر',
    phoneNumber: '+989987654321',
    nationality: 'iranian',
    nationalId: '9876543210',
    permissions: ['dashboard_view', 'map_view', 'map_edit'],
    securityClearance: 'basic',
    isActive: true,
    loginCount: 87,
    lastLogin: new Date('2023-08-15T10:45:00'),
    createdAt: new Date('2022-03-20'),
    updatedAt: new Date('2023-08-15'),
  },
  {
    id: '3',
    name: 'محمد حسینی',
    nameEn: 'Mohammad Hosseini',
    username: 'mohammad.hosseini',
    email: 'mohammad.h@example.com',
    role: 'commander',
    avatar: 'avatar3',
    department: 'فرماندهی',
    position: 'فرمانده ارشد',
    phoneNumber: '+989123456788',
    nationality: 'iranian',
    nationalId: '1234567890',
    permissions: ['dashboard_view', 'map_view', 'reports_view', 'simulation_run'],
    securityClearance: 'secret',
    isActive: true,
    loginCount: 215,
    lastLogin: new Date(),
    createdAt: new Date('2021-11-05'),
    updatedAt: new Date('2023-08-20'),
  },
  {
    id: '4',
    name: 'زهرا کریمی',
    nameEn: 'Zahra Karimi',
    username: 'zahra.karimi',
    email: 'zahra.k@example.com',
    role: 'viewer',
    avatar: 'none',
    department: 'گزارش‌دهی',
    position: 'تحلیلگر داده',
    phoneNumber: '+989198765432',
    nationality: 'iranian',
    nationalId: '0987654321',
    permissions: ['dashboard_view', 'reports_view'],
    securityClearance: 'basic',
    isActive: false,
    loginCount: 45,
    lastLogin: new Date('2023-07-28T14:20:00'),
    createdAt: new Date('2022-06-10'),
    updatedAt: new Date('2023-07-28'),
  },
  {
    id: '5',
    name: 'جان اسمیت',
    nameEn: 'John Smith',
    username: 'john.smith',
    email: 'john.s@example.com',
    role: 'viewer',
    avatar: 'avatar7',
    department: 'همکاری بین‌المللی',
    position: 'رابط بین‌المللی',
    phoneNumber: '+14155552671',
    nationality: 'non-iranian',
    nationalId: 'AB123456',
    permissions: ['dashboard_view', 'map_view'],
    securityClearance: 'basic',
    isActive: true,
    loginCount: 23,
    lastLogin: new Date('2023-08-01T09:15:00'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-08-01'),
  },
];

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  
  // State
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<'full' | 'edit' | 'permissions' | 'password'>('full');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Effects
  useEffect(() => {
    const filtered = users.filter(user => {
      // جستجوی متنی
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || (
        (user.name?.toLowerCase() || '').includes(searchLower) ||
        (user.nameEn?.toLowerCase() || '').includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower) ||
        user.position.toLowerCase().includes(searchLower)
      );
      
      // فیلتر نقش کاربری
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // فیلتر وضعیت
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setFilteredUsers(filtered);
    setPage(0);
  }, [searchQuery, roleFilter, statusFilter, users]);
  
  // Handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserDialogMode('full');
    setOpenUserDialog(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserDialogMode('edit');
    setOpenUserDialog(true);
  };

  const handleSaveUser = (userData: Partial<UserProfile>) => {
    if (selectedUser) {
      // Update existing user
      setUsers(prev =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, ...userData } : user))
      );
      dispatch(showSuccessNotification('کاربر با موفقیت بروزرسانی شد'));
    } else {
      // Create new user with mock ID
      const newUser: UserProfile = {
        id: Math.random().toString(36).substring(2, 9),
        username: userData.username || '',
        email: userData.email || '',
        role: userData.role || 'viewer',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: userData.isActive || true,
        permissions: userData.permissions || [],
        department: userData.department || '',
        position: userData.position || '',
        securityClearance: userData.securityClearance || 'none',
        loginCount: 0,
        ...userData,
      };
      
      setUsers(prev => [...prev, newUser]);
      dispatch(showSuccessNotification('کاربر جدید با موفقیت ایجاد شد'));
    }
  };

  const handleDeleteUser = (id: string) => {
    setUserToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(prev => prev.filter(user => user.id !== userToDelete));
      dispatch(showSuccessNotification('کاربر با موفقیت حذف شد'));
    }
    setUserToDelete(null);
    setConfirmDeleteOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev =>
      prev.map(user => {
        if (user.id === id) {
          const newStatus = !user.isActive;
          dispatch(showSuccessNotification(`وضعیت کاربر به ${newStatus ? 'فعال' : 'غیرفعال'} تغییر یافت`));
          return { ...user, isActive: newStatus };
        }
        return user;
      })
    );
  };

  const handleResetPassword = (user: UserProfile) => {
    // In a real application, you would call an API to reset the password
    const newPassword = generateStrongPassword();
    dispatch(showSuccessNotification('رمز عبور جدید با موفقیت ایجاد و برای کاربر ارسال شد'));
    // For demonstration purposes, we're logging the password
    console.log(`رمز عبور جدید برای ${user.name}: ${newPassword}`);
  };

  const handleViewPermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setUserDialogMode('permissions');
    setOpenUserDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.primary.main,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: '100%',
              height: 3,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 1.5,
            },
          }}
        >
          مدیریت کاربران
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateUser}
          sx={{
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: 2,
            px: 3,
            py: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <PersonAdd sx={{ mr: 1 }} />
          کاربر جدید
        </Button>
      </Box>
      
      {/* آمار کاربران */}
      <UserStats users={users} />
      
      {/* جستجو و فیلتر */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 2, 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        backgroundColor: theme.palette.background.paper,
        p: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          <TextField
            placeholder="جستجو در کاربران..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              flex: 1,
              backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ minWidth: 120 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="نقش"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              SelectProps={{
                native: false,
                IconComponent: props => (
                  <IconButton size="small" {...props}>
                    <FilterList fontSize="small" />
                  </IconButton>
                ),
              }}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="admin">مدیر کل</MenuItem>
              <MenuItem value="commander">فرمانده</MenuItem>
              <MenuItem value="operator">اپراتور</MenuItem>
              <MenuItem value="viewer">بیننده</MenuItem>
            </TextField>
          </Box>
          
          <Box sx={{ minWidth: 120 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="وضعیت"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              SelectProps={{
                native: false,
                IconComponent: props => (
                  <IconButton size="small" {...props}>
                    <FilterList fontSize="small" />
                  </IconButton>
                ),
              }}
            >
              <MenuItem value="all">همه</MenuItem>
              <MenuItem value="active">فعال</MenuItem>
              <MenuItem value="inactive">غیرفعال</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Box>
      
      {/* نمایش کاربران */}
      {filteredUsers.length === 0 ? (
        <Alert severity="info" sx={{ my: 3 }}>
          کاربری با معیارهای جستجوی شما یافت نشد
        </Alert>
      ) : (
        <>
          {/* Card View */}
          <Grid container spacing={3}>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <UserCard
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleStatus}
                    onResetPassword={handleResetPassword}
                    onViewPermissions={handleViewPermissions}
                  />
                </Grid>
              ))}
          </Grid>
          
          {/* Pagination */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="تعداد در صفحه:"
              rowsPerPageOptions={[4, 8, 12, 16, 24]}
            />
          </Box>
        </>
      )}
      
      {/* User Dialog */}
      <UserDialog
        open={openUserDialog}
        user={selectedUser}
        onClose={() => setOpenUserDialog(false)}
        onSave={handleSaveUser}
        mode={userDialogMode}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '2px solid',
            borderColor: 'error.main',
          },
        }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          حذف کاربر
        </DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف این کاربر اطمینان دارید؟ این عملیات قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteOpen(false)}
            sx={{ fontWeight: 'bold' }}
          >
            انصراف
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmDelete}
            sx={{ fontWeight: 'bold' }}
            startIcon={<Delete />}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage; 