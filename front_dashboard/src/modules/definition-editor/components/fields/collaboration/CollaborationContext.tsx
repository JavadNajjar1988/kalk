// Collaboration Context for Field Management System
import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import {
  Collaborator,
  FieldComment,
  CursorPosition,
  CollaborationSession,
  CollaborationNotification,
  CollaborationSettings,
  UserPresence,
  EditingConflict,
  FieldChangeEvent
} from './types';

// Collaboration context state
interface CollaborationState {
  session: CollaborationSession | null;
  currentUser: Collaborator | null;
  collaborators: Collaborator[];
  comments: FieldComment[];
  cursors: CursorPosition[];
  notifications: CollaborationNotification[];
  settings: CollaborationSettings;
  presence: UserPresence[];
  conflicts: EditingConflict[];
  changeHistory: FieldChangeEvent[];
  isConnected: boolean;
  isLoading: boolean;
}

// Action types for reducer
type CollaborationAction =
  | { type: 'SET_SESSION'; payload: CollaborationSession | null }
  | { type: 'SET_CURRENT_USER'; payload: Collaborator }
  | { type: 'ADD_COLLABORATOR'; payload: Collaborator }
  | { type: 'REMOVE_COLLABORATOR'; payload: string }
  | { type: 'UPDATE_COLLABORATOR'; payload: Collaborator }
  | { type: 'ADD_COMMENT'; payload: FieldComment }
  | { type: 'UPDATE_COMMENT'; payload: FieldComment }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'RESOLVE_COMMENT'; payload: { commentId: string; resolvedBy: Collaborator } }
  | { type: 'ADD_CURSOR'; payload: CursorPosition }
  | { type: 'REMOVE_CURSOR'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: CollaborationNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: CollaborationSettings }
  | { type: 'UPDATE_PRESENCE'; payload: UserPresence }
  | { type: 'ADD_CONFLICT'; payload: EditingConflict }
  | { type: 'RESOLVE_CONFLICT'; payload: string }
  | { type: 'ADD_CHANGE_EVENT'; payload: FieldChangeEvent }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: CollaborationState = {
  session: null,
  currentUser: null,
  collaborators: [],
  comments: [],
  cursors: [],
  notifications: [],
  settings: {
    enableRealTimeEditing: true,
    enableComments: true,
    enableNotifications: true,
    enableConflictDetection: true,
    autoSaveInterval: 30,
    maxConcurrentEditors: 10,
    allowAnonymousViewers: false
  },
  presence: [],
  conflicts: [],
  changeHistory: [],
  isConnected: false,
  isLoading: false
};

// Reducer function
const collaborationReducer = (state: CollaborationState, action: CollaborationAction): CollaborationState => {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'ADD_COLLABORATOR':
      return {
        ...state,
        collaborators: [...state.collaborators, action.payload]
      };
    
    case 'REMOVE_COLLABORATOR':
      return {
        ...state,
        collaborators: state.collaborators.filter(c => c.id !== action.payload)
      };
    
    case 'UPDATE_COLLABORATOR':
      return {
        ...state,
        collaborators: state.collaborators.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload]
      };
    
    case 'UPDATE_COMMENT':
      return {
        ...state,
        comments: state.comments.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(c => c.id !== action.payload)
      };
    
    case 'RESOLVE_COMMENT':
      return {
        ...state,
        comments: state.comments.map(c => 
          c.id === action.payload.commentId 
            ? { ...c, resolved: true, resolvedBy: action.payload.resolvedBy, resolvedAt: new Date() } 
            : c
        )
      };
    
    case 'ADD_CURSOR':
      return {
        ...state,
        cursors: [...state.cursors.filter(c => c.userId !== action.payload.userId), action.payload]
      };
    
    case 'REMOVE_CURSOR':
      return {
        ...state,
        cursors: state.cursors.filter(c => c.userId !== action.payload)
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      };
    
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: action.payload
      };
    
    case 'UPDATE_PRESENCE':
      return {
        ...state,
        presence: [...state.presence.filter(p => p.userId !== action.payload.userId), action.payload]
      };
    
    case 'ADD_CONFLICT':
      return {
        ...state,
        conflicts: [...state.conflicts, action.payload]
      };
    
    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        conflicts: state.conflicts.filter(c => c.id !== action.payload)
      };
    
    case 'ADD_CHANGE_EVENT':
      return {
        ...state,
        changeHistory: [...state.changeHistory, action.payload]
      };
    
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

// Context creation
interface CollaborationContextType extends CollaborationState {
  // Session management
  createSession: (fieldDefinitionId: string) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
  
  // Comment operations
  addComment: (comment: Omit<FieldComment, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'replies'>) => Promise<void>;
  updateComment: (comment: FieldComment) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  
  // Cursor operations
  updateCursorPosition: (position: Omit<CursorPosition, 'timestamp'>) => void;
  
  // Notification operations
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  
  // Settings operations
  updateSettings: (settings: Partial<CollaborationSettings>) => void;
  
  // Conflict operations
  resolveConflict: (conflictId: string) => Promise<void>;
  
  // Utility functions
  getCommentsForField: (fieldId: string) => FieldComment[];
  getUnreadNotificationsCount: () => number;
  getActiveCollaborators: () => Collaborator[];
  getUserPresence: (userId: string) => UserPresence | undefined;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// Provider component
export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Simulate session creation
  const createSession = useCallback(async (fieldDefinitionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real implementation, this would connect to a WebSocket server
      // and create a collaboration session
      const session: CollaborationSession = {
        id: `session_${Date.now()}`,
        fieldDefinitionId,
        participants: state.currentUser ? [state.currentUser] : [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        changeHistory: []
      };
      
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      console.error('Failed to create collaboration session:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentUser]);

  // Simulate joining a session
  const joinSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real implementation, this would connect to a WebSocket server
      // and join an existing collaboration session
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Simulate leaving a session
  const leaveSession = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Close WebSocket connection
      if (socket) {
        socket.close();
        setSocket(null);
      }
      
      // Reset session state
      dispatch({ type: 'SET_SESSION', payload: null });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    } catch (error) {
      console.error('Failed to leave collaboration session:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [socket]);

  // Add a comment
  const addComment = useCallback(async (commentData: Omit<FieldComment, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'replies'>) => {
    if (!state.currentUser) return;
    
    const comment: FieldComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...commentData,
      author: state.currentUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      replies: []
    };
    
    dispatch({ type: 'ADD_COMMENT', payload: comment });
    
    // In a real implementation, this would send the comment to the server
    // via WebSocket
  }, [state.currentUser]);

  // Update a comment
  const updateComment = useCallback(async (comment: FieldComment) => {
    const updatedComment = {
      ...comment,
      updatedAt: new Date()
    };
    
    dispatch({ type: 'UPDATE_COMMENT', payload: updatedComment });
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    dispatch({ type: 'DELETE_COMMENT', payload: commentId });
  }, []);

  // Resolve a comment
  const resolveComment = useCallback(async (commentId: string) => {
    if (!state.currentUser) return;
    
    dispatch({ 
      type: 'RESOLVE_COMMENT', 
      payload: { commentId, resolvedBy: state.currentUser } 
    });
  }, [state.currentUser]);

  // Update cursor position
  const updateCursorPosition = useCallback((position: Omit<CursorPosition, 'timestamp'>) => {
    const cursor: CursorPosition = {
      ...position,
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_CURSOR', payload: cursor });
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  }, []);

  // Delete a notification
  const deleteNotification = useCallback((notificationId: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<CollaborationSettings>) => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { ...state.settings, ...settings } 
    });
  }, [state.settings]);

  // Resolve a conflict
  const resolveConflict = useCallback(async (conflictId: string) => {
    dispatch({ type: 'RESOLVE_CONFLICT', payload: conflictId });
  }, []);

  // Utility functions
  const getCommentsForField = useCallback((fieldId: string) => {
    return state.comments.filter(comment => comment.fieldId === fieldId);
  }, [state.comments]);

  const getUnreadNotificationsCount = useCallback(() => {
    return state.notifications.filter(n => !n.read).length;
  }, [state.notifications]);

  const getActiveCollaborators = useCallback(() => {
    return state.collaborators.filter(collaborator => {
      const presence = state.presence.find(p => p.userId === collaborator.id);
      return presence?.status === 'online';
    });
  }, [state.collaborators, state.presence]);

  const getUserPresence = useCallback((userId: string) => {
    return state.presence.find(p => p.userId === userId);
  }, [state.presence]);

  // Simulate real-time updates
  useEffect(() => {
    // In a real implementation, this would handle WebSocket messages
    // For now, we'll simulate some activity
    
    const interval = setInterval(() => {
      if (state.session && state.isConnected) {
        // Simulate presence updates
        if (state.currentUser) {
          dispatch({
            type: 'UPDATE_PRESENCE',
            payload: {
              userId: state.currentUser.id,
              status: 'online',
              lastSeen: new Date()
            }
          });
        }
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [state.session, state.isConnected, state.currentUser]);

  // Context value
  const contextValue: CollaborationContextType = {
    ...state,
    createSession,
    joinSession,
    leaveSession,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    updateCursorPosition,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateSettings,
    resolveConflict,
    getCommentsForField,
    getUnreadNotificationsCount,
    getActiveCollaborators,
    getUserPresence
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

// Hook to use collaboration context
export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export default CollaborationContext;