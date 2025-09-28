/**
 * Landing Page Specific Types
 * انواع داده‌های مخصوص صفحه فرود
 */

import { ScenarioMetadata, DemoScenario, SortOption } from './scenario';

// Props for main landing page component
export interface ScenarioLandingPageProps {
  className?: string;
  onScenarioSelect?: (scenarioId: string) => void;
  onScenarioAction?: (action: string, scenarioId: string) => void;
  initialScenarios?: ScenarioMetadata[];
  showDemoScenarios?: boolean;
  enableUpload?: boolean;
  enableUrlLoad?: boolean;
}

// Props for scenario card component
export interface ScenarioCardProps {
  scenario: ScenarioMetadata;
  onAction: (action: string) => void;
  onSelect?: () => void;
  selected?: boolean;
  showActions?: boolean;
  dense?: boolean;
}

// Props for demo scenario card
export interface DemoScenarioCardProps {
  scenario: DemoScenario;
  onClick: () => void;
  dense?: boolean;
}

// Props for scenario grid
export interface ScenarioGridProps {
  scenarios: ScenarioMetadata[];
  demoScenarios?: DemoScenario[];
  onScenarioAction: (action: string, scenarioId: string) => void;
  onDemoScenarioSelect: (scenarioId: string) => void;
  onNewScenario: () => void;
  onUploadScenario?: (file: File) => void;
  onLoadFromUrl?: (url: string) => void;
  loading?: boolean;
  sortOptions?: SortOption[];
  onSortChange?: (sortBy: string) => void;
  className?: string;
}

// Props for scenario uploader
export interface ScenarioUploaderProps {
  onUpload: (file: File) => void;
  onUrlLoad?: (url: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
  variant?: 'file' | 'url' | 'both';
  acceptedTypes?: string[];
}

// Props for scenario toolbar
export interface ScenarioToolbarProps {
  onNewScenario: () => void;
  onSearch?: (query: string) => void;
  onSort?: (sortBy: string) => void;
  sortOptions?: SortOption[];
  searchValue?: string;
  className?: string;
  showSearch?: boolean;
  showSort?: boolean;
}

// Scenario grid section props
export interface ScenarioSectionProps {
  title: string;
  scenarios?: ScenarioMetadata[];
  demoScenarios?: DemoScenario[];
  onScenarioAction?: (action: string, scenarioId: string) => void;
  onDemoSelect?: (scenarioId: string) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}