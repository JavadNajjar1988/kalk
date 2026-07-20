import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import type { 
  Side, 
  SideGroup, 
  Unit, 
  MapLayer,
  EntityId,
  UnitPersonnel,
  UnitSupply 
} from '@/types/orbat';

interface OrbatState {
  sides: Side[];
  selectedSideId: EntityId | null;
  selectedUnitId: EntityId | null;
  mapLayers: MapLayer[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrbatState = {
  sides: [
    {
      id: 'iran',
      name: 'جمهوری اسلامی ایران',
      description: 'نیروهای مسلح جمهوری اسلامی ایران',
      standardIdentity: 'friend',
      groups: [
        {
          id: 'army',
          name: 'ارتش',
          description: 'نیروی زمینی ارتش',
          subUnits: [
            {
              id: 'division_21',
              name: 'لشکر 21 زرهی',
              sidc: '10031000521211000000',
              description: 'لشکر 21 زرهی حمزه سیدالشهدا',
              subUnits: [
                {
                  id: 'brigade_1',
                  name: 'تیپ 1 زرهی',
                  sidc: '10031000521211000000',
                  personnel: [
                    { name: 'افسر', count: 150, onHand: 145 },
                    { name: 'درجه‌دار', count: 800, onHand: 780 },
                    { name: 'سرباز', count: 2000, onHand: 1950 },
                  ],

                  subUnits: [],
                  _sid: 'iran',
                  _gid: 'army',
                },
              ],
              _sid: 'iran',
              _gid: 'army',
            },
          ],
        },
        {
          id: 'irgc',
          name: 'سپاه پاسداران',
          description: 'نیروی زمینی سپاه',
          subUnits: [
            {
              id: 'division_8',
              name: 'لشکر 8 نجف اشرف',
              sidc: '10031000001211000000',
              description: 'لشکر 8 نجف اشرف',
              subUnits: [],
              _sid: 'iran',
              _gid: 'irgc',
            },
          ],
        },
      ],
    },
  ],
  selectedSideId: null,
  selectedUnitId: null,

  mapLayers: [],
  isLoading: false,
  error: null,
};

const orbatSlice = createSlice({
  name: 'orbat',
  initialState,
  reducers: {
    // Side management
    addSide: (state, action: PayloadAction<Omit<Side, 'id'>>) => {
      const newSide: Side = {
        ...action.payload,
        id: `side_${Date.now()}`,
      };
      state.sides.push(newSide);
    },
    updateSide: (state, action: PayloadAction<Side>) => {
      const index = state.sides.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sides[index] = action.payload;
      }
    },
    deleteSide: (state, action: PayloadAction<EntityId>) => {
      state.sides = state.sides.filter(s => s.id !== action.payload);
      if (state.selectedSideId === action.payload) {
        state.selectedSideId = null;
      }
    },
    selectSide: (state, action: PayloadAction<EntityId | null>) => {
      state.selectedSideId = action.payload;
    },

    // Group management
    addGroup: (state, action: PayloadAction<{ sideId: EntityId; group: Omit<SideGroup, 'id'> }>) => {
      const side = state.sides.find(s => s.id === action.payload.sideId);
      if (side) {
        const newGroup: SideGroup = {
          ...action.payload.group,
          id: `group_${Date.now()}`,
        };
        side.groups.push(newGroup);
      }
    },

    // Unit management
    addUnit: (state, action: PayloadAction<{
      sideId: EntityId;
      groupId: EntityId;
      parentId?: EntityId;
      unit: Omit<Unit, 'id'>;
    }>) => {
      const { sideId, groupId, parentId, unit } = action.payload;
      const side = state.sides.find(s => s.id === sideId);
      if (!side) return;

      const group = side.groups.find(g => g.id === groupId);
      if (!group) return;

      const newUnit: Unit = {
        ...unit,
        id: `unit_${Date.now()}`,
        _sid: sideId,
        _gid: groupId,
        _pid: parentId,
      };

      if (parentId) {
        // Add as subunit
        const findAndAddSubunit = (units: Unit[]): boolean => {
          for (const u of units) {
            if (u.id === parentId) {
              if (!u.subUnits) u.subUnits = [];
              u.subUnits.push(newUnit);
              return true;
            }
            if (u.subUnits && findAndAddSubunit(u.subUnits)) {
              return true;
            }
          }
          return false;
        };
        findAndAddSubunit(group.subUnits);
      } else {
        // Add to group root
        group.subUnits.push(newUnit);
      }
    },

    updateUnit: (state, action: PayloadAction<Unit>) => {
      const unit = action.payload;
      const side = state.sides.find(s => s.id === unit._sid);
      if (!side) return;

      const group = side.groups.find(g => g.id === unit._gid);
      if (!group) return;

      const updateInTree = (units: Unit[]): boolean => {
        for (let i = 0; i < units.length; i++) {
          if (units[i].id === unit.id) {
            units[i] = unit;
            return true;
          }
          if (units[i].subUnits && updateInTree(units[i].subUnits ?? [])) {
            return true;
          }
        }
        return false;
      };

      updateInTree(group.subUnits ?? []);
    },

    deleteUnit: (state, action: PayloadAction<{ unitId: EntityId; sideId: EntityId; groupId: EntityId }>) => {
      const { unitId, sideId, groupId } = action.payload;
      const side = state.sides.find(s => s.id === sideId);
      if (!side) return;

      const group = side.groups.find(g => g.id === groupId);
      if (!group) return;

      const deleteFromTree = (units: Unit[]): Unit[] => {
        return units.filter(u => {
          if (u.id === unitId) return false;
          if (u.subUnits) {
            u.subUnits = deleteFromTree(u.subUnits);
          }
          return true;
        });
      };

      group.subUnits = deleteFromTree(group.subUnits);
    },

    selectUnit: (state, action: PayloadAction<EntityId | null>) => {
      state.selectedUnitId = action.payload;
    },





    // Map layers
    addMapLayer: (state, action: PayloadAction<Omit<MapLayer, 'id'>>) => {
      const newLayer: MapLayer = {
        ...action.payload,
        id: `layer_${Date.now()}`,
      };
      state.mapLayers.push(newLayer);
    },

    toggleMapLayer: (state, action: PayloadAction<string>) => {
      const layer = state.mapLayers.find(l => l.id === action.payload);
      if (layer) {
        layer.visible = !layer.visible;
      }
    },

    updateMapLayer: (state, action: PayloadAction<MapLayer>) => {
      const index = state.mapLayers.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.mapLayers[index] = action.payload;
      }
    },

    deleteMapLayer: (state, action: PayloadAction<string>) => {
      state.mapLayers = state.mapLayers.filter(l => l.id !== action.payload);
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addSide,
  updateSide,
  deleteSide,
  selectSide,
  addGroup,
  addUnit,
  updateUnit,
  deleteUnit,
  selectUnit,

  addMapLayer,
  toggleMapLayer,
  updateMapLayer,
  deleteMapLayer,
  setLoading,
  setError,
} = orbatSlice.actions;

// Selectors
export const selectSides = (state: RootState) => state.orbat.sides;
export const selectSelectedSideId = (state: RootState) => state.orbat.selectedSideId;
export const selectSelectedSide = (state: RootState) => {
  if (!state.orbat.selectedSideId) return null;
  return state.orbat.sides.find(s => s.id === state.orbat.selectedSideId) || null;
};
export const selectSelectedUnitId = (state: RootState) => state.orbat.selectedUnitId;

export const selectMapLayers = (state: RootState) => state.orbat.mapLayers;
export const selectIsLoading = (state: RootState) => state.orbat.isLoading;
export const selectError = (state: RootState) => state.orbat.error;

// Helper selector to get all units in a flat array
export const selectAllUnits = (state: RootState) => {
  const units: Unit[] = [];
  const collectUnits = (unitList: Unit[]) => {
    for (const unit of unitList) {
      units.push(unit);
      if (unit.subUnits) {
        collectUnits(unit.subUnits);
      }
    }
  };

  state.orbat.sides.forEach(side => {
    side.groups.forEach(group => {
      collectUnits(group.subUnits);
    });
  });

  return units;
};

export default orbatSlice.reducer;
