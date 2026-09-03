import { BaseApiClient, handleApiResponse } from './baseApiClient';

export type ResourceType =
  | 'personnel'
  | 'equipment'
  | 'units'
  | 'ammunition'
  | 'logistics'
  | 'ranks'
  | 'maps';

export interface ResourceMediaDto {
  id: string;
  resource_id?: string | null;
  filename: string;
  content_type?: string | null;
  file_size?: number | null;
  caption?: string | null;
  credits?: string | null;
  credits_url?: string | null;
  url: string;
  created_at: string;
}

export interface ResourceDto {
  id: string;
  type: ResourceType;
  name: string;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  media_files: ResourceMediaDto[];
}

export interface ResourceSearchResultDto {
  id: string;
  type: ResourceType;
  name: string;
  code?: string | null;
  description?: string | null;
}

function resolveBaseUrl(): string {
  const envBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envBase && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, '');
  }
  const apiPathEnv = (import.meta as any).env?.VITE_API_PATH as string | undefined;
  const apiPath =
    apiPathEnv && apiPathEnv.trim().length > 0
      ? apiPathEnv.trim().replace(/^\/+/, '')
      : 'api';
  const isDev = import.meta.env.DEV;
  if (isDev) {
    const devHost = (import.meta as any).env?.VITE_API_DEV_HOST as
      | string
      | undefined;
    const defaultDevHost =
      typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5180';
    return `${(devHost && devHost.trim()) || defaultDevHost}/${apiPath}`.replace(
      /\/+$/,
      '',
    );
  }
  if (typeof window !== 'undefined' && window.parent !== window) {
    const parentOriginEnv = (import.meta as any).env?.VITE_PARENT_ORIGIN as
      | string
      | undefined;
    const parentOrigin =
      parentOriginEnv && parentOriginEnv.trim().length > 0
        ? parentOriginEnv.trim()
        : document.referrer
          ? new URL(document.referrer).origin
          : window.location.origin;
    return `${parentOrigin.replace(/\/+$/, '')}/${apiPath}`;
  }
  return `${(typeof window !== 'undefined' ? window.location.origin : '').replace(/\/+$/, '')}/${apiPath}`;
}

export class ResourceApiService extends BaseApiClient {
  private apiBase: string;

  constructor() {
    const base = resolveBaseUrl();
    super(base);
    this.apiBase = base;
  }

  /** آدرس مستقیم فایل تصویر منبع برای استفاده در img.src */
  buildMediaUrl(mediaId: string): string {
    return `${this.apiBase}/resources/media/${encodeURIComponent(mediaId)}/file`;
  }

  async search(
    q: string,
    type?: ResourceType,
    limit = 20,
  ): Promise<ResourceSearchResultDto[]> {
    const qq = (q ?? '').trim();
    if (!qq) return [];
    const params = new URLSearchParams({ q: qq, limit: String(limit) });
    if (type) params.set('type', type);
    const res = await super.get<ResourceSearchResultDto[]>(
      `/resources/search?${params.toString()}`,
    );
    return handleApiResponse(res);
  }

  async list(opts: {
    type?: ResourceType;
    search?: string;
    limit?: number;
  } = {}): Promise<{ items: ResourceDto[]; total: number }> {
    const params = new URLSearchParams();
    if (opts.type) params.set('type', opts.type);
    if (opts.search) params.set('search', opts.search);
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const res = await super.get<{ items: ResourceDto[]; total: number }>(
      `/resources${qs ? `?${qs}` : ''}`,
    );
    return handleApiResponse(res);
  }

  async getById(id: string): Promise<ResourceDto> {
    const res = await super.get<ResourceDto>(
      `/resources/${encodeURIComponent(id)}`,
    );
    return handleApiResponse(res);
  }

  async getMediaMeta(mediaId: string): Promise<ResourceMediaDto> {
    const res = await super.get<ResourceMediaDto>(
      `/resources/media/${encodeURIComponent(mediaId)}`,
    );
    return handleApiResponse(res);
  }

  /** آپلود فایل تصویر و دریافت ResourceMediaDto. اختیاری می‌تواند به یک منبع مرجع متصل شود. */
  async uploadMedia(
    file: File,
    options: {
      resourceId?: string;
      caption?: string;
      credits?: string;
      creditsUrl?: string;
    } = {},
  ): Promise<ResourceMediaDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (options.resourceId) formData.append('resource_id', options.resourceId);
    if (options.caption) formData.append('caption', options.caption);
    if (options.credits) formData.append('credits', options.credits);
    if (options.creditsUrl) formData.append('credits_url', options.creditsUrl);
    const res = await this.postForm<ResourceMediaDto>(
      '/resources/media/upload',
      formData,
    );
    return handleApiResponse(res);
  }
}

export const resourceApiService = new ResourceApiService();
export default resourceApiService;
