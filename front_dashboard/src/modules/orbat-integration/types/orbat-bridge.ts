/**
 * Types for ORBAT Bridge Communication
 * پیام‌های ارتباطی بین React و Vue ORBAT Mapper
 */

// Base message structure
export interface BaseMessage {
  id?: string;
  timestamp?: number;
  origin: 'react' | 'vue';
}

// Message types
export type MessageType = 
  | 'ORBAT_COMMAND'
  | 'ORBAT_REQUEST' 
  | 'ORBAT_RESPONSE'
  | 'ORBAT_EVENT'
  | 'ORBAT_ERROR'
  | 'ORBAT_READY'
  | 'ORBAT_STATE_UPDATE'
  | 'LOGOUT_REQUEST';

// Command message from React to Vue
export interface CommandMessage extends BaseMessage {
  type: 'ORBAT_COMMAND';
  command: string;
  payload?: any;
}

// Request message from React to Vue
export interface RequestMessage extends BaseMessage {
  type: 'ORBAT_REQUEST';
  dataType: string;
  params?: any;
}

// Response message from Vue to React
export interface ResponseMessage extends BaseMessage {
  type: 'ORBAT_RESPONSE';
  requestId?: string;
  data: any;
  success: boolean;
  error?: string;
}

// Event message from Vue to React
export interface EventMessage extends BaseMessage {
  type: 'ORBAT_EVENT';
  eventType: string;
  data: any;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: 'ORBAT_ERROR';
  error: string;
  details?: any;
}

// Ready message when ORBAT is loaded
export interface ReadyMessage extends BaseMessage {
  type: 'ORBAT_READY';
  capabilities: string[];
  version?: string;
}

// State update message
export interface StateUpdateMessage extends BaseMessage {
  type: 'ORBAT_STATE_UPDATE';
  stateType: string;
  state: any;
}

// Union type for all messages
export type OrbatMessage = 
  | CommandMessage
  | RequestMessage
  | ResponseMessage
  | EventMessage
  | ErrorMessage
  | ReadyMessage
  | StateUpdateMessage;

// Message handler type
export type MessageHandler = (message: OrbatMessage) => void;
export type EventHandler<T = any> = (data: T) => void;

// Bridge configuration
export interface BridgeConfig {
  targetOrigin: string;
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
}

// Command types
export type OrbatCommandType = 
  | 'LOAD_SCENARIO'
  | 'SAVE_SCENARIO'
  | 'ADD_UNIT'
  | 'UPDATE_UNIT'
  | 'DELETE_UNIT'
  | 'MOVE_UNIT'
  | 'SET_VIEW_MODE'
  | 'ZOOM_TO_UNIT'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA';

// Event types
export type OrbatEventType = 
  | 'SCENARIO_LOADED'
  | 'SCENARIO_SAVED'
  | 'UNIT_ADDED'
  | 'UNIT_UPDATED'
  | 'UNIT_DELETED'
  | 'UNIT_MOVED'
  | 'UNIT_SELECTED'
  | 'VIEW_CHANGED'
  | 'SELECTION_CHANGED';

// Command response
export interface CommandResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}