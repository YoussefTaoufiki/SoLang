import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import readerReducer from './readerSlice';
import focusReducer from './slices/focusSlice';
import taskReducer from './slices/taskSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  reader: readerReducer,
  focus: focusReducer,
  tasks: taskReducer,
});

export default rootReducer; 