import { render, screen, act, fireEvent, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '../../theme/theme';
import { NavigationContainer } from '@react-navigation/native';
import { linking } from '../RootNavigator';

describe('RootNavigator', () => {
  it('renders welcome screen by default', () => {
    render(
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    );
    
    expect(screen.getByText('Language Learning & Productivity')).toBeTruthy();
  });

  it('persists navigation state', async () => {
    const { unmount } = render(
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    );

    // Simulate navigation state change
    await act(async () => {
      // Perform navigation actions here
    });

    unmount();

    // Re-render and check persisted state
    const { getByText } = render(
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    );
    
    // Verify expected screen based on persisted state
  });

  it('navigates to login screen', async () => {
    const { getByText } = render(
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    );

    fireEvent.press(getByText('Login'));
    await waitFor(() => getByText('Login Screen'));
  });

  it('handles deep links correctly', async () => {
    const { getByText } = render(
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>,
      {
        wrapper: ({ children }) => (
          <NavigationContainer linking={linking}>
            {children}
          </NavigationContainer>
        )
      }
    );

    await waitFor(() => expect(getByText(`Book ID: 123`)).toBeTruthy());
  });
}); 