import { BaseApiClient, handleApiResponse } from './baseApiClient';

export interface ServerNotification {
  id: string;
  eventType: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  starred: boolean;
}

class NotificationsApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }
  protected override getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  async list(archived = false) {
    return handleApiResponse(
      await this.get<{ items: ServerNotification[]; total: number }>('/notifications', {
        archived: String(archived),
        limit: '100',
      }),
    );
  }
  async refresh() { handleApiResponse(await this.post('/notifications/refresh')); }
  async markRead(id: string) { handleApiResponse(await this.patch(`/notifications/${id}/read`)); }
  async markAllRead() { handleApiResponse(await this.post('/notifications/read-all')); }
  async archive(id: string) { handleApiResponse(await this.patch(`/notifications/${id}/archive`)); }
  async unarchive(id: string) { handleApiResponse(await this.patch(`/notifications/${id}/unarchive`)); }
  async setStarred(id: string, starred: boolean) {
    handleApiResponse(await this.patch(`/notifications/${id}/star`, { starred }));
  }
}

export const notificationsApiService = new NotificationsApiService();

