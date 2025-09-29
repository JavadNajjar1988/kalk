/**
 * Smart Field Builder Module Index
 * Central export for all Smart Field Builder components and utilities
 */

// Main Smart Field Builder component
// Provide a neutral stub to satisfy existing imports without enabling functionality
import React from 'react';

export const SmartFieldBuilder: React.FC<any> = () => null;

// Components
export { default as BuilderModeSelector } from './components/BuilderModeSelector';
export { BuilderMode } from './components/BuilderModeSelector';
export { default as GuidedWizard } from './components/wizard/GuidedWizard';
export { default as TemplateSelector } from './components/templates/TemplateSelector';
export { default as TemplateCustomizer } from './components/templates/TemplateCustomizer';

// Wizard steps
export { default as BaseTypeStep } from './components/wizard/steps/BaseTypeStep';
export { default as EnhancementsStep } from './components/wizard/steps/EnhancementsStep';
export { default as DataSourceStep } from './components/wizard/steps/DataSourceStep';
export { default as PreviewStep } from './components/wizard/steps/PreviewStep';

// Store
// Slice exports disabled intentionally

// Types
export * from './types';

// Hooks (to be implemented)
// export { useSmartFieldBuilder } from './hooks/useSmartFieldBuilder';
// export { useTemplateManager } from './hooks/useTemplateManager';
// export { useEnhancementSuggestions } from './hooks/useEnhancementSuggestions';

// Utils (to be implemented)
// export * from './utils/fieldConfigGenerator';
// export * from './utils/enhancementEngine';
// export * from './utils/templateEngine';