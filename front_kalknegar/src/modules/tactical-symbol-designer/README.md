# Tactical Symbol Designer Module

A Vue.js module for designing tactical symbols with point and polyline functionality.

## Features

- **Point Drawing**: Create individual points on a canvas
- **Line Drawing**: Connect two points with a line
- **Polyline Drawing**: Create continuous line paths by connecting multiple points
- **Symbol Management**: Create, edit, and delete tactical symbols
- **Export/Import**: Export symbols to JSON and import from JSON files
- **Validation**: Comprehensive input validation and error handling

## Installation

This module is part of the Kalk Negar application and does not need separate installation.

## Usage

### Basic Usage

To use the tactical symbol designer, import and use the main component:

```vue
<template>
  <SymbolDesignerPage />
</template>

<script setup>
import { SymbolDesignerPage } from './modules/tactical-symbol-designer';
</script>
```

### Component Structure

The module consists of the following main components:

1. **SymbolDesignerPage**: Main page component that orchestrates all functionality
2. **DrawingCanvas**: Canvas component for drawing points and lines
3. **Toolbar**: Toolbar with drawing mode selection and canvas controls
4. **PointList**: List of points with management controls
5. **LineList**: List of lines with management controls
6. **SymbolForm**: Form for creating and editing symbol metadata
7. **ExportImport**: Component for exporting and importing symbols

### Store

The module uses Pinia for state management. The store provides the following functionality:

- `points`: Array of points on the canvas
- `lines`: Array of lines on the canvas
- `addPoint(point)`: Add a new point
- `deletePoint(id)`: Delete a point by ID
- `addLine(line)`: Add a new line
- `deleteLine(id)`: Delete a line by ID
- `clearCanvas()`: Clear all points and lines
- `loadSymbol(symbolData)`: Load a symbol into the designer
- `exportSymbol()`: Export the current symbol data

### Drawing Modes

The designer supports three drawing modes:

1. **Point Mode**: Click anywhere on the canvas to create a point
2. **Line Mode**: Click on two points to create a line between them
3. **Polyline Mode**: Click on multiple points to create a continuous line path

### Data Models

#### Point
```typescript
interface Point {
  id: string;
  x: number;
  y: number;
}
```

#### Line
```typescript
interface Line {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
```

#### TacticalSymbol
```typescript
interface TacticalSymbol {
  id: string;
  name: string;
  description?: string;
  points: Point[];
  lines: Line[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Export/Import

The module supports exporting and importing symbols in JSON format:

```json
{
  "id": "symbol-id",
  "name": "Symbol Name",
  "description": "Symbol Description",
  "points": [
    {
      "id": "point-id",
      "x": 100,
      "y": 200
    }
  ],
  "lines": [
    {
      "id": "line-id",
      "startX": 100,
      "startY": 200,
      "endX": 150,
      "endY": 250
    }
  ],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## Testing

The module includes comprehensive unit tests for the store and utility functions:

- Store tests: `stores/tacticalSymbolDesignerStore.test.ts`
- Utility tests: `utils/exportImport.test.ts`

Run tests with:
```bash
npm run test:unit
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for your changes
5. Submit a pull request

## License

This module is part of the Kalk Negar application and is licensed under the same license as the main application.