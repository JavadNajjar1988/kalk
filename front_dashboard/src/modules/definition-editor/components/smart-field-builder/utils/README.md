# Field Converter Utility

This utility provides a function to convert SmartFieldConfig objects (used in the Smart Field Builder) to CustomField objects (used by FieldPreview).

## Usage

```typescript
import { convertSmartFieldToCustomField } from './fieldConverter';
import { SmartFieldConfig } from '../types/smartFieldTypes';
import { CustomField } from '@/modules/definition-editor/types/equipment';

// Example SmartFieldConfig
const smartFieldConfig: SmartFieldConfig = {
  id: 'field_123',
  name: 'سن',
  englishName: 'age',
  baseType: 'number',
  enhancements: [
    {
      type: 'range',
      config: { min: 0, max: 120 },
      enabled: true
    },
    {
      type: 'unit',
      config: { unit: 'سال', display: 'after' },
      enabled: true
    }
  ],
  // ... other properties
};

// Convert to CustomField
const customField: CustomField = convertSmartFieldToCustomField(smartFieldConfig);

// Use with FieldPreview
<FieldPreview fields={[customField]} />
```

## How It Works

1. **Base Type Mapping**: Converts Smart Field base types to Custom Field types
2. **Enhancement Conversion**: Transforms Smart Field enhancements to Custom Field properties
3. **Metadata Preservation**: Stores Smart Field metadata in the defaultValue field as JSON for FieldPreview to extract
4. **Compatibility**: Ensures both previews (live preview in Smart Field Builder and form preview) display the same configuration

## Benefits

- **Consistent Data Source**: Both previews get their data from the same SmartFieldConfig source
- **Real-time Synchronization**: Changes in the Smart Field Builder are immediately reflected in both previews
- **Proper Formatting**: Ensures FieldPreview can extract display properties (placeholder, helpText, etc.) from the metadata