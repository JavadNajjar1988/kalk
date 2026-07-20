/**
 * ORBAT Validation Service
 * سرویس اعتبارسنجی داده‌های ORBAT
 */

import { OrbatScenario, OrbatUnit, OrbatEvent, SelectionState } from '../types/orbat-data';
import { OrbatCommand } from '../types/orbat-commands';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

export interface ValidationRule<T = any> {
  name: string;
  description: string;
  validate: (data: T) => ValidationError[];
}

export class OrbatValidationService {
  private unitRules: ValidationRule<OrbatUnit>[] = [];
  private scenarioRules: ValidationRule<OrbatScenario>[] = [];
  private eventRules: ValidationRule<OrbatEvent>[] = [];
  private commandRules: ValidationRule<OrbatCommand>[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.registerUnitRules();
    this.registerScenarioRules();
    this.registerEventRules();
    this.registerCommandRules();
  }

  // Unit validation rules
  private registerUnitRules(): void {
    this.unitRules = [
      {
        name: 'required_fields',
        description: 'Check required unit fields',
        validate: (unit: OrbatUnit) => {
          const errors: ValidationError[] = [];
          
          if (!unit.id) {
            errors.push({
              field: 'id',
              message: 'Unit ID is required',
              code: 'UNIT_ID_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!unit.name || unit.name.trim() === '') {
            errors.push({
              field: 'name',
              message: 'Unit name is required',
              code: 'UNIT_NAME_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!unit.sidc) {
            errors.push({
              field: 'sidc',
              message: 'Unit SIDC is required',
              code: 'UNIT_SIDC_REQUIRED',
              severity: 'error'
            });
          }
          
          return errors;
        }
      },
      {
        name: 'sidc_format',
        description: 'Validate SIDC format',
        validate: (unit: OrbatUnit) => {
          const errors: ValidationError[] = [];
          
          if (unit.sidc) {
            // SIDC should be 20 characters long
            if (unit.sidc.length !== 20) {
              errors.push({
                field: 'sidc',
                message: 'SIDC must be exactly 20 characters long',
                code: 'UNIT_SIDC_INVALID_LENGTH',
                severity: 'error'
              });
            }
            
            // SIDC should contain only valid characters
            if (!/^[0-9A-Z-]+$/.test(unit.sidc)) {
              errors.push({
                field: 'sidc',
                message: 'SIDC contains invalid characters',
                code: 'UNIT_SIDC_INVALID_FORMAT',
                severity: 'error'
              });
            }
          }
          
          return errors;
        }
      },
      {
        name: 'location_format',
        description: 'Validate unit location coordinates',
        validate: (unit: OrbatUnit) => {
          const errors: ValidationError[] = [];
          
          if (unit.location) {
            if (!Array.isArray(unit.location)) {
              errors.push({
                field: 'location',
                message: 'Location must be an array',
                code: 'UNIT_LOCATION_INVALID_TYPE',
                severity: 'error'
              });
            } else if (unit.location.length < 2 || unit.location.length > 3) {
              errors.push({
                field: 'location',
                message: 'Location must have 2 or 3 coordinates',
                code: 'UNIT_LOCATION_INVALID_LENGTH',
                severity: 'error'
              });
            } else {
              const [lon, lat, alt] = unit.location;
              
              if (typeof lon !== 'number' || lon < -180 || lon > 180) {
                errors.push({
                  field: 'location[0]',
                  message: 'Longitude must be a number between -180 and 180',
                  code: 'UNIT_LOCATION_INVALID_LONGITUDE',
                  severity: 'error'
                });
              }
              
              if (typeof lat !== 'number' || lat < -90 || lat > 90) {
                errors.push({
                  field: 'location[1]',
                  message: 'Latitude must be a number between -90 and 90',
                  code: 'UNIT_LOCATION_INVALID_LATITUDE',
                  severity: 'error'
                });
              }
              
              if (alt !== undefined && typeof alt !== 'number') {
                errors.push({
                  field: 'location[2]',
                  message: 'Altitude must be a number',
                  code: 'UNIT_LOCATION_INVALID_ALTITUDE',
                  severity: 'warning'
                });
              }
            }
          }
          
          return errors;
        }
      },
      {
        name: 'personnel_validation',
        description: 'Validate unit personnel data',
        validate: (unit: OrbatUnit) => {
          const errors: ValidationError[] = [];
          
          if (unit.personnel) {
            unit.personnel.forEach((person, index) => {
              if (!person.name) {
                errors.push({
                  field: `personnel[${index}].name`,
                  message: 'Personnel name is required',
                  code: 'UNIT_PERSONNEL_NAME_REQUIRED',
                  severity: 'error'
                });
              }
              
              if (typeof person.count !== 'number' || person.count < 0) {
                errors.push({
                  field: `personnel[${index}].count`,
                  message: 'Personnel count must be a non-negative number',
                  code: 'UNIT_PERSONNEL_COUNT_INVALID',
                  severity: 'error'
                });
              }
              
              if (person.onHand !== undefined && (typeof person.onHand !== 'number' || person.onHand < 0)) {
                errors.push({
                  field: `personnel[${index}].onHand`,
                  message: 'Personnel on-hand must be a non-negative number',
                  code: 'UNIT_PERSONNEL_ONHAND_INVALID',
                  severity: 'warning'
                });
              }
              
              if (person.onHand !== undefined && person.onHand > person.count) {
                errors.push({
                  field: `personnel[${index}].onHand`,
                  message: 'Personnel on-hand cannot exceed total count',
                  code: 'UNIT_PERSONNEL_ONHAND_EXCEEDS_COUNT',
                  severity: 'warning'
                });
              }
            });
          }
          
          return errors;
        }
      }
    ];
  }

  // Scenario validation rules
  private registerScenarioRules(): void {
    this.scenarioRules = [
      {
        name: 'required_fields',
        description: 'Check required scenario fields',
        validate: (scenario: OrbatScenario) => {
          const errors: ValidationError[] = [];
          
          if (!scenario.id) {
            errors.push({
              field: 'id',
              message: 'Scenario ID is required',
              code: 'SCENARIO_ID_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!scenario.name || scenario.name.trim() === '') {
            errors.push({
              field: 'name',
              message: 'Scenario name is required',
              code: 'SCENARIO_NAME_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!scenario.version) {
            errors.push({
              field: 'version',
              message: 'Scenario version is required',
              code: 'SCENARIO_VERSION_REQUIRED',
              severity: 'error'
            });
          }
          
          return errors;
        }
      },
      {
        name: 'time_validation',
        description: 'Validate scenario time settings',
        validate: (scenario: OrbatScenario) => {
          const errors: ValidationError[] = [];
          
          if (typeof scenario.startTime !== 'number' || scenario.startTime < 0) {
            errors.push({
              field: 'startTime',
              message: 'Start time must be a valid timestamp',
              code: 'SCENARIO_START_TIME_INVALID',
              severity: 'error'
            });
          }
          
          if (scenario.timeZone && typeof scenario.timeZone !== 'string') {
            errors.push({
              field: 'timeZone',
              message: 'Time zone must be a string',
              code: 'SCENARIO_TIMEZONE_INVALID',
              severity: 'warning'
            });
          }
          
          return errors;
        }
      },
      {
        name: 'sides_validation',
        description: 'Validate scenario sides',
        validate: (scenario: OrbatScenario) => {
          const errors: ValidationError[] = [];
          
          if (!Array.isArray(scenario.sides)) {
            errors.push({
              field: 'sides',
              message: 'Sides must be an array',
              code: 'SCENARIO_SIDES_INVALID_TYPE',
              severity: 'error'
            });
          } else if (scenario.sides.length === 0) {
            errors.push({
              field: 'sides',
              message: 'Scenario must have at least one side',
              code: 'SCENARIO_SIDES_EMPTY',
              severity: 'warning'
            });
          }
          
          return errors;
        }
      }
    ];
  }

  // Event validation rules
  private registerEventRules(): void {
    this.eventRules = [
      {
        name: 'required_fields',
        description: 'Check required event fields',
        validate: (event: OrbatEvent) => {
          const errors: ValidationError[] = [];
          
          if (!event.id) {
            errors.push({
              field: 'id',
              message: 'Event ID is required',
              code: 'EVENT_ID_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!event.title || event.title.trim() === '') {
            errors.push({
              field: 'title',
              message: 'Event title is required',
              code: 'EVENT_TITLE_REQUIRED',
              severity: 'error'
            });
          }
          
          if (typeof event.startTime !== 'number' || event.startTime < 0) {
            errors.push({
              field: 'startTime',
              message: 'Event start time must be a valid timestamp',
              code: 'EVENT_START_TIME_INVALID',
              severity: 'error'
            });
          }
          
          return errors;
        }
      }
    ];
  }

  // Command validation rules
  private registerCommandRules(): void {
    this.commandRules = [
      {
        name: 'required_fields',
        description: 'Check required command fields',
        validate: (command: OrbatCommand) => {
          const errors: ValidationError[] = [];
          
          if (!command.id) {
            errors.push({
              field: 'id',
              message: 'Command ID is required',
              code: 'COMMAND_ID_REQUIRED',
              severity: 'error'
            });
          }
          
          if (!command.type) {
            errors.push({
              field: 'type',
              message: 'Command type is required',
              code: 'COMMAND_TYPE_REQUIRED',
              severity: 'error'
            });
          }
          
          return errors;
        }
      }
    ];
  }

  // Validation methods
  public validateUnit(unit: OrbatUnit): ValidationResult {
    return this.runValidation(unit, this.unitRules);
  }

  public validateScenario(scenario: OrbatScenario): ValidationResult {
    return this.runValidation(scenario, this.scenarioRules);
  }

  public validateEvent(event: OrbatEvent): ValidationResult {
    return this.runValidation(event, this.eventRules);
  }

  public validateCommand(command: OrbatCommand): ValidationResult {
    return this.runValidation(command, this.commandRules);
  }

  public validateSelection(selection: SelectionState): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!Array.isArray(selection.selectedUnitIds)) {
      errors.push({
        field: 'selectedUnitIds',
        message: 'Selected unit IDs must be an array',
        code: 'SELECTION_UNIT_IDS_INVALID',
        severity: 'error'
      });
    }
    
    if (!Array.isArray(selection.selectedFeatureIds)) {
      errors.push({
        field: 'selectedFeatureIds',
        message: 'Selected feature IDs must be an array',
        code: 'SELECTION_FEATURE_IDS_INVALID',
        severity: 'error'
      });
    }
    
    if (!Array.isArray(selection.selectedEventIds)) {
      errors.push({
        field: 'selectedEventIds',
        message: 'Selected event IDs must be an array',
        code: 'SELECTION_EVENT_IDS_INVALID',
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  // Generic validation runner
  private runValidation<T>(data: T, rules: ValidationRule<T>[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    
    for (const rule of rules) {
      try {
        const ruleErrors = rule.validate(data);
        allErrors.push(...ruleErrors);
      } catch (error) {
        allErrors.push({
          field: 'validation',
          message: `Validation rule "${rule.name}" failed: ${error}`,
          code: 'VALIDATION_RULE_ERROR',
          severity: 'error'
        });
      }
    }
    
    const errors = allErrors.filter(e => e.severity === 'error');
    const warnings = allErrors.filter(e => e.severity === 'warning') as ValidationWarning[];
    
    return {
      valid: errors.length === 0,
      errors: allErrors,
      warnings
    };
  }

  // Rule management
  public addUnitRule(rule: ValidationRule<OrbatUnit>): void {
    this.unitRules.push(rule);
  }

  public addScenarioRule(rule: ValidationRule<OrbatScenario>): void {
    this.scenarioRules.push(rule);
  }

  public addEventRule(rule: ValidationRule<OrbatEvent>): void {
    this.eventRules.push(rule);
  }

  public addCommandRule(rule: ValidationRule<OrbatCommand>): void {
    this.commandRules.push(rule);
  }

  public removeRule(category: 'unit' | 'scenario' | 'event' | 'command', ruleName: string): boolean {
    const rules = this.getRuleArray(category);
    const index = rules.findIndex(rule => rule.name === ruleName);
    
    if (index !== -1) {
      rules.splice(index, 1);
      return true;
    }
    
    return false;
  }

  private getRuleArray(category: 'unit' | 'scenario' | 'event' | 'command'): ValidationRule[] {
    switch (category) {
      case 'unit': return this.unitRules;
      case 'scenario': return this.scenarioRules;
      case 'event': return this.eventRules;
      case 'command': return this.commandRules;
      default: throw new Error(`Unknown rule category: ${category}`);
    }
  }

  // Batch validation
  public validateUnits(units: OrbatUnit[]): ValidationResult[] {
    return units.map(unit => this.validateUnit(unit));
  }

  public validateEvents(events: OrbatEvent[]): ValidationResult[] {
    return events.map(event => this.validateEvent(event));
  }

  // Summary methods
  public getValidationSummary(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.filter(e => e.severity === 'error').length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
    };
  }

  // Utility methods
  public isValidSIDC(sidc: string): boolean {
    return Boolean(sidc && sidc.length === 20 && /^[0-9A-Z-]+$/.test(sidc));
  }

  public isValidCoordinate(coord: [number, number] | [number, number, number]): boolean {
    if (!Array.isArray(coord) || coord.length < 2 || coord.length > 3) {
      return false;
    }
    
    const [lon, lat, alt] = coord;
    
    if (typeof lon !== 'number' || lon < -180 || lon > 180) {
      return false;
    }
    
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      return false;
    }
    
    if (alt !== undefined && typeof alt !== 'number') {
      return false;
    }
    
    return true;
  }

  public isValidTimestamp(timestamp: number): boolean {
    return typeof timestamp === 'number' && timestamp >= 0 && timestamp <= Date.now() + (365 * 24 * 60 * 60 * 1000); // Max 1 year in future
  }
}