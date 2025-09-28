import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import scenariosSlice from './slices/scenariosSlice';
import mapSlice from './slices/mapSlice';
import resourcesSlice from './slices/resourcesSlice';
import orbatSlice from './slices/orbatSlice';
import tabularResourcesSlice from './slices/tabularResourcesSlice';

import definitionEditorSlice, { setExpandedNodes as deSetExpandedNodes, setHighlightedNodes as deSetHighlightedNodes } from '../modules/definition-editor/store/definitionEditorSlice';
import equipmentFieldsReducer from '../modules/definition-editor/store/equipmentFieldsSlice';
import hierarchyLevelsReducer from '../modules/definition-editor/store/hierarchyLevelsSlice';
import smartFieldBuilderReducer from '../modules/definition-editor/store/smartFieldBuilderSlice';
import usersSlice from '../modules/users/store/usersSlice';
import resourcesModuleSlice from '../modules/resources/store/resourcesSlice';

// Root reducer
const rootReducer = combineReducers({
	auth: authSlice,
	ui: uiSlice,
	scenarios: scenariosSlice,
	map: mapSlice,
	resources: resourcesSlice,
	orbat: orbatSlice,
	tabularResources: tabularResourcesSlice,

	definitionEditor: definitionEditorSlice,
	equipmentFields: equipmentFieldsReducer,
	hierarchyLevels: hierarchyLevelsReducer,
	smartFieldBuilder: smartFieldBuilderReducer,
	users: usersSlice,
	resourcesModule: resourcesModuleSlice,
});

// Persist config - تنها چیزی که persist میشه auth و تنظیمات تم
const persistConfig = {
	key: 'sajed-root',
	storage,
	whitelist: ['auth', 'ui'], // auth و ui persist میشوند
	version: 2, // برای migration
	migrate: async (state: any) => {
		try {
			if (!state) return state;
			// نمونه: تبدیل Set های قدیمی به آرایه در definitionEditor (در صورت وجود در نسخه‌های گذشته)
			const de = state.definitionEditor;
			if (de) {
				if (de.expandedNodes && !Array.isArray(de.expandedNodes)) {
					de.expandedNodes = Array.from(de.expandedNodes);
				}
				if (de.highlightedNodes && !Array.isArray(de.highlightedNodes)) {
					de.highlightedNodes = Array.from(de.highlightedNodes);
				}
			}
			return state;
		} catch {
			return state;
		}
	},
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration  
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
				ignoredPaths: ['definitionEditor.expandedNodes', 'definitionEditor.highlightedNodes'],
			},
		}),
	devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// یک‌بار در شروع برنامه وضعیت definitionEditor را سالم‌سازی می‌کنیم تا اگر به‌صورت Set مانده بود، به آرایه تبدیل شود
try {
	const state: any = store.getState();
	const de = state?.definitionEditor;
	if (de) {
		const expanded = Array.isArray(de.expandedNodes)
			? de.expandedNodes
			: Array.from(de.expandedNodes ?? []);
		const highlighted = Array.isArray(de.highlightedNodes)
			? de.highlightedNodes
			: Array.from(de.highlightedNodes ?? []);

		if (!Array.isArray(de.expandedNodes)) {
			store.dispatch(deSetExpandedNodes(expanded));
		}
		if (!Array.isArray(de.highlightedNodes)) {
			store.dispatch(deSetHighlightedNodes(highlighted));
		}
	}
} catch (e) {
	// نادیده بگیر
}

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;