import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { Platform } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAppSelector } from '../store/store';
import { Text } from 'react-native';
import { theme } from '../theme/theme';

interface AuthError extends Error {
  code?: string;
  message: string;
  type: 'auth' | 'network' | 'configuration' | 'validation' | 'unknown';
}

export function AppleLoginButton() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const error = useAppSelector(state => state.auth.error);

  // Only show Apple Sign In on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleAppleLogin = async () => {
    setIsLoading(true);
    dispatch(loginStart());

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('No identity token returned from Apple Sign In');
      }

      // Create OAuthCredential
      const { identityToken, nonce } = appleAuthRequestResponse;
      const credential = new OAuthProvider('apple.com').credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      // Sign in to Firebase
      const { user } = await signInWithCredential(auth, credential);

      // Store user data in Firestore
      // Note: Apple only provides name on first sign-in
      const userDoc = {
        email: user.email,
        displayName: user.displayName || appleAuthRequestResponse.fullName?.givenName,
        lastLoginAt: new Date().toISOString(),
        provider: 'apple',
      };

      if (appleAuthRequestResponse.fullName) {
        userDoc.displayName = `${appleAuthRequestResponse.fullName.givenName} ${appleAuthRequestResponse.fullName.familyName}`.trim();
      }

      await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });

      dispatch(loginSuccess(user));
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'An unknown error occurred';
      let errorType = 'unknown';

      if (authError.code) {
        switch (authError.code) {
          case 'auth/operation-not-allowed':
            errorMessage = 'Apple Sign In is not enabled for this app';
            errorType = 'configuration';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid Apple Sign In credential';
            errorType = 'auth';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network connection failed';
            errorType = 'network';
            break;
          default:
            errorMessage = authError.message;
            errorType = 'auth';
        }
      }

      dispatch(loginFailure({ 
        message: errorMessage,
        type: errorType as AuthError['type']
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        mode="outlined"
        icon="apple"
        onPress={handleAppleLogin}
        style={styles.socialButton}
        labelStyle={{ color: '#000' }}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Continue with Apple'}
      </Button>
      {error?.type === 'auth' && (
        <Text style={{ color: theme.colors.error }}>
          {error.message}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    marginVertical: 8,
    width: '100%',
    borderColor: '#79747E',
    borderRadius: 20,
    paddingVertical: 8,
  },
}); 