import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  RELATION_OPTIONS,
  displayName,
  getErrorMessage,
  pickAvatarId,
  resolveProfilePhotoUrl,
  validateProfileSetup,
  type Gender,
} from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/backend';
import { colors } from '../theme';

export function SetupProfileScreen() {
  const { user, setupProfile, skipProfileSetup } = useAuth();
  const [fullName, setFullName] = useState(user ? displayName(user) : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [relation, setRelation] = useState(
    RELATION_OPTIONS.some((o) => o.value === user?.relation) ? (user?.relation as string) : user?.relation ? 'other' : '',
  );
  const [relationOther, setRelationOther] = useState(
    RELATION_OPTIONS.some((o) => o.value === user?.relation) ? '' : user?.relation ?? '',
  );
  const [manualPhoto, setManualPhoto] = useState<string | null>(
    user?.photoManual ? user.photoURL : null,
  );
  const [loading, setLoading] = useState(false);

  const previewUri = useMemo(() => {
    if (manualPhoto) return manualPhoto;
    if (gender === 'male' || gender === 'female') {
      const avatarId = pickAvatarId(fullName || 'User', gender);
      return resolveProfilePhotoUrl(
        { photoURL: null, avatarId, photoManual: false },
        getApiUrl(),
      );
    }
    return resolveProfilePhotoUrl(
      {
        photoURL: user?.photoURL ?? null,
        avatarId: user?.avatarId ?? null,
        photoManual: Boolean(user?.photoManual),
      },
      getApiUrl(),
    );
  }, [fullName, gender, manualPhoto, user]);

  useEffect(() => {
    if (user) {
      setFullName(displayName(user));
      setEmail(user.email);
    }
  }, [user]);

  async function onPickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!asset.base64) {
      Alert.alert('Upload failed', 'Could not read the selected image.');
      return;
    }
    setManualPhoto(`data:${mime};base64,${asset.base64}`);
  }

  async function onSave() {
    const input = {
      fullName,
      email,
      gender: gender as Gender,
      relation,
      relationOther,
      photoURL: manualPhoto,
    };
    const validation = validateProfileSetup(input);
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setLoading(true);
    try {
      await setupProfile(input);
    } catch (error) {
      Alert.alert('Unable to save', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onSkip() {
    setLoading(true);
    try {
      await skipProfileSetup();
    } catch (error) {
      Alert.alert('Unable to skip', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.kicker}>Almost done</Text>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.sub}>Tell us who you are. You can skip and finish later.</Text>

      <Pressable onPress={() => void onPickImage()} style={styles.photoWrap}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoHint}>Photo</Text>
          </View>
        )}
        <Text style={styles.link}>Tap to upload image (optional)</Text>
      </Pressable>
      {manualPhoto ? (
        <Pressable onPress={() => setManualPhoto(null)}>
          <Text style={styles.link}>Use auto avatar from name + gender</Text>
        </Pressable>
      ) : null}

      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
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

      <Text style={styles.label}>Who are you? (related to admin)</Text>
      <View style={styles.wrapChips}>
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
          placeholder="Describe your relation"
          value={relationOther}
          onChangeText={setRelationOther}
        />
      ) : null}

      <Pressable style={styles.button} onPress={() => void onSave()} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save profile'}</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => void onSkip()} disabled={loading}>
        <Text style={styles.secondaryText}>Skip for now / Setup later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 64, gap: 12, backgroundColor: colors.bg },
  kicker: { color: colors.brand, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 8 },
  photoWrap: { alignItems: 'center', gap: 8 },
  photo: { width: 112, height: 112, borderRadius: 56 },
  photoFallback: { backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  photoHint: { color: colors.muted, fontWeight: '700' },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  label: { fontWeight: '800', color: colors.ink, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
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
  link: { color: colors.brand, fontWeight: '700', textAlign: 'center' },
});
