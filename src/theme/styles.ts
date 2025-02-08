import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  input: {
    marginVertical: 8
  },
  button: {
    marginVertical: 12
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
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
  }
}); 