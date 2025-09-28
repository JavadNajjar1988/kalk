import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, UserState, UserFilters, Role, AccessLevel, QuickActionPayload, ViewMode, PasswordChangeData, AccessLevelChangeData } from '../types';
import { loadUsersData } from '../utils/dataLoader';

// Initial state
const initialState: UserState = {
  users: [],
  roles: [],
  accessLevels: [],
  selectedUser: null,
  filters: {},
  viewMode: { type: 'table' },
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (filters?: UserFilters) => {
    const data = await loadUsersData();
    let filteredUsers = data.users;

    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.personalInfo.fullName.toLowerCase().includes(searchLower) ||
        user.userCode.toLowerCase().includes(searchLower) ||
        user.contactInfo.email?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.role) {
      filteredUsers = filteredUsers.filter(user => user.systemInfo.role === filters.role);
    }

    if (filters?.accessLevel) {
      filteredUsers = filteredUsers.filter(user => user.systemInfo.accessLevel === filters.accessLevel);
    }

    if (filters?.nationality) {
      filteredUsers = filteredUsers.filter(user => user.personalInfo.nationality === filters.nationality);
    }

    if (filters?.gender) {
      filteredUsers = filteredUsers.filter(user => user.personalInfo.gender === filters.gender);
    }

    if (filters?.status) {
      filteredUsers = filteredUsers.filter(user => user.professionalInfo.status === filters.status);
    }

    if (filters?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
    }

    return {
      users: filteredUsers,
      roles: data.roles,
      accessLevels: data.accessLevels,
      total: filteredUsers.length,
    };
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newUser;
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }: { id: string; userData: Partial<User> }) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id,
      ...userData,
      updatedAt: new Date().toISOString(),
    };
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return id;
  }
);

// Quick Actions
export const performQuickAction = createAsyncThunk(
  'users/performQuickAction',
  async (payload: QuickActionPayload) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switch (payload.action) {
      case 'toggleActive':
        return {
          userId: payload.userId,
          updates: { isActive: payload.data.isActive }
        };
      case 'changePassword':
        return {
          userId: payload.userId,
          updates: { 
            password: payload.data.newPassword,
            passwordLastChanged: new Date().toISOString()
          }
        };
      case 'updateAccessLevel':
        return {
          userId: payload.userId,
          updates: {
            'systemInfo.accessLevel': payload.data.newAccessLevel,
            'systemInfo.role': payload.data.newRole,
            'systemInfo.permissions': payload.data.newPermissions
          }
        };
      default:
        throw new Error('Unknown action type');
    }
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<UserFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.roles = action.payload.roles;
        state.accessLevels = action.payload.accessLevels;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در بارگذاری کاربران';
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در ایجاد کاربر';
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = { ...state.selectedUser, ...action.payload };
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در بروزرسانی کاربر';
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در حذف کاربر';
      })
      // Quick Actions
      .addCase(performQuickAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performQuickAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const { userId, updates } = action.payload;
        const userIndex = state.users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
          // Apply updates to the user using safer type approach
          Object.entries(updates).forEach(([key, value]) => {
            if (key.includes('.')) {
              // Handle nested updates like 'systemInfo.accessLevel'
              const [parent, child] = key.split('.');
              const userParent = state.users[userIndex][parent as keyof User];
              if (userParent && typeof userParent === 'object') {
                (userParent as Record<string, any>)[child] = value;
              }
            } else {
              // Handle direct property updates
              (state.users[userIndex] as Record<string, any>)[key] = value;
            }
          });
          
          state.users[userIndex].updatedAt = new Date().toISOString();
        }
        
        // Update selected user if it's the same user
        if (state.selectedUser?.id === userId) {
          Object.entries(updates).forEach(([key, value]) => {
            if (key.includes('.')) {
              const [parent, child] = key.split('.');
              const selectedUserParent = state.selectedUser![parent as keyof User];
              if (selectedUserParent && typeof selectedUserParent === 'object') {
                (selectedUserParent as Record<string, any>)[child] = value;
              }
            } else {
              // Handle direct property updates
              (state.selectedUser as Record<string, any>)[key] = value;
            }
          });
          state.selectedUser!.updatedAt = new Date().toISOString();
        }
      })
      .addCase(performQuickAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در انجام عملیات';
      });
  },
});

export const {
  setSelectedUser,
  setFilters,
  clearFilters,
  setViewMode,
  setPagination,
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;