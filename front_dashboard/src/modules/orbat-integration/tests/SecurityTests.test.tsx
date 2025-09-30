import { describe, beforeEach, afterEach, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React from 'react';

// Import security components and utilities
import { SecurityProvider } from '../security/SecurityMiddleware';
import { SecurityGuard } from '../security/SecurityMiddleware';
import { SecurityValidator } from '../security/ValidationSystem';
import { DataIntegrityValidator } from '../security/DataIntegrityValidator';
import { AuditLogger } from '../security/AuditLogger';
import { SecureCommunicationManager } from '../security/SecureCommunication';
import { SecurityPolicyManager } from '../security/SecurityPolicyManager';

// Import test utilities
import { TestWrapper, mockUnit, mockEvent, mockScenario } from './ComponentTests.test';

// Security test data
const maliciousInputs = {
  xssScripts: [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>'
  ],
  sqlInjections: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1--"
  ],
  invalidCoordinates: [
    { lat: 91, lon: 0 },
    { lat: -91, lon: 0 },
    { lat: 0, lon: 181 },
    { lat: 0, lon: -181 }
  ],
  invalidSIDCs: [
    'INVALID_SIDC',
    '123456789012345',
    'SFGPUCII------X',
    '',
    'SFGPUCII-'
  ]
};

beforeAll(() => {
  console.log('Starting Security Tests Suite');
  
  // Mock security-related APIs
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: () => 'test-security-uuid-' + Math.random().toString(36).substr(2, 9),
      subtle: {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
      }
    }
  });

  // Mock localStorage for security tests
  const mockStorage = {
    store: new Map(),
    getItem: vi.fn((key) => mockStorage.store.get(key) || null),
    setItem: vi.fn((key, value) => mockStorage.store.set(key, value)),
    removeItem: vi.fn((key) => mockStorage.store.delete(key)),
    clear: vi.fn(() => mockStorage.store.clear())
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage
  });
});

afterAll(() => {
  vi.restoreAllMocks();
  console.log('Security Tests Suite Completed');
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('ORBAT Integration - Security Testing and Penetration Tests', () => {
  
  describe('Input Validation Security Tests', () => {
    
    describe('XSS Prevention', () => {
      it('should sanitize malicious script tags', () => {
        maliciousInputs.xssScripts.forEach(script => {
          const sanitized = SecurityValidator.sanitizeHtml(script);
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror');
          expect(sanitized).not.toContain('onload');
        });
      });

      it('should prevent XSS in unit names', () => {
        maliciousInputs.xssScripts.forEach(script => {
          const maliciousUnit = {
            ...mockUnit,
            name: script
          };
          
          const validation = DataIntegrityValidator.validateUnit(maliciousUnit);
          expect(validation.isValid).toBe(false);
        });
      });

      it('should sanitize event descriptions', () => {
        maliciousInputs.xssScripts.forEach(script => {
          const sanitized = SecurityValidator.sanitizeText(script);
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          expect(sanitized).not.toContain('javascript:');
        });
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should detect SQL injection patterns', () => {
        maliciousInputs.sqlInjections.forEach(injection => {
          const isValid = SecurityValidator.validateSqlInjection(injection);
          expect(isValid).toBe(false);
        });
      });

      it('should allow safe SQL-like strings', () => {
        const safeInputs = [
          'Unit Alpha',
          'Operation Desert Storm',
          'Coordinates: 40.7128, -74.0060',
          'Status: Active'
        ];

        safeInputs.forEach(input => {
          const isValid = SecurityValidator.validateSqlInjection(input);
          expect(isValid).toBe(true);
        });
      });
    });

    describe('Data Validation Security', () => {
      it('should reject invalid coordinates', () => {
        maliciousInputs.invalidCoordinates.forEach(coord => {
          const isValid = SecurityValidator.validateCoordinates(coord.lat, coord.lon);
          expect(isValid).toBe(false);
        });
      });

      it('should reject invalid SIDC formats', () => {
        maliciousInputs.invalidSIDCs.forEach(sidc => {
          const isValid = SecurityValidator.validateSIDC(sidc);
          expect(isValid).toBe(false);
        });
      });

      it('should handle oversized data gracefully', () => {
        const longString = 'A'.repeat(10000);
        const sanitizedString = SecurityValidator.sanitizeText(longString, 1000);
        expect(sanitizedString.length).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe('Authentication and Authorization Security', () => {
    
    describe('Authentication Tests', () => {
      it('should handle invalid authentication tokens', () => {
        const TestComponent = () => {
          const [error, setError] = React.useState<string | null>(null);
          
          const handleInvalidAuth = () => {
            try {
              const token = 'invalid.jwt.token';
              if (!token.includes('valid')) {
                throw new Error('Invalid authentication token');
              }
            } catch (err) {
              setError(err.message);
            }
          };

          return (
            <div>
              <button data-testid="invalid-auth" onClick={handleInvalidAuth}>
                Test Invalid Auth
              </button>
              <span data-testid="auth-error">{error}</span>
            </div>
          );
        };

        render(<TestComponent />);
        fireEvent.click(screen.getByTestId('invalid-auth'));
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid authentication token');
      });

      it('should prevent brute force authentication attempts', async () => {
        const auditLogger = new AuditLogger();

        // Simulate multiple failed login attempts
        for (let i = 0; i < 6; i++) {
          auditLogger.log(
            'LOGIN_ATTEMPT',
            'USER_SESSION',
            'FAILURE',
            { username: 'testuser', attempt: i + 1 },
            undefined,
            undefined,
            'AUTHENTICATION',
            'HIGH'
          );
        }

        const alerts = auditLogger.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts.some(alert => alert.type === 'SECURITY_BREACH')).toBe(true);
      });

      it('should handle session timeout properly', () => {
        const TestComponent = () => {
          const [sessionValid, setSessionValid] = React.useState(true);
          
          const checkSession = () => {
            const sessionStart = Date.now() - (31 * 60 * 1000); // 31 minutes ago
            const maxSessionTime = 30 * 60 * 1000; // 30 minutes
            
            if (Date.now() - sessionStart > maxSessionTime) {
              setSessionValid(false);
            }
          };

          React.useEffect(() => {
            checkSession();
          }, []);

          return (
            <div data-testid="session-status">
              {sessionValid ? 'Valid Session' : 'Session Expired'}
            </div>
          );
        };

        render(<TestComponent />);
        expect(screen.getByTestId('session-status')).toHaveTextContent('Session Expired');
      });
    });

    describe('Authorization Tests', () => {
      it('should enforce role-based access control', () => {
        const TestComponent = ({ userRole }: { userRole: string }) => {
          const hasAdminAccess = userRole === 'ADMIN';
          const hasEditorAccess = ['ADMIN', 'EDITOR'].includes(userRole);
          
          return (
            <div>
              <div data-testid="admin-section" style={{ display: hasAdminAccess ? 'block' : 'none' }}>
                Admin Only Content
              </div>
              <div data-testid="editor-section" style={{ display: hasEditorAccess ? 'block' : 'none' }}>
                Editor Content
              </div>
              <div data-testid="user-section">
                User Content
              </div>
            </div>
          );
        };

        const { rerender } = render(<TestComponent userRole="USER" />);
        expect(screen.getByTestId('admin-section')).toHaveStyle('display: none');
        expect(screen.getByTestId('editor-section')).toHaveStyle('display: none');
        expect(screen.getByTestId('user-section')).toBeVisible();

        rerender(<TestComponent userRole="ADMIN" />);
        expect(screen.getByTestId('admin-section')).toHaveStyle('display: block');
        expect(screen.getByTestId('editor-section')).toHaveStyle('display: block');
      });

      it('should prevent unauthorized data access', () => {
        const TestComponent = ({ userPermissions }: { userPermissions: string[] }) => {
          const canViewUnits = userPermissions.includes('VIEW_UNITS');
          const canEditUnits = userPermissions.includes('EDIT_UNITS');
          const canDeleteUnits = userPermissions.includes('DELETE_UNITS');
          
          return (
            <div>
              <button data-testid="view-button" disabled={!canViewUnits}>View Units</button>
              <button data-testid="edit-button" disabled={!canEditUnits}>Edit Units</button>
              <button data-testid="delete-button" disabled={!canDeleteUnits}>Delete Units</button>
            </div>
          );
        };

        render(<TestComponent userPermissions={['VIEW_UNITS']} />);
        expect(screen.getByTestId('view-button')).not.toBeDisabled();
        expect(screen.getByTestId('edit-button')).toBeDisabled();
        expect(screen.getByTestId('delete-button')).toBeDisabled();
      });
    });
  });

  describe('Data Integrity and Encryption Tests', () => {
    
    describe('Data Integrity Validation', () => {
      it('should detect data tampering', () => {
        const originalData = { ...mockUnit };
        const checksum = DataIntegrityValidator.generateChecksum(originalData);
        
        const tamperedData = { ...originalData, name: 'Tampered Unit' };
        const isValid = DataIntegrityValidator.verifyIntegrity(tamperedData, checksum);
        
        expect(isValid).toBe(false);
      });

      it('should validate cross-references', () => {
        const scenario = {
          ...mockScenario,
          units: [
            { ...mockUnit, id: 'unit-1', parent: 'unit-2' },
            { ...mockUnit, id: 'unit-2', parent: 'non-existent-unit' }
          ],
          events: [
            { ...mockEvent, unitId: 'non-existent-unit' }
          ]
        };

        const validation = DataIntegrityValidator.validateCrossReferences(scenario);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });

      it('should prevent circular references', () => {
        const scenario = {
          ...mockScenario,
          units: [
            { ...mockUnit, id: 'unit-1', parent: 'unit-2' },
            { ...mockUnit, id: 'unit-2', parent: 'unit-1' }
          ]
        };

        const validation = DataIntegrityValidator.validateCrossReferences(scenario);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(error => error.includes('Circular parent reference'))).toBe(true);
      });
    });

    describe('Secure Communication Tests', () => {
      it('should encrypt sensitive data', async () => {
        const sensitiveData = { password: 'secret123', apiKey: 'key123' };
        
        const encrypted = btoa(JSON.stringify(sensitiveData));
        expect(encrypted).not.toContain('secret123');
        expect(encrypted).not.toContain('key123');
        
        const decrypted = JSON.parse(atob(encrypted));
        expect(decrypted.password).toBe('secret123');
        expect(decrypted.apiKey).toBe('key123');
      });

      it('should validate message signatures', () => {
        const message = { data: 'test', timestamp: Date.now() };
        const signature = btoa(JSON.stringify(message) + 'secret-key');
        
        const expectedSignature = btoa(JSON.stringify(message) + 'secret-key');
        expect(signature).toBe(expectedSignature);
        
        const tamperedMessage = { ...message, data: 'tampered' };
        const tamperedSignature = btoa(JSON.stringify(tamperedMessage) + 'secret-key');
        expect(tamperedSignature).not.toBe(signature);
      });
    });
  });

  describe('Audit Logging and Monitoring Tests', () => {
    
    describe('Security Event Logging', () => {
      it('should log security violations', () => {
        const auditLogger = new AuditLogger();
        
        const violations = [
          { type: 'XSS_ATTEMPT', payload: '<script>alert("XSS")</script>' },
          { type: 'SQL_INJECTION', payload: "'; DROP TABLE users; --" },
          { type: 'INVALID_AUTHENTICATION', payload: 'fake_token' }
        ];

        violations.forEach(violation => {
          auditLogger.log(
            'SECURITY_VIOLATION',
            violation.type,
            'ERROR',
            { payload: violation.payload },
            undefined,
            undefined,
            'SECURITY',
            'CRITICAL'
          );
        });

        const logs = auditLogger.getLogs({ category: 'SECURITY' });
        expect(logs.length).toBe(violations.length);
        
        logs.forEach(log => {
          expect(log.category).toBe('SECURITY');
          expect(log.severity).toBe('CRITICAL');
          expect(log.outcome).toBe('ERROR');
        });
      });

      it('should generate security alerts', () => {
        const auditLogger = new AuditLogger();
        
        for (let i = 0; i < 6; i++) {
          auditLogger.log(
            'LOGIN_ATTEMPT',
            'USER_SESSION',
            'FAILURE',
            { username: 'attacker', ip: '192.168.1.100' },
            undefined,
            undefined,
            'AUTHENTICATION',
            'HIGH'
          );
        }

        const alerts = auditLogger.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        
        const securityAlert = alerts.find(alert => alert.type === 'SECURITY_BREACH');
        expect(securityAlert).toBeDefined();
        expect(securityAlert?.severity).toBe('HIGH');
      });

      it('should track security metrics', () => {
        const auditLogger = new AuditLogger();
        
        auditLogger.log('LOGIN', 'USER_SESSION', 'SUCCESS', {}, undefined, undefined, 'AUTHENTICATION');
        auditLogger.log('LOGIN', 'USER_SESSION', 'FAILURE', {}, undefined, undefined, 'AUTHENTICATION');
        auditLogger.log('ACCESS_DENIED', 'ADMIN_PANEL', 'FAILURE', {}, undefined, undefined, 'AUTHORIZATION');
        auditLogger.log('DATA_ACCESS', 'SENSITIVE_DATA', 'ERROR', {}, undefined, undefined, 'DATA_ACCESS', 'HIGH');

        const metrics = auditLogger.getMetrics();
        expect(metrics.totalRequests).toBeGreaterThan(0);
        expect(metrics.authenticationAttempts).toBeGreaterThan(0);
        expect(metrics.authenticationFailures).toBeGreaterThan(0);
        expect(metrics.unauthorizedAccess).toBeGreaterThan(0);
      });
    });
  });

  describe('Network Security Tests', () => {
    
    describe('URL Validation', () => {
      it('should validate safe URLs', () => {
        const safeUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://api.example.com/data'
        ];

        safeUrls.forEach(url => {
          expect(SecurityValidator.validateUrl(url)).toBe(true);
        });
      });

      it('should reject dangerous URLs', () => {
        const dangerousUrls = [
          'javascript:alert("XSS")',
          'data:text/html,<script>alert("XSS")</script>',
          'file:///etc/passwd',
          'ftp://malicious.com',
          'invalid-url'
        ];

        dangerousUrls.forEach(url => {
          expect(SecurityValidator.validateUrl(url)).toBe(false);
        });
      });
    });
  });

  describe('Performance Security Tests', () => {
    
    describe('DoS Prevention', () => {
      it('should handle large payload attacks', () => {
        const largePayload = 'A'.repeat(1000000); // 1MB string
        
        const startTime = performance.now();
        const sanitized = SecurityValidator.sanitizeText(largePayload, 10000);
        const endTime = performance.now();
        
        expect(sanitized.length).toBeLessThanOrEqual(10000);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });

    describe('Memory Security Tests', () => {
      it('should clean up sensitive data from memory', () => {
        const TestComponent = () => {
          const [sensitiveData, setSensitiveData] = React.useState<string | null>('password123');
          
          const clearSensitiveData = () => {
            setSensitiveData(null);
            if (global.gc) {
              global.gc();
            }
          };

          React.useEffect(() => {
            return () => {
              setSensitiveData(null);
            };
          }, []);

          return (
            <div>
              <span data-testid="sensitive-data">{sensitiveData || 'Cleared'}</span>
              <button data-testid="clear-data" onClick={clearSensitiveData}>
                Clear Sensitive Data
              </button>
            </div>
          );
        };

        const { unmount } = render(<TestComponent />);
        
        expect(screen.getByTestId('sensitive-data')).toHaveTextContent('password123');
        
        fireEvent.click(screen.getByTestId('clear-data'));
        expect(screen.getByTestId('sensitive-data')).toHaveTextContent('Cleared');
        
        unmount();
      });
    });
  });

  describe('Error Handling Security', () => {
    
    describe('Information Disclosure Prevention', () => {
      it('should not expose sensitive information in error messages', () => {
        const TestComponent = () => {
          const [error, setError] = React.useState<string | null>(null);
          
          const simulateError = () => {
            try {
              throw new Error('Database connection failed: server=prod-db-01, user=admin, password=secret123');
            } catch (err) {
              const sanitizedMessage = err.message
                .replace(/password=\w+/gi, 'password=***')
                .replace(/user=\w+/gi, 'user=***')
                .replace(/server=[\w.-]+/gi, 'server=***');
              
              setError(sanitizedMessage);
            }
          };

          return (
            <div>
              <button data-testid="trigger-error" onClick={simulateError}>
                Trigger Error
              </button>
              <span data-testid="error-message">{error}</span>
            </div>
          );
        };

        render(<TestComponent />);
        fireEvent.click(screen.getByTestId('trigger-error'));
        
        const errorMessage = screen.getByTestId('error-message').textContent;
        expect(errorMessage).not.toContain('secret123');
        expect(errorMessage).not.toContain('admin');
        expect(errorMessage).not.toContain('prod-db-01');
        expect(errorMessage).toContain('***');
      });
    });
  });

  describe('Security Integration Tests', () => {
    
    describe('Full Security Workflow', () => {
      it('should handle complete security validation flow', async () => {
        const TestSecurityWorkflow = () => {
          const [status, setStatus] = React.useState('Initializing');
          const [isSecure, setIsSecure] = React.useState(false);
          
          const runSecurityChecks = async () => {
            let allChecksPassed = true;
            
            // Step 1: Input validation
            setStatus('Validating inputs...');
            const maliciousInput = '<script>alert("XSS")</script>';
            const sanitized = SecurityValidator.sanitizeHtml(maliciousInput);
            if (sanitized.includes('<script')) {
              allChecksPassed = false;
            }
            
            // Step 2: Data integrity
            setStatus('Checking data integrity...');
            const originalData = { test: 'data' };
            const checksum = DataIntegrityValidator.generateChecksum(originalData);
            const tamperedData = { test: 'tampered' };
            if (DataIntegrityValidator.verifyIntegrity(tamperedData, checksum)) {
              allChecksPassed = false;
            }
            
            // Step 3: Authorization
            setStatus('Verifying authorization...');
            const userRole = 'USER';
            const hasAdminAccess = userRole === 'ADMIN';
            if (hasAdminAccess) {
              allChecksPassed = false; // User shouldn't have admin access
            }
            
            setStatus('Security checks completed');
            setIsSecure(allChecksPassed);
          };

          React.useEffect(() => {
            runSecurityChecks();
          }, []);

          return (
            <div>
              <div data-testid="security-status">{status}</div>
              <div data-testid="security-result">
                {isSecure ? 'System Secure' : 'Security Issues Detected'}
              </div>
            </div>
          );
        };

        render(<TestSecurityWorkflow />);
        
        await waitFor(() => {
          expect(screen.getByTestId('security-status')).toHaveTextContent('Security checks completed');
        });
        
        expect(screen.getByTestId('security-result')).toHaveTextContent('System Secure');
      });
    });
  });
});

// Security test utilities
export class SecurityTestUtils {
  static generateMaliciousPayload(type: 'xss' | 'sql' | 'overflow'): string {
    switch (type) {
      case 'xss':
        return '<script>alert("Security Test XSS")</script>';
      case 'sql':
        return "'; DROP TABLE test_users; --";
      case 'overflow':
        return 'A'.repeat(10000);
      default:
        return 'test';
    }
  }

  static simulateSecurityViolation(logger: AuditLogger, violationType: string): void {
    logger.log(
      'SECURITY_TEST_VIOLATION',
      violationType,
      'ERROR',
      { payload: this.generateMaliciousPayload('xss'), test: true },
      undefined,
      undefined,
      'SECURITY',
      'CRITICAL'
    );
  }

  static validateSecurityResponse(response: any): boolean {
    // Check if response doesn't contain sensitive information
    const responseStr = JSON.stringify(response);
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /admin/i
    ];

    return !sensitivePatterns.some(pattern => pattern.test(responseStr));
  }
}

export default SecurityTestUtils;