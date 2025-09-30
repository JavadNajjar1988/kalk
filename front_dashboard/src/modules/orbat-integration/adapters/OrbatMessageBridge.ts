/**
 * ORBAT Message Bridge
 * کلاس اصلی برای ارتباط بین React و Vue ORBAT Mapper
 */

import { 
  OrbatMessage, 
  MessageType, 
  CommandMessage, 
  RequestMessage, 
  ResponseMessage,
  EventMessage,
  ErrorMessage,
  ReadyMessage,
  MessageHandler,
  BridgeConfig 
} from '../types/orbat-bridge';
import { OrbatCommand, CommandResult } from '../types/orbat-commands';
import { OrbatEvent } from '../types/orbat-events';

export class OrbatMessageBridge {
  private iframe: HTMLIFrameElement | null = null;
  private messageHandlers = new Map<MessageType, Set<MessageHandler>>();
  private pendingRequests = new Map<string, {
    resolve: (data: any) => void;
    reject: (error: string) => void;
    timestamp: number;
  }>();
  private config: BridgeConfig;
  private isReady = false;
  private readyPromise: Promise<void>;
  private readyResolve?: () => void;
  private messageId = 0;

  constructor(config: Partial<BridgeConfig> = {}) {
    this.config = {
      targetOrigin: 'http://localhost:5173',
      timeout: 10000,
      retryAttempts: 3,
      enableLogging: true,
      ...config
    };

    // Initialize ready promise
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    this.init();
  }

  private init(): void {
    // Listen for messages from iframe
    window.addEventListener('message', this.handleMessage.bind(this));

    // Clean up pending requests periodically
    setInterval(() => {
      this.cleanupPendingRequests();
    }, 5000);

    this.log('OrbatMessageBridge initialized');
  }

  public setIframe(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
    this.log('Iframe attached to bridge');
    
    // Set a timeout to detect if Vue backend doesn't respond
    setTimeout(() => {
      if (!this.isReady) {
        const errorMsg = 'ORBAT backend did not respond within 10 seconds. Make sure the Vue ORBAT service is running on http://localhost:5173';
        this.log('Ready timeout:', errorMsg);
        
        // Trigger error handlers
        const handlers = this.messageHandlers.get('ORBAT_ERROR');
        if (handlers) {
          handlers.forEach(handler => handler({
            type: 'ORBAT_ERROR',
            origin: 'bridge',
            timestamp: Date.now(),
            error: errorMsg
          }));
        }
      }
    }, 10000);
  }

  public async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  public get ready(): boolean {
    return this.isReady;
  }

  // Send command to ORBAT Mapper
  public async sendCommand(command: string, payload?: any): Promise<CommandResult> {
    if (!this.isReady) {
      throw new Error('ORBAT Mapper is not ready');
    }

    const message: CommandMessage = {
      id: this.generateMessageId(),
      type: 'ORBAT_COMMAND',
      origin: 'react',
      timestamp: Date.now(),
      command,
      payload
    };

    return this.sendMessageWithResponse(message);
  }

  // Request data from ORBAT Mapper
  public async requestData(dataType: string, params?: any): Promise<any> {
    if (!this.isReady) {
      throw new Error('ORBAT Mapper is not ready');
    }

    const message: RequestMessage = {
      id: this.generateMessageId(),
      type: 'ORBAT_REQUEST',
      origin: 'react',
      timestamp: Date.now(),
      dataType,
      params
    };

    return this.sendMessageWithResponse(message);
  }

  // Send message and wait for response
  private async sendMessageWithResponse(message: CommandMessage | RequestMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.iframe?.contentWindow) {
        reject('Iframe not available');
        return;
      }

      // Store pending request
      if (message.id) {
        this.pendingRequests.set(message.id, {
          resolve,
          reject,
          timestamp: Date.now()
        });
      }

      // Send message
      this.iframe.contentWindow.postMessage(message, this.config.targetOrigin);
      this.log('Sent message:', message);

      // Set timeout
      setTimeout(() => {
        if (message.id && this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(`Request timeout: ${message.type}`);
        }
      }, this.config.timeout);
    });
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    // Log all incoming messages for debugging
    console.log('[OrbatBridge] Raw message received:', {
      origin: event.origin,
      data: event.data,
      expectedOrigin: this.config.targetOrigin
    });
    
    // Validate origin
    if (event.origin !== this.config.targetOrigin) {
      this.log('Message from invalid origin:', event.origin);
      return;
    }

    const message = event.data as OrbatMessage;
    if (!this.isValidMessage(message)) {
      this.log('Invalid message received:', message);
      return;
    }

    this.log('Received message:', message);

    // Handle response messages
    if (message.type === 'ORBAT_RESPONSE' && message.id) {
      this.handleResponse(message as ResponseMessage);
      return;
    }

    // Handle ready message
    if (message.type === 'ORBAT_READY') {
      this.handleReady(message as ReadyMessage);
      return;
    }

    // Handle error messages
    if (message.type === 'ORBAT_ERROR') {
      this.handleError(message as ErrorMessage);
      return;
    }

    // Handle event messages
    if (message.type === 'ORBAT_EVENT') {
      this.handleEvent(message as EventMessage);
      return;
    }

    // Dispatch to registered handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          this.log('Error in message handler:', error);
        }
      });
    }
  }

  private handleResponse(message: ResponseMessage): void {
    if (!message.id) return;

    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      this.pendingRequests.delete(message.id);
      
      if (message.success) {
        pending.resolve(message.data);
      } else {
        pending.reject(message.error || 'Unknown error');
      }
    }
  }

  private handleReady(message: ReadyMessage): void {
    this.isReady = true;
    this.log('ORBAT Mapper is ready:', message.data);
    
    if (this.readyResolve) {
      this.readyResolve();
    }

    // Notify handlers
    const handlers = this.messageHandlers.get('ORBAT_READY');
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleError(message: ErrorMessage): void {
    this.log('ORBAT Error:', message.error, message.details);
    
    // Notify handlers
    const handlers = this.messageHandlers.get('ORBAT_ERROR');
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleEvent(message: EventMessage): void {
    this.log('ORBAT Event:', message.eventType, message.data);
    
    // Notify handlers
    const handlers = this.messageHandlers.get('ORBAT_EVENT');
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  // Register message handler
  public onMessage(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  // Register event listener (convenience method)
  public onEvent(eventType: string, handler: (data: any) => void): () => void {
    return this.onMessage('ORBAT_EVENT', (message: OrbatMessage) => {
      if (message.type === 'ORBAT_EVENT') {
        const eventMessage = message as EventMessage;
        if (eventMessage.eventType === eventType) {
          handler(eventMessage.data);
        }
      }
    });
  }

  // Register error listener
  public onError(handler: (error: string, details?: any) => void): () => void {
    return this.onMessage('ORBAT_ERROR', (message: OrbatMessage) => {
      if (message.type === 'ORBAT_ERROR') {
        const errorMessage = message as ErrorMessage;
        handler(errorMessage.error, errorMessage.details);
      }
    });
  }

  // Utility methods
  private generateMessageId(): string {
    return `react_${++this.messageId}_${Date.now()}`;
  }

  private isValidMessage(message: any): message is OrbatMessage {
    return message && 
           typeof message === 'object' && 
           typeof message.type === 'string' &&
           typeof message.origin === 'string';
  }

  private cleanupPendingRequests(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.pendingRequests.forEach((request, id) => {
      if (now - request.timestamp > this.config.timeout) {
        expired.push(id);
        request.reject('Request timeout');
      }
    });

    expired.forEach(id => this.pendingRequests.delete(id));
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[OrbatBridge] ${message}`, ...args);
    }
  }

  // Cleanup
  public destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.messageHandlers.clear();
    this.pendingRequests.clear();
    this.iframe = null;
    this.isReady = false;
    this.log('OrbatMessageBridge destroyed');
  }
}