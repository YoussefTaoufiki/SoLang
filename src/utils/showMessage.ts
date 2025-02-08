import { showMessage as flashMessage } from 'react-native-flash-message';

export const showMessage = (options: {
  message: string;
  description?: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
}) => {
  flashMessage({
    duration: 3000,
    ...options
  });
}; 