/**
 * Scenario Types for Landing Page
 * انواع داده‌های سناریو برای صفحه فرود
 */

// Base scenario metadata compatible with ORBAT
export interface ScenarioMetadata {
  id: string;
  name: string;
  description?: string;
  created: Date | string;
  modified: Date | string;
  imageUrl?: string;
  summary?: string;
  type?: 'ORBAT-mapper' | 'custom';
  version?: string;
}

// Demo scenario structure (for static scenarios)
export interface DemoScenario {
  id: string;
  name: string;
  summary: string;
  imageUrl: string;
}

// Scenario actions available in UI
export type ScenarioAction = 'open' | 'delete' | 'download' | 'duplicate' | 'edit' | 'run';

// Scenario loading source
export type ScenarioSource = 'local' | 'url' | 'file' | 'demo';

// Landing page view state
export interface LandingPageState {
  scenarios: ScenarioMetadata[];
  demoScenarios: DemoScenario[];
  isLoading: boolean;
  error: string | null;
  sortBy: 'name' | 'modified' | 'created';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  selectedScenarios: string[];
}

// Sort options for dropdown
export interface SortOption {
  label: string;
  value: string;
  action?: () => void;
  active?: boolean;
  disabled?: boolean;
}

// File upload result
export interface UploadResult {
  success: boolean;
  scenario?: ScenarioMetadata;
  error?: string;
}

// Loading from URL result
export interface UrlLoadResult {
  success: boolean;
  scenario?: ScenarioMetadata;
  error?: string;
}