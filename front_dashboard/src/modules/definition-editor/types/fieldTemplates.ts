// Field Template Gallery Types
// قالب‌های آماده برای انواع مختلف فیلدها

import type { FieldConstructorConfig } from './fieldConstructor';

export interface FieldTemplate {
  id: string;
  name: string;                    // نام فارسی قالب
  englishName: string;             // نام انگلیسی قالب
  description: string;             // توضیح کاربرد
  category: FieldTemplateCategory; // دسته‌بندی قالب
  icon: string;                    // نام آیکون Material-UI
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // سطح پیچیدگی
  tags: string[];                  // برچسب‌های جستجو
  config: FieldConstructorConfig; // تنظیمات فیلد
  examples: string[];              // مثال‌های کاربرد
  preview?: {
    sampleData?: any;             // نمونه داده برای پیش‌نمایش
    description?: string;         // توضیح پیش‌نمایش
  };
}

export type FieldTemplateCategory = 
  | 'basic'           // فیلدهای پایه
  | 'text'           // فیلدهای متنی
  | 'numeric'        // فیلدهای عددی  
  | 'validation'     // فیلدهای با اعتبارسنجی
  | 'array'          // فیلدهای آرایه‌ای
  | 'hierarchical'   // فیلدهای سلسله‌مراتبی
  | 'reference'      // فیلدهای مرجع
  | 'composite'      // فیلدهای مرکب
  | 'specialized';   // فیلدهای تخصصی

export interface TemplateGalleryConfig {
  showCategories: FieldTemplateCategory[];
  showDifficulty: boolean;
  showTags: boolean;
  defaultCategory?: FieldTemplateCategory;
  searchEnabled: boolean;
  previewEnabled: boolean;
}

// Popular Templates - قالب‌های محبوب
export const POPULAR_TEMPLATES = [
  'simple_text',
  'english_text',
  'phone_array',
  'hierarchical_address',
  'reference_military_rank',
  'conditional_national_id'
];

// Category Icons
export const CATEGORY_ICONS: Record<FieldTemplateCategory, string> = {
  basic: 'Dashboard',
  text: 'TextFields',
  numeric: 'Numbers',
  validation: 'VerifiedUser',
  array: 'ViewArray',
  hierarchical: 'AccountTree',
  reference: 'Link',
  composite: 'Merge',
  specialized: 'Engineering'
};

// Category Labels
export const CATEGORY_LABELS: Record<FieldTemplateCategory, string> = {
  basic: 'فیلدهای پایه',
  text: 'فیلدهای متنی',
  numeric: 'فیلدهای عددی',
  validation: 'اعتبارسنجی',
  array: 'آرایه‌ای',
  hierarchical: 'سلسله‌مراتبی',
  reference: 'مرجع',
  composite: 'مرکب',
  specialized: 'تخصصی'
};

// Difficulty Colors
export const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800', 
  advanced: '#F44336'
};

// Difficulty Labels
export const DIFFICULTY_LABELS = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته'
};