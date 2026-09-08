import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  ONBOARDING_MESSAGES,
  getErrorMessage,
  resolveProfilePhotoUrl,
  toIdentifyInput,
  validateIdentifierInput,
  type LoginCandidate,
} from '@nexora/shared';
import { useNavigation } from '@react-navigation/native';
import { FadingPlaceholder } from '../components/FadingPlaceholder';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/backend';
import { colors } from '../theme';

export function ExistingUserScreen() {
  const { identify, loginByUid } = useAuth();
  const navigation = useNavigation<any>();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<LoginCandidate[]>([]);

  async function onVerify() {
    const validationError = validateIdentifierInput(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    setCandidates([]);
    try {
      const result = await identify(toIdentifyInput(value));
      if (result.status === 'candidates') {
        setCandidates(result.candidates);
        return;
      }
      if (result.status === 'not_found') {
        setError(ONBOARDING_MESSAGES.NOT_FOUND);
      }
      // authenticated → navigator switches to dashboard
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onPick(uid: string) {
    setLoading(true);
    try {
      await loginByUid(uid);
    } catch (err) {
      Alert.alert('Unable to continue', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.kicker}>Login</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Enter first name, full name, email, or phone.</Text>
        <Text style={[styles.sub, { fontSize: 12 }]}>API: {getApiUrl()}</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError('');
            }}
            autoCapitalize="none"
            editable={!loading}
          />
          <FadingPlaceholder visible={value.trim().length === 0} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={() => void onVerify()} disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>{ONBOARDING_MESSAGES.VERIFYING}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        {candidates.length > 0 ? (
          <View style={styles.candidateBox}>
            <Text style={styles.candidateTitle}>Multiple matches — choose your account</Text>
            {candidates.map((item) => (
              <CandidateRow key={item.uid} item={item} onPress={() => void onPick(item.uid)} />
            ))}
          </View>
        ) : null}

        <Text style={styles.switchText}>
          Don't have an Account?{' '}
          <Text style={styles.switchLink} onPress={() => navigation.navigate('RegisterWizard')}>
            Create Account
          </Text>
        </Text>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 24, paddingTop: 72, gap: 12 },
  kicker: { color: colors.brand, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 8 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.danger, fontWeight: '600' },
  button: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  loadingRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondary: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryText: { fontWeight: '800', color: colors.ink },
  link: { color: colors.brand, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  candidateBox: { gap: 10, marginTop: 4 },
  candidateTitle: { fontWeight: '800', color: colors.ink },
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
  switchText: { color: colors.muted, textAlign: 'center', marginTop: 16 },
  switchLink: { color: colors.brand, fontWeight: '800' },
});
