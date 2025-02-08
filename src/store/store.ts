import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { PersistedState } from 'redux-persist/es/types';
import type { Middleware, Action } from 'redux';
import type { PersistConfig } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';

// Import all reducers directly
import authReducer from './slices/authSlice';
import readerReducer from './readerSlice';
import focusReducer from './slices/focusSlice';
import taskReducer from './slices/taskSlice';

// Define root reducer with proper imports
const rootReducer = combineReducers({
  auth: authReducer,
  reader: readerReducer,
  focus: focusReducer,
  tasks: taskReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Fix middleware type signature
const offlineMiddleware: Middleware = 
  (store) => (next) => (action: unknown) => {
    const result = next(action);
    
    // Add proper type narrowing for the action
    if (typeof action === 'object' && action !== null && 'type' in action) {
      const actionType = (action as Action<string>).type;
      if (actionType.startsWith('reader/') || 
          actionType.startsWith('auth/')) {
        try {
          AsyncStorage.setItem('lastAction', JSON.stringify(action));
        } catch (error) {
          console.error('Action caching failed:', error);
        }
      }
    }

    return result;
  };

// Fix 2: Update persist config with proper types
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'reader', 'tasks'],
  timeout: 5000,
  migrate: (state: PersistedState) => Promise.resolve(state),
  writeFailHandler: (error: Error) => console.error('Storage write error:', error)
};

// Fix 4: Complete store configuration
export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(offlineMiddleware),
});

export const persistor = persistStore(store);

// Fix 5: Properly type dispatch and selector hooks
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// After app restart
const user = useAppSelector(state => state.auth.user); 
// Still contains authenticated user data 