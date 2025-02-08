import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { loadAsync } from 'expo-font';
import RootNavigator from './src/navigation/RootNavigator';
import { store } from './src/store/store';
import { theme } from './src/theme/theme';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './src/screens/LoadingScreen';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await loadAsync({
        'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
        'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
        'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
        'Roboto-Thin': require('./assets/fonts/Roboto-Thin.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate 
        loading={<LoadingScreen />}
        persistor={persistor}
        onBeforeLift={() => {
          AsyncStorage.getItem('persist:root').then(storedState => {
            if (storedState) {
              const parsedState = JSON.parse(storedState);
              if (Date.now() - parsedState._timestamp > 604800000) {
                persistor.purge();
              }
            }
          });
        }}
      >
        <PaperProvider theme={theme}>
          <RootNavigator />
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
} 