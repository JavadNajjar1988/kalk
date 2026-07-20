/**
 * Field Configuration Import/Export System
 * Provides comprehensive field configuration management with backup and restore
 */

import { useState, useCallback } from 'react';
import { useAdvancedMemo } from '../hooks/useAdvancedMemoization';

interface FieldConfig {
  id: string;
  name: string;
  type: string;
  configuration: any;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    creator?: string;
  };
}

interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata: boolean;
  includeValidation: boolean;
  includeEnhancements: boolean;
  compression: boolean;
}

interface ImportOptions {
  overwriteExisting: boolean;
  validateOnImport: boolean;
  createBackup: boolean;
  mergeStrategy: 'replace' | 'merge' | 'append';
}

interface ExportData {
  version: string;
  exportDate: string;
  fields: FieldConfig[];
  metadata: {
    totalFields: number;
    exportOptions: ExportOptions;
    checksum: string;
  };
}

export const useFieldImportExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);

  // Generate checksum for data integrity
  const generateChecksum = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }, []);

  // Export field configurations
  const exportFields = useCallback(async (
    fields: FieldConfig[],
    options: Partial<ExportOptions> = {}
  ): Promise<string> => {
    const exportOptions: ExportOptions = {
      format: 'json',
      includeMetadata: true,
      includeValidation: true,
      includeEnhancements: true,
      compression: false,
      ...options
    };

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Process fields based on options
      const processedFields = fields.map((field, index) => {
        setExportProgress((index / fields.length) * 80); // 80% for processing

        const processedField: any = {
          id: field.id,
          name: field.name,
          type: field.type,
          configuration: { ...field.configuration }
        };

        if (exportOptions.includeMetadata) {
          processedField.metadata = field.metadata;
        }

        if (!exportOptions.includeValidation) {
          delete processedField.configuration.validation;
        }

        if (!exportOptions.includeEnhancements) {
          delete processedField.configuration.enhancements;
        }

        return processedField;
      });

      // Create export data
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        fields: processedFields,
        metadata: {
          totalFields: processedFields.length,
          exportOptions,
          checksum: ''
        }
      };

      setExportProgress(90);

      // Generate checksum
      const dataString = JSON.stringify(exportData.fields);
      exportData.metadata.checksum = generateChecksum(dataString);

      setExportProgress(95);

      // Format output based on requested format
      let output: string;
      
      switch (exportOptions.format) {
        case 'csv':
          output = convertToCSV(processedFields);
          break;
        case 'xlsx':
          output = JSON.stringify(exportData); // For now, JSON format
          break;
        default:
          output = JSON.stringify(exportData, null, 2);
      }

      // Apply compression if requested
      if (exportOptions.compression && exportOptions.format === 'json') {
        output = JSON.stringify(exportData); // Remove formatting for compression
      }

      setExportProgress(100);
      return output;

    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [generateChecksum]);

  // Import field configurations
  const importFields = useCallback(async (
    data: string,
    options: Partial<ImportOptions> = {}
  ): Promise<FieldConfig[]> => {
    const importOptions: ImportOptions = {
      overwriteExisting: false,
      validateOnImport: true,
      createBackup: true,
      mergeStrategy: 'append',
      ...options
    };

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Parse input data
      let importData: ExportData;
      
      try {
        importData = JSON.parse(data);
        setImportProgress(20);
      } catch (parseError) {
        throw new Error('Invalid JSON format');
      }

      // Validate data structure
      if (!importData.fields || !Array.isArray(importData.fields)) {
        throw new Error('Invalid field data structure');
      }

      setImportProgress(30);

      // Verify checksum if available
      if (importData.metadata?.checksum && importOptions.validateOnImport) {
        const dataString = JSON.stringify(importData.fields);
        const calculatedChecksum = generateChecksum(dataString);
        
        if (calculatedChecksum !== importData.metadata.checksum) {
          throw new Error('Data integrity check failed - checksum mismatch');
        }
      }

      setImportProgress(50);

      // Process imported fields
      const processedFields: FieldConfig[] = [];
      
      for (let i = 0; i < importData.fields.length; i++) {
        const field = importData.fields[i];
        setImportProgress(50 + (i / importData.fields.length) * 40);

        // Validate field structure
        if (importOptions.validateOnImport) {
          if (!field.id || !field.name || !field.type) {
            console.warn(`Skipping invalid field at index ${i}:`, field);
            continue;
          }
        }

        // Create processed field
        const processedField: FieldConfig = {
          id: field.id,
          name: field.name,
          type: field.type,
          configuration: field.configuration || {},
          metadata: {
            ...field.metadata,
            updatedAt: new Date().toISOString(),
            version: importData.version || '1.0.0'
          }
        };

        processedFields.push(processedField);
      }

      setImportProgress(95);

      // Apply merge strategy
      let finalFields = processedFields;
      
      if (importOptions.mergeStrategy === 'replace') {
        // Replace all existing fields
        finalFields = processedFields;
      } else if (importOptions.mergeStrategy === 'merge') {
        // Merge with existing fields (implementation depends on existing data)
        finalFields = processedFields;
      }
      // 'append' strategy is default - just add new fields

      setImportProgress(100);
      return finalFields;

    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [generateChecksum]);

  // Download exported data
  const downloadExport = useCallback((data: string, filename: string, format: string) => {
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const blob = new Blob([data], { 
      type: mimeTypes[format as keyof typeof mimeTypes] || 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Validate field configuration
  const validateFieldConfig = useCallback((field: any): string[] => {
    const errors: string[] = [];

    if (!field.id) errors.push('Field ID is required');
    if (!field.name) errors.push('Field name is required');
    if (!field.type) errors.push('Field type is required');

    // Validate field type
    const validTypes = ['TEXT', 'NUMBER', 'EMAIL', 'SELECT', 'CHECKBOX', 'RADIO', 'DATE', 'TIME'];
    if (field.type && !validTypes.includes(field.type)) {
      errors.push(`Invalid field type: ${field.type}`);
    }

    // Validate configuration structure
    if (field.configuration) {
      if (field.configuration.validation && !Array.isArray(field.configuration.validation)) {
        errors.push('Validation rules must be an array');
      }
      
      if (field.configuration.enhancements && !Array.isArray(field.configuration.enhancements)) {
        errors.push('Enhancements must be an array');
      }
    }

    return errors;
  }, []);

  // Convert fields to CSV format
  const convertToCSV = useCallback((fields: FieldConfig[]): string => {
    const headers = ['ID', 'Name', 'Type', 'Required', 'Placeholder', 'Description'];
    const rows = [headers.join(',')];

    fields.forEach(field => {
      const row = [
        field.id,
        `"${field.name}"`,
        field.type,
        field.configuration?.isRequired || false,
        `"${field.configuration?.placeholder || ''}"`,
        `"${field.configuration?.description || ''}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }, []);

  // Create backup before import
  const createBackup = useCallback(async (fields: FieldConfig[]): Promise<string> => {
    const backup = await exportFields(fields, {
      format: 'json',
      includeMetadata: true,
      includeValidation: true,
      includeEnhancements: true
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `field-backup-${timestamp}.json`;
    
    downloadExport(backup, backupFilename, 'json');
    return backupFilename;
  }, [exportFields, downloadExport]);

  return {
    // State
    isExporting,
    isImporting,
    exportProgress,
    importProgress,

    // Actions
    exportFields,
    importFields,
    downloadExport,
    createBackup,
    validateFieldConfig,

    // Utilities
    generateChecksum,
    convertToCSV
  };
};