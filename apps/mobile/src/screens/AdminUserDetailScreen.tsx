import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MESSAGES, displayName, getErrorMessage, validateProfile, type UserProfile, type UserRole } from '@nexora/shared';
import { getBackend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';

export function AdminUserDetailScreen() {
  const route = useRoute<any>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    getBackend()
      .admin.getUser(route.params.id)
      .then((profile) => {
        setUser(profile);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setRole(profile.role);
      })
      .catch((err: unknown) => Alert.alert('Error', getErrorMessage(err)));
  }, [route.params.id]);

  async function save() {
    if (!user) return;
    const validation = validateProfile({ firstName, lastName });
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    try {
      const updated = await getBackend().admin.updateUser(user.uid, { firstName, lastName, role });
      setUser(updated);
      Alert.alert('Saved', MESSAGES.USER_UPDATED);
    } catch (error) {
      Alert.alert('Unable to update', getErrorMessage(error));
    }
  }

  if (!user) return <Text style={styles.wrap}>Loading user...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{displayName(user)}</Text>
      <Text style={styles.demo}>{user.email}</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
      {currentUser?.uid !== user.uid ? (
        <Pressable style={styles.button} onPress={() => setRole((current) => (current === 'admin' ? 'user' : 'admin'))}>
          <Text style={styles.buttonText}>Role: {role}</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.button} onPress={() => void save()}>
        <Text style={styles.buttonText}>Save user</Text>
      </Pressable>
    </ScrollView>
  );
}
