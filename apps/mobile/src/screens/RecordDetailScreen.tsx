import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatDateTime, getErrorMessage, type RecordItem } from '@nexora/shared';
import { getBackend } from '../services/backend';
import { styles } from './LoginScreen';

export function RecordDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getBackend()
      .records.getById(route.params.id)
      .then(setRecord)
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, [route.params.id]);

  if (error) return <Text style={styles.wrap}>{error}</Text>;
  if (!record) return <Text style={styles.wrap}>Loading record...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>{record.title}</Text>
      <Text style={styles.demo}>{record.status} · {formatDateTime(record.createdAt)}</Text>
      <Text>{record.description}</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('EditRecord', { id: record.id })}>
        <Text style={styles.buttonText}>Edit</Text>
      </Pressable>
    </ScrollView>
  );
}
