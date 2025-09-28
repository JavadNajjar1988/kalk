import {
  FieldUsageEvent,
  FieldEventType,
  FieldAnalytics,
  GlobalAnalytics,
  AnalyticsQuery,
  FieldHealthScore,
  UserJourney
} from './types';

/**
 * Core Analytics Engine for Field Management System
 * Handles event collection, processing, and analysis
 */
export class FieldAnalyticsEngine {
  private static instance: FieldAnalyticsEngine;
  private events: FieldUsageEvent[] = [];
  private isCollecting: boolean = true;
  private batchSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private eventBuffer: FieldUsageEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startBatchProcessing();
  }

  public static getInstance(): FieldAnalyticsEngine {
    if (!FieldAnalyticsEngine.instance) {
      FieldAnalyticsEngine.instance = new FieldAnalyticsEngine();
    }
    return FieldAnalyticsEngine.instance;
  }

  /**
   * Track a field usage event
   */
  public trackEvent(event: Omit<FieldUsageEvent, 'id' | 'timestamp'>): void {
    if (!this.isCollecting) return;

    const fullEvent: FieldUsageEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.eventBuffer.push(fullEvent);

    // Immediate flush for critical events
    if (this.isCriticalEvent(event.eventType)) {
      this.flushEvents();
    } else if (this.eventBuffer.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Get analytics for a specific field
   */
  public getFieldAnalytics(fieldId: string, dateRange?: { start: Date; end: Date }): FieldAnalytics {
    const fieldEvents = this.getFieldEvents(fieldId, dateRange);
    
    if (fieldEvents.length === 0) {
      return this.createEmptyFieldAnalytics(fieldId);
    }

    return {
      fieldId,
      fieldName: this.getFieldName(fieldId),
      fieldType: this.getFieldType(fieldId),
      
      totalEvents: fieldEvents.length,
      uniqueUsers: this.countUniqueUsers(fieldEvents),
      totalSessions: this.countUniqueSessions(fieldEvents),
      
      firstUsed: this.getFirstUsage(fieldEvents),
      lastUsed: this.getLastUsage(fieldEvents),
      averageSessionDuration: this.calculateAverageSessionDuration(fieldEvents),
      
      focusCount: this.countEventType(fieldEvents, FieldEventType.FOCUS),
      changeCount: this.countEventType(fieldEvents, FieldEventType.CHANGE),
      validationErrors: this.countEventType(fieldEvents, FieldEventType.ERROR),
      completionRate: this.calculateCompletionRate(fieldEvents),
      
      averageRenderTime: this.calculateAverageRenderTime(fieldEvents),
      errorRate: this.calculateErrorRate(fieldEvents),
      
      dailyUsage: this.getDailyUsage(fieldEvents, dateRange),
      popularValues: this.getPopularValues(fieldEvents),
      
      dropOffRate: this.calculateDropOffRate(fieldEvents),
      timeToComplete: this.calculateTimeToComplete(fieldEvents),
      mostCommonErrors: this.getMostCommonErrors(fieldEvents)
    };
  }

  /**
   * Get global analytics across all fields
   */
  public getGlobalAnalytics(dateRange?: { start: Date; end: Date }): GlobalAnalytics {
    const events = this.getEventsInRange(dateRange);
    const fieldIds = this.getUniqueFieldIds(events);

    return {
      totalFields: fieldIds.length,
      activeFields: this.countActiveFields(events, dateRange),
      totalEvents: events.length,
      uniqueUsers: this.countUniqueUsers(events),
      
      timeRange: dateRange || {
        start: this.getEarliestEvent()?.timestamp || new Date(),
        end: new Date()
      },
      
      fieldTypeDistribution: this.getFieldTypeDistribution(fieldIds),
      usageTrends: this.getUsageTrends(events, dateRange),
      topFields: this.getTopFields(events),
      problemFields: this.getProblemFields(events),
      
      performance: {
        averageRenderTime: this.calculateAverageRenderTime(events),
        averageResponseTime: this.calculateAverageResponseTime(events),
        errorRate: this.calculateErrorRate(events),
        crashRate: this.calculateCrashRate(events)
      }
    };
  }

  /**
   * Calculate field health score
   */
  public calculateFieldHealth(fieldId: string): FieldHealthScore {
    const analytics = this.getFieldAnalytics(fieldId);
    
    const usability = this.calculateUsabilityScore(analytics);
    const performance = this.calculatePerformanceScore(analytics);
    const reliability = this.calculateReliabilityScore(analytics);
    const adoption = this.calculateAdoptionScore(analytics);
    
    const overall = (usability * 0.3 + performance * 0.25 + reliability * 0.25 + adoption * 0.2);

    return {
      fieldId,
      overall: Math.round(overall),
      usability: Math.round(usability),
      performance: Math.round(performance),
      reliability: Math.round(reliability),
      adoption: Math.round(adoption),
      
      factors: [
        {
          name: 'Usability',
          score: usability,
          weight: 0.3,
          description: 'How easy is the field to use and complete'
        },
        {
          name: 'Performance',
          score: performance,
          weight: 0.25,
          description: 'Rendering speed and responsiveness'
        },
        {
          name: 'Reliability',
          score: reliability,
          weight: 0.25,
          description: 'Error rates and stability'
        },
        {
          name: 'Adoption',
          score: adoption,
          weight: 0.2,
          description: 'User engagement and usage frequency'
        }
      ],
      
      recommendations: this.generateRecommendations(analytics, {
        usability,
        performance,
        reliability,
        adoption
      })
    };
  }

  /**
   * Analyze user journey through fields
   */
  public analyzeUserJourney(sessionId: string): UserJourney | null {
    const sessionEvents = this.events.filter(e => e.sessionId === sessionId);
    
    if (sessionEvents.length === 0) return null;

    const sortedEvents = sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const startTime = sortedEvents[0].timestamp;
    const endTime = sortedEvents[sortedEvents.length - 1].timestamp;

    const steps = this.processJourneySteps(sortedEvents);
    const metrics = this.calculateJourneyMetrics(steps);
    const pathAnalysis = this.analyzeJourneyPath(steps);

    return {
      sessionId,
      userId: sortedEvents[0].userId,
      startTime,
      endTime,
      steps,
      metrics,
      pathAnalysis
    };
  }

  /**
   * Query events with filters
   */
  public queryEvents(query: AnalyticsQuery): FieldUsageEvent[] {
    let filtered = [...this.events];

    if (query.fieldIds?.length) {
      filtered = filtered.filter(e => query.fieldIds!.includes(e.fieldId));
    }

    if (query.eventTypes?.length) {
      filtered = filtered.filter(e => query.eventTypes!.includes(e.eventType));
    }

    if (query.dateRange) {
      filtered = filtered.filter(e => 
        e.timestamp >= query.dateRange!.start && 
        e.timestamp <= query.dateRange!.end
      );
    }

    if (query.userIds?.length) {
      filtered = filtered.filter(e => e.userId && query.userIds!.includes(e.userId));
    }

    if (query.formIds?.length) {
      filtered = filtered.filter(e => e.formId && query.formIds!.includes(e.formId));
    }

    // Apply pagination
    const start = query.offset || 0;
    const end = query.limit ? start + query.limit : filtered.length;

    return filtered.slice(start, end);
  }

  /**
   * Export analytics data
   */
  public exportData(format: 'json' | 'csv', query?: AnalyticsQuery): string {
    const events = query ? this.queryEvents(query) : this.events;

    if (format === 'csv') {
      return this.exportToCSV(events);
    } else {
      return JSON.stringify(events, null, 2);
    }
  }

  /**
   * Clear all analytics data
   */
  public clearData(): void {
    this.events = [];
    this.eventBuffer = [];
  }

  /**
   * Start/stop data collection
   */
  public setCollecting(enabled: boolean): void {
    this.isCollecting = enabled;
    if (!enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    } else if (enabled && !this.flushTimer) {
      this.startBatchProcessing();
    }
  }

  // Private helper methods

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCriticalEvent(eventType: FieldEventType): boolean {
    return [FieldEventType.ERROR, FieldEventType.DELETE, FieldEventType.SUBMIT].includes(eventType);
  }

  private startBatchProcessing(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  private flushEvents(): void {
    if (this.eventBuffer.length === 0) return;

    this.events.push(...this.eventBuffer);
    this.eventBuffer = [];

    // Trim events if storage gets too large (keep last 10k events)
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  private getFieldEvents(fieldId: string, dateRange?: { start: Date; end: Date }): FieldUsageEvent[] {
    let filtered = this.events.filter(e => e.fieldId === fieldId);
    
    if (dateRange) {
      filtered = filtered.filter(e => 
        e.timestamp >= dateRange.start && e.timestamp <= dateRange.end
      );
    }
    
    return filtered;
  }

  private createEmptyFieldAnalytics(fieldId: string): FieldAnalytics {
    return {
      fieldId,
      fieldName: 'Unknown Field',
      fieldType: 'unknown',
      totalEvents: 0,
      uniqueUsers: 0,
      totalSessions: 0,
      firstUsed: new Date(),
      lastUsed: new Date(),
      averageSessionDuration: 0,
      focusCount: 0,
      changeCount: 0,
      validationErrors: 0,
      completionRate: 0,
      averageRenderTime: 0,
      errorRate: 0,
      dailyUsage: [],
      popularValues: [],
      dropOffRate: 0,
      timeToComplete: 0,
      mostCommonErrors: []
    };
  }

  private countUniqueUsers(events: FieldUsageEvent[]): number {
    const users = new Set(events.map(e => e.userId).filter(Boolean));
    return users.size;
  }

  private countUniqueSessions(events: FieldUsageEvent[]): number {
    const sessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    return sessions.size;
  }

  private getFirstUsage(events: FieldUsageEvent[]): Date {
    return events.reduce((earliest, event) => 
      event.timestamp < earliest ? event.timestamp : earliest, events[0].timestamp
    );
  }

  private getLastUsage(events: FieldUsageEvent[]): Date {
    return events.reduce((latest, event) => 
      event.timestamp > latest ? event.timestamp : latest, events[0].timestamp
    );
  }

  private countEventType(events: FieldUsageEvent[], type: FieldEventType): number {
    return events.filter(e => e.eventType === type).length;
  }

  private calculateCompletionRate(events: FieldUsageEvent[]): number {
    const focuses = this.countEventType(events, FieldEventType.FOCUS);
    const changes = this.countEventType(events, FieldEventType.CHANGE);
    return focuses > 0 ? (changes / focuses) * 100 : 0;
  }

  private calculateErrorRate(events: FieldUsageEvent[]): number {
    const totalInteractions = events.filter(e => 
      [FieldEventType.FOCUS, FieldEventType.CHANGE, FieldEventType.INPUT].includes(e.eventType)
    ).length;
    const errors = this.countEventType(events, FieldEventType.ERROR);
    return totalInteractions > 0 ? (errors / totalInteractions) * 100 : 0;
  }

  private getFieldName(fieldId: string): string {
    // This would typically come from a field registry
    return `Field ${fieldId}`;
  }

  private getFieldType(fieldId: string): string {
    // This would typically come from a field registry
    return 'text';
  }

  // Additional helper methods would be implemented here...
  private calculateAverageSessionDuration(events: FieldUsageEvent[]): number { return 0; }
  private calculateAverageRenderTime(events: FieldUsageEvent[]): number { return 0; }
  private getDailyUsage(events: FieldUsageEvent[], dateRange?: { start: Date; end: Date }): Array<{ date: Date; count: number }> { return []; }
  private getPopularValues(events: FieldUsageEvent[]): Array<{ value: string; count: number }> { return []; }
  private calculateDropOffRate(events: FieldUsageEvent[]): number { return 0; }
  private calculateTimeToComplete(events: FieldUsageEvent[]): number { return 0; }
  private getMostCommonErrors(events: FieldUsageEvent[]): Array<{ error: string; count: number }> { return []; }
  private getEventsInRange(dateRange?: { start: Date; end: Date }): FieldUsageEvent[] { return this.events; }
  private getUniqueFieldIds(events: FieldUsageEvent[]): string[] { return []; }
  private countActiveFields(events: FieldUsageEvent[], dateRange?: { start: Date; end: Date }): number { return 0; }
  private getEarliestEvent(): FieldUsageEvent | undefined { return this.events[0]; }
  private getFieldTypeDistribution(fieldIds: string[]): Array<{ type: string; count: number; percentage: number }> { return []; }
  private getUsageTrends(events: FieldUsageEvent[], dateRange?: { start: Date; end: Date }): Array<{ date: Date; events: number; users: number }> { return []; }
  private getTopFields(events: FieldUsageEvent[]): Array<{ fieldId: string; name: string; type: string; score: number; totalEvents: number }> { return []; }
  private getProblemFields(events: FieldUsageEvent[]): Array<{ fieldId: string; name: string; type: string; issues: string[]; severity: 'low' | 'medium' | 'high' }> { return []; }
  private calculateAverageResponseTime(events: FieldUsageEvent[]): number { return 0; }
  private calculateCrashRate(events: FieldUsageEvent[]): number { return 0; }
  private calculateUsabilityScore(analytics: FieldAnalytics): number { return 80; }
  private calculatePerformanceScore(analytics: FieldAnalytics): number { return 75; }
  private calculateReliabilityScore(analytics: FieldAnalytics): number { return 90; }
  private calculateAdoptionScore(analytics: FieldAnalytics): number { return 85; }
  private generateRecommendations(analytics: FieldAnalytics, scores: any): any[] { return []; }
  private processJourneySteps(events: FieldUsageEvent[]): any[] { return []; }
  private calculateJourneyMetrics(steps: any[]): any { return {}; }
  private analyzeJourneyPath(steps: any[]): any { return {}; }
  private exportToCSV(events: FieldUsageEvent[]): string { return ''; }
}

export default FieldAnalyticsEngine;