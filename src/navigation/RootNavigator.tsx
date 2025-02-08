import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReaderScreen from '../screens/ReaderScreen';
import FocusScreen from '../screens/FocusScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationState } from '@react-navigation/native';
import LoadingScreen from '../screens/LoadingScreen';
import { Button } from 'react-native-paper';
import { useAppSelector } from '../store/store';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ChapterSelectScreen from '../screens/ChapterSelectScreen';
import { Icon } from 'react-native-paper';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  Reader: { bookId: string; jumpToCfi?: string };
  Focus: undefined;
  Settings: undefined;
  ForgotPassword: undefined;
  ChapterSelect: { bookId: string };
  FootnoteView: { content: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Add persistence configuration
const PERSISTENCE_KEY = 'NAVIGATION_STATE';

// Add linking configuration
const linking = {
  prefixes: ['langapp://', 'https://langapp.com'],
  config: {
    screens: {
      Welcome: 'welcome',
      Login: 'login',
      SignUp: 'signup',
      Dashboard: 'dashboard',
      Reader: 'reader/:bookId',
      Focus: 'focus',
      Settings: 'settings',
      ForgotPassword: 'forgot-password'
    }
  }
};

// Add new auth check hook
function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  return { user };
}

// Add error type differentiation and visual feedback
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  // Update error classification
  const getErrorDetails = (error: Error) => {
    if (error.message.includes('auth/')) {
      return 'Authentication Error';
    }
    if (error.message.includes('network')) {
      return 'Connection Issue';
    }
    return 'Application Error';
  };

  const styles = StyleSheet.create({
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    errorText: {
      fontSize: 18,
      marginBottom: 20,
      color: theme.colors.error,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginBottom: 20,
    },
    reportButton: {
      marginVertical: 10,
      backgroundColor: theme.colors.secondary,
    }
  });

  return (
    <View style={styles.errorContainer}>
      <View style={{ marginBottom: 20 }}>
        <Icon 
          source="alert-circle-outline"
          size={40}
          color={theme.colors.error}
        />
      </View>
      <Text style={styles.errorText}>
        {getErrorDetails(error)} - Please try again
      </Text>
      {showDetails && (
        <Text style={styles.detailText}>
          {error.message}
        </Text>
      )}
      <Button
        mode="contained"
        onPress={resetErrorBoundary}
        style={{ marginBottom: 10 }}
      >
        Try Again
      </Button>
      <Button
        mode="outlined"
        onPress={() => setShowDetails(!showDetails)}
        style={{ marginBottom: 10 }}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </Button>
      <Button
        mode="contained"
        onPress={() => {/* Add error reporting service */}}
        style={styles.reportButton}
      >
        Report Error
      </Button>
    </View>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState>();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (savedState) {
          try {
            setInitialState(JSON.parse(savedState));
          } catch (e) {
            console.error('Invalid navigation state, resetting...');
            AsyncStorage.removeItem(PERSISTENCE_KEY);
          }
        }
      } catch (e) {
        console.error('State restoration failed:', e);
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) restoreState();
  }, [isReady]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const theme = useTheme();
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        // Add error logging service integration
        console.error('Navigation Error:', error);
      }}
    >
      <NavigationContainer
        theme={{
          ...theme,
          colors: {
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.outline,
            primary: theme.colors.primary,
            notification: theme.colors.error,
          }
        }}
        linking={linking}
        initialState={initialState}
        onStateChange={(state: NavigationState | undefined) => {
          // Add cache validation before saving state
          if (state) {
            const simplifiedState = {
              ...state,
              routes: state.routes.map(route => ({
                name: route.name,
                params: route.params ? 
                  Object.keys(route.params).reduce((acc, key) => {
                    if (key === 'bookId' || key === 'jumpToCfi') {
                      acc[key] = route.params?.[key as keyof typeof route.params];
                    }
                    return acc;
                  }, {} as Record<string, unknown>) : {}
              }))
            };
            AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(simplifiedState));
          }
        }}
      >
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            animation: 'fade',
            animationDuration: 300,
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.primary,
            headerTitleStyle: {
              fontFamily: theme.fonts.bodyMedium.fontFamily,
              fontWeight: theme.fonts.bodyMedium.fontWeight,
            }
          }}
        >
          {user ? (
            <Stack.Group>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen 
                name="Reader" 
                component={ReaderScreen as React.ComponentType<any>}
              />
              <Stack.Screen name="Focus" component={FocusScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Group>
          ) : (
            <Stack.Group>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </Stack.Group>
          )}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen 
              name="ChapterSelect" 
              component={ChapterSelectScreen}
              options={{ 
                title: 'Table of Contents',
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.primary,
              }}
            />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export { linking }; 