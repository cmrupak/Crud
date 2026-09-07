import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from './LoginScreen';

export function DeactivatedScreen() {
  const { logout } = useAuth();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Account deactivated</Text>
      <Text style={styles.demo}>Please contact an administrator.</Text>
      <Pressable style={styles.button} onPress={() => void logout()}>
        <Text style={styles.buttonText}>Back to login</Text>
      </Pressable>
    </View>
  );
}
