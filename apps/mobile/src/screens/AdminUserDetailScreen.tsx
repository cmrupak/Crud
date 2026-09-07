import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  MESSAGES,
  RELATION_OPTIONS,
  displayName,
  getErrorMessage,
  validateProfile,
  type Gender,
  type UserProfile,
  type UserRole,
} from '@nexora/shared';
import { getBackend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';
import { colors } from '../theme';

function relationSelectState(stored: string | null | undefined) {
  if (!stored) return { relation: '', relationOther: '' };
  if (RELATION_OPTIONS.some((option) => option.value === stored)) {
    return { relation: stored, relationOther: '' };
  }
  return { relation: 'other', relationOther: stored };
}

export function AdminUserDetailScreen() {
  const route = useRoute<any>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [relation, setRelation] = useState('');
  const [relationOther, setRelationOther] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    getBackend()
      .admin.getUser(route.params.id)
      .then((profile) => {
        setUser(profile);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setGender(profile.gender ?? '');
        const next = relationSelectState(profile.relation);
        setRelation(next.relation);
        setRelationOther(next.relationOther);
        setRole(profile.role);
      })
      .catch((err: unknown) => Alert.alert('Error', getErrorMessage(err)));
  }, [route.params.id]);

  async function save() {
    if (!user) return;
    const nextErrors: string[] = [];
    if (gender !== 'male' && gender !== 'female') nextErrors.push('Select male or female.');
    if (!relation.trim()) nextErrors.push('Select a relationship.');
    if (relation === 'other' && !relationOther.trim()) nextErrors.push('Describe the relationship.');
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
    try {
      const updated = await getBackend().admin.updateUser(user.uid, {
        firstName,
        lastName,
        gender: gender as Gender,
        relation,
        relationOther,
        role,
      });
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
