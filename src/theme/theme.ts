import { configureFonts, DefaultTheme } from 'react-native-paper';

const fontConfig = {
  displaySmall: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 44,
    fontSize: 36,
  },
  displayMedium: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400' as '400',
    letterSpacing: 0,
    lineHeight: 52,
    fontSize: 45,
  },
  bodyMedium: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400' as '400',
    letterSpacing: 0.15,
    lineHeight: 20,
    fontSize: 14,
  },
  bodyLarge: {
    fontFamily: 'Roboto-Regular',
    fontWeight: '400' as '400',
    letterSpacing: 0.15,
    lineHeight: 24,
    fontSize: 16,
  },
  regular: {
    fontFamily: 'Roboto-Regular',
    fontWeight: 'normal' as 'normal',
  },
  medium: {
    fontFamily: 'Roboto-Medium',
    fontWeight: 'normal' as 'normal',
  },
  light: {
    fontFamily: 'Roboto-Light',
    fontWeight: 'normal' as 'normal',
  },
  thin: {
    fontFamily: 'Roboto-Thin',
    fontWeight: 'normal' as 'normal',
  },
};

export const theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    primary: '#2A9D8F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#9CEEE2',
    secondary: '#E76F51',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFD9D0',
    tertiary: '#264653',
    surface: '#F8F9FA',
    surfaceVariant: '#DFE4E8',
    onSurface: '#1A1C1E',
    background: '#FFFFFF',
    outline: '#79747E',
    error: '#B00020',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
}; 