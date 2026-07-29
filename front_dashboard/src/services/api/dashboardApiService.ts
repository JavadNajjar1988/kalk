import { BaseApiClient, handleApiResponse } from './baseApiClient';

export type DashboardCardKey =
  | 'archived_scenarios'
  | 'available_forces'
  | 'ongoing_operations'
  | 'security_alerts'
  | 'recent_activities'
  | 'system_status'
  | 'important_notices'
  | 'active_users_24h'
  | 'failed_logins_24h'
  | 'storage_usage'
  | 'healthy_services'
  | 'user_activity_chart';

export type DashboardWidgetId =
  | 'continue_latest_kalk'
  | 'scenario_overview'
  | 'recent_scenarios'
  | 'quick_access'
  | DashboardCardKey;

export interface DashboardLayoutItem {
  i: DashboardWidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardWorkspace {
  version: number;
  layouts: Record<string, DashboardLayoutItem[]>;
  hiddenWidgetIds: DashboardWidgetId[];
}

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
  scenarioOverview: { total: number; draft: number; readyForReview: number; archived: number };
  latestScenario: DashboardScenarioCard | null;
  recentScenarios: DashboardScenarioCard[];
  managementMetrics: {
    activeUsers24h: number;
    failedLogins24h: number;
    storage: {
      usedBytes: number;
      totalBytes: number;
      freeBytes: number;
      percent: number;
    } | null;
    services: {
      healthy: number;
      total: number;
      items: Array<{
        key: string;
        name: string;
        healthy: boolean;
        latencyMs: number | null;
      }>;
    };
    userActivity: Array<{
      userId: string;
      name: string;
      created: number;
      changed: number;
    }>;
    activityWindowDays: number;
  } | null;
}

export interface DashboardScenarioCard {
  id: string;
  name: string;
  description: string;
  image: string | null;
  status: string;
  modifiedAt: string;
  archivedAt: string | null;
  contentStats: {
    units: number;
    events: number;
    features: number;
    layers: number;
    conditions: number;
    storyboardScenes: number;
  };
  mapPreview: {
    baseMapId: string;
    center: [number, number];
    zoom: number;
    snapshotUrl: string | null;
    features: Array<Record<string, unknown>>;
    truncated: boolean;
  };
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

  async getWorkspace(): Promise<DashboardWorkspace> {
    return handleApiResponse(await this.get<DashboardWorkspace>('/dashboard/workspace'));
  }

  async saveWorkspace(workspace: DashboardWorkspace): Promise<DashboardWorkspace> {
    return handleApiResponse(
      await this.put<DashboardWorkspace>('/dashboard/workspace', workspace),
    );
  }
}

export const dashboardApiService = new DashboardApiService();
