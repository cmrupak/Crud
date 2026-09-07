import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getErrorMessage, splitFullName, validateEmail, validatePhone, validateRegistration } from '@nexora/shared';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function RegisterWizardScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  function onNext() {
    const { firstName } = splitFullName(fullName);
    if (!firstName) {
      Alert.alert('Full name required', 'Please enter your full name.');
      return;
    }
    setStep(2);
  }

  async function onContinue() {
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    if (emailError || phoneError) {
      Alert.alert('Check contact details', [emailError, phoneError].filter(Boolean).join('\n'));
      return;
    }
    const validation = validateRegistration({ fullName, email, phone });
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await register({ fullName, email, phone });
      // Auth stack unmounts → Dashboard
    } catch (error) {
      Alert.alert('Unable to create account', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.kicker}>Create Account</Text>
        <Text style={styles.title}>{step === 1 ? 'What is your full name?' : 'How can we reach you?'}</Text>
        <Text style={styles.sub}>
          {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2 — email and phone must be unique.'}
        </Text>

        {step === 1 ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoFocus
            />
            <Pressable style={styles.button} onPress={onNext}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Pressable style={styles.button} onPress={() => void onContinue()} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Continue'}</Text>
            </Pressable>
            <Pressable onPress={() => setStep(1)}>
              <Text style={styles.link}>Back</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.switchText}>
          Have an Account?{' '}
          <Text style={styles.switchLink} onPress={() => navigation.navigate('Login')}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 24, paddingTop: 72, gap: 12 },
  kicker: { color: colors.brand, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  button: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  link: { color: colors.brand, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  switchText: { color: colors.muted, textAlign: 'center', marginTop: 16 },
  switchLink: { color: colors.brand, fontWeight: '800' },
});
