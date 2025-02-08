import React, { useEffect } from 'react';
import { useAppSelector } from '../store/store';
import { useNavigation } from '@react-navigation/native';

export const useSubscriptionCheck = () => {
  const user = useAppSelector(state => state.auth.user);
  const navigation = useNavigation();

  useEffect(() => {
    if (user && !(user as any).customClaims?.subscriptionActive) {
      (navigation as any).navigate('Subscription');
    }
  }, [user]);
}; 