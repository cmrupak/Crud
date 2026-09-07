import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { getErrorMessage, validateRegistration } from '@nexora/shared';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';

export function RegisterScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const form = { fullName, email, phone };
    const validation = validateRegistration(form);
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      Alert.alert('Unable to create account', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.demo}>No password — email and phone must be unique.</Text>
      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create account'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to login</Text>
      </Pressable>
    </ScrollView>
  );
}
