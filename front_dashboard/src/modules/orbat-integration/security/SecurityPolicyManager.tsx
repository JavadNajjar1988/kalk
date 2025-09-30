import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SecurityUser } from './SecurityMiddleware';

// Security policy interfaces
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  rules: SecurityRule[];
  enforcement: 'STRICT' | 'MODERATE' | 'LENIENT';
  scope: 'GLOBAL' | 'MODULE' | 'USER';
}

export interface SecurityRule {
  id: string;
  name: string;
  type: 'ACCESS_CONTROL' | 'DATA_VALIDATION' | 'COMMUNICATION' | 'AUTHENTICATION' | 'AUDIT';
  condition: string;
  action: 'ALLOW' | 'DENY' | 'LOG' | 'ALERT' | 'REQUIRE_APPROVAL';
  parameters: Record<string, any>;
  priority: number;
  isEnabled: boolean;
  description?: string;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  ruleId: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  handled: boolean;
  response?: string;
}

export interface SecurityConfiguration {
  // Authentication settings
  authentication: {
    enabled: boolean;
    sessionTimeout: number;
    maxSessions: number;
    requireMFA: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
      expirationDays: number;
    };
  };
  
  // Authorization settings
  authorization: {
    enabled: boolean;
    defaultRole: string;
    inheritParentPermissions: boolean;
    enableRoleBasedAccess: boolean;
    enableAttributeBasedAccess: boolean;
  };
  
  // Data protection settings
  dataProtection: {
    enableEncryption: boolean;
    encryptionAlgorithm: string;
    enableDataMasking: boolean;
    enableDataClassification: boolean;
    retentionPeriodDays: number;
  };
  
  // Communication security
  communication: {
    enforceHTTPS: boolean;
    allowedOrigins: string[];
    enableMessageEncryption: boolean;
    messageTimeout: number;
    maxMessageSize: number;
  };
  
  // Audit and monitoring
  audit: {
    enableAuditLogging: boolean;
    logLevel: 'BASIC' | 'DETAILED' | 'VERBOSE';
    enableRealTimeMonitoring: boolean;
    enableAlerts: boolean;
    retentionDays: number;
  };
  
  // Compliance settings
  compliance: {
    framework: 'NONE' | 'ISO27001' | 'NIST' | 'GDPR' | 'CUSTOM';
    enableComplianceChecks: boolean;
    reportingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    enableAutomaticRemediation: boolean;
  };
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfiguration = {
  authentication: {
    enabled: true,
    sessionTimeout: 60,
    maxSessions: 5,
    requireMFA: false,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
      expirationDays: 90
    }
  },
  authorization: {
    enabled: true,
    defaultRole: 'USER',
    inheritParentPermissions: true,
    enableRoleBasedAccess: true,
    enableAttributeBasedAccess: false
  },
  dataProtection: {
    enableEncryption: true,
    encryptionAlgorithm: 'AES-256',
    enableDataMasking: true,
    enableDataClassification: true,
    retentionPeriodDays: 365
  },
  communication: {
    enforceHTTPS: true,
    allowedOrigins: ['http://localhost:5173', 'https://localhost:5173'],
    enableMessageEncryption: true,
    messageTimeout: 30000,
    maxMessageSize: 1048576 // 1MB
  },
  audit: {
    enableAuditLogging: true,
    logLevel: 'DETAILED',
    enableRealTimeMonitoring: true,
    enableAlerts: true,
    retentionDays: 90
  },
  compliance: {
    framework: 'NIST',
    enableComplianceChecks: true,
    reportingFrequency: 'WEEKLY',
    enableAutomaticRemediation: false
  }
};

// Default security policies
const DEFAULT_POLICIES: SecurityPolicy[] = [
  {
    id: 'default-access-policy',
    name: 'Default Access Control Policy',
    description: 'Standard access control rules for ORBAT integration',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isActive: true,
    enforcement: 'STRICT',
    scope: 'GLOBAL',
    rules: [
      {
        id: 'auth-required',
        name: 'Authentication Required',
        type: 'ACCESS_CONTROL',
        condition: 'user.isAuthenticated === false',
        action: 'DENY',
        parameters: { message: 'Authentication required' },
        priority: 1,
        isEnabled: true,
        description: 'Deny access to unauthenticated users'
      },
      {
        id: 'session-timeout',
        name: 'Session Timeout Check',
        type: 'ACCESS_CONTROL',
        condition: 'session.isExpired === true',
        action: 'DENY',
        parameters: { redirectTo: '/login' },
        priority: 2,
        isEnabled: true,
        description: 'Check for expired sessions'
      }
    ]
  },
  {
    id: 'data-protection-policy',
    name: 'Data Protection Policy',
    description: 'Rules for protecting sensitive data',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isActive: true,
    enforcement: 'STRICT',
    scope: 'GLOBAL',
    rules: [
      {
        id: 'classify-sensitive-data',
        name: 'Classify Sensitive Data',
        type: 'DATA_VALIDATION',
        condition: 'data.containsSensitiveInfo === true',
        action: 'LOG',
        parameters: { classification: 'CONFIDENTIAL' },
        priority: 1,
        isEnabled: true,
        description: 'Automatically classify sensitive data'
      },
      {
        id: 'encrypt-confidential',
        name: 'Encrypt Confidential Data',
        type: 'DATA_VALIDATION',
        condition: 'data.classification === "CONFIDENTIAL"',
        action: 'REQUIRE_APPROVAL',
        parameters: { approverRole: 'ADMIN' },
        priority: 2,
        isEnabled: true,
        description: 'Require approval for confidential data access'
      }
    ]
  }
];

// Policy manager class
export class SecurityPolicyManager {
  private policies: SecurityPolicy[] = [];
  private violations: PolicyViolation[] = [];
  private config: SecurityConfiguration;
  private evaluationCache = new Map<string, any>();
  private ruleEvaluators = new Map<string, (context: any) => boolean>();

  constructor(config: SecurityConfiguration = DEFAULT_SECURITY_CONFIG) {
    this.config = config;
    this.loadPolicies();
    this.initializeRuleEvaluators();
  }

  private loadPolicies(): void {
    try {
      const stored = localStorage.getItem('orbat_security_policies');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.policies = parsed.map((policy: any) => ({
          ...policy,
          createdAt: new Date(policy.createdAt),
          updatedAt: new Date(policy.updatedAt)
        }));
      } else {
        this.policies = [...DEFAULT_POLICIES];
        this.savePolicies();
      }
    } catch (error) {
      console.error('Failed to load security policies:', error);
      this.policies = [...DEFAULT_POLICIES];
    }
  }

  private savePolicies(): void {
    try {
      localStorage.setItem('orbat_security_policies', JSON.stringify(this.policies));
    } catch (error) {
      console.error('Failed to save security policies:', error);
    }
  }

  private initializeRuleEvaluators(): void {
    // Authentication evaluators
    this.ruleEvaluators.set('user.isAuthenticated', (context) => 
      !!context.user && !!context.session && context.session.isActive
    );
    
    this.ruleEvaluators.set('session.isExpired', (context) => 
      !context.session || new Date() > new Date(context.session.expiresAt)
    );
    
    // Authorization evaluators
    this.ruleEvaluators.set('user.hasRole', (context) => 
      context.user?.roles?.includes(context.requiredRole)
    );
    
    this.ruleEvaluators.set('user.hasPermission', (context) => 
      context.user?.permissions?.includes(context.requiredPermission)
    );
    
    // Data classification evaluators
    this.ruleEvaluators.set('data.containsSensitiveInfo', (context) => 
      this.containsSensitiveInfo(context.data)
    );
    
    this.ruleEvaluators.set('data.classification', (context) => 
      context.data?.classification === context.expectedClassification
    );
  }

  private containsSensitiveInfo(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'ssn', 'creditCard',
      'personalInfo', 'classified', 'confidential'
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return sensitiveFields.some(field => dataString.includes(field));
  }

  /**
   * Add or update a security policy
   */
  addPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newPolicy: SecurityPolicy = {
      ...policy,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.policies.push(newPolicy);
    this.savePolicies();
    this.clearEvaluationCache();
    
    return newPolicy.id;
  }

  /**
   * Update existing policy
   */
  updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index === -1) return false;
    
    this.policies[index] = {
      ...this.policies[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.savePolicies();
    this.clearEvaluationCache();
    return true;
  }

  /**
   * Remove policy
   */
  removePolicy(policyId: string): boolean {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index === -1) return false;
    
    this.policies.splice(index, 1);
    this.savePolicies();
    this.clearEvaluationCache();
    return true;
  }

  /**
   * Evaluate policies against context
   */
  evaluatePolicies(context: {
    user?: SecurityUser;
    session?: any;
    action: string;
    resource: string;
    data?: any;
    [key: string]: any;
  }): {
    allowed: boolean;
    violations: PolicyViolation[];
    alerts: string[];
    requiredApprovals: string[];
  } {
    const violations: PolicyViolation[] = [];
    const alerts: string[] = [];
    const requiredApprovals: string[] = [];
    let allowed = true;

    // Get applicable policies
    const applicablePolicies = this.getApplicablePolicies(context);

    for (const policy of applicablePolicies) {
      if (!policy.isActive) continue;

      // Sort rules by priority
      const sortedRules = policy.rules
        .filter(rule => rule.isEnabled)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        const evaluation = this.evaluateRule(rule, context);
        
        if (evaluation.matched) {
          switch (rule.action) {
            case 'DENY':
              allowed = false;
              violations.push(this.createViolation(policy, rule, context, 'HIGH'));
              break;
              
            case 'ALERT':
              alerts.push(rule.parameters.message || `Rule ${rule.name} triggered`);
              violations.push(this.createViolation(policy, rule, context, 'MEDIUM'));
              break;
              
            case 'LOG':
              violations.push(this.createViolation(policy, rule, context, 'LOW'));
              break;
              
            case 'REQUIRE_APPROVAL':
              requiredApprovals.push(rule.parameters.approverRole || 'ADMIN');
              violations.push(this.createViolation(policy, rule, context, 'MEDIUM'));
              break;
              
            case 'ALLOW':
              // Explicitly allowed
              break;
          }
        }
      }
    }

    return {
      allowed,
      violations,
      alerts,
      requiredApprovals
    };
  }

  private getApplicablePolicies(context: any): SecurityPolicy[] {
    return this.policies.filter(policy => {
      if (!policy.isActive) return false;
      
      switch (policy.scope) {
        case 'GLOBAL':
          return true;
        case 'MODULE':
          return context.module === 'orbat-integration';
        case 'USER':
          return context.user?.id === policy.createdBy;
        default:
          return false;
      }
    });
  }

  private evaluateRule(rule: SecurityRule, context: any): { matched: boolean; result?: any } {
    const cacheKey = `${rule.id}-${JSON.stringify(context)}`;
    
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey);
    }

    try {
      const evaluator = this.ruleEvaluators.get(rule.condition);
      let matched = false;
      
      if (evaluator) {
        matched = evaluator({ ...context, ...rule.parameters });
      } else {
        // Fallback: simple string matching for now
        // In production, use a proper rule engine
        matched = this.evaluateConditionString(rule.condition, context);
      }
      
      const result = { matched };
      this.evaluationCache.set(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error(`Failed to evaluate rule ${rule.id}:`, error);
      return { matched: false };
    }
  }

  private evaluateConditionString(condition: string, context: any): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    try {
      // Replace context variables
      let expression = condition;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, JSON.stringify(value));
      }
      
      // For safety, only allow specific operators
      if (!/^[\w\s"'.\[\]===!<>&|(){}]+$/.test(expression)) {
        return false;
      }
      
      return eval(expression);
    } catch {
      return false;
    }
  }

  private createViolation(
    policy: SecurityPolicy,
    rule: SecurityRule,
    context: any,
    severity: PolicyViolation['severity']
  ): PolicyViolation {
    const violation: PolicyViolation = {
      id: crypto.randomUUID(),
      policyId: policy.id,
      ruleId: rule.id,
      timestamp: new Date(),
      userId: context.user?.id,
      action: context.action,
      resource: context.resource,
      details: { ...context, policyName: policy.name, ruleName: rule.name },
      severity,
      handled: false
    };
    
    this.violations.push(violation);
    return violation;
  }

  private clearEvaluationCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Get all policies
   */
  getPolicies(): SecurityPolicy[] {
    return [...this.policies];
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): SecurityPolicy | undefined {
    return this.policies.find(p => p.id === policyId);
  }

  /**
   * Get violations
   */
  getViolations(filter?: {
    policyId?: string;
    userId?: string;
    severity?: PolicyViolation['severity'];
    handled?: boolean;
  }): PolicyViolation[] {
    let filtered = [...this.violations];
    
    if (filter) {
      if (filter.policyId) {
        filtered = filtered.filter(v => v.policyId === filter.policyId);
      }
      if (filter.userId) {
        filtered = filtered.filter(v => v.userId === filter.userId);
      }
      if (filter.severity) {
        filtered = filtered.filter(v => v.severity === filter.severity);
      }
      if (filter.handled !== undefined) {
        filtered = filtered.filter(v => v.handled === filter.handled);
      }
    }
    
    return filtered;
  }

  /**
   * Update security configuration
   */
  updateConfiguration(updates: Partial<SecurityConfiguration>): void {
    this.config = { ...this.config, ...updates };
    localStorage.setItem('orbat_security_config', JSON.stringify(this.config));
    this.clearEvaluationCache();
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SecurityConfiguration {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate authentication settings
    if (this.config.authentication.sessionTimeout < 5) {
      errors.push('Session timeout must be at least 5 minutes');
    }
    
    if (this.config.authentication.passwordPolicy.minLength < 6) {
      errors.push('Minimum password length must be at least 6 characters');
    }
    
    // Validate communication settings
    if (this.config.communication.messageTimeout < 5000) {
      errors.push('Message timeout must be at least 5 seconds');
    }
    
    // Validate audit settings
    if (this.config.audit.retentionDays < 30) {
      errors.push('Audit log retention must be at least 30 days');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Security policy context
interface PolicyContextType {
  manager: SecurityPolicyManager;
  policies: SecurityPolicy[];
  configuration: SecurityConfiguration;
  updateConfiguration: (updates: Partial<SecurityConfiguration>) => void;
  evaluatePolicies: (context: any) => any;
  refreshPolicies: () => void;
}

const PolicyContext = createContext<PolicyContextType | null>(null);

// Security policy provider
export const SecurityPolicyProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<SecurityConfiguration>;
}> = ({ children, config: userConfig = {} }) => {
  const [manager] = useState(() => new SecurityPolicyManager({ ...DEFAULT_SECURITY_CONFIG, ...userConfig }));
  const [policies, setPolicies] = useState<SecurityPolicy[]>(manager.getPolicies());
  const [configuration, setConfiguration] = useState<SecurityConfiguration>(manager.getConfiguration());

  const updateConfiguration = useCallback((updates: Partial<SecurityConfiguration>) => {
    manager.updateConfiguration(updates);
    setConfiguration(manager.getConfiguration());
  }, [manager]);

  const refreshPolicies = useCallback(() => {
    setPolicies(manager.getPolicies());
  }, [manager]);

  const contextValue: PolicyContextType = {
    manager,
    policies,
    configuration,
    updateConfiguration,
    evaluatePolicies: manager.evaluatePolicies.bind(manager),
    refreshPolicies
  };

  return (
    <PolicyContext.Provider value={contextValue}>
      {children}
    </PolicyContext.Provider>
  );
};

// Hook for using security policies
export const useSecurityPolicy = () => {
  const context = useContext(PolicyContext);
  if (!context) {
    throw new Error('useSecurityPolicy must be used within SecurityPolicyProvider');
  }
  return context;
};

export default SecurityPolicyManager;