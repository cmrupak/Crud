import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  MESSAGES,
  RELATION_OPTIONS,
  displayName,
  displayRelation,
  getErrorMessage,
  resolveProfilePhotoUrl,
  validateProfile,
  type Gender,
} from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import {
  checkForAppUpdate,
  getInstalledVersionCode,
  getInstalledVersionName,
  installAppUpdate,
} from '../services/appUpdate';
import { getAssetUrl, getBackend } from '../services/backend';
import { styles } from './LoginScreen';
import { colors } from '../theme';

function relationSelectState(stored: string | null | undefined) {
  if (!stored) return { relation: '', relationOther: '' };
  if (RELATION_OPTIONS.some((option) => option.value === stored)) {
    return { relation: stored, relationOther: '' };
  }
  return { relation: 'other', relationOther: stored };
}

export function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const initialRelation = relationSelectState(user?.relation);
  const [relation, setRelation] = useState(initialRelation.relation);
  const [relationOther, setRelationOther] = useState(initialRelation.relationOther);
  const [saving, setSaving] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const photoUri = useMemo(
    () =>
      user
        ? resolveProfilePhotoUrl(
            {
              photoURL: user.photoURL,
              avatarId: user.avatarId,
              photoManual: user.photoManual,
            },
            getAssetUrl(),
          )
        : null,
    [user],
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setGender(user.gender ?? '');
    const next = relationSelectState(user.relation);
    setRelation(next.relation);
    setRelationOther(next.relationOther);
  }, [user]);

  if (!user) return null;

  async function save() {
    const nextErrors: string[] = [];
    if (gender !== 'male' && gender !== 'female') nextErrors.push('Select male or female.');
    if (!relation.trim()) nextErrors.push('Select your relationship.');
    if (relation === 'other' && !relationOther.trim()) nextErrors.push('Describe your relationship.');
    const validation = validateProfile({
      firstName,
      lastName,
      gender: gender || null,
      relation,
      relationOther,
    });
    if (!validation.valid || nextErrors.length > 0) {
      Alert.alert('Check the form', [...Object.values(validation.errors), ...nextErrors].join('\n'));
      return;
    }
    setSaving(true);
    try {
      await getBackend().users.updateProfile(user.uid, {
        firstName,
        lastName,
        gender: gender as Gender,
        relation,
        relationOther,
      });
      await refreshUser();
      Alert.alert('Saved', MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      Alert.alert(MESSAGES.UPDATE_PROFILE_ERROR, getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    try {
      await getBackend().files.uploadProfileImage(blob, 'avatar.jpg', asset.mimeType ?? 'image/jpeg');
      await refreshUser();
      Alert.alert('Saved', MESSAGES.PHOTO_UPDATED);
    } catch (error) {
      Alert.alert('Upload failed', getErrorMessage(error));
    }
  }

  function deactivate() {
    Alert.alert('Deactivate My Account', `Are you sure you want to deactivate ${displayName(user)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: () => {
          void getBackend()
            .users.deactivateSelf()
            .then(() => logout());
        },
      },
    ]);
  }

  async function onCheckUpdate() {
    setCheckingUpdate(true);
    try {
      const result = await checkForAppUpdate();
      if (result.status === 'unavailable') {
        Alert.alert('Update check', result.message);
        return;
      }
      if (result.status === 'up_to_date') {
        Alert.alert(
          'Up to date',
          `You have the latest app (v${getInstalledVersionName()} / ${getInstalledVersionCode()}).`,
        );
        return;
      }

      Alert.alert(
        'Update available',
        `Version ${result.latest.version} is ready.${result.latest.notes ? `\n\n${result.latest.notes}` : ''}\n\nDownload and install now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Update',
            onPress: () => {
              void (async () => {
                try {
                  await installAppUpdate(result.latest);
                } catch (error) {
                  Alert.alert('Update failed', getErrorMessage(error));
                }
              })();
            },
          },
        ],
      );
    } finally {
      setCheckingUpdate(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Profile</Text>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={{ width: 88, height: 88, borderRadius: 44 }} />
      ) : (
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: '#ccfbf1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '800' }}>{user.firstName.charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.demo}>
        {user.email}
        {user.phone ? ` · ${user.phone}` : ''}
        {'\n'}
        {user.gender ? `${user.gender} · ` : ''}
        {displayRelation(user.relation) || 'Relation not set'}
        {' · '}
        {user.role}
        {'\n'}
        App v{getInstalledVersionName()} ({getInstalledVersionCode()})
      </Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <Text style={{ color: colors.ink, fontWeight: '700' }}>Gender</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['male', 'female'] as Gender[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setGender(value)}
            style={{
              borderWidth: 1,
              borderColor: gender === value ? colors.brand : colors.line,
              backgroundColor: gender === value ? colors.brand : colors.white,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: gender === value ? '#fff' : colors.ink, fontWeight: '700' }}>
              {value === 'male' ? 'Male' : 'Female'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: colors.ink, fontWeight: '700' }}>Relationship</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {RELATION_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setRelation(option.value)}
            style={{
              borderWidth: 1,
              borderColor: relation === option.value ? colors.brand : colors.line,
              backgroundColor: relation === option.value ? colors.brand : colors.white,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: relation === option.value ? '#fff' : colors.ink, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {relation === 'other' ? (
        <TextInput
          style={styles.input}
          value={relationOther}
          onChangeText={setRelationOther}
          placeholder="Describe relationship"
        />
      ) : null}
      <Pressable style={styles.button} onPress={() => void save()} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Updating...' : 'Save profile'}</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void pickImage()}>
        <Text style={styles.buttonText}>Upload photo</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void onCheckUpdate()} disabled={checkingUpdate}>
        <Text style={styles.buttonText}>{checkingUpdate ? 'Checking…' : 'Check for updates'}</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void logout()}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
      <Pressable onPress={deactivate}>
        <Text style={[styles.link, { color: '#dc2626' }]}>Deactivate my account</Text>
      </Pressable>
    </ScrollView>
  );
}
