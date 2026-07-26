import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'commander' | 'operator' | 'viewer';
  rank: string;
  unit: string;
  avatar?: string;
  permissions?: string[];
  userCode?: string;
  roleTitle?: string;
  accessLevel?: string;
  email?: string;
  mobile?: string[];
  position?: string;
  lastLogin?: string;
  loginCount?: number;
  isActive?: boolean;
}

interface AuthProfileResponse {
  success: boolean;
  data: {
    id: string;
    username: string;
    userCode?: string;
    roles: string[];
    name: string;
    roleTitle?: string;
    accessLevel?: string;
    permissions?: string[];
    rank?: string;
    unit?: string;
    position?: string;
    email?: string;
    mobile?: string[];
    avatar?: string;
    lastLogin?: string;
    loginCount?: number;
    isActive?: boolean;
  };
}

const mapBackendRolesToUiRole = (roles: unknown): User['role'] => {
  const roleList = Array.isArray(roles) ? roles.map((role) => String(role).toUpperCase()) : [];
  if (roleList.includes('SUPER_ADMIN') || roleList.includes('ADMIN')) return 'admin';
  if (roleList.includes('COMMANDER')) return 'commander';
  if (roleList.includes('OPERATOR')) return 'operator';
  return 'viewer';
};

const profileToUser = (profile: AuthProfileResponse['data']): User => ({
  id: profile.id,
  username: profile.username,
  name: profile.name || profile.username,
  role: mapBackendRolesToUiRole(profile.roles),
  rank: profile.rank || profile.position || '',
  unit: profile.unit || '',
  avatar: profile.avatar,
  permissions: profile.permissions || [],
  userCode: profile.userCode,
  roleTitle: profile.roleTitle,
  accessLevel: profile.accessLevel,
  email: profile.email,
  mobile: profile.mobile || [],
  position: profile.position,
  lastLogin: profile.lastLogin,
  loginCount: profile.loginCount || 0,
  isActive: profile.isActive,
});

const loadProfile = async (token: string): Promise<User> => {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('خطا در دریافت اطلاعات کاربر');
  const payload = await response.json() as AuthProfileResponse;
  return profileToUser(payload.data);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async actions
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      // OAuth2 token endpoint expects application/x-www-form-urlencoded (not FormData/multipart)
      const body = new URLSearchParams();
      body.append('username', credentials.username);
      body.append('password', credentials.password);

      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      
      if (!response.ok) {
        // Backend error envelope uses { success: false, message, ... } (not FastAPI's { detail }).
        const errorData = await response.json().catch(() => ({} as any));
        const message =
          (errorData && (errorData.detail || errorData.message || errorData.error)) ||
          `خطا در ورود (HTTP ${response.status})`;
        throw new Error(message);
      }
      
      const tokenData = await response.json();
      const { access_token } = tokenData;
      
      // Store token in localStorage
      localStorage.setItem('access_token', access_token);
      
      // Decode JWT to get user info (basic decode without verification for now)
      const payload = JSON.parse(atob(access_token.split('.')[1]));

      const fallbackUser: User = {
        id: payload.uid || '1',
        username: payload.sub || credentials.username,
        name: payload.sub === 'admin' ? 'مدیر سیستم' : 'اپراتور سیستم',
        role: mapBackendRolesToUiRole(payload.roles),
        rank: payload.sub === 'admin' ? 'سرهنگ' : 'ستوان',
        unit: payload.sub === 'admin' ? 'فرماندهی کل' : 'مرکز عملیات',
      };
      return await loadProfile(access_token).catch(() => fallbackUser);
    } catch (error: any) {
      return rejectWithValue(error.message || 'خطا در ورود');
    }
  }
);

export const fetchCurrentUserProfile = createAsyncThunk(
  'auth/fetchCurrentUserProfile',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('access_token');
    if (!token) return rejectWithValue({ token: null, message: 'نشست کاربری یافت نشد' });
    try {
      return { token, user: await loadProfile(token) };
    } catch (error: any) {
      return rejectWithValue({
        token,
        message: error.message || 'خطا در دریافت اطلاعات کاربر',
      });
    }
  },
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      // Clear token from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('access_token_exp');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    // Re-hydrate user from localStorage on app start
    rehydrateUser: (state) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        state.user = null;
        state.isAuthenticated = false;
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        const now = Math.floor(Date.now() / 1000);
        // Check if token is not expired
        if (payload.exp && payload.exp > now) {
          const user: User = {
            id: payload.uid || '1',
            username: payload.sub || 'unknown',
            name: payload.sub === 'admin' ? 'مدیر سیستم' : 'اپراتور سیستم',
            role: mapBackendRolesToUiRole(payload.roles),
            rank: payload.sub === 'admin' ? 'سرهنگ' : 'ستوان',
            unit: payload.sub === 'admin' ? 'فرماندهی کل' : 'مرکز عملیات',
          };
          state.user = user;
          state.isAuthenticated = true;
        } else {
          // Token expired, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('access_token_exp');
          state.user = null;
          state.isAuthenticated = false;
        }
      } catch (error) {
        // Invalid token, clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('access_token_exp');
        state.user = null;
        state.isAuthenticated = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        if (localStorage.getItem('access_token') === action.payload.token) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(fetchCurrentUserProfile.rejected, (state, action) => {
        const payload = action.payload as { token: string | null; message: string } | undefined;
        if (
          state.isAuthenticated
          && payload?.token
          && localStorage.getItem('access_token') === payload.token
        ) {
          state.error = payload.message;
        }
      });
  },
});

// Actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
  rehydrateUser,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Default export
export default authSlice.reducer; 
