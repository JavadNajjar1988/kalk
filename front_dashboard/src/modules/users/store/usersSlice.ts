import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  User,
  UserState,
  UserFilters,
  Role,
  AccessLevel,
  QuickActionPayload,
  ViewMode,
} from '../types';
import { userApiService } from '@/services/api/userApiService';
import type { RootState } from '@/store';

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
export const fetchUsers = createAsyncThunk<
  { users: User[]; roles: Role[]; accessLevels: AccessLevel[]; total: number },
  void,
  { state: RootState; rejectValue: string }
>('users/fetchUsers', async (_: void, { getState, rejectWithValue }) => {
  try {
    const { filters, pagination } = (getState() as RootState).users;
    const response = await userApiService.getUsers(filters, pagination.page, pagination.pageSize);
    return response;
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در بارگذاری کاربران');
  }
});

export const fetchUserById = createAsyncThunk<
  User,
  string,
  { rejectValue: string }
>('users/fetchUserById', async (id, { rejectWithValue }) => {
  try {
    return await userApiService.getUserById(id);
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در بارگذاری کاربر');
  }
});

export const createUser = createAsyncThunk<
  { user: User; temporaryPassword?: string },
  Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { username?: string },
  { rejectValue: string }
>('users/createUser', async (userData, { rejectWithValue }) => {
  try {
    return await userApiService.createUser(userData);
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در ایجاد کاربر');
  }
});

export const updateUser = createAsyncThunk<
  User,
  { id: string; userData: Partial<User> },
  { rejectValue: string }
>('users/updateUser', async ({ id, userData }, { rejectWithValue }) => {
  try {
    return await userApiService.updateUser(id, userData);
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در بروزرسانی کاربر');
  }
});

export const deleteUser = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('users/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await userApiService.deleteUser(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در حذف کاربر');
  }
});

// Quick Actions
export const performQuickAction = createAsyncThunk<
  User,
  QuickActionPayload,
  { rejectValue: string }
>('users/performQuickAction', async (payload, { rejectWithValue }) => {
  try {
    return await userApiService.performQuickAction(payload.userId, payload);
  } catch (error: any) {
    return rejectWithValue(error?.message || 'خطا در انجام عملیات');
  }
});

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
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
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
        state.error = (action.payload as string) || action.error.message || 'خطا در بارگذاری کاربران';
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.unshift(action.payload.user);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'خطا در ایجاد کاربر';
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload;
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        if (state.selectedUser?.id === updatedUser.id) {
          state.selectedUser = updatedUser;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'خطا در بروزرسانی کاربر';
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
        state.error = (action.payload as string) || action.error.message || 'خطا در حذف کاربر';
      })
      // Quick Actions
      .addCase(performQuickAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performQuickAction.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload;
        const userIndex = state.users.findIndex(user => user.id === updatedUser.id);

        if (userIndex !== -1) {
          state.users[userIndex] = updatedUser;
        }

        if (state.selectedUser?.id === updatedUser.id) {
          state.selectedUser = updatedUser;
        }
      })
      .addCase(performQuickAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'خطا در انجام عملیات';
      })
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
        // Also update in users list if exists
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        } else {
          // Add to list if not exists
          state.users.push(action.payload);
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'خطا در بارگذاری کاربر';
        state.selectedUser = null;
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
