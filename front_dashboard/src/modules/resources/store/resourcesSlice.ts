import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Resource, ResourceState, ResourceFilters } from '../types';

// Initial state
const initialState: ResourceState = {
  resources: [],
  selectedResource: null,
  filters: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

// Async thunks (placeholder for API calls)
export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (filters?: ResourceFilters) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      resources: [] as Resource[],
      total: 0,
    };
  }
);

export const createResource = createAsyncThunk(
  'resources/createResource',
  async (resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newResource: Resource = {
      ...resourceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newResource;
  }
);

export const updateResource = createAsyncThunk(
  'resources/updateResource',
  async ({ id, resourceData }: { id: string; resourceData: Partial<Resource> }) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedResource: Resource = {
      ...resourceData as Resource,
      id,
      updatedAt: new Date().toISOString(),
    };
    return updatedResource;
  }
);

export const deleteResource = createAsyncThunk(
  'resources/deleteResource',
  async (id: string) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return id;
  }
);

// Slice
const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setSelectedResource: (state, action: PayloadAction<Resource | null>) => {
      state.selectedResource = action.payload;
    },
    setFilters: (state, action: PayloadAction<ResourceFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action: PayloadAction<Partial<{ page: number; pageSize: number; total: number }>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload.resources;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در بارگذاری منابع';
      })
      .addCase(createResource.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources.unshift(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'خطا در ایجاد منبع';
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(r => r.id !== action.payload);
      });
  },
});

export const {
  setSelectedResource,
  setFilters,
  clearFilters,
  clearError,
  setPagination,
} = resourcesSlice.actions;

export default resourcesSlice.reducer;