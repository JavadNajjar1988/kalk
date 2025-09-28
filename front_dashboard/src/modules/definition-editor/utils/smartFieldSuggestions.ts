// Smart Field Suggestions based on field names and context
// پیشنهادات هوشمند فیلد بر اساس نام و زمینه

import type { FieldTemplate } from '../types/fieldTemplates';
import { FIELD_TEMPLATES, searchTemplates } from '../data/fieldTemplates';

interface FieldSuggestion {
  template: FieldTemplate;
  score: number;
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface SuggestionContext {
  nodeType?: string;
  existingFields?: string[];
  domain?: 'military' | 'personnel' | 'equipment' | 'general';
}

/**
 * الگوهای نام فیلد برای تشخیص خودکار نوع
 */
export const FIELD_NAME_PATTERNS = {
  // نام و هویت
  name: {
    patterns: ['نام', 'اسم', 'name', 'first.*name', 'last.*name', 'نام.*خانوادگی', 'نام.*کوچک'],
    suggestions: ['simple_text', 'name_split', 'full_name_dual'],
    weight: 0.9
  },
  
  // شماره تلفن
  phone: {
    patterns: ['تلفن', 'موبایل', 'phone', 'mobile', 'tel', 'شماره.*تماس', 'شماره.*تلفن'],
    suggestions: ['phone_field', 'phone_array'],
    weight: 0.95
  },
  
  // ایمیل
  email: {
    patterns: ['ایمیل', 'email', 'e-mail', 'پست.*الکترونیک'],
    suggestions: ['email_field'],
    weight: 0.95
  },
  
  // آدرس
  address: {
    patterns: ['آدرس', 'address', 'نشانی', 'محل.*سکونت', 'محل.*زندگی', 'منطقه', 'شهر', 'استان'],
    suggestions: ['hierarchical_address', 'address_array'],
    weight: 0.9
  },
  
  // کد ملی و شناسه
  nationalId: {
    patterns: ['کد.*ملی', 'شماره.*ملی', 'national.*id', 'شناسه.*ملی', 'کد.*پرسنلی', 'شماره.*شناسایی'],
    suggestions: ['conditional_national_id', 'numeric_text'],
    weight: 0.9
  },
  
  // رتبه و درجه
  rank: {
    patterns: ['رتبه', 'درجه', 'rank', 'سمت', 'مقام', 'پست', 'جایگاه'],
    suggestions: ['reference_military_rank'],
    weight: 0.85
  },
  
  // تجهیزات
  equipment: {
    patterns: ['تجهیز', 'equipment', 'سلاح', 'weapon', 'ابزار', 'وسیله', 'تجهیزات'],
    suggestions: ['reference_equipment'],
    weight: 0.85
  },
  
  // تاریخ
  date: {
    patterns: ['تاریخ', 'date', 'زمان', 'time', 'سال', 'year', 'ماه', 'month', 'روز', 'day'],
    suggestions: ['simple_date'],
    weight: 0.9
  },
  
  // متن انگلیسی
  englishText: {
    patterns: ['انگلیسی', 'english', 'latin', 'لاتین', '.*english.*', '.*latin.*'],
    suggestions: ['english_text'],
    weight: 0.8
  },
  
  // اعداد و کدها
  numericCode: {
    patterns: ['کد', 'code', 'شماره', 'number', 'عدد', 'digit', 'کد.*رهگیری', 'شماره.*پیگیری'],
    suggestions: ['numeric_text', 'simple_number'],
    weight: 0.7
  },
  
  // جنسیت
  gender: {
    patterns: ['جنسیت', 'gender', 'جنس'],
    suggestions: ['simple_selection'],
    weight: 0.95
  },
  
  // وضعیت
  status: {
    patterns: ['وضعیت', 'status', 'حالت', 'state', 'شرایط', 'موقعیت'],
    suggestions: ['simple_selection'],
    weight: 0.8
  },
  
  // تابعیت
  nationality: {
    patterns: ['تابعیت', 'nationality', 'ملیت', 'کشور', 'country'],
    suggestions: ['simple_selection'],
    weight: 0.9
  }
};

/**
 * پیشنهاد قالب‌های مناسب بر اساس نام فیلد
 */
export function suggestTemplatesByName(
  fieldName: string, 
  englishName?: string,
  context?: SuggestionContext
): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];
  const normalizedName = fieldName.toLowerCase();
  const normalizedEnglish = englishName?.toLowerCase() || '';
  
  // Check against patterns
  Object.entries(FIELD_NAME_PATTERNS).forEach(([category, config]) => {
    const matchScore = getPatternMatchScore(normalizedName, normalizedEnglish, config.patterns);
    
    if (matchScore > 0) {
      config.suggestions.forEach(templateId => {
        const template = FIELD_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          const score = matchScore * config.weight;
          const reasons = [`تطبیق با الگوی ${category}`, `امتیاز تطبیق: ${Math.round(score * 100)}%`];
          
          // Add context-based scoring
          const contextScore = getContextScore(template, context);
          const finalScore = (score + contextScore) / 2;
          
          if (contextScore > 0) {
            reasons.push(`سازگاری با زمینه: ${context?.domain || 'عمومی'}`);
          }
          
          suggestions.push({
            template,
            score: finalScore,
            reasons,
            confidence: finalScore > 0.8 ? 'high' : finalScore > 0.5 ? 'medium' : 'low'
          });
        }
      });
    }
  });
  
  // Sort by score and remove duplicates
  const uniqueSuggestions = suggestions
    .filter((suggestion, index, self) => 
      index === self.findIndex(s => s.template.id === suggestion.template.id)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 suggestions
  
  return uniqueSuggestions;
}

/**
 * محاسبه امتیاز تطبیق با الگوها
 */
function getPatternMatchScore(fieldName: string, englishName: string, patterns: string[]): number {
  let maxScore = 0;
  
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'i');
    
    // Check Persian name
    if (regex.test(fieldName)) {
      maxScore = Math.max(maxScore, 1.0);
    }
    
    // Check English name
    if (englishName && regex.test(englishName)) {
      maxScore = Math.max(maxScore, 1.0);
    }
    
    // Partial matches
    if (fieldName.includes(pattern.toLowerCase())) {
      maxScore = Math.max(maxScore, 0.7);
    }
    
    if (englishName && englishName.includes(pattern.toLowerCase())) {
      maxScore = Math.max(maxScore, 0.7);
    }
  });
  
  return maxScore;
}

/**
 * محاسبه امتیاز بر اساس زمینه
 */
function getContextScore(template: FieldTemplate, context?: SuggestionContext): number {
  if (!context) return 0;
  
  let score = 0;
  
  // Domain-based scoring
  if (context.domain) {
    if (context.domain === 'military') {
      if (template.tags.includes('نظامی') || template.tags.includes('رتبه') || template.id.includes('military')) {
        score += 0.3;
      }
    }
    
    if (context.domain === 'personnel') {
      if (template.tags.includes('شخصی') || template.tags.includes('نام') || template.category === 'validation') {
        score += 0.2;
      }
    }
    
    if (context.domain === 'equipment') {
      if (template.tags.includes('تجهیزات') || template.category === 'reference') {
        score += 0.2;
      }
    }
  }
  
  // Existing fields compatibility
  if (context.existingFields && context.existingFields.length > 0) {
    const hasRelatedFields = context.existingFields.some(field => 
      template.examples.some(example => 
        field.toLowerCase().includes(example.toLowerCase())
      )
    );
    
    if (hasRelatedFields) {
      score += 0.1;
    }
  }
  
  return Math.min(score, 1.0);
}

/**
 * پیشنهاد قالب‌های مکمل بر اساس فیلدهای موجود
 */
export function suggestComplementaryTemplates(
  existingFields: string[],
  context?: SuggestionContext
): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];
  
  // Common field combinations
  const combinations = [
    {
      trigger: ['نام', 'name'],
      suggest: ['phone_field', 'email_field'],
      reason: 'فیلدهای مکمل اطلاعات شخصی'
    },
    {
      trigger: ['تلفن', 'phone'],
      suggest: ['hierarchical_address'],
      reason: 'آدرس معمولاً با اطلاعات تماس همراه است'
    },
    {
      trigger: ['آدرس', 'address'],
      suggest: ['phone_field'],
      reason: 'شماره تماس معمولاً با آدرس همراه است'
    },
    {
      trigger: ['رتبه', 'rank'],
      suggest: ['reference_equipment'],
      reason: 'تجهیزات مرتبط با رتبه نظامی'
    },
    {
      trigger: ['تابعیت', 'nationality'],
      suggest: ['conditional_national_id'],
      reason: 'کد ملی شرطی بر اساس تابعیت'
    }
  ];
  
  const existingFieldsStr = existingFields.join(' ').toLowerCase();
  
  combinations.forEach(combo => {
    const hasTriggrer = combo.trigger.some(trigger => 
      existingFieldsStr.includes(trigger.toLowerCase())
    );
    
    if (hasTriggrer) {
      combo.suggest.forEach(templateId => {
        const template = FIELD_TEMPLATES.find(t => t.id === templateId);
        if (template) {
          // Check if this type already exists
          const alreadyExists = existingFields.some(field => 
            template.examples.some(example => 
              field.toLowerCase().includes(example.toLowerCase())
            )
          );
          
          if (!alreadyExists) {
            suggestions.push({
              template,
              score: 0.7,
              reasons: [combo.reason, 'پیشنهاد بر اساس فیلدهای موجود'],
              confidence: 'medium'
            });
          }
        }
      });
    }
  });
  
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * جستجوی هوشمند قالب‌ها
 */
export function smartTemplateSearch(
  query: string,
  context?: SuggestionContext
): FieldSuggestion[] {
  // First try direct search
  const directResults = searchTemplates(query);
  
  // Then try name-based suggestions
  const nameSuggestions = suggestTemplatesByName(query, undefined, context);
  
  // Combine and deduplicate
  const allSuggestions = new Map<string, FieldSuggestion>();
  
  // Add direct results with high confidence
  directResults.forEach(template => {
    if (!allSuggestions.has(template.id)) {
      allSuggestions.set(template.id, {
        template,
        score: 0.9,
        reasons: ['تطبیق مستقیم با جستجو'],
        confidence: 'high'
      });
    }
  });
  
  // Add name-based suggestions
  nameSuggestions.forEach(suggestion => {
    if (!allSuggestions.has(suggestion.template.id)) {
      allSuggestions.set(suggestion.template.id, suggestion);
    }
  });
  
  return Array.from(allSuggestions.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

/**
 * تحلیل فیلد موجود و پیشنهاد بهبود
 */
export function analyzeFieldForImprovement(fieldName: string, fieldType: string): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];
  
  // Suggest upgrades for basic field types
  const upgrades: Record<string, string[]> = {
    'text': ['english_text', 'numeric_text'],
    'phone': ['phone_array'],
    'address': ['hierarchical_address'],
    'select': ['reference_military_rank', 'reference_equipment']
  };
  
  const upgradeOptions = upgrades[fieldType];
  if (upgradeOptions) {
    upgradeOptions.forEach(templateId => {
      const template = FIELD_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        suggestions.push({
          template,
          score: 0.6,
          reasons: [`ارتقاء از ${fieldType}`, 'قابلیت‌های بیشتر'],
          confidence: 'medium'
        });
      }
    });
  }
  
  return suggestions;
}

export default {
  suggestTemplatesByName,
  suggestComplementaryTemplates,
  smartTemplateSearch,
  analyzeFieldForImprovement,
  FIELD_NAME_PATTERNS
};