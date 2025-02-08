import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from 'firebase/auth';

interface AuthError {
  message: string;
  type: 'auth' | 'network' | 'configuration' | 'validation' | 'unknown';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  errorType: 'login' | 'signup' | 'reset' | 'social' | null;
  errorMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  errorType: null,
  errorMessage: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
    },
    loginFailure: (state, action: PayloadAction<AuthError>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
    resetError: (state) => {
      state.errorType = null;
      state.errorMessage = null;
    }
  }
});

// Only export the generated actions once
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  resetError 
} = authSlice.actions;

export default authSlice.reducer;

// Remove these duplicate action creators as they're not needed
// with the slice approach
// export const loginStartAction = createAction('auth/loginStart');
// export const loginSuccessAction = createAction<User>('auth/loginSuccess');
// export const loginFailureAction = createAction<string>('auth/loginFailure');

// Remove duplicate interface declaration
// interface AuthState {
//   user: User | null;
//   loading: boolean;
//   error: string | null;
// } 