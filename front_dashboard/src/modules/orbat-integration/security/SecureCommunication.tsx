import { SecurityValidator } from './ValidationSystem';
import { RequestSecurityMiddleware, SecurityUser } from './SecurityMiddleware';
import { DataIntegrityValidator } from './DataIntegrityValidator';

// Secure communication interfaces
export interface SecureMessage {
  id: string;
  type: 'COMMAND' | 'RESPONSE' | 'EVENT' | 'HEARTBEAT';
  command?: string;
  data?: any;
  timestamp: Date;
  sessionId?: string;
  checksum: string;
  signature?: string;
  nonce: string;
}

export interface CommunicationChannel {
  id: string;
  origin: string;
  established: Date;
  lastActivity: Date;
  isSecure: boolean;
  isVerified: boolean;
  messageCount: number;
  errorCount: number;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

// Message encryption utility (simplified for demo - in production use proper crypto)
class MessageCrypto {
  private static readonly SECRET_KEY = 'orbat-integration-secret-key-2024';

  static encrypt(data: string): string {
    // Simplified encryption - in production, use proper encryption libraries
    const encoded = btoa(data);
    return encoded.split('').reverse().join('');
  }

  static decrypt(encryptedData: string): string {
    try {
      const reversed = encryptedData.split('').reverse().join('');
      return atob(reversed);
    } catch (error) {
      throw new Error('Failed to decrypt message');
    }
  }

  static generateNonce(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }

  static generateSignature(data: string, nonce: string): string {
    // Simplified signature generation
    const combined = data + nonce + this.SECRET_KEY;
    return btoa(combined).slice(0, 32);
  }

  static verifySignature(data: string, nonce: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(data, nonce);
    return expectedSignature === signature;
  }
}

// Secure communication manager
export class SecureCommunicationManager {
  private channels = new Map<string, CommunicationChannel>();
  private messageQueue = new Map<string, SecureMessage[]>();
  private securityMiddleware: RequestSecurityMiddleware;
  private user: SecurityUser | null = null;
  private isInitialized = false;

  constructor(config: any = {}) {
    this.securityMiddleware = RequestSecurityMiddleware.getInstance(config);
    this.initializeSecurityHeaders();
  }

  private initializeSecurityHeaders(): void {
    // Set security headers for iframe communication
    const headers: SecurityHeaders = {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };

    // Apply headers if possible (limited in browser environment)
    if (typeof document !== 'undefined') {
      Object.entries(headers).forEach(([name, value]) => {
        const meta = document.createElement('meta');
        meta.httpEquiv = name;
        meta.content = value;
        document.head.appendChild(meta);
      });
    }
  }

  /**
   * Initialize secure communication with user context
   */
  initialize(user: SecurityUser): void {
    this.user = user;
    this.isInitialized = true;
    console.log('Secure communication initialized for user:', user.username);
  }

  /**
   * Register a communication channel
   */
  registerChannel(origin: string): string {
    const channelId = crypto.randomUUID();
    const channel: CommunicationChannel = {
      id: channelId,
      origin,
      established: new Date(),
      lastActivity: new Date(),
      isSecure: origin.startsWith('https://') || origin.includes('localhost'),
      isVerified: this.securityMiddleware.validateOrigin(origin),
      messageCount: 0,
      errorCount: 0
    };

    this.channels.set(channelId, channel);
    this.messageQueue.set(channelId, []);

    console.log(`Channel registered: ${channelId} for origin: ${origin}`);
    return channelId;
  }

  /**
   * Create secure message
   */
  createSecureMessage(
    type: SecureMessage['type'],
    command?: string,
    data?: any,
    channelId?: string
  ): SecureMessage {
    if (!this.isInitialized || !this.user) {
      throw new Error('Secure communication not initialized');
    }

    const nonce = MessageCrypto.generateNonce();
    const timestamp = new Date();
    
    // Sanitize data if present
    let sanitizedData = data;
    if (data && typeof data === 'object') {
      sanitizedData = this.sanitizeMessageData(data);
    }

    // Create message payload
    const payload = {
      type,
      command,
      data: sanitizedData,
      timestamp,
      sessionId: this.user.sessionId
    };

    const payloadString = JSON.stringify(payload);
    const checksum = DataIntegrityValidator.generateChecksum(payload);
    const signature = MessageCrypto.generateSignature(payloadString, nonce);

    const secureMessage: SecureMessage = {
      id: crypto.randomUUID(),
      ...payload,
      checksum,
      signature,
      nonce
    };

    // Queue message if channel specified
    if (channelId) {
      this.queueMessage(channelId, secureMessage);
    }

    return secureMessage;
  }

  /**
   * Validate incoming secure message
   */
  validateSecureMessage(message: any, origin: string): {
    isValid: boolean;
    errors: string[];
    message?: SecureMessage;
  } {
    const errors: string[] = [];

    try {
      // Basic structure validation
      if (!message || typeof message !== 'object') {
        errors.push('Invalid message format');
        return { isValid: false, errors };
      }

      // Required fields validation
      const requiredFields = ['id', 'type', 'timestamp', 'checksum', 'nonce'];
      for (const field of requiredFields) {
        if (!message[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Origin validation
      if (!this.securityMiddleware.validateOrigin(origin)) {
        errors.push('Invalid origin');
        return { isValid: false, errors };
      }

      // Signature verification
      if (message.signature) {
        const { signature, nonce, ...payload } = message;
        const payloadString = JSON.stringify(payload);
        
        if (!MessageCrypto.verifySignature(payloadString, nonce, signature)) {
          errors.push('Invalid message signature');
        }
      }

      // Checksum verification
      if (message.checksum) {
        const { checksum, signature, nonce, ...payload } = message;
        const expectedChecksum = DataIntegrityValidator.generateChecksum(payload);
        
        if (checksum !== expectedChecksum) {
          errors.push('Message integrity check failed');
        }
      }

      // Session validation
      if (message.sessionId && this.user) {
        if (message.sessionId !== this.user.sessionId) {
          errors.push('Invalid session ID');
        }
      }

      // Command authorization
      if (message.command && this.user) {
        if (!this.securityMiddleware.validateCommand(message.command, this.user)) {
          errors.push(`Unauthorized command: ${message.command}`);
        }
      }

      // Timestamp validation (prevent replay attacks)
      const messageTime = new Date(message.timestamp);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - messageTime.getTime());
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxAge) {
        errors.push('Message timestamp too old');
      }

      if (errors.length === 0) {
        return {
          isValid: true,
          errors: [],
          message: message as SecureMessage
        };
      }

      return { isValid: false, errors };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Send secure message through channel
   */
  async sendSecureMessage(
    channelId: string,
    message: SecureMessage,
    targetWindow?: Window
  ): Promise<boolean> {
    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      if (!channel.isVerified) {
        throw new Error('Channel not verified');
      }

      // Encrypt sensitive data if needed
      let messageToSend = { ...message };
      if (message.data && typeof message.data === 'object') {
        messageToSend.data = this.encryptSensitiveData(message.data);
      }

      // Send message
      if (targetWindow) {
        targetWindow.postMessage(messageToSend, channel.origin);
      } else {
        // Default iframe communication
        const iframe = document.querySelector('iframe[src*="' + channel.origin + '"]') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(messageToSend, channel.origin);
        }
      }

      // Update channel statistics
      channel.messageCount++;
      channel.lastActivity = new Date();

      console.log(`Secure message sent through channel ${channelId}:`, message.type);
      return true;

    } catch (error) {
      console.error('Failed to send secure message:', error);
      
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.errorCount++;
      }
      
      return false;
    }
  }

  /**
   * Handle incoming secure message
   */
  handleIncomingMessage(
    messageEvent: MessageEvent,
    onMessage?: (message: SecureMessage) => void
  ): void {
    const validation = this.validateSecureMessage(messageEvent.data, messageEvent.origin);
    
    if (!validation.isValid) {
      console.warn('Invalid secure message received:', validation.errors);
      return;
    }

    const message = validation.message!;
    
    // Find or create channel
    let channelId: string | undefined;
    for (const [id, channel] of this.channels.entries()) {
      if (channel.origin === messageEvent.origin) {
        channelId = id;
        channel.lastActivity = new Date();
        channel.messageCount++;
        break;
      }
    }

    if (!channelId) {
      channelId = this.registerChannel(messageEvent.origin);
    }

    // Queue message
    this.queueMessage(channelId, message);

    // Call message handler
    if (onMessage) {
      onMessage(message);
    }

    console.log(`Secure message received on channel ${channelId}:`, message.type);
  }

  /**
   * Get channel statistics
   */
  getChannelStats(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Get all channels
   */
  getAllChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Clean up expired channels
   */
  cleanupChannels(): void {
    const now = new Date();
    const maxInactivity = 30 * 60 * 1000; // 30 minutes

    for (const [channelId, channel] of this.channels.entries()) {
      const inactiveTime = now.getTime() - channel.lastActivity.getTime();
      
      if (inactiveTime > maxInactivity) {
        this.channels.delete(channelId);
        this.messageQueue.delete(channelId);
        console.log(`Channel ${channelId} cleaned up due to inactivity`);
      }
    }
  }

  private sanitizeMessageData(data: any): any {
    if (typeof data === 'string') {
      return SecurityValidator.sanitizeText(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeMessageData(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeMessageData(value);
      }
      return sanitized;
    }

    return data;
  }

  private encryptSensitiveData(data: any): any {
    // In a real implementation, identify and encrypt sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    if (data && typeof data === 'object') {
      const result = { ...data };
      
      for (const field of sensitiveFields) {
        if (result[field] && typeof result[field] === 'string') {
          result[field] = MessageCrypto.encrypt(result[field]);
        }
      }
      
      return result;
    }

    return data;
  }

  private queueMessage(channelId: string, message: SecureMessage): void {
    const queue = this.messageQueue.get(channelId) || [];
    queue.push(message);
    
    // Keep only last 100 messages per channel
    if (queue.length > 100) {
      queue.shift();
    }
    
    this.messageQueue.set(channelId, queue);
  }
}

// React hook for secure communication
export const useSecureCommunication = (config?: any) => {
  const [manager] = React.useState(() => new SecureCommunicationManager(config));
  const [isInitialized, setIsInitialized] = React.useState(false);

  const initialize = React.useCallback((user: SecurityUser) => {
    manager.initialize(user);
    setIsInitialized(true);
  }, [manager]);

  const createMessage = React.useCallback((
    type: SecureMessage['type'],
    command?: string,
    data?: any
  ) => {
    return manager.createSecureMessage(type, command, data);
  }, [manager]);

  const sendMessage = React.useCallback(async (
    channelId: string,
    message: SecureMessage,
    targetWindow?: Window
  ) => {
    return manager.sendSecureMessage(channelId, message, targetWindow);
  }, [manager]);

  const validateMessage = React.useCallback((message: any, origin: string) => {
    return manager.validateSecureMessage(message, origin);
  }, [manager]);

  const handleMessage = React.useCallback((
    event: MessageEvent,
    onMessage?: (message: SecureMessage) => void
  ) => {
    manager.handleIncomingMessage(event, onMessage);
  }, [manager]);

  React.useEffect(() => {
    // Auto cleanup channels every 5 minutes
    const interval = setInterval(() => {
      manager.cleanupChannels();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [manager]);

  return {
    manager,
    isInitialized,
    initialize,
    createMessage,
    sendMessage,
    validateMessage,
    handleMessage,
    getChannelStats: manager.getChannelStats.bind(manager),
    getAllChannels: manager.getAllChannels.bind(manager)
  };
};

export default SecureCommunicationManager;