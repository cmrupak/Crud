import { useEffect } from 'react';
import { Alert } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { checkForAppUpdate, installAppUpdate } from './src/services/appUpdate';
import { getApiUrl } from './src/services/backend';
import { getErrorMessage } from '@nexora/shared';

const UPDATE_PROMPT_KEY = 'nexora.update.promptedAt';

/** Ping the API once at launch so the first real screen request is warmer. */
function warmApi(): void {
  try {
    const url = `${getApiUrl()}/health`;
    void fetch(url).catch(() => undefined);
  } catch {
    // ignore missing config during early boot
  }
}

async function maybePromptUpdate(): Promise<void> {
  try {
    const last = Number((await AsyncStorage.getItem(UPDATE_PROMPT_KEY)) || 0);
    if (Date.now() - last < 12 * 60 * 60 * 1000) return;

    const result = await checkForAppUpdate();
    if (result.status !== 'available') return;

    await AsyncStorage.setItem(UPDATE_PROMPT_KEY, String(Date.now()));
    Alert.alert(
      'Update available',
      `Version ${result.latest.version} is ready.${result.latest.notes ? `\n\n${result.latest.notes}` : ''}`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            void installAppUpdate(result.latest).catch((error) => {
              Alert.alert('Update failed', getErrorMessage(error));
            });
          },
        },
      ],
    );
  } catch {
    // ignore background update check failures
  }
}

export default function App() {
  useEffect(() => {
    warmApi();
    const id = setInterval(warmApi, 4 * 60 * 1000);
    const timer = setTimeout(() => {
      void maybePromptUpdate();
    }, 2500);
    return () => {
      clearInterval(id);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <ExpoStatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
