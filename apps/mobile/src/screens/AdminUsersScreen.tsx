import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MESSAGES, displayName, getErrorMessage, type UserProfile } from '@nexora/shared';
import { getBackend } from '../services/backend';
import { styles } from './LoginScreen';

export function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await getBackend().admin.listUsers({ search, pageSize: 50 });
      setUsers(result.items);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err) || MESSAGES.LOAD_USERS_ERROR);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function toggle(user: UserProfile) {
    const deactivate = user.status === 'active';
    Alert.alert(
      deactivate ? 'Deactivate User' : 'Activate User',
      deactivate
        ? `Are you sure you want to deactivate ${displayName(user)}? The user will no longer be able to access the application.`
        : `Activate ${displayName(user)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: deactivate ? 'Deactivate' : 'Activate',
          style: deactivate ? 'destructive' : 'default',
          onPress: () => {
            const action = deactivate
              ? getBackend().admin.deactivateUser(user.uid)
              : getBackend().admin.activateUser(user.uid);
            void action.then(load).catch((err: unknown) => Alert.alert('Error', getErrorMessage(err)));
          },
        },
      ],
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Users</Text>
      <TextInput style={styles.input} placeholder="Search users" value={search} onChangeText={setSearch} />
      {error ? <Text>{error}</Text> : null}
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ fontWeight: '800' }}>{displayName(item)}</Text>
            <Text>{item.email}</Text>
            <Text>
              {item.role} · {item.status}
            </Text>
            <Pressable onPress={() => navigation.navigate('AdminUserDetail', { id: item.uid })}>
              <Text style={styles.link}>View / Edit</Text>
            </Pressable>
            <Pressable onPress={() => toggle(item)}>
              <Text style={styles.link}>{item.status === 'active' ? 'Deactivate' : 'Activate'}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
