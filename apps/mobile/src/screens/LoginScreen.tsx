import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
  getErrorMessage,
  resolveProfilePhotoUrl,
  validateIdentify,
  validateRegistration,
  type LoginCandidate,
} from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/backend';
import { colors } from '../theme';

export function LoginScreen() {
  const { identify, loginByUid, register } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<LoginCandidate[]>([]);

  async function onContinue() {
    const validation = validateIdentify({ email, name, phone });
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    setCandidates([]);
    try {
      const result = await identify({ email, name, phone });
      if (result.status === 'candidates') {
        setCandidates(result.candidates);
        return;
      }
      if (result.status === 'not_found') {
        Alert.alert('No account found', result.message);
      }
    } catch (error) {
      Alert.alert('Unable to continue', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    const validation = validateRegistration({ fullName: name, email, phone });
    if (!validation.valid) {
      Alert.alert('Create account', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await register({ fullName: name, email, phone });
    } catch (error) {
      Alert.alert('Unable to create account', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onPick(uid: string) {
    setLoading(true);
    try {
      await loginByUid(uid);
    } catch (error) {
      Alert.alert('Unable to sign in', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.kicker}>CRUD</Text>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.demo}>
          Sign in with email, name, or phone — no password.
          {'\n'}
          Same name? We will ask you to pick the right person.
        </Text>
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
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Pressable style={styles.button} onPress={() => void onContinue()} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Continue'}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => void onCreate()} disabled={loading}>
          <Text style={styles.secondaryText}>Create account</Text>
        </Pressable>

        {candidates.length > 0 ? (
          <View style={styles.candidateBox}>
            <Text style={styles.candidateTitle}>Multiple people match that name</Text>
            <Text style={styles.demo}>Choose your account:</Text>
            {candidates.map((item) => (
              <CandidateRow key={item.uid} item={item} onPress={() => void onPick(item.uid)} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CandidateRow({ item, onPress }: { item: LoginCandidate; onPress: () => void }) {
  const uri = useMemo(
    () =>
      resolveProfilePhotoUrl(
        { photoURL: item.photoURL, avatarId: item.avatarId, photoManual: false },
        getApiUrl(),
      ),
    [item],
  );
  return (
    <Pressable style={styles.candidate} onPress={onPress}>
      {uri ? <Image source={{ uri }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.candidateName}>{item.fullName}</Text>
        <Text style={styles.candidateMeta}>{item.email}</Text>
        {item.phone ? <Text style={styles.candidateMeta}>{item.phone}</Text> : null}
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 24, paddingTop: 72, gap: 12 },
  kicker: { color: colors.brand, fontWeight: '800' },
  title: { fontSize: 32, fontWeight: '800', color: colors.ink },
  demo: { color: colors.muted, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  button: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  secondary: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryText: { fontWeight: '800', color: colors.ink },
  candidateBox: { marginTop: 8, gap: 10 },
  candidateTitle: { fontWeight: '800', fontSize: 16, color: colors.ink },
  candidate: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: colors.line },
  candidateName: { fontWeight: '800', color: colors.ink },
  candidateMeta: { color: colors.muted, fontSize: 12 },
});
