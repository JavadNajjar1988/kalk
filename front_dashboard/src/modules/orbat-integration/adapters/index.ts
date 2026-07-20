/**
 * Adapters Index - Export all adapter classes
 */

export { OrbatMessageBridge } from './OrbatMessageBridge';
export { OrbatEventAdapter } from './OrbatEventAdapter';
export { OrbatCommandHandler } from './OrbatCommandHandler';
export { OrbatStateSync } from './OrbatStateSync';

// Re-export types for bridge configuration
export type { 
  BridgeConfig,
  MessageHandler
} from '../types/orbat-bridge';