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
import {
  RELATION_OPTIONS,
  getErrorMessage,
  splitFullName,
  validateEmail,
  validatePhone,
  validateRegistration,
  type Gender,
} from '@nexora/shared';
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
  const [gender, setGender] = useState<Gender | ''>('');
  const [relation, setRelation] = useState('');
  const [relationOther, setRelationOther] = useState('');
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
    if (gender !== 'male' && gender !== 'female') {
      Alert.alert('Gender required', 'Please select male or female.');
      return;
    }
    if (!relation.trim()) {
      Alert.alert('Relationship required', 'Please select your relationship.');
      return;
    }
    if (relation === 'other' && !relationOther.trim()) {
      Alert.alert('Describe relationship', 'Please describe your relationship.');
      return;
    }
    const payload = {
      fullName,
      email,
      phone,
      gender: gender as Gender,
      relation,
      relationOther,
    };
    const validation = validateRegistration(payload);
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await register(payload);
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
        <Text style={styles.title}>{step === 1 ? 'What is your full name?' : 'Tell us about you'}</Text>
        <Text style={styles.sub}>
          {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2 — contact, gender, and relationship.'}
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
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {(['male', 'female'] as Gender[]).map((value) => (
                <Pressable
                  key={value}
                  style={[styles.chip, gender === value && styles.chipActive]}
                  onPress={() => setGender(value)}
                >
                  <Text style={[styles.chipText, gender === value && styles.chipTextActive]}>
                    {value === 'male' ? 'Male' : 'Female'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.chipRow}>
              {RELATION_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.chip, relation === option.value && styles.chipActive]}
                  onPress={() => setRelation(option.value)}
                >
                  <Text style={[styles.chipText, relation === option.value && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {relation === 'other' ? (
              <TextInput
                style={styles.input}
                placeholder="Describe relationship"
                value={relationOther}
                onChangeText={setRelationOther}
              />
            ) : null}
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
  label: { color: colors.ink, fontWeight: '700', marginTop: 4 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.ink, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  link: { color: colors.brand, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  switchText: { color: colors.muted, textAlign: 'center', marginTop: 16 },
  switchLink: { color: colors.brand, fontWeight: '800' },
});
