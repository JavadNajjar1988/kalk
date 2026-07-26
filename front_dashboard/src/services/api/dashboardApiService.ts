import { BaseApiClient, handleApiResponse } from './baseApiClient';

export type DashboardCardKey =
  | 'archived_scenarios'
  | 'available_forces'
  | 'ongoing_operations'
  | 'security_alerts'
  | 'recent_activities'
  | 'system_status'
  | 'important_notices';

export interface DashboardSummary {
  generatedAt: string;
  role: string;
  visibleCards: DashboardCardKey[];
  scenarioStats: { total: number; active: number; archived: number; ready: number; completed: number };
  forceStats: { total: number; iranian: number; foreign: number };
  operationStats: { total: number; active: number; ready: number; completed: number };
  alertStats: { total: number; failedLogins: number; lockedAccounts: number; inactiveAccounts: number };
  resourceStats: { total: number; byType: Record<string, number> };
  activities: Array<{ id: string; kind: string; title: string; description: string; occurredAt: string }>;
  systemStatus: Array<{ key: 'cpu' | 'ram' | 'disk' | 'network'; name: string; value: number; color: 'success' | 'warning' | 'error' }>;
  notices: Array<{ severity: 'success' | 'info' | 'warning' | 'error'; message: string }>;
}

class DashboardApiService extends BaseApiClient {
  constructor() {
    super(((import.meta as any).env?.VITE_API_URL as string) || '/api');
  }

  protected override getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getSummary(): Promise<DashboardSummary> {
    return handleApiResponse(await this.get<DashboardSummary>('/dashboard/summary'));
  }
}

export const dashboardApiService = new DashboardApiService();

