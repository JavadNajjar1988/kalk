// Security Module Exports
// Central export file for all security-related components and utilities

// Validation System
export {
  SecurityValidator,
  ValidationSchemas,
  useInputValidation,
  createValidationSchema,
  CoordinateSchema,
  SIDCSchema,
  UnitTypeSchema,
  UnitStatusSchema,
  OrbatUnitSchema,
  OrbatEventSchema,
  OrbatScenarioSchema
} from './ValidationSystem';

// Security Middleware
export {
  SecurityProvider,
  SecurityGuard,
  RequestSecurityMiddleware,
  useSecurityMiddleware,
  useSecurityGuard
} from './SecurityMiddleware';

export type {
  SecurityUser,
  SecuritySession,
  SecurityConfig
} from './SecurityMiddleware';

// Data Integrity Validation
export {
  DataIntegrityValidator,
  DataConsistencyManager,
  useDataIntegrity
} from './DataIntegrityValidator';

export type {
  DataIntegrityResult,
  DataConsistencyCheck,
  DataSyncState,
  DataConflict
} from './DataIntegrityValidator';

// Secure Communication
export {
  SecureCommunicationManager,
  useSecureCommunication
} from './SecureCommunication';

export type {
  SecureMessage,
  CommunicationChannel,
  SecurityHeaders
} from './SecureCommunication';

// Audit Logging and Monitoring
export {
  AuditLogger,
  MonitoringProvider,
  useMonitoring,
  useAuditLogger
} from './AuditLogger';

export type {
  AuditLogEntry,
  SecurityMetrics,
  SecurityAlert,
  MonitoringConfig
} from './AuditLogger';

// Security Policy Management
export {
  SecurityPolicyManager,
  SecurityPolicyProvider,
  useSecurityPolicy
} from './SecurityPolicyManager';

export type {
  SecurityPolicy,
  SecurityRule,
  PolicyViolation,
  SecurityConfiguration
} from './SecurityPolicyManager';

// Complete Security Suite Provider
export const SecuritySuiteProvider: React.FC<{
  children: React.ReactNode;
  securityConfig?: Partial<SecurityConfig>;
  monitoringConfig?: Partial<MonitoringConfig>;
  policyConfig?: Partial<SecurityConfiguration>;
}> = ({ 
  children, 
  securityConfig = {}, 
  monitoringConfig = {},
  policyConfig = {}
}) => {
  return (
    <SecurityProvider config={securityConfig}>
      <MonitoringProvider config={monitoringConfig}>
        <SecurityPolicyProvider config={policyConfig}>
          {children}
        </SecurityPolicyProvider>
      </MonitoringProvider>
    </SecurityProvider>
  );
};

// Security utilities
export const SecurityUtils = {
  // Generate secure random string
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Validate password strength
  validatePasswordStrength: (password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    return {
      score,
      feedback,
      isValid: score >= 4
    };
  },

  // Check for common security vulnerabilities
  securityHealthCheck: (): {
    score: number;
    issues: string[];
    recommendations: string[];
  } => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check if running over HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('Application is not served over HTTPS');
      recommendations.push('Enable HTTPS for production deployment');
      score -= 20;
    }

    // Check for secure storage
    try {
      localStorage.setItem('security_test', 'test');
      localStorage.removeItem('security_test');
    } catch (error) {
      issues.push('Local storage is not available');
      recommendations.push('Ensure secure storage is available for session management');
      score -= 10;
    }

    // Check for WebCrypto API
    if (!window.crypto || !window.crypto.subtle) {
      issues.push('Web Crypto API is not available');
      recommendations.push('Use modern browser that supports Web Crypto API');
      score -= 15;
    }

    return { score, issues, recommendations };
  }
};

export default SecuritySuiteProvider;