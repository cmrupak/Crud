import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getErrorMessage, type DashboardStats } from '@nexora/shared';
import { useAuth } from '../context/AuthContext';
import { getBackend } from '../services/backend';
import { colors } from '../theme';

export function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getBackend()
      .stats.getDashboardStats()
      .then(setStats)
      .catch((err: unknown) => setError(getErrorMessage(err)));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.hello}>Welcome, {user?.firstName}</Text>
      <Text style={styles.sub}>CRUD · {user?.role}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        <Stat label="Total records" value={stats?.totalRecords ?? 0} />
        <Stat label="Active records" value={stats?.activeRecords ?? 0} />
        <Stat label="Inactive records" value={stats?.inactiveRecords ?? 0} />
        {user?.role === 'admin' ? (
          <>
            <Stat label="Total users" value={stats?.totalUsers ?? 0} />
            <Stat label="Active users" value={stats?.activeUsers ?? 0} />
            <Stat label="Inactive users" value={stats?.inactiveUsers ?? 0} />
          </>
        ) : null}
      </View>
      <Pressable style={styles.cta} onPress={() => navigation.navigate('CreateRecord')}>
        <Text style={styles.ctaText}>Create record</Text>
      </Pressable>
      {user?.role === 'admin' ? (
        <Pressable style={styles.secondary} onPress={() => navigation.navigate('AdminRecords')}>
          <Text style={styles.secondaryText}>All records</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingTop: 64, gap: 12, backgroundColor: colors.bg },
  hello: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 8 },
  error: { color: colors.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  value: { fontSize: 26, fontWeight: '800', marginTop: 6 },
  cta: { backgroundColor: colors.brand, borderRadius: 12, padding: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
  secondary: { borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  secondaryText: { fontWeight: '800', color: colors.ink },
});
