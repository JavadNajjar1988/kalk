import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '..';
import { notificationsApiService, ServerNotification } from '@/services/api/notificationsApiService';


interface State {
  active: ServerNotification[];
  archived: ServerNotification[];
  loading: boolean;
  error: string | null;
}

const initialState: State = { active: [], archived: [], loading: false, error: null };

export const fetchServerNotifications = createAsyncThunk<
  { archived: boolean; items: ServerNotification[]; total: number },
  boolean | undefined
>(
  'serverNotifications/fetch',
  async (archived = false) => ({ archived, ...(await notificationsApiService.list(archived)) }),
);
export const refreshServerNotifications = createAsyncThunk(
  'serverNotifications/refresh',
  async () => {
    await notificationsApiService.refresh();
    return notificationsApiService.list(false);
  },
);
export const markServerNotificationRead = createAsyncThunk(
  'serverNotifications/read',
  async (id: string) => { await notificationsApiService.markRead(id); return id; },
);
export const markAllServerNotificationsRead = createAsyncThunk(
  'serverNotifications/readAll',
  async () => { await notificationsApiService.markAllRead(); },
);
export const archiveServerNotification = createAsyncThunk(
  'serverNotifications/archive',
  async (id: string) => { await notificationsApiService.archive(id); return id; },
);
export const unarchiveServerNotification = createAsyncThunk(
  'serverNotifications/unarchive',
  async (id: string) => { await notificationsApiService.unarchive(id); return id; },
);
export const starServerNotification = createAsyncThunk(
  'serverNotifications/star',
  async ({ id, starred }: { id: string; starred: boolean }) => {
    await notificationsApiService.setStarred(id, starred);
    return { id, starred };
  },
);
export const archiveServerNotifications = createAsyncThunk(
  'serverNotifications/archiveMany',
  async (ids: string[]) => {
    await Promise.all(ids.map((id) => notificationsApiService.archive(id)));
    return ids;
  },
);
export const unarchiveServerNotifications = createAsyncThunk(
  'serverNotifications/unarchiveMany',
  async (ids: string[]) => {
    await Promise.all(ids.map((id) => notificationsApiService.unarchive(id)));
    return ids;
  },
);
export const starServerNotifications = createAsyncThunk(
  'serverNotifications/starMany',
  async ({ ids, starred }: { ids: string[]; starred: boolean }) => {
    await Promise.all(ids.map((id) => notificationsApiService.setStarred(id, starred)));
    return { ids, starred };
  },
);

const slice = createSlice({
  name: 'serverNotifications',
  initialState,
  reducers: {
    ingestServerNotification(state, action: PayloadAction<ServerNotification>) {
      state.active = [action.payload, ...state.active.filter((item) => item.id !== action.payload.id)];
    },
    clearServerNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchServerNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.archived) state.archived = action.payload.items;
        else state.active = action.payload.items;
      })
      .addCase(fetchServerNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'خطا در دریافت اعلان‌ها';
      })
      .addCase(refreshServerNotifications.fulfilled, (state, action) => { state.active = action.payload.items; })
      .addCase(markServerNotificationRead.fulfilled, (state, action) => {
        const item = [...state.active, ...state.archived].find((value) => value.id === action.payload);
        if (item) item.read = true;
      })
      .addCase(markAllServerNotificationsRead.fulfilled, (state) => {
        state.active.forEach((item) => { item.read = true; });
      })
      .addCase(archiveServerNotification.fulfilled, (state, action) => {
        const item = state.active.find((value) => value.id === action.payload);
        if (!item) return;
        item.archived = true;
        state.active = state.active.filter((value) => value.id !== action.payload);
        state.archived.unshift(item);
      })
      .addCase(unarchiveServerNotification.fulfilled, (state, action) => {
        const item = state.archived.find((value) => value.id === action.payload);
        if (!item) return;
        item.archived = false;
        state.archived = state.archived.filter((value) => value.id !== action.payload);
        state.active.unshift(item);
      })
      .addCase(starServerNotification.fulfilled, (state, action) => {
        const item = [...state.active, ...state.archived].find((value) => value.id === action.payload.id);
        if (item) item.starred = action.payload.starred;
      })
      .addCase(archiveServerNotifications.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        const moved = state.active.filter((item) => ids.has(item.id));
        moved.forEach((item) => { item.archived = true; });
        state.active = state.active.filter((item) => !ids.has(item.id));
        state.archived = [...moved, ...state.archived];
      })
      .addCase(unarchiveServerNotifications.fulfilled, (state, action) => {
        const ids = new Set(action.payload);
        const moved = state.archived.filter((item) => ids.has(item.id));
        moved.forEach((item) => { item.archived = false; });
        state.archived = state.archived.filter((item) => !ids.has(item.id));
        state.active = [...moved, ...state.active];
      })
      .addCase(starServerNotifications.fulfilled, (state, action) => {
        const ids = new Set(action.payload.ids);
        [...state.active, ...state.archived].forEach((item) => {
          if (ids.has(item.id)) item.starred = action.payload.starred;
        });
      });
  },
});

export const { ingestServerNotification, clearServerNotifications } = slice.actions;
export const selectServerNotifications = (state: RootState) => state.serverNotifications.active;
export const selectArchivedServerNotifications = (state: RootState) => state.serverNotifications.archived;
export const selectUnreadServerNotifications = (state: RootState) =>
  state.serverNotifications.active.filter((item) => !item.read);
export const selectServerNotificationsLoading = (state: RootState) => state.serverNotifications.loading;
export const selectServerNotificationStats = (state: RootState) => {
  const active = state.serverNotifications.active;
  const archived = state.serverNotifications.archived;
  const all = [...active, ...archived];
  return {
    total: all.length,
    unread: active.filter((item) => !item.read).length,
    read: all.filter((item) => item.read).length,
    starred: all.filter((item) => item.starred).length,
    archived: archived.length,
    active: active.length,
  };
};
export default slice.reducer;
