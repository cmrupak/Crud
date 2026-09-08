import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getApiUrl } from './src/services/backend';

/** Ping the API once at launch so the first real screen request is warmer. */
function warmApi(): void {
  try {
    const url = `${getApiUrl()}/health`;
    void fetch(url).catch(() => undefined);
  } catch {
    // ignore missing config during early boot
  }
}

export default function App() {
  useEffect(() => {
    warmApi();
    const id = setInterval(warmApi, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
