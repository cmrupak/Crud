import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { MESSAGES, getErrorMessage, validateEmail, validatePasswordReset } from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';

export function ForgotPasswordScreen() {
  const { resetPassword, confirmPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestReset() {
    const error = validateEmail(email);
    if (error) {
      Alert.alert('Check email', error);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setRequested(true);
      Alert.alert('Reset requested', MESSAGES.RESET_EMAIL_SENT);
    } catch (err) {
      Alert.alert('Unable to reset', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    const validation = validatePasswordReset(password, confirmPassword);
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(email, password);
      Alert.alert('Password updated', MESSAGES.PASSWORD_RESET);
    } catch (err) {
      Alert.alert('Unable to reset', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Forgot password</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      {!requested ? (
        <Pressable style={styles.button} onPress={() => void requestReset()} disabled={loading}>
          <Text style={styles.buttonText}>Send reset link</Text>
        </Pressable>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="New password" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirm password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          <Pressable style={styles.button} onPress={() => void confirm()} disabled={loading}>
            <Text style={styles.buttonText}>Update password</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
