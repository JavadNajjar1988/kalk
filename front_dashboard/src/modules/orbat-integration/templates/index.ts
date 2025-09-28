/**
 * Templates Index - Export all template components
 */

// Export layouts
export { default as ResponsiveProvider } from './layouts/ResponsiveLayoutSystem';
export { default as OrbatMasterLayout } from './layouts/OrbatMasterLayout';

// Export dashboards
export { default as OrbatDashboardTemplate } from './dashboards/OrbatDashboardTemplate';

// Export panels
export { default as ConfigurationPanel } from './panels/ConfigurationPanel';

// Export themes
export { default as OrbatThemeSystem } from './themes/OrbatThemeSystem';

// Export template components
export * from './components/TemplateComponents';