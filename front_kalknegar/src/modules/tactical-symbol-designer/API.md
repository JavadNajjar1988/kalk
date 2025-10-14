# Tactical Symbol Designer API Documentation

## Components

### SymbolDesignerPage

Main page component that provides the complete tactical symbol designer interface.

#### Props

None

#### Events

None

#### Methods

None

#### Usage

```vue
<template>
  <SymbolDesignerPage />
</template>

<script setup>
import { SymbolDesignerPage } from './modules/tactical-symbol-designer';
</script>
```

### DrawingCanvas

Canvas component for drawing points and lines.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| points | Point[] | Yes | Array of points to display on the canvas |
| lines | Line[] | Yes | Array of lines to display on the canvas |
| mode | 'point' \| 'line' \| 'polyline' | Yes | Current drawing mode |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| update:points | Point[] | Emitted when points are added, updated, or removed |
| update:lines | Line[] | Emitted when lines are added, updated, or removed |
| update:mode | 'point' \| 'line' \| 'polyline' | Emitted when drawing mode changes |
| error | string | Emitted when an error occurs |

#### Methods

None

#### Usage

```vue
<template>
  <DrawingCanvas 
    :points="points"
    :lines="lines"
    :mode="mode"
    @update:points="handlePointsUpdate"
    @update:lines="handleLinesUpdate"
    @update:mode="handleModeUpdate"
    @error="handleError"
  />
</template>
```

### Toolbar

Toolbar component with drawing mode selection and canvas controls.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| mode | 'point' \| 'line' \| 'polyline' | Yes | Current drawing mode |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| update:mode | 'point' \| 'line' \| 'polyline' | Emitted when drawing mode changes |
| clear-canvas | None | Emitted when the clear canvas button is clicked |

#### Methods

None

#### Usage

```vue
<template>
  <Toolbar 
    :mode="mode"
    @update:mode="handleModeUpdate"
    @clear-canvas="handleClearCanvas"
  />
</template>
```

### PointList

List component for displaying and managing points.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| points | Point[] | Yes | Array of points to display |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| select-point | string | Emitted when a point is selected (payload is point ID) |
| update-point | { id: string, updates: Partial<Point> } | Emitted when a point is updated |
| delete-point | string | Emitted when a point is deleted (payload is point ID) |

#### Methods

None

#### Usage

```vue
<template>
  <PointList 
    :points="points"
    @select-point="handleSelectPoint"
    @update-point="handleUpdatePoint"
    @delete-point="handleDeletePoint"
  />
</template>
```

### LineList

List component for displaying and managing lines.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| lines | Line[] | Yes | Array of lines to display |
| points | Point[] | Yes | Array of points (used for displaying line endpoints) |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| delete-line | string | Emitted when a line is deleted (payload is line ID) |

#### Methods

None

#### Usage

```vue
<template>
  <LineList 
    :lines="lines"
    :points="points"
    @delete-line="handleDeleteLine"
  />
</template>
```

### SymbolForm

Form component for creating and editing symbol metadata.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| symbol | TacticalSymbol \| null | No | Symbol to edit (null for creating new symbol) |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| save | TacticalSymbol | Emitted when the form is submitted |
| cancel | None | Emitted when the cancel button is clicked |
| error | string | Emitted when a form validation error occurs |

#### Methods

None

#### Usage

```vue
<template>
  <SymbolForm 
    :symbol="editingSymbol"
    @save="handleSave"
    @cancel="handleCancel"
    @error="handleError"
  />
</template>
```

### ExportImport

Component for exporting and importing symbols.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| currentSymbol | TacticalSymbol \| null | No | Current symbol to export |
| symbols | TacticalSymbol[] | Yes | Array of all symbols (for bulk export) |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| import-symbol | TacticalSymbol | Emitted when a single symbol is imported |
| import-symbols | TacticalSymbol[] | Emitted when multiple symbols are imported |
| error | string | Emitted when an import/export error occurs |
| success | string | Emitted when an import/export operation succeeds |

#### Methods

None

#### Usage

```vue
<template>
  <ExportImport 
    :current-symbol="currentSymbol"
    :symbols="symbols"
    @import-symbol="handleImportSymbol"
    @import-symbols="handleImportSymbols"
    @error="handleError"
    @success="handleSuccess"
  />
</template>
```

## Store

### useTacticalSymbolDesignerStore

Pinia store for managing tactical symbol designer state.

#### State

| Property | Type | Description |
|----------|------|-------------|
| points | Point[] | Array of points on the canvas |
| lines | Line[] | Array of lines on the canvas |
| isLoading | boolean | Loading state |
| error | string \| null | Error message |

#### Getters

None

#### Actions

| Action | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| setPoints | points: Point[] | void | Set the points array |
| setLines | lines: Line[] | void | Set the lines array |
| addPoint | point: Point | void | Add a new point |
| updatePoint | id: string, updates: Partial<Point> | void | Update a point by ID |
| deletePoint | id: string | void | Delete a point by ID |
| addLine | line: Line | void | Add a new line |
| deleteLine | id: string | void | Delete a line by ID |
| clearCanvas | None | void | Clear all points and lines |
| loadSymbol | symbolData: { points: Point[], lines: Line[] } | void | Load a symbol into the designer |
| exportSymbol | None | { points: Point[], lines: Line[] } | Export the current symbol data |
| createPolylineFromPoints | pointIds: string[] | void | Create polyline from point IDs |

#### Usage

```typescript
import { useTacticalSymbolDesignerStore } from './modules/tactical-symbol-designer/stores';

const store = useTacticalSymbolDesignerStore();

// Add a point
store.addPoint({ id: '1', x: 100, y: 200 });

// Add a line
store.addLine({ id: '1', startX: 100, startY: 200, endX: 150, endY: 250 });
```

## Utilities

### Export/Import Utilities

#### exportSymbolToJson

Export a tactical symbol to JSON format.

```typescript
import { exportSymbolToJson } from './modules/tactical-symbol-designer/utils/exportImport';

const json = exportSymbolToJson(symbol);
```

#### importSymbolFromJson

Import a tactical symbol from JSON format.

```typescript
import { importSymbolFromJson } from './modules/tactical-symbol-designer/utils/exportImport';

const symbol = importSymbolFromJson(json);
```

#### exportSymbolsToJson

Export multiple tactical symbols to JSON format.

```typescript
import { exportSymbolsToJson } from './modules/tactical-symbol-designer/utils/exportImport';

const json = exportSymbolsToJson(symbols);
```

#### importSymbolsFromJson

Import multiple tactical symbols from JSON format.

```typescript
import { importSymbolsFromJson } from './modules/tactical-symbol-designer/utils/exportImport';

const symbols = importSymbolsFromJson(json);
```

## Types

### Point

```typescript
interface Point {
  id: string;
  x: number;
  y: number;
}
```

### Line

```typescript
interface Line {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
```

### TacticalSymbol

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