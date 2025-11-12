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
  private parentOrigin = (() => {
    const raw = (import.meta as any).env?.VITE_PARENT_ORIGIN as string | undefined;
    const resolved = raw && raw.trim().length > 0 ? raw : 'http://127.0.0.1:3000';
    return resolved.replace(/\/+$/, '');
  })();
  private currentToken: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Check if running in integration mode
    const urlParams = new URLSearchParams(window.location.search);
    this.isIntegrationMode = urlParams.get('integration') === 'react';

    console.log('[ReactBridge] URL params:', window.location.search);
    console.log('[ReactBridge] Integration mode:', this.isIntegrationMode);

    if (this.isIntegrationMode) {
      console.log('[ReactBridge] Integration mode enabled');
      this.applyDashboardTheme();
      
      // Check for token in URL parameter as fallback
      const tokenFromUrl = urlParams.get('token');
      if (tokenFromUrl) {
        console.log('[ReactBridge] Found token in URL parameter, storing it');
        try {
          this.currentToken = tokenFromUrl;
          localStorage.setItem('access_token', tokenFromUrl);
          console.log('[ReactBridge] Token stored from URL parameter');
          this.removeQueryParam('token');
        } catch (e) {
          console.error('[ReactBridge] Failed to store token from URL', e);
        }
      }
      
      this.setupMessageListener();
      
      // Wait for DOM to be ready before notifying
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.waitForVueApp();
        });
      } else {
        this.waitForVueApp();
      }
    } else {
      console.log('[ReactBridge] Not in integration mode, skipping bridge setup');
    }
  }

  private waitForVueApp() {
    console.log('[ReactBridge] Waiting for Vue app to mount...');
    // Wait for Vue app to mount
    const checkInterval = setInterval(() => {
      // Check if Vue app is mounted (look for Vue app element)
      const appElement = document.getElementById('app');
      console.log('[ReactBridge] App element:', appElement, 'Children:', appElement?.children.length);
      if (appElement && appElement.children.length > 0) {
        clearInterval(checkInterval);
        console.log('[ReactBridge] Vue app mounted, notifying ready');
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
    console.log('[ReactBridge] Notifying parent that Vue app is ready');
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
    console.log('[ReactBridge] Received AUTH_TOKEN message');
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
      console.log('[ReactBridge] Auth token stored successfully');
      this.sendEvent('AUTH_APPLIED', { exp });
      // Notify local Vue app
      try {
        window.dispatchEvent(new CustomEvent('kalk-auth-applied', { detail: { token, exp } }));
      } catch {}
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
      // Notify local Vue app
      try {
        window.dispatchEvent(new CustomEvent('kalk-auth-cleared'));
      } catch {}
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

  private removeQueryParam(param: string) {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has(param)) {
        return;
      }
      url.searchParams.delete(param);
      const nextSearch = url.searchParams.toString();
      const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
      window.history.replaceState({}, document.title, nextUrl);
      console.log(`[ReactBridge] Removed '${param}' from URL query`);
    } catch (error) {
      console.warn('[ReactBridge] Failed to strip query parameter', param, error);
    }
  }

  private applyDashboardTheme() {
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      const app = document.getElementById('app');

      root.classList.add('react-integration-mode');
      root.style.backgroundColor = '#f0f4f8';
      body.classList.add('react-integration-mode');
      body.style.backgroundColor = '#f0f4f8';
      if (app) {
        app.style.backgroundColor = '#f0f4f8';
      }

      const themeVariables: Record<string, string> = {
        '--background': '213 33% 96%',
        '--foreground': '220 46% 10%',
        '--card': '0 0% 100%',
        '--card-foreground': '220 46% 10%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '220 46% 10%',
        '--primary': '212 75% 42%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '207 72% 47%',
        '--secondary-foreground': '0 0% 100%',
        '--muted': '213 28% 88%',
        '--muted-foreground': '215 16% 34%',
        '--accent': '216 87% 34%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '0 84% 60%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '213 28% 85%',
        '--input': '213 28% 85%',
        '--ring': '212 74% 45%',
        '--chart-1': '212 75% 42%',
        '--chart-2': '207 72% 47%',
        '--chart-3': '204 80% 45%',
        '--chart-4': '199 90% 56%',
        '--chart-5': '187 73% 52%',
        '--sidebar': '213 33% 96%',
        '--sidebar-foreground': '220 46% 10%',
        '--sidebar-primary': '212 75% 42%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '213 33% 90%',
        '--sidebar-accent-foreground': '220 46% 10%',
        '--sidebar-border': '213 28% 85%',
        '--sidebar-ring': '207 72% 47%',
        '--heading': '#0d1421',
        '--subheading': '#1f2937',
        '--panel': '#ffffff',
        '--panel-foreground': '#0d1421',
        '--mpanel': '#f8fbff',
        '--color-background': '#f0f4f8',
        '--color-foreground': '#0d1421',
        '--color-card': '#ffffff',
        '--color-card-foreground': '#0d1421',
        '--color-popover': '#ffffff',
        '--color-popover-foreground': '#0d1421',
        '--color-primary': '#1565c0',
        '--color-primary-foreground': '#ffffff',
        '--color-secondary': '#1976d2',
        '--color-secondary-foreground': '#ffffff',
        '--color-muted': '#e1e8ed',
        '--color-muted-foreground': '#4b5563',
        '--color-accent': '#0d47a1',
        '--color-accent-foreground': '#ffffff',
        '--color-destructive': '#dc2626',
        '--color-destructive-foreground': '#ffffff',
        '--color-border': '#cbd5e0',
        '--color-input': '#cbd5e0',
        '--color-ring': '#1976d2',
        '--color-sidebar': '#f0f4f8',
        '--color-sidebar-foreground': '#0d1421',
        '--color-sidebar-primary': '#1565c0',
        '--color-sidebar-primary-foreground': '#ffffff',
        '--color-sidebar-accent': '#d1dce5',
        '--color-sidebar-accent-foreground': '#0d1421',
        '--color-sidebar-border': '#cbd5e0',
        '--color-sidebar-ring': '#1976d2'
      };

      Object.entries(themeVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      console.log('[ReactBridge] Dashboard theme variables injected');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
    } else {
      applyTheme();
    }
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
