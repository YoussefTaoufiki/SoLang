import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

export const cacheFirstRequest = async (url: string, options: RequestInit) => {
  const isConnected = await checkNetworkStatus();
  const cacheKey = `cache_${btoa(url)}`;
  
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    if (!isConnected) {
      throw new Error('No network connection');
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache with 1 hour expiration
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      expiresIn: 3600000
    }));
    
    return data;
  } catch (error) {
    console.error('Cache-first request failed:', error);
    throw error;
  }
};

// Add retry mechanism
export const retryRequest = async (
  fn: () => Promise<any>,
  retries = 3,
  delay = 1000
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}; 