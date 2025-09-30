import { OrbatUnit, OrbatEvent, OrbatScenario } from '../types/orbat-data';

// Browser-compatible hash function using Web Crypto API
async function createBrowserHash(data: string): Promise<string> {
  if (!window.crypto || !window.crypto.subtle) {
    // Fallback to simple hash for environments without Web Crypto API
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Data integrity interfaces
export interface DataIntegrityResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checksum?: string;
  timestamp: Date;
}

export interface DataConsistencyCheck {
  type: 'REFERENCE' | 'CONSTRAINT' | 'FORMAT' | 'BUSINESS_RULE';
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

export interface DataSyncState {
  lastSync: Date;
  version: number;
  checksum: string;
  conflicts: DataConflict[];
}

export interface DataConflict {
  id: string;
  type: 'UPDATE' | 'DELETE' | 'CREATE';
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: Date;
  resolved: boolean;
}

// Data integrity validator
export class DataIntegrityValidator {
  private static checksumCache = new Map<string, string>();

  /**
   * Generate data checksum for integrity verification
   */
  static async generateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return await createBrowserHash(dataString);
  }

  /**
   * Generate synchronous checksum (fallback)
   */
  static generateChecksumSync(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verify data integrity using checksum (async)
   */
  static async verifyIntegrity(data: any, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Verify data integrity using checksum (sync fallback)
   */
  static verifyIntegritySync(data: any, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksumSync(data);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Validate unit data integrity
   */
  static validateUnit(unit: OrbatUnit): DataIntegrityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!unit.id) errors.push('Unit ID is required');
    if (!unit.name?.trim()) errors.push('Unit name is required');
    if (!unit.sidc) errors.push('Unit SIDC is required');
    if (!unit.position) errors.push('Unit position is required');

    // SIDC format validation
    if (unit.sidc && !/^[A-Z0-9]{15}$/.test(unit.sidc)) {
      errors.push('Invalid SIDC format');
    }

    // Position validation
    if (unit.position) {
      if (unit.position.lat < -90 || unit.position.lat > 90) {
        errors.push('Invalid latitude value');
      }
      if (unit.position.lon < -180 || unit.position.lon > 180) {
        errors.push('Invalid longitude value');
      }
    }

    // Parent-child relationship validation
    if (unit.parent && unit.id === unit.parent) {
      errors.push('Unit cannot be its own parent');
    }

    // Children validation
    if (unit.children?.includes(unit.id)) {
      errors.push('Unit cannot be in its own children list');
    }

    // Name length validation
    if (unit.name && unit.name.length > 100) {
      warnings.push('Unit name is very long (>100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checksum: this.generateChecksumSync(unit),
      timestamp: new Date()
    };
  }

  /**
   * Validate event data integrity
   */
  static validateEvent(event: OrbatEvent): DataIntegrityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!event.id) errors.push('Event ID is required');
    if (!event.type) errors.push('Event type is required');
    if (!event.unitId) errors.push('Event unit ID is required');
    if (!event.description?.trim()) errors.push('Event description is required');
    if (!event.startTime) errors.push('Event start time is required');

    // Date validation
    if (event.startTime && event.endTime) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      if (start >= end) {
        errors.push('Event end time must be after start time');
      }
    }

    // Location validation
    if (event.location) {
      if (event.location.lat < -90 || event.location.lat > 90) {
        errors.push('Invalid event location latitude');
      }
      if (event.location.lon < -180 || event.location.lon > 180) {
        errors.push('Invalid event location longitude');
      }
    }

    // Description length validation
    if (event.description && event.description.length > 500) {
      warnings.push('Event description is very long (>500 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checksum: this.generateChecksumSync(event),
      timestamp: new Date()
    };
  }

  /**
   * Validate scenario data integrity
   */
  static validateScenario(scenario: OrbatScenario): DataIntegrityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!scenario.id) errors.push('Scenario ID is required');
    if (!scenario.name?.trim()) errors.push('Scenario name is required');
    if (!scenario.startTime) errors.push('Scenario start time is required');

    // Date validation
    if (scenario.startTime && scenario.endTime) {
      const start = new Date(scenario.startTime);
      const end = new Date(scenario.endTime);
      if (start >= end) {
        errors.push('Scenario end time must be after start time');
      }
    }

    // Bounds validation
    if (scenario.bounds) {
      const { north, south, east, west } = scenario.bounds;
      if (north <= south) errors.push('North bound must be greater than south bound');
      if (east <= west) errors.push('East bound must be greater than west bound');
      if (north > 90 || south < -90) errors.push('Invalid latitude bounds');
      if (east > 180 || west < -180) errors.push('Invalid longitude bounds');
    }

    // Units validation
    if (scenario.units) {
      const unitIds = new Set<string>();
      scenario.units.forEach((unit, index) => {
        if (unitIds.has(unit.id)) {
          errors.push(`Duplicate unit ID at index ${index}: ${unit.id}`);
        }
        unitIds.add(unit.id);

        const unitValidation = this.validateUnit(unit);
        if (!unitValidation.isValid) {
          errors.push(`Unit ${unit.id}: ${unitValidation.errors.join(', ')}`);
        }
      });
    }

    // Events validation
    if (scenario.events) {
      const eventIds = new Set<string>();
      scenario.events.forEach((event, index) => {
        if (eventIds.has(event.id)) {
          errors.push(`Duplicate event ID at index ${index}: ${event.id}`);
        }
        eventIds.add(event.id);

        const eventValidation = this.validateEvent(event);
        if (!eventValidation.isValid) {
          errors.push(`Event ${event.id}: ${eventValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checksum: this.generateChecksumSync(scenario),
      timestamp: new Date()
    };
  }

  /**
   * Validate cross-references between units and events
   */
  static validateCrossReferences(scenario: OrbatScenario): DataIntegrityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!scenario.units || !scenario.events) {
      return {
        isValid: true,
        errors: [],
        warnings: ['No units or events to validate cross-references'],
        timestamp: new Date()
      };
    }

    const unitIds = new Set(scenario.units.map(u => u.id));
    const parentIds = new Set(scenario.units.map(u => u.parent).filter(Boolean));

    // Check parent references
    parentIds.forEach(parentId => {
      if (!unitIds.has(parentId)) {
        errors.push(`Parent unit ${parentId} not found in scenario`);
      }
    });

    // Check event unit references
    scenario.events.forEach(event => {
      if (!unitIds.has(event.unitId)) {
        errors.push(`Event ${event.id} references non-existent unit ${event.unitId}`);
      }
    });

    // Check for circular parent references
    scenario.units.forEach(unit => {
      const visited = new Set<string>();
      let current = unit.parent;
      
      while (current && !visited.has(current)) {
        visited.add(current);
        const parentUnit = scenario.units.find(u => u.id === current);
        if (!parentUnit) break;
        
        current = parentUnit.parent;
        
        if (current === unit.id) {
          errors.push(`Circular parent reference detected for unit ${unit.id}`);
          break;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date()
    };
  }
}

// Data consistency manager
export class DataConsistencyManager {
  private syncStates = new Map<string, DataSyncState>();
  private conflictResolvers = new Map<string, (conflict: DataConflict) => any>();

  /**
   * Register a conflict resolver for a specific data type
   */
  registerConflictResolver(dataType: string, resolver: (conflict: DataConflict) => any): void {
    this.conflictResolvers.set(dataType, resolver);
  }

  /**
   * Update sync state for data
   */
  updateSyncState(dataId: string, data: any): void {
    const checksum = DataIntegrityValidator.generateChecksumSync(data);
    const currentState = this.syncStates.get(dataId);
    
    this.syncStates.set(dataId, {
      lastSync: new Date(),
      version: (currentState?.version || 0) + 1,
      checksum,
      conflicts: currentState?.conflicts || []
    });
  }

  /**
   * Detect conflicts between local and remote data
   */
  detectConflicts(dataId: string, localData: any, remoteData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    const localChecksum = DataIntegrityValidator.generateChecksum(localData);
    const remoteChecksum = DataIntegrityValidator.generateChecksum(remoteData);
    
    if (localChecksum === remoteChecksum) {
      return conflicts; // No conflicts
    }

    // Deep compare objects to find specific conflicts
    this.compareObjects(localData, remoteData, '', conflicts, dataId);
    
    return conflicts;
  }

  private compareObjects(local: any, remote: any, path: string, conflicts: DataConflict[], dataId: string): void {
    if (typeof local !== typeof remote) {
      conflicts.push({
        id: `${dataId}-${path}`,
        type: 'UPDATE',
        field: path,
        localValue: local,
        remoteValue: remote,
        timestamp: new Date(),
        resolved: false
      });
      return;
    }

    if (typeof local === 'object' && local !== null && remote !== null) {
      const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
      
      allKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in local)) {
          conflicts.push({
            id: `${dataId}-${newPath}`,
            type: 'CREATE',
            field: newPath,
            localValue: undefined,
            remoteValue: remote[key],
            timestamp: new Date(),
            resolved: false
          });
        } else if (!(key in remote)) {
          conflicts.push({
            id: `${dataId}-${newPath}`,
            type: 'DELETE',
            field: newPath,
            localValue: local[key],
            remoteValue: undefined,
            timestamp: new Date(),
            resolved: false
          });
        } else {
          this.compareObjects(local[key], remote[key], newPath, conflicts, dataId);
        }
      });
    } else if (local !== remote) {
      conflicts.push({
        id: `${dataId}-${path}`,
        type: 'UPDATE',
        field: path,
        localValue: local,
        remoteValue: remote,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  /**
   * Resolve conflicts automatically where possible
   */
  resolveConflicts(dataId: string, conflicts: DataConflict[]): DataConflict[] {
    const unresolved: DataConflict[] = [];
    
    conflicts.forEach(conflict => {
      const resolver = this.conflictResolvers.get(conflict.type);
      
      if (resolver) {
        try {
          resolver(conflict);
          conflict.resolved = true;
        } catch (error) {
          console.error('Failed to resolve conflict:', error);
          unresolved.push(conflict);
        }
      } else {
        unresolved.push(conflict);
      }
    });

    // Update sync state
    const syncState = this.syncStates.get(dataId);
    if (syncState) {
      syncState.conflicts = unresolved;
    }

    return unresolved;
  }

  /**
   * Get sync state for data
   */
  getSyncState(dataId: string): DataSyncState | undefined {
    return this.syncStates.get(dataId);
  }

  /**
   * Clear sync state
   */
  clearSyncState(dataId: string): void {
    this.syncStates.delete(dataId);
  }
}

// React hook for data integrity
export const useDataIntegrity = () => {
  const consistencyManager = new DataConsistencyManager();

  const validateData = (type: 'unit' | 'event' | 'scenario', data: any): DataIntegrityResult => {
    switch (type) {
      case 'unit':
        return DataIntegrityValidator.validateUnit(data);
      case 'event':
        return DataIntegrityValidator.validateEvent(data);
      case 'scenario':
        return DataIntegrityValidator.validateScenario(data);
      default:
        return {
          isValid: false,
          errors: ['Unknown data type'],
          warnings: [],
          timestamp: new Date()
        };
    }
  };

  const validateCrossReferences = (scenario: OrbatScenario): DataIntegrityResult => {
    return DataIntegrityValidator.validateCrossReferences(scenario);
  };

  const generateChecksum = (data: any): string => {
    return DataIntegrityValidator.generateChecksum(data);
  };

  const verifyIntegrity = (data: any, checksum: string): boolean => {
    return DataIntegrityValidator.verifyIntegrity(data, checksum);
  };

  return {
    validateData,
    validateCrossReferences,
    generateChecksum,
    verifyIntegrity,
    consistencyManager
  };
};

export default DataIntegrityValidator;