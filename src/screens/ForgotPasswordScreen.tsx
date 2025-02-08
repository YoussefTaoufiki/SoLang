import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text, useTheme } from 'react-native-paper';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAppDispatch } from '../store/store';
import { showMessage } from 'react-native-flash-message';
import { authStyles as styles } from '../theme/styles';  // Use shared styles
import { validateEmail } from '../utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const handleReset = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      showMessage({
        message: 'Password reset email sent!',
        description: 'Check your inbox for further instructions',
        type: 'success'
      });
    } catch (error: any) {
      setError(error.message);
      showMessage({
        message: "Password reset failed",
        description: error.message,
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {error && (
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>
          {error}
        </Text>
      )}
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        error={!!error}
      />
      
      <Button
        mode="contained"
        onPress={handleReset}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Send Reset Email
      </Button>
    </View>
  );
}

// Similar styles as LoginScreen 