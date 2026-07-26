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
  accessLevel?: string;
  permissions?: string[];
  internalRole?: string;
}

export interface UserAuditLog {
  id: string;
  targetUserId: string;
  actorUserId?: string;
  actorUsername?: string;
  action: string;
  before?: Partial<User>;
  after?: Partial<User>;
  clientIp?: string;
  requestId?: string;
  createdAt: string;
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
      accessLevel: item.accessLevel || '',
      permissions: item.permissions || [],
      internalRole: item.internalRole,
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

  async getUsers(filters?: UserFilters, page = 1, pageSize = 10): Promise<{
    users: User[];
    total: number;
    roles: Role[];
    accessLevels: AccessLevel[];
  }> {
    const response = await this.get<UsersListApiData>('/users', {
      ...(this.buildFilters(filters) || {}),
      page: String(page),
      pageSize: String(pageSize),
    });
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

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'> & { username?: string }): Promise<{
    user: User;
    temporaryPassword?: string;
  }> {
    const response = await this.post<{ user: User; temporaryPassword?: string }>('/users', userData);
    return handleApiResponse(response);
  }

  async updateUser(id: string, userData: Partial<User>, expectedVersion: number): Promise<User> {
    const response = await this.patch<User>(`/users/${id}`, {
      ...userData,
      expectedVersion,
    });
    return handleApiResponse(response);
  }

  async deleteUser(id: string, expectedVersion: number): Promise<{ id: string; version: number }> {
    const response = await this.delete<{ id: string; version: number }>(
      `/users/${id}?expectedVersion=${expectedVersion}`,
    );
    return handleApiResponse(response);
  }

  async performQuickAction(userId: string, payload: QuickActionPayload, expectedVersion: number): Promise<User> {
    const response = await this.post<User>(`/users/${userId}/actions`, {
      ...payload,
      expectedVersion,
    });
    return handleApiResponse(response);
  }

  async getArchivedUsers(): Promise<User[]> {
    const response = await this.get<User[]>('/users/archived');
    return handleApiResponse(response);
  }

  async restoreUser(id: string, expectedVersion: number): Promise<User> {
    const response = await this.post<User>(`/users/${id}/restore?expectedVersion=${expectedVersion}`);
    return handleApiResponse(response);
  }

  async getAuditLogs(targetUserId?: string): Promise<UserAuditLog[]> {
    const response = await this.get<UserAuditLog[]>('/users/audit-logs', {
      ...(targetUserId ? { targetUserId } : {}),
      limit: '100',
    });
    return handleApiResponse(response);
  }
}

export const userApiService = new UserApiService();


