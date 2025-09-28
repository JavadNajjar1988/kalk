import { describe, beforeEach, afterEach, it, expect, vi, Mock } from 'vitest';
import { OrbatMessageBridge } from '../adapters/OrbatMessageBridge';
import type { 
  CommandMessage, 
  ResponseMessage, 
  EventMessage,
  OrbatCommandType 
} from '../types/orbat-bridge';

// Mock iframe for testing
class MockIframe {
  contentWindow: {
    postMessage: Mock;
  };
  
  constructor() {
    this.contentWindow = {
      postMessage: vi.fn()
    };
  }
  
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

describe('OrbatMessageBridge', () => {
  let bridge: OrbatMessageBridge;
  let mockIframe: MockIframe;
  let mockWindow: any;

  beforeEach(() => {
    mockIframe = new MockIframe();
    mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: vi.fn()
    };
    
    // Mock global window
    global.window = mockWindow;
    
    bridge = new OrbatMessageBridge();
    (bridge as any).iframe = mockIframe;
  });

  afterEach(() => {
    vi.clearAllMocks();
    bridge.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(bridge).toBeDefined();
      expect((bridge as any).config.timeout).toBe(30000);
      expect((bridge as any).config.retryAttempts).toBe(3);
    });

    it('should accept custom configuration', () => {
      const customBridge = new OrbatMessageBridge({
        timeout: 15000,
        retryAttempts: 5,
        enableHeartbeat: true
      });
      
      expect((customBridge as any).config.timeout).toBe(15000);
      expect((customBridge as any).config.retryAttempts).toBe(5);
      expect((customBridge as any).config.enableHeartbeat).toBe(true);
      
      customBridge.destroy();
    });
  });

  describe('Message Sending', () => {
    it('should send command messages with correct format', async () => {
      const command: OrbatCommandType = 'LOAD_SCENARIO';
      const data = { scenarioId: 'test-scenario' };
      
      // Mock successful response
      setTimeout(() => {
        const responseMessage: ResponseMessage = {
          id: expect.any(String),
          type: 'RESPONSE',
          success: true,
          data: { result: 'success' },
          timestamp: new Date()
        };
        
        // Simulate message event
        const messageEvent = new MessageEvent('message', {
          data: responseMessage,
          origin: 'http://localhost:5173'
        });
        
        mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')[1](messageEvent);
      }, 100);
      
      const result = await bridge.sendCommand(command, data);
      
      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'COMMAND',
          command,
          data,
          timestamp: expect.any(Date)
        }),
        'http://localhost:5173'
      );
      
      expect(result).toEqual({ result: 'success' });
    });

    it('should handle command timeout', async () => {
      const command: OrbatCommandType = 'LOAD_SCENARIO';
      const data = { scenarioId: 'test-scenario' };
      
      // Don't send any response to trigger timeout
      const bridgeWithShortTimeout = new OrbatMessageBridge({ timeout: 100 });
      (bridgeWithShortTimeout as any).iframe = mockIframe;
      
      await expect(bridgeWithShortTimeout.sendCommand(command, data))
        .rejects.toThrow('Command timeout after 100ms');
        
      bridgeWithShortTimeout.destroy();
    });

    it('should retry failed commands', async () => {
      const command: OrbatCommandType = 'LOAD_SCENARIO';
      const data = { scenarioId: 'test-scenario' };
      
      let attemptCount = 0;
      
      // Mock failed responses for first 2 attempts, then success
      setTimeout(() => {
        const interval = setInterval(() => {
          attemptCount++;
          
          let responseMessage: ResponseMessage;
          
          if (attemptCount < 3) {
            responseMessage = {
              id: expect.any(String),
              type: 'RESPONSE',
              success: false,
              error: 'Temporary failure',
              timestamp: new Date()
            };
          } else {
            responseMessage = {
              id: expect.any(String),
              type: 'RESPONSE',
              success: true,
              data: { result: 'success after retry' },
              timestamp: new Date()
            };
            clearInterval(interval);
          }
          
          const messageEvent = new MessageEvent('message', {
            data: responseMessage,
            origin: 'http://localhost:5173'
          });
          
          mockWindow.addEventListener.mock.calls
            .find(call => call[0] === 'message')[1](messageEvent);
        }, 50);
      }, 50);
      
      const result = await bridge.sendCommand(command, data);
      
      expect(result).toEqual({ result: 'success after retry' });
      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Event Handling', () => {
    it('should register and handle event listeners', () => {
      const eventHandler = vi.fn();
      
      bridge.addEventListener('UNIT_CHANGED', eventHandler);
      
      // Simulate event message
      const eventMessage: EventMessage = {
        id: 'event-1',
        type: 'EVENT',
        eventType: 'UNIT_CHANGED',
        data: { unitId: 'unit-1', changes: { name: 'Updated Unit' } },
        timestamp: new Date()
      };
      
      const messageEvent = new MessageEvent('message', {
        data: eventMessage,
        origin: 'http://localhost:5173'
      });
      
      mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);
      
      expect(eventHandler).toHaveBeenCalledWith(eventMessage.data);
    });

    it('should remove event listeners', () => {
      const eventHandler = vi.fn();
      
      bridge.addEventListener('UNIT_CHANGED', eventHandler);
      bridge.removeEventListener('UNIT_CHANGED', eventHandler);
      
      // Simulate event message
      const eventMessage: EventMessage = {
        id: 'event-1',
        type: 'EVENT',
        eventType: 'UNIT_CHANGED',
        data: { unitId: 'unit-1' },
        timestamp: new Date()
      };
      
      const messageEvent = new MessageEvent('message', {
        data: eventMessage,
        origin: 'http://localhost:5173'
      });
      
      mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);
      
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should wait for ready state', async () => {
      // Simulate ready message after delay
      setTimeout(() => {
        const readyMessage: EventMessage = {
          id: 'ready-1',
          type: 'EVENT',
          eventType: 'SYSTEM_READY',
          data: { version: '1.0.0', capabilities: ['ORBAT', 'MAP'] },
          timestamp: new Date()
        };
        
        const messageEvent = new MessageEvent('message', {
          data: readyMessage,
          origin: 'http://localhost:5173'
        });
        
        mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')[1](messageEvent);
      }, 100);
      
      const readyData = await bridge.waitForReady();
      
      expect(readyData).toEqual({ 
        version: '1.0.0', 
        capabilities: ['ORBAT', 'MAP'] 
      });
    });

    it('should handle connection errors', async () => {
      // Simulate error message
      setTimeout(() => {
        const errorMessage: EventMessage = {
          id: 'error-1',
          type: 'EVENT',
          eventType: 'SYSTEM_ERROR',
          data: { error: 'Connection failed', code: 'CONN_ERR' },
          timestamp: new Date()
        };
        
        const messageEvent = new MessageEvent('message', {
          data: errorMessage,
          origin: 'http://localhost:5173'
        });
        
        mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')[1](messageEvent);
      }, 100);
      
      await expect(bridge.waitForReady(500))
        .rejects.toThrow('Ready timeout after 500ms');
    });
  });

  describe('Request/Response Pattern', () => {
    it('should handle request/response cycle', async () => {
      const requestData = { query: 'SELECT * FROM units' };
      
      // Mock response
      setTimeout(() => {
        const responseMessage: ResponseMessage = {
          id: expect.any(String),
          type: 'RESPONSE',
          success: true,
          data: { units: [{ id: 'unit-1', name: 'Alpha Company' }] },
          timestamp: new Date()
        };
        
        const messageEvent = new MessageEvent('message', {
          data: responseMessage,
          origin: 'http://localhost:5173'
        });
        
        mockWindow.addEventListener.mock.calls
          .find(call => call[0] === 'message')[1](messageEvent);
      }, 100);
      
      const result = await bridge.requestData('GET_UNITS', requestData);
      
      expect(result).toEqual({ 
        units: [{ id: 'unit-1', name: 'Alpha Company' }] 
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Send malformed message
      const messageEvent = new MessageEvent('message', {
        data: 'invalid-json',
        origin: 'http://localhost:5173'
      });
      
      mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Ignoring invalid message:', 
        'invalid-json'
      );
      
      consoleSpy.mockRestore();
    });

    it('should ignore messages from wrong origin', () => {
      const eventHandler = vi.fn();
      bridge.addEventListener('UNIT_CHANGED', eventHandler);
      
      const eventMessage: EventMessage = {
        id: 'event-1',
        type: 'EVENT',
        eventType: 'UNIT_CHANGED',
        data: { unitId: 'unit-1' },
        timestamp: new Date()
      };
      
      // Message from wrong origin
      const messageEvent = new MessageEvent('message', {
        data: eventMessage,
        origin: 'http://malicious-site.com'
      });
      
      mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'message')[1](messageEvent);
      
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up listeners on destroy', () => {
      bridge.destroy();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should reject pending promises on destroy', async () => {
      const command: OrbatCommandType = 'LOAD_SCENARIO';
      const data = { scenarioId: 'test-scenario' };
      
      const commandPromise = bridge.sendCommand(command, data);
      bridge.destroy();
      
      await expect(commandPromise).rejects.toThrow('Bridge destroyed');
    });
  });
});