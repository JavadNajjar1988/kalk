/**
 * New Scenario Types
 * انواع داده‌های مخصوص صفحه ایجاد سناریوی جدید
 */

// Symbology standards (مطابق با Vue)
export type SymbologyStandard = 'app6' | '2525';

export interface SymbologyStandardOption {
  value: SymbologyStandard;
  name: string;
  description: string;
}

// Root unit configuration
export interface RootUnitConfig {
  rootUnitName?: string;
  rootUnitSidc?: string;
  rootUnitEchelon?: string;
  rootUnitIcon?: string;
}

// Side data with symbol options
export interface InitialSideData {
  name: string;
  standardIdentity: string;
  symbolOptions: {
    fillColor?: string;
    [key: string]: any;
  };
  units: RootUnitConfig[];
}

// Main form data structure
export interface NewScenarioFormData {
  // Basic info
  name: string;
  description: string;
  
  // ORBAT configuration
  noInitialOrbat: boolean;
  sides: InitialSideData[];
  
  // Time settings
  timeZone: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  
  // Symbology
  symbologyStandard: SymbologyStandard;
}

// Form validation errors
export interface NewScenarioFormErrors {
  name?: string;
  description?: string;
  timeZone?: string;
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  sides?: {
    [sideIndex: number]: {
      name?: string;
      units?: {
        [unitIndex: number]: {
          rootUnitName?: string;
          rootUnitEchelon?: string;
          rootUnitIcon?: string;
        };
      };
    };
  };
}

// Creation result
export interface ScenarioCreationResult {
  success: boolean;
  scenarioId?: string;
  error?: string;
}

// Page props
export interface NewScenarioPageProps {
  onScenarioCreated?: (scenarioId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<NewScenarioFormData>;
}

// Form step configuration
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  isValid: boolean;
  isOptional?: boolean;
}

// Symbol preview data
export interface SymbolPreviewData {
  sidc: string;
  standardIdentity: string;
  echelon: string;
  icon: string;
  fillColor?: string;
}

// Icon option for dropdown
export interface IconOption {
  code: string;
  text: string;
  sidc: string;
}

// Echelon option for dropdown  
export interface EchelonOption {
  code: string;
  text: string;
  sidc: string;
}