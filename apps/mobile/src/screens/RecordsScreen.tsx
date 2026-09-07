import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MESSAGES, getErrorMessage, type RecordItem } from '@nexora/shared';
import { getBackend } from '../services/backend';
import { colors } from '../theme';

export function RecordsScreen({ adminView = false }: { adminView?: boolean }) {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const backend = getBackend();
      const result = adminView
        ? await backend.records.listAll({ search, status, pageSize: 50 })
        : await backend.records.listMine({ search, status, pageSize: 50 });
      setItems(result.items);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [adminView, search, status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function remove(record: RecordItem) {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void getBackend()
            .records.softDelete(record.id)
            .then(() => load())
            .catch((err: unknown) => Alert.alert('Error', getErrorMessage(err)));
        },
      },
    ]);
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{adminView ? 'All records' : 'Records'}</Text>
      <TextInput style={styles.search} placeholder="Search" value={search} onChangeText={setSearch} />
      <View style={styles.filters}>
        {(['all', 'active', 'inactive'] as const).map((value) => (
          <Pressable key={value} onPress={() => setStatus(value)} style={[styles.chip, status === value && styles.chipOn]}>
            <Text style={[styles.chipText, status === value && styles.chipTextOn]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error || MESSAGES.LOAD_RECORDS_ERROR}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No records found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.description}</Text>
            <Text style={styles.badge}>{item.status}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => navigation.navigate('RecordDetail', { id: item.id })}>
                <Text style={styles.link}>View</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('EditRecord', { id: item.id })}>
                <Text style={styles.link}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => void remove(item)}>
                <Text style={[styles.link, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      {!adminView ? (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateRecord')}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  search: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 12, marginBottom: 10 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontWeight: '700', textTransform: 'capitalize' },
  chipTextOn: { color: '#fff' },
  error: { color: colors.danger },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.line },
  cardTitle: { fontWeight: '800', fontSize: 16 },
  muted: { color: colors.muted, marginVertical: 6 },
  badge: { fontWeight: '700', color: colors.brand, textTransform: 'capitalize' },
  row: { flexDirection: 'row', gap: 16, marginTop: 10 },
  link: { color: colors.brand, fontWeight: '800' },
  fab: { position: 'absolute', right: 18, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: -2 },
});
