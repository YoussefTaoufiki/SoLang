import React from 'react';
import { View, Text } from 'react-native';
import { useSubscriptionCheck } from '../hooks/useSubscriptionCheck';

export default function DashboardScreen() {
  useSubscriptionCheck();

  return (
    <View>
      <Text>Dashboard Screen</Text>
    </View>
  );
} 