import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FocusState {
  isFocusMode: boolean;
  timerDuration: number;
  remainingTime: number;
}

const initialState: FocusState = {
  isFocusMode: false,
  timerDuration: 25 * 60, // 25 minutes in seconds
  remainingTime: 25 * 60,
};

const focusSlice = createSlice({
  name: 'focus',
  initialState,
  reducers: {
    toggleFocusMode: (state) => {
      state.isFocusMode = !state.isFocusMode;
    },
    setTimerDuration: (state, action: PayloadAction<number>) => {
      state.timerDuration = action.payload;
      state.remainingTime = action.payload;
    },
    updateRemainingTime: (state, action: PayloadAction<number>) => {
      state.remainingTime = action.payload;
    },
  },
});

export const { toggleFocusMode, setTimerDuration, updateRemainingTime } = focusSlice.actions;
export default focusSlice.reducer; 