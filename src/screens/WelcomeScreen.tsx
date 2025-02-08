import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { GoogleLoginButton } from '../components/SocialLoginButton';
import { AppleLoginButton } from '../components/AppleLoginButton';

export default function WelcomeScreen({ navigation }: { navigation: NavigationProp<RootStackParamList> }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Learning & Productivity</Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Login')}
        style={styles.button}>
        Login
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('SignUp')}
        style={styles.button}>
        Sign Up
      </Button>
      <GoogleLoginButton />
      <AppleLoginButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    marginVertical: 10,
  },
}); 