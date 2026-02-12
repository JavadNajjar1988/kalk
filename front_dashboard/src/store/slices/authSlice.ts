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
}

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'خطا در ورود');
      }
      
      const tokenData = await response.json();
      const { access_token } = tokenData;
      
      // Store token in localStorage
      localStorage.setItem('access_token', access_token);
      
      // Decode JWT to get user info (basic decode without verification for now)
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      
      const user: User = {
        id: payload.uid || '1',
        username: payload.sub || credentials.username,
        name: payload.sub === 'admin' ? 'مدیر سیستم' : 'اپراتور سیستم',
        role: payload.roles?.includes('ADMIN') ? 'admin' : 'operator',
        rank: payload.sub === 'admin' ? 'سرهنگ' : 'ستوان',
        unit: payload.sub === 'admin' ? 'فرماندهی کل' : 'مرکز عملیات',
      };
      
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'خطا در ورود');
    }
  }
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
            role: payload.roles?.includes('ADMIN') ? 'admin' : 'operator',
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
