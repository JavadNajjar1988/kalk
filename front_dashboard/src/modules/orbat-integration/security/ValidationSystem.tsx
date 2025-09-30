import { z } from 'zod';
import DOMPurify from 'dompurify';

// Validation schemas for ORBAT data types
export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  alt: z.number().optional()
});

export const SIDCSchema = z.string().regex(/^[A-Z0-9]{15}$/, 'Invalid SIDC format');

export const UnitTypeSchema = z.enum([
  'INFANTRY', 'ARMOR', 'ARTILLERY', 'AVIATION', 'NAVAL', 
  'ENGINEER', 'LOGISTICS', 'MEDICAL', 'COMMUNICATION', 'OTHER'
]);

export const UnitStatusSchema = z.enum([
  'ACTIVE', 'INACTIVE', 'DESTROYED', 'DAMAGED', 'MAINTENANCE'
]);

export const OrbatUnitSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  unitType: UnitTypeSchema,
  sidc: SIDCSchema,
  position: CoordinateSchema,
  status: UnitStatusSchema,
  parent: z.string().uuid().optional(),
  children: z.array(z.string().uuid()).optional(),
  properties: z.record(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const OrbatEventSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['MOVEMENT', 'ENGAGEMENT', 'STATUS_CHANGE', 'COMMUNICATION', 'OTHER']),
  unitId: z.string().uuid(),
  description: z.string().min(1).max(500),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  location: CoordinateSchema.optional(),
  properties: z.record(z.string()).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
});

export const OrbatScenarioSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  }).optional(),
  properties: z.record(z.string()).optional(),
  units: z.array(OrbatUnitSchema).optional(),
  events: z.array(OrbatEventSchema).optional()
});

// Security validation utilities
export class SecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|\/\*|\*\/|;|'|")/g,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi
  ];

  private static readonly XSS_PATTERNS = [
    /<[^>]*>/g,
    /&[#\w]+;/g,
    /[\x00-\x1F\x7F-\x9F]/g
  ];

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick']
    });
  }

  /**
   * Validate and sanitize text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    
    // Remove dangerous patterns
    let sanitized = input;
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Remove potential XSS
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Trim and limit length
    sanitized = sanitized.trim().substring(0, maxLength);
    
    return sanitized;
  }

  /**
   * Check for SQL injection patterns
   */
  static validateSqlInjection(input: string): boolean {
    if (typeof input !== 'string') return true;
    
    return !this.SQL_INJECTION_PATTERNS.some(pattern => 
      pattern.test(input)
    );
  }

  /**
   * Validate URL safety
   */
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate coordinate bounds
   */
  static validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Validate SIDC format (MIL-STD-2525)
   */
  static validateSIDC(sidc: string): boolean {
    if (typeof sidc !== 'string' || sidc.length !== 15) return false;
    return /^[A-Z0-9]{15}$/.test(sidc);
  }
}

// Input validation hook
export const useInputValidation = () => {
  const validateUnit = (unit: any) => {
    try {
      return {
        success: true,
        data: OrbatUnitSchema.parse(unit)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof z.ZodError ? error.errors : 'Validation failed'
      };
    }
  };

  const validateEvent = (event: any) => {
    try {
      return {
        success: true,
        data: OrbatEventSchema.parse(event)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof z.ZodError ? error.errors : 'Validation failed'
      };
    }
  };

  const validateScenario = (scenario: any) => {
    try {
      return {
        success: true,
        data: OrbatScenarioSchema.parse(scenario)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof z.ZodError ? error.errors : 'Validation failed'
      };
    }
  };

  const sanitizeInput = (input: string, type: 'text' | 'html' = 'text') => {
    switch (type) {
      case 'html':
        return SecurityValidator.sanitizeHtml(input);
      case 'text':
      default:
        return SecurityValidator.sanitizeText(input);
    }
  };

  return {
    validateUnit,
    validateEvent,
    validateScenario,
    sanitizeInput,
    SecurityValidator
  };
};

// Form validation helpers
export const createValidationSchema = <T,>(schema: z.ZodSchema<T>) => {
  return {
    validate: (data: unknown) => {
      try {
        const result = schema.parse(data);
        return { success: true, data: result, errors: null };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            data: null,
            errors: error.errors.reduce((acc, err) => {
              const path = err.path.join('.');
              acc[path] = err.message;
              return acc;
            }, {} as Record<string, string>)
          };
        }
        return {
          success: false,
          data: null,
          errors: { _root: 'Validation failed' }
        };
      }
    },
    
    validateField: (field: string, value: unknown) => {
      try {
        const fieldSchema = schema.shape?.[field];
        if (!fieldSchema) return { success: true, error: null };
        
        fieldSchema.parse(value);
        return { success: true, error: null };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.errors[0]?.message || 'Validation failed'
          };
        }
        return { success: false, error: 'Validation failed' };
      }
    }
  };
};

// Export validation schemas
export const ValidationSchemas = {
  Unit: OrbatUnitSchema,
  Event: OrbatEventSchema,
  Scenario: OrbatScenarioSchema,
  Coordinate: CoordinateSchema,
  SIDC: SIDCSchema,
  UnitType: UnitTypeSchema,
  UnitStatus: UnitStatusSchema
};

export default SecurityValidator;