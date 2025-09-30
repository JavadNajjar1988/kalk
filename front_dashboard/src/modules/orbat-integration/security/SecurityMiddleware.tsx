import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SecurityValidator } from './ValidationSystem';

// Security context interfaces
export interface SecurityUser {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  clearanceLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  sessionId: string;
  expiresAt: Date;
}

export interface SecuritySession {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface SecurityConfig {
  sessionTimeout: number; // minutes
  maxSessions: number;
  requireAuthentication: boolean;
  enableAuditLogging: boolean;
  restrictedMode: boolean;
  allowedOrigins: string[];
  minClearanceLevel: SecurityUser['clearanceLevel'];
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  sessionTimeout: 60,
  maxSessions: 5,
  requireAuthentication: true,
  enableAuditLogging: true,
  restrictedMode: false,
  allowedOrigins: ['http://localhost:5173', 'https://localhost:5173'],
  minClearanceLevel: 'PUBLIC'
};

// Security context
interface SecurityContextType {
  user: SecurityUser | null;
  session: SecuritySession | null;
  isAuthenticated: boolean;
  isAuthorized: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasClearance: (level: SecurityUser['clearanceLevel']) => boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
  refreshSession: () => void;
  config: SecurityConfig;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Security middleware hook
export const useSecurityMiddleware = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityMiddleware must be used within SecurityProvider');
  }
  return context;
};

// Security provider component
export const SecurityProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<SecurityConfig>;
}> = ({ children, config: userConfig = {} }) => {
  const [user, setUser] = useState<SecurityUser | null>(null);
  const [session, setSession] = useState<SecuritySession | null>(null);
  const [config] = useState<SecurityConfig>({ ...DEFAULT_SECURITY_CONFIG, ...userConfig });

  // Session validation
  const checkSession = useCallback((): boolean => {
    if (!session || !user) return false;
    
    const now = new Date();
    if (now > session.expiresAt || now > user.expiresAt) {
      setUser(null);
      setSession(null);
      return false;
    }
    
    return session.isActive;
  }, [session, user]);

  // Refresh session
  const refreshSession = useCallback(() => {
    if (!session || !user) return;
    
    const now = new Date();
    const newExpiration = new Date(now.getTime() + config.sessionTimeout * 60000);
    
    setSession(prev => prev ? {
      ...prev,
      lastActivity: now,
      expiresAt: newExpiration
    } : null);
    
    setUser(prev => prev ? {
      ...prev,
      expiresAt: newExpiration
    } : null);
  }, [session, user, config.sessionTimeout]);

  // Authentication
  const login = useCallback(async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      // Validate credentials format
      if (!credentials.username || !credentials.password) {
        throw new Error('Invalid credentials format');
      }

      // Sanitize username
      const sanitizedUsername = SecurityValidator.sanitizeText(credentials.username, 50);
      
      // Mock authentication - in real implementation, this would call an API
      if (sanitizedUsername === 'admin' && credentials.password === 'admin123') {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.sessionTimeout * 60000);
        const sessionId = crypto.randomUUID();

        const newUser: SecurityUser = {
          id: 'user-admin',
          username: sanitizedUsername,
          roles: ['ADMIN', 'OPERATOR'],
          permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE_SCENARIOS', 'MANAGE_UNITS'],
          clearanceLevel: 'SECRET',
          sessionId,
          expiresAt
        };

        const newSession: SecuritySession = {
          id: sessionId,
          userId: newUser.id,
          createdAt: now,
          lastActivity: now,
          expiresAt,
          ipAddress: '127.0.0.1', // In real implementation, get from request
          userAgent: navigator.userAgent,
          isActive: true
        };

        setUser(newUser);
        setSession(newSession);
        
        // Store in localStorage for persistence
        localStorage.setItem('orbat_user', JSON.stringify(newUser));
        localStorage.setItem('orbat_session', JSON.stringify(newSession));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [config.sessionTimeout]);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('orbat_user');
    localStorage.removeItem('orbat_session');
  }, []);

  // Authorization checks
  const isAuthorized = useCallback((permission: string): boolean => {
    if (!user || !checkSession()) return false;
    return user.permissions.includes(permission);
  }, [user, checkSession]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user || !checkSession()) return false;
    return user.roles.includes(role);
  }, [user, checkSession]);

  const hasClearance = useCallback((level: SecurityUser['clearanceLevel']): boolean => {
    if (!user || !checkSession()) return false;
    
    const clearanceLevels = ['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    const userLevelIndex = clearanceLevels.indexOf(user.clearanceLevel);
    const requiredLevelIndex = clearanceLevels.indexOf(level);
    
    return userLevelIndex >= requiredLevelIndex;
  }, [user, checkSession]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('orbat_user');
      const storedSession = localStorage.getItem('orbat_session');
      
      if (storedUser && storedSession) {
        const parsedUser = JSON.parse(storedUser) as SecurityUser;
        const parsedSession = JSON.parse(storedSession) as SecuritySession;
        
        // Convert date strings back to Date objects
        parsedUser.expiresAt = new Date(parsedUser.expiresAt);
        parsedSession.createdAt = new Date(parsedSession.createdAt);
        parsedSession.lastActivity = new Date(parsedSession.lastActivity);
        parsedSession.expiresAt = new Date(parsedSession.expiresAt);
        
        // Check if session is still valid
        const now = new Date();
        if (now < parsedUser.expiresAt && now < parsedSession.expiresAt) {
          setUser(parsedUser);
          setSession(parsedSession);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      logout();
    }
  }, [logout]);

  // Auto-refresh session
  useEffect(() => {
    if (!session || !user) return;

    const interval = setInterval(() => {
      if (checkSession()) {
        refreshSession();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, user, checkSession, refreshSession]);

  const contextValue: SecurityContextType = {
    user,
    session,
    isAuthenticated: !!user && checkSession(),
    isAuthorized,
    hasRole,
    hasClearance,
    login,
    logout,
    checkSession,
    refreshSession,
    config
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// Security guard component
export const SecurityGuard: React.FC<{
  children: React.ReactNode;
  permission?: string;
  role?: string;
  clearance?: SecurityUser['clearanceLevel'];
  fallback?: React.ReactNode;
}> = ({ children, permission, role, clearance, fallback = null }) => {
  const { isAuthenticated, isAuthorized, hasRole, hasClearance } = useSecurityMiddleware();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (permission && !isAuthorized(permission)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (clearance && !hasClearance(clearance)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Request security middleware
export class RequestSecurityMiddleware {
  private static instance: RequestSecurityMiddleware;
  private config: SecurityConfig;

  private constructor(config: SecurityConfig) {
    this.config = config;
  }

  static getInstance(config?: SecurityConfig): RequestSecurityMiddleware {
    if (!RequestSecurityMiddleware.instance) {
      RequestSecurityMiddleware.instance = new RequestSecurityMiddleware(
        config || DEFAULT_SECURITY_CONFIG
      );
    }
    return RequestSecurityMiddleware.instance;
  }

  validateOrigin(origin: string): boolean {
    if (!this.config.allowedOrigins.length) return true;
    return this.config.allowedOrigins.includes(origin);
  }

  validateMessage(message: any, origin: string): boolean {
    // Validate origin
    if (!this.validateOrigin(origin)) {
      console.warn('Message from unauthorized origin:', origin);
      return false;
    }

    // Validate message structure
    if (!message || typeof message !== 'object') {
      return false;
    }

    // Sanitize string properties
    if (message.command) {
      message.command = SecurityValidator.sanitizeText(message.command, 50);
    }

    if (message.data && typeof message.data === 'object') {
      this.sanitizeObjectStrings(message.data);
    }

    return true;
  }

  private sanitizeObjectStrings(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = SecurityValidator.sanitizeText(obj[key]);
      } else if (obj[key] && typeof obj[key] === 'object') {
        this.sanitizeObjectStrings(obj[key]);
      }
    }
  }

  validateCommand(command: string, user: SecurityUser | null): boolean {
    if (!user) return false;

    const commandPermissions: Record<string, string[]> = {
      'LOAD_SCENARIO': ['READ'],
      'CREATE_SCENARIO': ['WRITE'],
      'UPDATE_SCENARIO': ['WRITE'],
      'DELETE_SCENARIO': ['DELETE'],
      'ADD_UNIT': ['WRITE'],
      'UPDATE_UNIT': ['WRITE'],
      'DELETE_UNIT': ['DELETE'],
      'ZOOM_TO_UNIT': ['READ'],
      'GET_SCENARIOS': ['READ'],
      'GET_UNITS': ['READ']
    };

    const requiredPermissions = commandPermissions[command] || ['READ'];
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  }
}

// Security hooks
export const useSecurityGuard = () => {
  const security = useSecurityMiddleware();
  
  const requireAuth = useCallback((callback: () => void) => {
    if (security.isAuthenticated) {
      callback();
    } else {
      console.warn('Authentication required');
    }
  }, [security.isAuthenticated]);

  const requirePermission = useCallback((permission: string, callback: () => void) => {
    if (security.isAuthorized(permission)) {
      callback();
    } else {
      console.warn(`Permission '${permission}' required`);
    }
  }, [security]);

  const requireClearance = useCallback((level: SecurityUser['clearanceLevel'], callback: () => void) => {
    if (security.hasClearance(level)) {
      callback();
    } else {
      console.warn(`Clearance level '${level}' required`);
    }
  }, [security]);

  return {
    requireAuth,
    requirePermission,
    requireClearance,
    ...security
  };
};

export default SecurityProvider;