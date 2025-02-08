import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useAppDispatch } from '../store/store';
import { loginSuccess, loginFailure } from '../store/authSlice';
import { Picker } from '@react-native-picker/picker';
import { authStyles } from '../theme/styles';
import { checkPasswordStrength, validateEmail, validatePassword } from '../utils/validation';
import { sendEmailVerification } from 'firebase/auth';
import { showMessage } from '../utils/showMessage';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
];

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [selectedLanguages, setSelectedLanguages] = useState(['en']);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const STRENGTH_COLORS = ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#80ff00'];
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordStrength(checkPasswordStrength(text));
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      setVerificationSent(true);
      
      // Store user data
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        emailVerified: false, // Track verification status
        createdAt: new Date().toISOString(),
        languagePreferences: selectedLanguages,
        dailyGoals: {
          vocabulary: 10,
          reading: 30,
        }
      });

      dispatch(loginSuccess(userCredential.user));
      
      showMessage({
        message: "Verification Email Sent",
        description: "Please check your inbox to verify your email address",
        type: "info"
      });

    } catch (error: any) {
      let errorMessage = error.message;
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
      }
      
      dispatch(loginFailure(errorMessage));
      showMessage({
        message: "Sign Up Failed",
        description: errorMessage,
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const validEmail = validateEmailInput();
    const validPassword = validatePasswordInput();
    return validEmail && validPassword;
  };

  const validateEmailInput = () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePasswordInput = () => {
    if (checkPasswordStrength(password) < 3) {
      setPasswordError('Password must be at least moderate strength');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const PasswordStrengthIndicator = () => (
    <View style={authStyles.strengthContainer}>
      {Array(5).fill(0).map((_, index) => (
        <View 
          key={index}
          style={[
            authStyles.strengthBar,
            { 
              backgroundColor: index < passwordStrength ? 
                STRENGTH_COLORS[passwordStrength - 1] : '#e0e0e0' 
              }
          ]}
        />
      ))}
      <Text style={authStyles.strengthText}>
        {['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'][passwordStrength - 1] || ''}
      </Text>
    </View>
  );

  const VerificationNotice = () => (
    <View style={authStyles.verificationContainer}>
      <Text style={authStyles.verificationText}>
        {verificationSent 
          ? "We've sent a verification email to your address. " 
          : "Please verify your email to complete registration."}
      </Text>
      <Button
        mode="text"
        onPress={() => {
          if (auth.currentUser) {
            sendEmailVerification(auth.currentUser);
          }
        }}
        disabled={!verificationSent}
      >
        Resend Verification Email
      </Button>
    </View>
  );

  return (
    <View style={[authStyles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={authStyles.title}>
        Create Account
      </Text>
      
      <Picker
        selectedValue={selectedLanguages[0]}
        onValueChange={(itemValue: string) => setSelectedLanguages([itemValue])}
      >
        {LANGUAGES.map((lang) => (
          <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
        ))}
      </Picker>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (emailError) validateEmailInput();
        }}
        onBlur={validateEmailInput}
        mode="outlined"
        style={authStyles.input}
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
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry={!showPassword}
        mode="outlined"
        style={authStyles.input}
        right={
          <TextInput.Icon 
            icon={showPassword ? "eye-off" : "eye"} 
            onPress={togglePasswordVisibility}
          />
        }
      />
      
      <PasswordStrengthIndicator />
      
      {passwordError && (
        <Text style={[authStyles.errorText, { color: theme.colors.error }]}>
          {passwordError}
        </Text>
      )}
      
      <Button
        mode="contained"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading || !!emailError || !!passwordError}
        style={authStyles.button}
      >
        Sign Up
      </Button>
      
      {verificationSent && <VerificationNotice />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 12,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  strengthText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    marginTop: -8,
    marginBottom: 12,
    fontSize: 12,
  },
  verificationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  verificationText: {
    color: '#1976d2',
    marginBottom: 10,
  },
}); 