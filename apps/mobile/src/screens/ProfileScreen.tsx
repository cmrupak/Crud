import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  MESSAGES,
  displayName,
  displayRelation,
  getErrorMessage,
  resolveProfilePhotoUrl,
  validateProfile,
} from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, getBackend } from '../services/backend';
import { styles } from './LoginScreen';

export function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const photoUri = useMemo(
    () =>
      user
        ? resolveProfilePhotoUrl(
            {
              photoURL: user.photoURL,
              avatarId: user.avatarId,
              photoManual: user.photoManual,
            },
            getApiUrl(),
          )
        : null,
    [user],
  );

  if (!user) return null;

  async function save() {
    const validation = validateProfile({ firstName, lastName });
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setSaving(true);
    try {
      await getBackend().users.updateProfile(user.uid, { firstName, lastName });
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
      </Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <Pressable style={styles.button} onPress={() => void save()} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Updating...' : 'Save profile'}</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void pickImage()}>
        <Text style={styles.buttonText}>Upload photo</Text>
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
