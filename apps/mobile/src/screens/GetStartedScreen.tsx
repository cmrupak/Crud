import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

export function GetStartedScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>Get started</Text>
      <Text style={styles.title}>How would you like to continue?</Text>
      <Text style={styles.sub}>Choose the option that fits you best.</Text>

      <Pressable style={styles.cardPrimary} onPress={() => navigation.navigate('RegisterWizard')}>
        <Text style={styles.cardTitleLight}>New User</Text>
        <Text style={styles.cardSubLight}>Create New Account</Text>
      </Pressable>

      <Pressable style={styles.cardSecondary} onPress={() => navigation.navigate('ExistingUser')}>
        <Text style={styles.cardTitleDark}>Existing User</Text>
        <Text style={styles.cardSubDark}>Continue</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 72, gap: 14 },
  kicker: { color: colors.brand, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 8 },
  cardPrimary: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  cardSecondary: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitleLight: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardSubLight: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  cardTitleDark: { fontSize: 18, fontWeight: '800', color: colors.ink },
  cardSubDark: { color: colors.muted, fontWeight: '600' },
  back: { color: colors.brand, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});
