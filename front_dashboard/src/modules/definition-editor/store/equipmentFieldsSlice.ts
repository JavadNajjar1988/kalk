import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { CustomFieldDefinition } from '../types/equipment';

interface EquipmentFieldsState {
  customFieldDefinitions: Record<string, CustomFieldDefinition[]>;
  nodeFieldSetVersion: Record<string, number>;
}

const initialState: EquipmentFieldsState = {
  customFieldDefinitions: {},
  nodeFieldSetVersion: {},
};

const equipmentFieldsSlice = createSlice({
  name: 'equipmentFields',
  initialState,
  reducers: {
    addCustomFieldDefinition: (state, action: PayloadAction<{ nodeId: string; field: CustomFieldDefinition }>) => {
      const { nodeId, field } = action.payload;
      if (!state.customFieldDefinitions[nodeId]) {
        state.customFieldDefinitions[nodeId] = [];
      }
      state.customFieldDefinitions[nodeId].push(field);
      state.nodeFieldSetVersion[nodeId] = (state.nodeFieldSetVersion[nodeId] || 0) + 1;
    },
    updateCustomFieldDefinition: (state, action: PayloadAction<{ 
      nodeId: string; 
      fieldId: string; 
      updates: Partial<CustomFieldDefinition> 
    }>) => {
      const { nodeId, fieldId, updates } = action.payload;
      const fields = state.customFieldDefinitions[nodeId];
      if (fields) {
        const index = fields.findIndex(field => field.id === fieldId);
        if (index !== -1) {
          fields[index] = { ...fields[index], ...updates };
          state.nodeFieldSetVersion[nodeId] = (state.nodeFieldSetVersion[nodeId] || 0) + 1;
        }
      }
    },
    deleteCustomFieldDefinition: (state, action: PayloadAction<{ nodeId: string; fieldId: string }>) => {
      const { nodeId, fieldId } = action.payload;
      const fields = state.customFieldDefinitions[nodeId];
      if (fields) {
        state.customFieldDefinitions[nodeId] = fields.filter(field => field.id !== fieldId);
        state.nodeFieldSetVersion[nodeId] = (state.nodeFieldSetVersion[nodeId] || 0) + 1;
      }
    },
    setCustomFieldDefinitions: (state, action: PayloadAction<{ nodeId: string; fields: CustomFieldDefinition[] }>) => {
      const { nodeId, fields } = action.payload;
      state.customFieldDefinitions[nodeId] = fields;
      state.nodeFieldSetVersion[nodeId] = (state.nodeFieldSetVersion[nodeId] || 0) + 1;
    },
    clearCustomFieldDefinitions: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      delete state.customFieldDefinitions[nodeId];
      delete state.nodeFieldSetVersion[nodeId];
    },
  },
});

export const { 
  addCustomFieldDefinition, 
  updateCustomFieldDefinition, 
  deleteCustomFieldDefinition,
  setCustomFieldDefinitions,
  clearCustomFieldDefinitions
} = equipmentFieldsSlice.actions;

export const selectCustomFieldsByNodeId = createSelector(
  [(state: { equipmentFields: EquipmentFieldsState }) => state.equipmentFields.customFieldDefinitions, (_state: any, nodeId: string) => nodeId],
  (customFieldDefinitions, nodeId) => customFieldDefinitions[nodeId] || []
);

export const selectNodeFieldSetVersion = (state: { equipmentFields: EquipmentFieldsState }, nodeId: string) => 
  state.equipmentFields.nodeFieldSetVersion[nodeId] || 0;

export default equipmentFieldsSlice.reducer;
