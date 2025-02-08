import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAppDispatch, useAppSelector } from '../store/store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import type { AuthError } from '../store/slices/authSlice';
import { showMessage } from '../utils/showMessage';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { GoogleLoginButton } from '../components/SocialLoginButton';
import { AppleLoginButton } from '../components/AppleLoginButton';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { validateEmail } from '../utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const error = useAppSelector(state => state.auth.error);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validateEmailInput = () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleLogin = async () => {
    if (!validateEmailInput()) return;
    
    try {
      setLoading(true);
      dispatch(loginStart());
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      dispatch(loginSuccess(userCredential.user!));
    } catch (error: any) {
      let errorMessage = error.message;
      
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Try again later or reset password';
          break;
      }
      
      dispatch(loginFailure({
        message: errorMessage,
        type: 'auth'
      }));
      showMessage({
        message: "Login Failed",
        description: errorMessage,
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        Language Learning Login
      </Text>
      
      <GoogleLoginButton />
      <AppleLoginButton />
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) validateEmailInput();
        }}
        onBlur={validateEmailInput}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        error={!!emailError}
        right={
          emailError && (
            <TextInput.Icon
              icon="alert-circle"
              color={theme.colors.error}
            />
          )
        }
      />
      
      {emailError && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {emailError}
        </Text>
      )}
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        mode="outlined"
        style={styles.input}
        right={
          <TextInput.Icon 
            icon={showPassword ? "eye-off" : "eye"} 
            onPress={togglePasswordVisibility}
          />
        }
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Login
      </Button>
      
      <Button
        mode="text"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotButton}
      >
        Forgot Password?
      </Button>
      
      <View style={styles.errorContainer}>
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error.message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 12,
  },
  errorContainer: {
    minHeight: 24,
    marginVertical: 8,
  },
}); 