// Field Drag and Drop System - Main Exports

// Core Components
export { DragDropProvider, useDragDrop as useDragDropContext } from './DragDropContext';
export { DraggableField } from './DraggableField';
export { DroppableContainer } from './DroppableContainer';
export { DragDropFieldList } from './DragDropFieldList';

// React Hooks
export { default as useDragDrop } from './useDragDrop';

// Types and Interfaces
export type {
  DragItem,
  DropTarget
} from './DragDropContext';

export type {
  DragDropItem,
  DropZone,
  DragDropState,
  UseDragDropOptions,
  UseDragDropReturn
} from './useDragDrop';

// Usage Examples and Documentation

/**
 * Basic Usage Example:
 * 
 * 1. Simple Drag and Drop Field List:
 * ```tsx
 * import { DragDropFieldList } from './drag-drop';
 * 
 * const FieldManager = () => {
 *   const [fields, setFields] = useState([
 *     {
 *       id: 'field1',
 *       name: 'Email Address',
 *       type: 'email',
 *       category: 'contact',
 *       order: 1
 *     },
 *     {
 *       id: 'field2',
 *       name: 'Phone Number',
 *       type: 'tel',
 *       category: 'contact',
 *       order: 2,
 *       groupId: 'contact-group'
 *     }
 *   ]);
 * 
 *   const [groups, setGroups] = useState([
 *     {
 *       id: 'contact-group',
 *       name: 'Contact Information',
 *       collapsed: false,
 *       order: 1
 *     }
 *   ]);
 * 
 *   const handleFieldReorder = (sourceIndex, targetIndex) => {
 *     const newFields = [...fields];
 *     const [movedField] = newFields.splice(sourceIndex, 1);
 *     newFields.splice(targetIndex, 0, movedField);
 *     
 *     // Update order values
 *     newFields.forEach((field, index) => {
 *       field.order = index + 1;
 *     });
 *     
 *     setFields(newFields);
 *   };
 * 
 *   const handleFieldMove = (fieldId, targetGroupId, position) => {
 *     setFields(prev => prev.map(field => 
 *       field.id === fieldId 
 *         ? { ...field, groupId: targetGroupId, order: position }
 *         : field
 *     ));
 *   };
 * 
 *   return (
 *     <DragDropFieldList
 *       fields={fields}
 *       groups={groups}
 *       onFieldReorder={handleFieldReorder}
 *       onFieldMove={handleFieldMove}
 *       onFieldEdit={(field) => console.log('Edit:', field)}
 *       onAddField={(groupId) => console.log('Add to group:', groupId)}
 *       enableGrouping={true}
 *     />
 *   );
 * };
 * ```
 * 
 * 2. Custom Draggable Component:
 * ```tsx
 * import { DragDropProvider, DraggableField, DroppableContainer } from './drag-drop';
 * 
 * const CustomDragDrop = () => {
 *   const handleFieldReorder = (sourceIndex, targetIndex) => {
 *     console.log(`Move field from ${sourceIndex} to ${targetIndex}`);
 *   };
 * 
 *   return (
 *     <DragDropProvider onFieldReorder={handleFieldReorder}>
 *       <DroppableContainer
 *         id="main-container"
 *         accepts={['field']}
 *         placeholder={<div>Drop fields here</div>}
 *       >
 *         <DraggableField
 *           id="field1"
 *           index={0}
 *           data={{ name: 'Email', type: 'email' }}
 *         >
 *           <div style={{ padding: 16, border: '1px solid #ccc' }}>
 *             Email Field
 *           </div>
 *         </DraggableField>
 * 
 *         <DraggableField
 *           id="field2"
 *           index={1}
 *           data={{ name: 'Phone', type: 'tel' }}
 *         >
 *           <div style={{ padding: 16, border: '1px solid #ccc' }}>
 *             Phone Field
 *           </div>
 *         </DraggableField>
 *       </DroppableContainer>
 *     </DragDropProvider>
 *   );
 * };
 * ```
 * 
 * 3. Advanced Hook Usage:
 * ```tsx
 * import { useDragDrop } from './drag-drop';
 * 
 * const AdvancedDragDrop = () => {
 *   const {
 *     dragState,
 *     startDrag,
 *     endDrag,
 *     enterDropZone,
 *     leaveDropZone,
 *     drop,
 *     canDrop
 *   } = useDragDrop({
 *     onDragStart: (item) => console.log('Drag started:', item),
 *     onDragEnd: (item) => console.log('Drag ended:', item),
 *     onDrop: (item, zone) => {
 *       console.log('Dropped:', item, 'on:', zone);
 *       return true; // Return true if drop was successful
 *     },
 *     enableKeyboard: true
 *   });
 * 
 *   const handleMouseDown = (item) => {
 *     startDrag(item, { x: 0, y: 0 });
 *   };
 * 
 *   return (
 *     <div>
 *       <div
 *         onMouseDown={() => handleMouseDown({ id: 'item1', type: 'field', data: {}, index: 0 })}
 *         style={{ 
 *           padding: 16, 
 *           backgroundColor: dragState.isDragging ? '#f0f0f0' : 'white',
 *           cursor: 'grab'
 *         }}
 *       >
 *         Draggable Item
 *       </div>
 * 
 *       <div
 *         onMouseEnter={() => enterDropZone({ id: 'zone1', type: 'container', accepts: ['field'] })}
 *         onMouseLeave={leaveDropZone}
 *         onMouseUp={drop}
 *         style={{
 *           padding: 32,
 *           border: '2px dashed #ccc',
 *           backgroundColor: dragState.dropZone ? '#e3f2fd' : 'transparent'
 *         }}
 *       >
 *         Drop Zone
 *       </div>
 *     </div>
 *   );
 * };
 * ```
 * 
 * Features:
 * - Visual drag feedback with custom previews
 * - Drop zone highlighting and position indicators
 * - Support for field grouping and ungrouped fields
 * - Keyboard accessibility support
 * - Touch device support (configurable)
 * - Smooth animations and transitions
 * - Glassmorphism UI design
 * - Flexible drop handling with custom callbacks
 * - Type-safe drag and drop operations
 * - Non-intrusive integration with existing field systems
 * - Performance optimized with React best practices
 */