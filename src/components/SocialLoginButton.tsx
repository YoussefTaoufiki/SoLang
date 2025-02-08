import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
import { auth } from '../firebase/config';
import { signInWithCredential } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Constants from 'expo-constants';

GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

const styles = StyleSheet.create({
  socialButton: {
    marginVertical: 8,
    width: '100%',
    borderColor: '#79747E',
    borderRadius: 20,
    paddingVertical: 8,
  },
});

interface GoogleSignInResponse {
  user: User;
}

interface AuthError extends Error {
  code?: string;
  message: string;
}

export function GoogleLoginButton() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    dispatch(loginStart());
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.idToken) {
        throw new Error('No ID token present in Google Sign-In response');
      }

      const credential = GoogleAuthProvider.credential(userInfo.idToken);
      
      const { user } = await signInWithCredential(auth, credential);
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: new Date().toISOString(),
        provider: 'google',
      }, { merge: true });

      dispatch(loginSuccess(user));
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'An unknown error occurred';
      let errorType = 'unknown';

      if (authError.code) {
        switch (authError.code) {
          case 'SIGN_IN_CANCELLED':
            errorMessage = 'Sign in was cancelled';
            errorType = 'configuration';
            break;
          case 'PLAY_SERVICES_NOT_AVAILABLE':
            errorMessage = 'Play Services are not available';
            errorType = 'configuration';
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
        type: errorType as 'auth' | 'network' | 'configuration' | 'validation' | 'unknown'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      mode="outlined"
      icon="google"
      onPress={handleGoogleLogin}
      style={styles.socialButton}
      labelStyle={{ color: '#000' }}
      loading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}

// Similar Apple Login component 