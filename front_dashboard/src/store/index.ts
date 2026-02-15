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
	users: usersSlice,
	resourcesModule: resourcesModuleSlice,
});

// Persist config - تنها چیزی که persist میشه auth و تنظیمات تم
const persistConfig = {
	key: 'sajed-root',
	storage,
	whitelist: ['auth', 'ui'], // auth و ui persist میشوند
	version: 2,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration  
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
			},
		}),
	devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;