import { BaseApiClient, handleApiResponse } from './baseApiClient';
import type {
  User,
  UserFilters,
  Role,
  AccessLevel,
  QuickActionPayload,
} from '@/modules/users/types';

interface LookupItem {
  id: string;
  name: string;
}

interface UsersListApiData {
  items: User[];
  total: number;
  roles: LookupItem[];
  accessLevels: LookupItem[];
}

export class UserApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  protected override getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private buildFilters(filters?: UserFilters): Record<string, string> | undefined {
    if (!filters) return undefined;
    const entries = Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return acc;
      }
      if (typeof value === 'boolean') {
        acc[key] = value ? 'true' : 'false';
      } else {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    return Object.keys(entries).length ? entries : undefined;
  }

  private mapLookupToRole(items: LookupItem[]): Role[] {
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      englishName: item.name,
      description: '',
      accessLevel: '',
      permissions: [],
    }));
  }

  private mapLookupToAccess(items: LookupItem[]): AccessLevel[] {
    return items.map((item, index) => ({
      id: item.id,
      name: item.name,
      englishName: item.name,
      description: '',
      color: undefined,
      priority: index + 1,
    }));
  }

  async getUsers(filters?: UserFilters): Promise<{
    users: User[];
    total: number;
    roles: Role[];
    accessLevels: AccessLevel[];
  }> {
    const response = await this.get<UsersListApiData>('/users', this.buildFilters(filters));
    const data = handleApiResponse(response);
    return {
      users: data.items ?? [],
      total: data.total ?? 0,
      roles: this.mapLookupToRole(data.roles ?? []),
      accessLevels: this.mapLookupToAccess(data.accessLevels ?? []),
    };
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.get<User>(`/users/${id}`);
    return handleApiResponse(response);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { username?: string }): Promise<User> {
    const response = await this.post<User>('/users', userData);
    return handleApiResponse(response);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await this.patch<User>(`/users/${id}`, userData);
    return handleApiResponse(response);
  }

  async deleteUser(id: string): Promise<{ id: string }> {
    const response = await this.delete<{ id: string }>(`/users/${id}`);
    return handleApiResponse(response);
  }

  async performQuickAction(userId: string, payload: QuickActionPayload): Promise<User> {
    const response = await this.post<User>(`/users/${userId}/actions`, payload);
    return handleApiResponse(response);
  }
}

export const userApiService = new UserApiService();


