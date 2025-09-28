# API Integration Guide for Kalknegar

## Overview

This guide explains how the Mock API system has been implemented in `front_kalknegar` to match the pattern used in `front_dashboard`. The system allows seamless switching between local storage (IndexedDB) and remote API calls.

## Architecture

### 1. API Layer Structure

```
src/services/api/
├── types.ts              # Shared API types and interfaces
├── baseApiClient.ts      # Base HTTP client with error handling
├── scenarioApiService.ts # Main API service for scenarios
├── mockApiServer.ts      # Mock implementation for development
├── mockData.ts          # Mock data and utilities
└── index.ts             # Exports
```

### 2. Key Components

#### BaseApiClient
- Handles HTTP requests (GET, POST, PUT, DELETE)
- Manages timeouts and retries
- Provides consistent error handling
- Supports file uploads

#### ScenarioApiService
- Main service for scenario operations
- Automatically switches between mock and real API
- Provides methods for CRUD operations
- Handles import/export functionality

#### MockApiServer
- Simulates backend behavior
- Maintains in-memory data store
- Provides realistic delays and responses
- Supports all API endpoints

## Environment Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK_API=true
VITE_OFFLINE_MODE=false

# Development
VITE_DEV_MODE=true
```

### Switching Modes

The system automatically determines which mode to use based on environment variables:

1. **Mock Mode**: `VITE_USE_MOCK_API=true` or `VITE_API_URL` not set
2. **API Mode**: `VITE_USE_MOCK_API=false` and `VITE_API_URL` is set
3. **Offline Mode**: `VITE_OFFLINE_MODE=true` (forces local storage)

## Usage Examples

### 1. Using the API Service Directly

```typescript
import { scenarioApiService } from '@/services/api/scenarioApiService';

// Get all scenarios
const scenarios = await scenarioApiService.getScenarios();

// Get specific scenario
const scenario = await scenarioApiService.getScenarioById('scenario-1');

// Create new scenario
const newScenario = await scenarioApiService.createScenario({
  name: 'New Scenario',
  description: 'Description',
  // ... other fields
});

// Update scenario
const updated = await scenarioApiService.updateScenario('scenario-1', {
  name: 'Updated Name'
});

// Delete scenario
await scenarioApiService.deleteScenario('scenario-1');
```

### 2. Using the Composable

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <!-- Scenario list -->
    </div>
  </div>
</template>

<script setup>
import { useScenarioApi } from '@/composables/useScenarioApi';

const {
  loading,
  error,
  getScenarios,
  createScenario,
  updateScenario,
  deleteScenario
} = useScenarioApi();

// Load scenarios on mount
onMounted(async () => {
  const scenarios = await getScenarios();
  console.log('Scenarios:', scenarios);
});
</script>
```

### 3. Using the Enhanced IO Layer

The existing `useScenarioIO` composable has been enhanced to support both local and API storage:

```typescript
import { useScenarioIO } from '@/scenariostore/io';

const { saveToApi, loadFromApi, duplicateScenario } = useScenarioIO(store);

// Save to API (automatically switches between mock and real)
await saveToApi();

// Load from API
await loadFromApi('scenario-id');

// Duplicate scenario (uses appropriate storage)
await duplicateScenario();
```

## API Endpoints

### Scenarios

- `GET /api/scenarios` - List scenarios with query parameters
- `GET /api/scenarios/:id` - Get specific scenario
- `POST /api/scenarios` - Create new scenario
- `PUT /api/scenarios/:id` - Update scenario
- `DELETE /api/scenarios/:id` - Delete scenario
- `GET /api/scenarios/stats` - Get scenario statistics

### Import/Export

- `POST /api/scenarios/import` - Import scenario from file
- `GET /api/scenarios/:id/export` - Export scenario in various formats

### Files

- `POST /api/upload` - Upload files

## Query Parameters

### Scenario List Query

```typescript
interface ScenarioQuery {
  search?: string;        // Search by name/description
  status?: string[];      // Filter by status
  limit?: number;         // Pagination limit
  offset?: number;        // Pagination offset
  sortBy?: 'name' | 'created' | 'modified';
  sortOrder?: 'asc' | 'desc';
}
```

### Export Options

```typescript
interface ExportOptions {
  format?: 'json' | 'kml' | 'kmz' | 'xlsx' | 'milx';
  includeUnits?: boolean;
  includeFeatures?: boolean;
  oneFolderPerSide?: boolean;
  useShortName?: boolean;
  embedIcons?: boolean;
}
```

## Error Handling

The API client provides consistent error handling:

```typescript
import { ApiClientError } from '@/services/api/baseApiClient';

try {
  const scenario = await scenarioApiService.getScenarioById('invalid-id');
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  }
}
```

## Development Workflow

### 1. Development with Mock API

1. Set `VITE_USE_MOCK_API=true` in `.env.local`
2. Develop and test features using mock data
3. Mock API provides realistic responses and delays

### 2. Testing with Real API

1. Set `VITE_USE_MOCK_API=false` and `VITE_API_URL=http://localhost:8000/api`
2. Ensure backend is running
3. Test integration with real API

### 3. Production Deployment

1. Set `VITE_API_URL` to production API URL
2. Set `VITE_USE_MOCK_API=false`
3. Build and deploy

## Migration from Local Storage

The system maintains backward compatibility with existing local storage:

- Existing IndexedDB data remains accessible
- Local storage methods continue to work
- Gradual migration to API is possible
- Offline mode still available

## Benefits

1. **Seamless Development**: Switch between mock and real API easily
2. **Consistent Interface**: Same API methods regardless of backend
3. **Error Handling**: Robust error handling and retry logic
4. **Type Safety**: Full TypeScript support with shared types
5. **Testing**: Mock API enables comprehensive testing
6. **Offline Support**: Maintains offline capabilities

## Next Steps

1. **Backend Development**: Implement FastAPI endpoints matching the contract
2. **Authentication**: Add JWT token support
3. **Real-time Updates**: Implement WebSocket for live collaboration
4. **File Storage**: Add support for file uploads and downloads
5. **Caching**: Implement client-side caching for better performance

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows frontend origin
2. **Network Errors**: Check API URL and network connectivity
3. **Type Errors**: Ensure shared types are synchronized
4. **Mock Data**: Verify mock data matches expected format

### Debug Mode

Enable debug logging by setting `VITE_DEV_MODE=true` in environment variables.
