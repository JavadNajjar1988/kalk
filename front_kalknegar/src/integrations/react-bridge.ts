/**
 * React Integration Bridge for Vue ORBAT
 * ادغام Vue ORBAT با React Frontend
 */

interface OrbatMessage {
  id?: string;
  type: string;
  origin: string;
  timestamp: number;
  [key: string]: any;
}

interface ReadyMessage extends OrbatMessage {
  type: 'ORBAT_READY';
  data: {
    version: string;
    capabilities: string[];
  };
}

class ReactBridge {
  private isIntegrationMode = false;
  private parentOrigin = (import.meta as any).env?.VITE_PARENT_ORIGIN || 'http://localhost:3000';
  private currentToken: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Check if running in integration mode
    const urlParams = new URLSearchParams(window.location.search);
    this.isIntegrationMode = urlParams.get('integration') === 'react';

    if (this.isIntegrationMode) {
      console.log('[ReactBridge] Integration mode enabled');
      this.setupMessageListener();
      
      // Wait for DOM to be ready before notifying
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.waitForVueApp();
        });
      } else {
        this.waitForVueApp();
      }
    }
  }

  private waitForVueApp() {
    // Wait for Vue app to mount
    const checkInterval = setInterval(() => {
      // Check if Vue app is mounted (look for Vue app element)
      const appElement = document.getElementById('app');
      if (appElement && appElement.children.length > 0) {
        clearInterval(checkInterval);
        // Add a small delay to ensure Vue is fully initialized
        setTimeout(() => {
          this.notifyReady();
        }, 500);
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.warn('[ReactBridge] Vue app mount timeout, sending ready anyway');
      this.notifyReady();
    }, 10000);
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Validate origin
      if (event.origin !== this.parentOrigin) {
        return;
      }

      const message = event.data as OrbatMessage;
      if (!message || typeof message !== 'object') {
        return;
      }

      console.log('[ReactBridge] Received message:', message);
      
      // Handle different message types (auth bridge + data bridge)
      switch (message.type) {
        case 'AUTH_TOKEN':
          this.handleAuthToken(message);
          break;
        case 'CLEAR_TOKEN':
          this.handleClearToken();
          break;
        case 'ORBAT_COMMAND':
          this.handleCommand(message);
          break;
        case 'ORBAT_REQUEST':
          this.handleRequest(message);
          break;
        default:
          console.warn('[ReactBridge] Unknown message type:', message.type);
      }
    });
  }

  private notifyReady() {
    // Ensure we have a parent window and we're in an iframe
    if (window.parent === window) {
      console.warn('[ReactBridge] Not running in iframe, skipping ready notification');
      return;
    }

    // Send ready message to parent React app
    const readyMessage: ReadyMessage = {
      id: 'ready_' + Date.now(),
      type: 'ORBAT_READY',
      origin: 'vue',
      timestamp: Date.now(),
      data: {
        version: '0.5.0',
        capabilities: ['chart', 'map', 'grid', 'story']
      }
    };

    console.log('[ReactBridge] Sending ready message:', readyMessage);
    
    try {
      window.parent.postMessage(readyMessage, this.parentOrigin);
      console.log('[ReactBridge] Ready message sent successfully to React parent');
      
      // Send additional ready message with * origin as fallback
      setTimeout(() => {
        window.parent.postMessage(readyMessage, '*');
        console.log('[ReactBridge] Backup ready message sent with * origin');
      }, 100);
    } catch (error) {
      console.error('[ReactBridge] Failed to send ready message:', error);
    }
  }

  private handleCommand(message: OrbatMessage) {
    const { command, payload } = message;
    
    console.log('[ReactBridge] Handling command:', command, payload);
    
    // Send response back
    this.sendResponse(message.id, true, { 
      command, 
      result: 'Command executed successfully' 
    });
  }

  private handleRequest(message: OrbatMessage) {
    const { dataType, params } = message;
    
    console.log('[ReactBridge] Handling request:', dataType, params);
    
    // Mock response - replace with actual data handling
    const mockData = this.getMockData(dataType);
    
    this.sendResponse(message.id, true, mockData);
  }

  private getMockData(dataType: string) {
    switch (dataType) {
      case 'scenarios':
        return [
          { id: 'demo-Operation_Beit_ol_Moqaddas_1982_FA', name: 'آزادسازی خرمشهر – عملیات بیت‌المقدس (۱۳۶۱)' },
          { id: 'demo-Operation_Mersad_1988_FA', name: 'عملیات مرصاد (۱۳۶۷) – مقابله با تهاجم منافقین/حمایت عراق' },
          { id: 'demo-Iran_Israel_War_June_2025_FA', name: 'جنگ ایران و اسرائیل (خرداد ۱۴۰۴ / ژوئن ۲۰۲۵)' }
        ];
      case 'units':
        return [
          { id: 'unit1', name: 'Unit 1', type: 'Infantry' },
          { id: 'unit2', name: 'Unit 2', type: 'Armor' }
        ];
      default:
        return { message: 'No data available for ' + dataType };
    }
  }

  private sendMessage(message: OrbatMessage) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(message, this.parentOrigin);
        console.log('[ReactBridge] Message sent:', message);
      } catch (error) {
        console.error('[ReactBridge] Failed to send message:', message, error);
        
        // Try with wildcard origin as fallback
        try {
          window.parent.postMessage(message, '*');
          console.log('[ReactBridge] Message sent with * origin:', message);
        } catch (fallbackError) {
          console.error('[ReactBridge] Failed to send message even with * origin:', fallbackError);
        }
      }
    } else {
      console.warn('[ReactBridge] No parent window found, cannot send message:', message);
    }
  }

  private handleAuthToken(message: OrbatMessage) {
    const token = message.token as string | undefined;
    const exp = message.exp as number | undefined;
    if (!token || typeof token !== 'string') {
      console.warn('[ReactBridge] AUTH_TOKEN message missing token');
      return;
    }
    try {
      this.currentToken = token;
      // Persist for API clients that read from localStorage
      localStorage.setItem('access_token', token);
      if (exp) {
        localStorage.setItem('access_token_exp', String(exp));
      }
      console.log('[ReactBridge] Auth token stored');
      this.sendEvent('AUTH_APPLIED', { exp });
    } catch (e) {
      console.error('[ReactBridge] Failed to store auth token', e);
    }
  }

  private handleClearToken() {
    this.currentToken = null;
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('access_token_exp');
      console.log('[ReactBridge] Auth token cleared');
      this.sendEvent('AUTH_CLEARED', {});
    } catch (e) {
      console.error('[ReactBridge] Failed to clear auth token', e);
    }
  }

  private sendResponse(requestId: string | undefined, success: boolean, data: any, error?: string) {
    if (!requestId) return;

    const response = {
      id: requestId,
      type: 'ORBAT_RESPONSE',
      origin: 'vue',
      timestamp: Date.now(),
      success,
      data,
      error
    };

    this.sendMessage(response);
  }

  public sendEvent(eventType: string, data: any) {
    if (!this.isIntegrationMode) return;

    const eventMessage = {
      type: 'ORBAT_EVENT',
      origin: 'vue',
      timestamp: Date.now(),
      eventType,
      data
    };

    this.sendMessage(eventMessage);
  }
}

// Export singleton instance
export const reactBridge = new ReactBridge();

// Make it globally available for Vue components
declare global {
  interface Window {
    reactBridge: ReactBridge;
  }
}

window.reactBridge = reactBridge;