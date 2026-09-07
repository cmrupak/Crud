import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MESSAGES, getErrorMessage, validateRecord, type RecordInput } from '@nexora/shared';
import { getBackend } from '../services/backend';
import { styles } from './LoginScreen';

export function RecordFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string | undefined;
  const [form, setForm] = useState<RecordInput>({ title: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBackend()
      .records.getById(id)
      .then((record) => setForm({ title: record.title, description: record.description, status: record.status }))
      .catch((err: unknown) => Alert.alert('Error', getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    const validation = validateRecord(form);
    if (!validation.valid) {
      Alert.alert('Check the form', Object.values(validation.errors).join('\n'));
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await getBackend().records.update(id, form);
        Alert.alert('Saved', MESSAGES.RECORD_UPDATED);
      } else {
        await getBackend().records.create(form);
        Alert.alert('Saved', MESSAGES.RECORD_CREATED);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(MESSAGES.SAVE_RECORD_ERROR, getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Text style={styles.wrap}>Loading record...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={(title) => setForm((c) => ({ ...c, title }))} />
      <TextInput
        style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
        placeholder="Description"
        multiline
        value={form.description}
        onChangeText={(description) => setForm((c) => ({ ...c, description }))}
      />
      <Pressable
        style={styles.button}
        onPress={() => setForm((c) => ({ ...c, status: c.status === 'active' ? 'inactive' : 'active' }))}
      >
        <Text style={styles.buttonText}>Status: {form.status}</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => void save()} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </Pressable>
    </ScrollView>
  );
}
