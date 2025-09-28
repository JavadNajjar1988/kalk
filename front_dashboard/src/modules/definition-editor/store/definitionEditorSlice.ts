// Redux slice برای ماژول Definition Editor

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  DefinitionEditorState,
  DefinitionNode,
  ExtendedHierarchyLevel,
  SearchFilters,
  ViewMode,
  TreeDisplayMode,
  DefinitionCategory,
  CategoryType
} from '../types';
import {
  loadCategoryNodes,
  loadCategoryLevels,
  saveCategoryNodes,
  saveCategoryLevels
} from '../data/loader';
import equipmentFieldsReducer from './equipmentFieldsSlice';

// Initial state
const initialState: DefinitionEditorState = {
  nodesByCategory: {},
  levelsByCategory: {},
  filters: {
    query: '',
    searchIn: 'both',
    levelRange: [1, 10],
    hasChildren: 'all',
    hasCoordinates: 'all',
    country: '',
    hasNatoEquivalent: 'all',
    nodeType: 'all',
    specialty: '',
    icon: ''
  },
  viewMode: ViewMode.TREE,
  treeDisplayMode: TreeDisplayMode.HIERARCHY,
  selectedNode: null,
  expandedNodes: ['1'],
  highlightedNodes: [],
  loadingStatus: 'idle',
  error: null,
  currentCategory: null,
  // اضافه کردن state های جدید برای UI
  showCategories: true,
  showDefinitions: false,
  searchTerm: '',
  selectedStatus: 'all',
  selectedCategoryFilter: '',
  selectedItems: [],
  sortOption: 'order'
};

// Async thunks
export const fetchNodes = createAsyncThunk(
  'definitionEditor/fetchNodes',
  async ({ categoryType, categoryId }: { categoryType: CategoryType; categoryId: string }) => {
    const nodes = await loadCategoryNodes(categoryType, categoryId);
    return { categoryId, nodes };
  }
);

export const fetchLevels = createAsyncThunk(
  'definitionEditor/fetchLevels',
  async (categoryType: CategoryType) => {
    const levels = await loadCategoryLevels(categoryType);
    return { categoryType, levels };
  }
);

export const createNode = createAsyncThunk(
  'definitionEditor/createNode',
  async ({ 
    categoryType, 
    categoryId, 
    node 
  }: { 
    categoryType: CategoryType; 
    categoryId: string; 
    node: Omit<DefinitionNode, 'id'> 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentNodes = state.definitionEditor.nodesByCategory[categoryId] || [];
    
    const newNode: DefinitionNode = {
      ...node,
      id: Date.now().toString()
    };
    
    const updatedNodes = [...currentNodes, newNode];
    await saveCategoryNodes(categoryType, categoryId, updatedNodes);
    
    return { categoryId, node: newNode };
  }
);

export const updateNode = createAsyncThunk(
  'definitionEditor/updateNode',
  async ({ 
    categoryType, 
    categoryId, 
    nodeId, 
    updates 
  }: { 
    categoryType: CategoryType; 
    categoryId: string; 
    nodeId: string; 
    updates: Partial<DefinitionNode> 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentNodes = state.definitionEditor.nodesByCategory[categoryId] || [];
    
    const updatedNodes = currentNodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    
    await saveCategoryNodes(categoryType, categoryId, updatedNodes);
    
    return { categoryId, nodeId, updates };
  }
);

export const deleteNode = createAsyncThunk(
  'definitionEditor/deleteNode',
  async ({ 
    categoryType, 
    categoryId, 
    nodeId 
  }: { 
    categoryType: CategoryType; 
    categoryId: string; 
    nodeId: string 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentNodes = state.definitionEditor.nodesByCategory[categoryId] || [];
    
    const updatedNodes = currentNodes.filter(node => node.id !== nodeId);
    await saveCategoryNodes(categoryType, categoryId, updatedNodes);
    
    return { categoryId, nodeId };
  }
);

export const createLevel = createAsyncThunk(
  'definitionEditor/createLevel',
  async ({ 
    categoryType, 
    level 
  }: { 
    categoryType: CategoryType; 
    level: Omit<ExtendedHierarchyLevel, 'id'> 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentLevels = state.definitionEditor.levelsByCategory[categoryType] || [];
    
    const newLevel: ExtendedHierarchyLevel = {
      ...level,
      id: Date.now().toString()
    };
    
    const updatedLevels = [...currentLevels, newLevel];
    await saveCategoryLevels(categoryType, updatedLevels);
    
    return { categoryType, level: newLevel };
  }
);

export const updateLevel = createAsyncThunk(
  'definitionEditor/updateLevel',
  async ({ 
    categoryType, 
    levelId, 
    updates 
  }: { 
    categoryType: CategoryType; 
    levelId: string; 
    updates: Partial<ExtendedHierarchyLevel> 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentLevels = state.definitionEditor.levelsByCategory[categoryType] || [];
    
    const updatedLevels = currentLevels.map(level => 
      level.id === levelId ? { ...level, ...updates } : level
    );
    
    await saveCategoryLevels(categoryType, updatedLevels);
    
    return { categoryType, levelId, updates };
  }
);

export const deleteLevel = createAsyncThunk(
  'definitionEditor/deleteLevel',
  async ({ 
    categoryType, 
    levelId 
  }: { 
    categoryType: CategoryType; 
    levelId: string 
  }, { getState }) => {
    const state = getState() as { definitionEditor: DefinitionEditorState };
    const currentLevels = state.definitionEditor.levelsByCategory[categoryType] || [];
    
    const updatedLevels = currentLevels.filter(level => level.id !== levelId);
    await saveCategoryLevels(categoryType, updatedLevels);
    
    return { categoryType, levelId };
  }
);

// Slice
const definitionEditorSlice = createSlice({
  name: 'definitionEditor',
  initialState,
  reducers: {
    // تنظیم فیلترها
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    
    // پاک کردن فیلترها
    clearFilters: (state) => {
      state.filters = {
        query: '',
        searchIn: 'both',
        levelRange: [1, 10],
        hasChildren: 'all',
        hasCoordinates: 'all',
        country: '',
        hasNatoEquivalent: 'all',
        nodeType: 'all',
        specialty: '',
        icon: ''
      };
    },
    
    // تنظیم حالت نمایش
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    
    // تنظیم حالت نمایش درخت
    setTreeDisplayMode: (state, action: PayloadAction<TreeDisplayMode>) => {
      state.treeDisplayMode = action.payload;
    },
    
    // انتخاب نود
    setSelectedNode: (state, action: PayloadAction<DefinitionNode | null>) => {
      state.selectedNode = action.payload;
    },
    
    // گسترش/جمع کردن نود
    toggleExpandedNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      if (state.expandedNodes.includes(nodeId)) {
        state.expandedNodes = state.expandedNodes.filter(id => id !== nodeId);
      } else {
        state.expandedNodes = [...state.expandedNodes, nodeId];
      }
    },
    
    // تنظیم نودهای گسترش یافته
    setExpandedNodes: (state, action: PayloadAction<string[]>) => {
      state.expandedNodes = action.payload;
    },
    
    // گسترش تمام نودها
    expandAllNodes: (state) => {
      state.expandedNodes = ['1', '2'];
    },
    
    // جمع کردن تمام نودها
    collapseAllNodes: (state) => {
      state.expandedNodes = [];
    },
    
    // هایلایت نودها
    setHighlightedNodes: (state, action: PayloadAction<string[]>) => {
      state.highlightedNodes = action.payload;
    },
    
    // تنظیم نود هایلایت شده
    setHighlightedNode: (state, action: PayloadAction<DefinitionNode | null>) => {
      state.highlightedNodes = action.payload ? [action.payload.id] : [];
    },
    
    // اضافه کردن نود به هایلایت
    addHighlightedNode: (state, action: PayloadAction<string>) => {
      if (!state.highlightedNodes.includes(action.payload)) {
        state.highlightedNodes = [...state.highlightedNodes, action.payload];
      }
    },
    
    // حذف نود از هایلایت
    removeHighlightedNode: (state, action: PayloadAction<string>) => {
      state.highlightedNodes = state.highlightedNodes.filter(id => id !== action.payload);
    },
    
    // پاک کردن هایلایت
    clearHighlightedNodes: (state) => {
      state.highlightedNodes = [];
    },
    
    // تنظیم دسته‌بندی فعلی
    setCurrentCategory: (state, action: PayloadAction<DefinitionCategory | null>) => {
      state.currentCategory = action.payload;
    },
    
    // پاک کردن خطا
    clearError: (state) => {
      state.error = null;
    },
    
    // پاک کردن state
    resetState: () => {
      return { ...initialState };
    },
    
    // بازنشانی نمایش
    resetView: (state) => {
      state.selectedNode = null;
      state.expandedNodes = ['1'];
      state.highlightedNodes = [];
      state.filters = {
        query: '',
        searchIn: 'both',
        levelRange: [1, 10],
        hasChildren: 'all',
        hasCoordinates: 'all',
        country: '',
        hasNatoEquivalent: 'all',
        nodeType: 'all',
        specialty: '',
        icon: ''
      };
    },
    
    // UI State Reducers
    setShowCategories: (state, action: PayloadAction<boolean>) => {
      state.showCategories = action.payload;
    },
    
    setShowDefinitions: (state, action: PayloadAction<boolean>) => {
      state.showDefinitions = action.payload;
    },
    
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    
    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
    },
    
    setSelectedCategoryFilter: (state, action: PayloadAction<string>) => {
      state.selectedCategoryFilter = action.payload;
    },
    
    setSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    
    setSortOption: (state, action: PayloadAction<string>) => {
      state.sortOption = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch Nodes
    builder
      .addCase(fetchNodes.pending, (state) => {
        state.loadingStatus = 'fetching';
        state.error = null;
      })
      .addCase(fetchNodes.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryId, nodes } = action.payload;
        state.nodesByCategory[categoryId] = nodes;
      })
      .addCase(fetchNodes.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در بارگذاری نودها';
      });

    // Fetch Levels
    builder
      .addCase(fetchLevels.pending, (state) => {
        state.loadingStatus = 'fetching';
        state.error = null;
      })
      .addCase(fetchLevels.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryType, levels } = action.payload;
        state.levelsByCategory[categoryType] = levels;
      })
      .addCase(fetchLevels.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در بارگذاری سطوح';
      });

    // Create Node
    builder
      .addCase(createNode.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(createNode.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryId, node } = action.payload;
        if (!state.nodesByCategory[categoryId]) {
          state.nodesByCategory[categoryId] = [];
        }
        state.nodesByCategory[categoryId].push(node);
      })
      .addCase(createNode.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در ایجاد نود';
      });

    // Update Node
    builder
      .addCase(updateNode.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(updateNode.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryId, nodeId, updates } = action.payload;
        const nodes = state.nodesByCategory[categoryId];
        if (nodes) {
          const index = nodes.findIndex(node => node.id === nodeId);
          if (index !== -1) {
            nodes[index] = { ...nodes[index], ...updates };
          }
        }
      })
      .addCase(updateNode.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در بروزرسانی نود';
      });

    // Delete Node
    builder
      .addCase(deleteNode.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(deleteNode.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryId, nodeId } = action.payload;
        const nodes = state.nodesByCategory[categoryId];
        if (nodes) {
          state.nodesByCategory[categoryId] = nodes.filter(node => node.id !== nodeId);
        }
      })
      .addCase(deleteNode.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در حذف نود';
      });

    // Create Level
    builder
      .addCase(createLevel.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(createLevel.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryType, level } = action.payload;
        if (!state.levelsByCategory[categoryType]) {
          state.levelsByCategory[categoryType] = [];
        }
        state.levelsByCategory[categoryType].push(level);
      })
      .addCase(createLevel.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در ایجاد سطح';
      });

    // Update Level
    builder
      .addCase(updateLevel.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(updateLevel.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryType, levelId, updates } = action.payload;
        const levels = state.levelsByCategory[categoryType];
        if (levels) {
          const index = levels.findIndex(level => level.id === levelId);
          if (index !== -1) {
            levels[index] = { ...levels[index], ...updates };
          }
        }
      })
      .addCase(updateLevel.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در بروزرسانی سطح';
      });

    // Delete Level
    builder
      .addCase(deleteLevel.pending, (state) => {
        state.loadingStatus = 'mutating';
        state.error = null;
      })
      .addCase(deleteLevel.fulfilled, (state, action) => {
        state.loadingStatus = 'idle';
        const { categoryType, levelId } = action.payload;
        const levels = state.levelsByCategory[categoryType];
        if (levels) {
          state.levelsByCategory[categoryType] = levels.filter(level => level.id !== levelId);
        }
      })
      .addCase(deleteLevel.rejected, (state, action) => {
        state.loadingStatus = 'error';
        state.error = action.error.message || 'خطا در حذف سطح';
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setViewMode,
  setTreeDisplayMode,
  setSelectedNode,
  toggleExpandedNode,
  setExpandedNodes,
  expandAllNodes,
  collapseAllNodes,
  setHighlightedNodes,
  setHighlightedNode,
  addHighlightedNode,
  removeHighlightedNode,
  clearHighlightedNodes,
  // اضافه کردن reducers جدید برای UI
  setShowCategories,
  setShowDefinitions,
  setSearchTerm,
  setSelectedStatus,
  setSelectedCategoryFilter,
  setSelectedItems,
  setSortOption,
  setCurrentCategory,
  clearError,
  resetState,
  resetView
} = definitionEditorSlice.actions;

// ترکیب reducer اصلی با equipment fields reducer
const combinedReducer = {
  definitionEditor: definitionEditorSlice.reducer,
  equipmentFields: equipmentFieldsReducer
};

// Export reducer اصلی برای backward compatibility
export default definitionEditorSlice.reducer;
