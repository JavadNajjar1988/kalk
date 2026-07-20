// Field Analytics System - Main Exports

// Core Components
export { default as AnalyticsDashboard } from './AnalyticsDashboard';

// Core Engine
export { default as FieldAnalyticsEngine } from './FieldAnalyticsEngine';

// React Hooks
export { default as useFieldAnalytics, useFieldTracking } from './useFieldAnalytics';

// Types and Interfaces
export type {
  FieldUsageEvent,
  FieldEventType,
  FieldAnalytics,
  GlobalAnalytics,
  AnalyticsQuery,
  AnalyticsFilters,
  AnalyticsDashboardConfig,
  AnalyticsWidget,
  WidgetType,
  WidgetConfig,
  FieldHealthScore,
  UserJourney
} from './types';

// Usage Examples and Documentation

/**
 * Basic Usage Example:
 * 
 * 1. Simple Analytics Dashboard:
 * ```tsx
 * import { AnalyticsDashboard } from './analytics';
 * 
 * const AnalyticsPage = () => {
 *   return (
 *     <AnalyticsDashboard
 *       fieldIds={['field1', 'field2', 'field3']}
 *       autoRefresh={true}
 *       refreshInterval={30000}
 *       onExport={(format, data) => {
 *         console.log('Exporting analytics data:', format, data);
 *       }}
 *     />
 *   );
 * };
 * ```
 * 
 * 2. Using Analytics Hook:
 * ```tsx
 * import { useFieldAnalytics } from './analytics';
 * 
 * const FieldAnalyticsComponent = ({ fieldId }) => {
 *   const {
 *     globalAnalytics,
 *     fieldAnalytics,
 *     isLoading,
 *     trackEvent,
 *     getFieldHealth
 *   } = useFieldAnalytics({
 *     defaultFieldIds: [fieldId],
 *     autoRefresh: true,
 *     refreshInterval: 60000
 *   });
 * 
 *   const fieldHealth = getFieldHealth(fieldId);
 * 
 *   return (
 *     <div>
 *       <h3>Field Analytics</h3>
 *       {isLoading ? (
 *         <p>Loading...</p>
 *       ) : (
 *         <div>
 *           <p>Health Score: {fieldHealth?.overall || 'N/A'}</p>
 *           <p>Total Events: {fieldAnalytics[0]?.totalEvents || 0}</p>
 *           <button onClick={() => trackEvent({
 *             fieldId,
 *             eventType: 'view',
 *             metadata: { source: 'analytics_component' }
 *           })}>
 *             Track View
 *           </button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 * 
 * 3. Field Interaction Tracking:
 * ```tsx
 * import { useFieldTracking } from './analytics';
 * 
 * const TrackedField = ({ fieldId, userId, sessionId }) => {
 *   const {
 *     trackFocus,
 *     trackBlur,
 *     trackChange,
 *     trackError
 *   } = useFieldTracking(fieldId, userId, sessionId);
 * 
 *   return (
 *     <input
 *       onFocus={trackFocus}
 *       onBlur={trackBlur}
 *       onChange={(e) => {
 *         trackChange(e.target.value);
 *       }}
 *       onError={(error) => {
 *         trackError(error.message);
 *       }}
 *       placeholder="Type something..."
 *     />
 *   );
 * };
 * ```
 * 
 * 4. Advanced Analytics Engine Usage:
 * ```tsx
 * import { FieldAnalyticsEngine } from './analytics';
 * 
 * const engine = FieldAnalyticsEngine.getInstance();
 * 
 * // Track various events
 * engine.trackEvent({
 *   fieldId: 'email-field',
 *   eventType: 'focus',
 *   userId: 'user123',
 *   sessionId: 'session456'
 * });
 * 
 * engine.trackEvent({
 *   fieldId: 'email-field',
 *   eventType: 'change',
 *   userId: 'user123',
 *   sessionId: 'session456',
 *   value: 'user@example.com'
 * });
 * 
 * engine.trackEvent({
 *   fieldId: 'email-field',
 *   eventType: 'error',
 *   userId: 'user123',
 *   sessionId: 'session456',
 *   metadata: { error: 'Invalid email format' }
 * });
 * 
 * // Get analytics for a field
 * const fieldAnalytics = engine.getFieldAnalytics('email-field');
 * console.log('Field completion rate:', fieldAnalytics.completionRate);
 * 
 * // Calculate field health
 * const healthScore = engine.calculateFieldHealth('email-field');
 * console.log('Field health:', healthScore.overall);
 * 
 * // Query events
 * const recentErrors = engine.queryEvents({
 *   eventTypes: ['error'],
 *   dateRange: {
 *     start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
 *     end: new Date()
 *   }
 * });
 * 
 * // Export data
 * const csvData = engine.exportData('csv', {
 *   fieldIds: ['email-field', 'phone-field'],
 *   eventTypes: ['focus', 'change', 'error']
 * });
 * ```
 * 
 * Features:
 * - Real-time analytics dashboard with KPIs
 * - Field health scoring system
 * - User journey analysis
 * - Performance monitoring
 * - Error tracking and reporting
 * - Data export capabilities (JSON/CSV)
 * - Auto-refresh with configurable intervals
 * - Glassmorphism UI design
 * - Responsive layout for all devices
 * - Type-safe analytics tracking
 * - Non-intrusive integration with existing field systems
 * - Performance optimized with React best practices
 */