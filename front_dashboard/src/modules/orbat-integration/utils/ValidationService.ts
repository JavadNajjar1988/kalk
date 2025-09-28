import type {
  OrbatScenario,
  OrbatUnit,
  OrbatEvent,
  Position,
  MapViewState
} from '../types/orbat-data';
import type { 
  BaseMessage,
  CommandMessage,
  ResponseMessage,
  EventMessage 
} from '../types/orbat-bridge';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Base validator class
abstract class BaseValidator<T> {
  abstract validate(data: T): ValidationResult;

  protected createError(field: string, message: string, code: string, severity: 'error' | 'warning' | 'info' = 'error'): ValidationError {
    return { field, message, code, severity };
  }

  protected createResult(errors: ValidationError[] = [], warnings: ValidationError[] = []): ValidationResult {
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  protected isValidString(value: any, minLength = 1, maxLength = 1000): boolean {
    return typeof value === 'string' && 
           value.length >= minLength && 
           value.length <= maxLength;
  }

  protected isValidNumber(value: any, min?: number, max?: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  }

  protected isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  protected isValidArray(value: any, minLength = 0, maxLength?: number): boolean {
    if (!Array.isArray(value)) return false;
    if (value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
    return true;
  }

  protected isValidUrl(value: any): boolean {
    if (!this.isValidString(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  protected isValidEmail(value: any): boolean {
    if (!this.isValidString(value)) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
}

// Position validator
export class PositionValidator extends BaseValidator<Position> {
  validate(position: Position): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate latitude
    if (!this.isValidNumber(position.lat, -90, 90)) {
      errors.push(this.createError(
        'lat',
        'Latitude must be a number between -90 and 90',
        'INVALID_LATITUDE'
      ));
    }

    // Validate longitude
    if (!this.isValidNumber(position.lon, -180, 180)) {
      errors.push(this.createError(
        'lon',
        'Longitude must be a number between -180 and 180',
        'INVALID_LONGITUDE'
      ));
    }

    // Validate elevation (optional)
    if (position.elevation !== undefined && !this.isValidNumber(position.elevation, -500, 10000)) {
      warnings.push(this.createError(
        'elevation',
        'Elevation should be between -500m and 10000m',
        'UNUSUAL_ELEVATION',
        'warning'
      ));
    }

    return this.createResult(errors, warnings);
  }
}

// Unit validator
export class UnitValidator extends BaseValidator<OrbatUnit> {
  private positionValidator = new PositionValidator();

  validate(unit: OrbatUnit): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate ID
    if (!this.isValidString(unit.id, 1, 100)) {
      errors.push(this.createError(
        'id',
        'Unit ID must be a non-empty string (max 100 characters)',
        'INVALID_ID'
      ));
    }

    // Validate name
    if (!this.isValidString(unit.name, 1, 200)) {
      errors.push(this.createError(
        'name',
        'Unit name must be a non-empty string (max 200 characters)',
        'INVALID_NAME'
      ));
    }

    // Validate SIDC (Standard Identity Symbol Code)
    if (unit.sidc && !this.isValidSIDC(unit.sidc)) {
      errors.push(this.createError(
        'sidc',
        'Invalid SIDC format (must be 15-character military symbol code)',
        'INVALID_SIDC'
      ));
    }

    // Validate position
    if (unit.position) {
      const positionResult = this.positionValidator.validate(unit.position);
      errors.push(...positionResult.errors.map(e => ({ ...e, field: `position.${e.field}` })));
      warnings.push(...positionResult.warnings.map(w => ({ ...w, field: `position.${w.field}` })));
    }

    // Validate unit type
    const validUnitTypes = ['INFANTRY', 'ARMOR', 'ARTILLERY', 'AIR_DEFENSE', 'AVIATION', 'NAVAL', 'SPECIAL_FORCES', 'LOGISTICS', 'HEADQUARTERS', 'OTHER'];
    if (unit.unitType && !validUnitTypes.includes(unit.unitType)) {
      warnings.push(this.createError(
        'unitType',
        `Unit type '${unit.unitType}' is not in standard list`,
        'NON_STANDARD_UNIT_TYPE',
        'warning'
      ));
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'DESTROYED', 'CAPTURED', 'UNKNOWN'];
    if (unit.status && !validStatuses.includes(unit.status)) {
      errors.push(this.createError(
        'status',
        `Invalid unit status: ${unit.status}`,
        'INVALID_STATUS'
      ));
    }

    // Validate strength
    if (unit.strength !== undefined && !this.isValidNumber(unit.strength, 0, 100000)) {
      errors.push(this.createError(
        'strength',
        'Unit strength must be a number between 0 and 100000',
        'INVALID_STRENGTH'
      ));
    }

    // Validate parent unit relationship
    if (unit.parentUnitId && unit.parentUnitId === unit.id) {
      errors.push(this.createError(
        'parentUnitId',
        'Unit cannot be its own parent',
        'CIRCULAR_PARENT_REFERENCE'
      ));
    }

    // Validate creation date
    if (unit.createdAt && !this.isValidDate(unit.createdAt)) {
      errors.push(this.createError(
        'createdAt',
        'Invalid creation date format',
        'INVALID_DATE'
      ));
    }

    return this.createResult(errors, warnings);
  }

  private isValidSIDC(sidc: string): boolean {
    // SIDC should be 15 characters following MIL-STD-2525 standard
    if (typeof sidc !== 'string' || sidc.length !== 15) return false;
    
    // Basic format validation - all characters should be alphanumeric or hyphens
    const sidcRegex = /^[A-Z0-9\-]{15}$/;
    return sidcRegex.test(sidc);
  }
}

// Event validator
export class EventValidator extends BaseValidator<OrbatEvent> {
  validate(event: OrbatEvent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate ID
    if (!this.isValidString(event.id, 1, 100)) {
      errors.push(this.createError(
        'id',
        'Event ID must be a non-empty string (max 100 characters)',
        'INVALID_ID'
      ));
    }

    // Validate name
    if (!this.isValidString(event.name, 1, 200)) {
      errors.push(this.createError(
        'name',
        'Event name must be a non-empty string (max 200 characters)',
        'INVALID_NAME'
      ));
    }

    // Validate event type
    const validEventTypes = ['ATTACK', 'DEFEND', 'MOVE', 'RESUPPLY', 'COMMUNICATION', 'RECONNAISSANCE', 'OTHER'];
    if (!validEventTypes.includes(event.eventType)) {
      warnings.push(this.createError(
        'eventType',
        `Event type '${event.eventType}' is not in standard list`,
        'NON_STANDARD_EVENT_TYPE',
        'warning'
      ));
    }

    // Validate dates
    if (event.startTime) {
      if (!this.isValidDate(event.startTime)) {
        errors.push(this.createError(
          'startTime',
          'Invalid start time format',
          'INVALID_START_TIME'
        ));
      }
    }

    if (event.endTime) {
      if (!this.isValidDate(event.endTime)) {
        errors.push(this.createError(
          'endTime',
          'Invalid end time format',
          'INVALID_END_TIME'
        ));
      }
    }

    // Validate time sequence
    if (event.startTime && event.endTime) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      if (endDate <= startDate) {
        errors.push(this.createError(
          'endTime',
          'End time must be after start time',
          'INVALID_TIME_SEQUENCE'
        ));
      }
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (event.priority && !validPriorities.includes(event.priority)) {
      errors.push(this.createError(
        'priority',
        `Invalid priority: ${event.priority}`,
        'INVALID_PRIORITY'
      ));
    }

    // Validate affected units
    if (event.affectedUnits && !this.isValidArray(event.affectedUnits, 0, 1000)) {
      errors.push(this.createError(
        'affectedUnits',
        'Affected units must be an array (max 1000 units)',
        'INVALID_AFFECTED_UNITS'
      ));
    }

    return this.createResult(errors, warnings);
  }
}

// Scenario validator
export class ScenarioValidator extends BaseValidator<OrbatScenario> {
  private unitValidator = new UnitValidator();
  private eventValidator = new EventValidator();

  validate(scenario: OrbatScenario): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate ID
    if (!this.isValidString(scenario.id, 1, 100)) {
      errors.push(this.createError(
        'id',
        'Scenario ID must be a non-empty string (max 100 characters)',
        'INVALID_ID'
      ));
    }

    // Validate name
    if (!this.isValidString(scenario.name, 1, 200)) {
      errors.push(this.createError(
        'name',
        'Scenario name must be a non-empty string (max 200 characters)',
        'INVALID_NAME'
      ));
    }

    // Validate description
    if (scenario.description && !this.isValidString(scenario.description, 0, 5000)) {
      warnings.push(this.createError(
        'description',
        'Description is very long (max 5000 characters recommended)',
        'LONG_DESCRIPTION',
        'warning'
      ));
    }

    // Validate units
    if (scenario.units && this.isValidArray(scenario.units)) {
      scenario.units.forEach((unit, index) => {
        const unitResult = this.unitValidator.validate(unit);
        errors.push(...unitResult.errors.map(e => ({ 
          ...e, 
          field: `units[${index}].${e.field}` 
        })));
        warnings.push(...unitResult.warnings.map(w => ({ 
          ...w, 
          field: `units[${index}].${w.field}` 
        })));
      });

      // Check for duplicate unit IDs
      const unitIds = scenario.units.map(u => u.id);
      const duplicateIds = unitIds.filter((id, index) => unitIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(this.createError(
          'units',
          `Duplicate unit IDs found: ${duplicateIds.join(', ')}`,
          'DUPLICATE_UNIT_IDS'
        ));
      }
    }

    // Validate events
    if (scenario.events && this.isValidArray(scenario.events)) {
      scenario.events.forEach((event, index) => {
        const eventResult = this.eventValidator.validate(event);
        errors.push(...eventResult.errors.map(e => ({ 
          ...e, 
          field: `events[${index}].${e.field}` 
        })));
        warnings.push(...eventResult.warnings.map(w => ({ 
          ...w, 
          field: `events[${index}].${w.field}` 
        })));
      });

      // Check for duplicate event IDs
      const eventIds = scenario.events.map(e => e.id);
      const duplicateIds = eventIds.filter((id, index) => eventIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(this.createError(
          'events',
          `Duplicate event IDs found: ${duplicateIds.join(', ')}`,
          'DUPLICATE_EVENT_IDS'
        ));
      }
    }

    // Validate creation date
    if (scenario.createdAt && !this.isValidDate(scenario.createdAt)) {
      errors.push(this.createError(
        'createdAt',
        'Invalid creation date format',
        'INVALID_DATE'
      ));
    }

    return this.createResult(errors, warnings);
  }
}

// Message validator
export class MessageValidator extends BaseValidator<BaseMessage> {
  validate(message: BaseMessage): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate ID
    if (!this.isValidString(message.id, 1, 100)) {
      errors.push(this.createError(
        'id',
        'Message ID must be a non-empty string (max 100 characters)',
        'INVALID_ID'
      ));
    }

    // Validate type
    const validTypes = ['COMMAND', 'REQUEST', 'RESPONSE', 'EVENT'];
    if (!validTypes.includes(message.type)) {
      errors.push(this.createError(
        'type',
        `Invalid message type: ${message.type}`,
        'INVALID_MESSAGE_TYPE'
      ));
    }

    // Validate timestamp
    if (!this.isValidDate(message.timestamp)) {
      errors.push(this.createError(
        'timestamp',
        'Invalid timestamp format',
        'INVALID_TIMESTAMP'
      ));
    }

    // Type-specific validation
    if (message.type === 'COMMAND') {
      const commandMessage = message as CommandMessage;
      if (!this.isValidString(commandMessage.command)) {
        errors.push(this.createError(
          'command',
          'Command must be a non-empty string',
          'INVALID_COMMAND'
        ));
      }
    }

    if (message.type === 'RESPONSE') {
      const responseMessage = message as ResponseMessage;
      if (typeof responseMessage.success !== 'boolean') {
        errors.push(this.createError(
          'success',
          'Response success must be a boolean',
          'INVALID_SUCCESS_FLAG'
        ));
      }
    }

    if (message.type === 'EVENT') {
      const eventMessage = message as EventMessage;
      if (!this.isValidString(eventMessage.eventType)) {
        errors.push(this.createError(
          'eventType',
          'Event type must be a non-empty string',
          'INVALID_EVENT_TYPE'
        ));
      }
    }

    return this.createResult(errors, warnings);
  }
}

// Main validation service
export class ValidationService {
  private positionValidator = new PositionValidator();
  private unitValidator = new UnitValidator();
  private eventValidator = new EventValidator();
  private scenarioValidator = new ScenarioValidator();
  private messageValidator = new MessageValidator();

  validatePosition(position: Position): ValidationResult {
    return this.positionValidator.validate(position);
  }

  validateUnit(unit: OrbatUnit): ValidationResult {
    return this.unitValidator.validate(unit);
  }

  validateEvent(event: OrbatEvent): ValidationResult {
    return this.eventValidator.validate(event);
  }

  validateScenario(scenario: OrbatScenario): ValidationResult {
    return this.scenarioValidator.validate(scenario);
  }

  validateMessage(message: BaseMessage): ValidationResult {
    return this.messageValidator.validate(message);
  }

  // Batch validation
  validateUnits(units: OrbatUnit[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    units.forEach((unit, index) => {
      const result = this.validateUnit(unit);
      allErrors.push(...result.errors.map(e => ({ 
        ...e, 
        field: `units[${index}].${e.field}` 
      })));
      allWarnings.push(...result.warnings.map(w => ({ 
        ...w, 
        field: `units[${index}].${w.field}` 
      })));
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  validateEvents(events: OrbatEvent[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    events.forEach((event, index) => {
      const result = this.validateEvent(event);
      allErrors.push(...result.errors.map(e => ({ 
        ...e, 
        field: `events[${index}].${e.field}` 
      })));
      allWarnings.push(...result.warnings.map(w => ({ 
        ...w, 
        field: `events[${index}].${w.field}` 
      })));
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  // Utility methods
  isValidData(data: any, type: 'position' | 'unit' | 'event' | 'scenario' | 'message'): boolean {
    let result: ValidationResult;
    
    switch (type) {
      case 'position':
        result = this.validatePosition(data);
        break;
      case 'unit':
        result = this.validateUnit(data);
        break;
      case 'event':
        result = this.validateEvent(data);
        break;
      case 'scenario':
        result = this.validateScenario(data);
        break;
      case 'message':
        result = this.validateMessage(data);
        break;
      default:
        return false;
    }
    
    return result.isValid;
  }

  formatValidationErrors(result: ValidationResult): string {
    if (result.isValid) return 'Valid';
    
    const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`);
    const warningMessages = result.warnings.map(w => `${w.field}: ${w.message} (Warning)`);
    
    return [...errorMessages, ...warningMessages].join('\n');
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// All validators are already exported individually above