// Collaboration Types for Field Management System

// User information for collaboration
export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActive: Date;
  color: string; // For cursor and selection highlighting
}

// Comment on a field
export interface FieldComment {
  id: string;
  fieldId: string;
  author: Collaborator;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  resolvedBy?: Collaborator;
  resolvedAt?: Date;
  replies: FieldComment[];
}

// Real-time cursor position
export interface CursorPosition {
  userId: string;
  fieldId: string;
  position: number;
  selectionStart?: number;
  selectionEnd?: number;
  timestamp: Date;
}

// Field change event
export interface FieldChangeEvent {
  id: string;
  fieldId: string;
  userId: string;
  userName: string;
  changeType: 'create' | 'update' | 'delete' | 'move';
  fieldName: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  description: string;
}

// Collaboration session
export interface CollaborationSession {
  id: string;
  fieldDefinitionId: string;
  participants: Collaborator[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  comments: FieldComment[];
  changeHistory: FieldChangeEvent[];
}

// Real-time editing conflict
export interface EditingConflict {
  id: string;
  fieldId: string;
  conflictingUsers: Collaborator[];
  conflictingChanges: FieldChangeEvent[];
  resolutionRequired: boolean;
  createdAt: Date;
}

// Notification for collaboration events
export interface CollaborationNotification {
  id: string;
  type: 'comment' | 'mention' | 'conflict' | 'resolution' | 'user_join' | 'user_leave';
  userId: string;
  targetUserId?: string;
  fieldId: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

// Mention in comments
export interface Mention {
  id: string;
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

// Collaboration settings
export interface CollaborationSettings {
  enableRealTimeEditing: boolean;
  enableComments: boolean;
  enableNotifications: boolean;
  enableConflictDetection: boolean;
  autoSaveInterval: number; // in seconds
  maxConcurrentEditors: number;
  allowAnonymousViewers: boolean;
}

// Presence status
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentFieldId?: string;
}