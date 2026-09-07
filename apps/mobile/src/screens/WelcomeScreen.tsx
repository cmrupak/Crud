import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme';

export function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const [showHi, setShowHi] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCta, setShowCta] = useState(false);

  const hiOpacity = useRef(new Animated.Value(0)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setShowHi(true);
        Animated.timing(hiOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      }, 200),
    );

    timers.push(
      setTimeout(() => {
        setShowWelcome(true);
        Animated.timing(welcomeOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      }, 1100),
    );

    timers.push(
      setTimeout(() => {
        setShowCta(true);
        Animated.timing(ctaOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      }, 2000),
    );

    return () => timers.forEach(clearTimeout);
  }, [ctaOpacity, hiOpacity, welcomeOpacity]);

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        {showHi ? (
          <Animated.Text style={[styles.hi, { opacity: hiOpacity }]}>Hi</Animated.Text>
        ) : (
          <View style={styles.hiSpacer} />
        )}
        {showWelcome ? (
          <Animated.Text style={[styles.welcome, { opacity: welcomeOpacity }]}>Welcome</Animated.Text>
        ) : null}
      </View>

      {showCta ? (
        <Animated.View style={{ opacity: ctaOpacity }}>
          <Pressable style={styles.button} onPress={() => navigation.replace('Login')}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.buttonSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: 28,
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingBottom: 48,
  },
  hero: { gap: 8 },
  hi: { color: '#fff', fontSize: 52, fontWeight: '800' },
  hiSpacer: { height: 64 },
  welcome: { color: '#E2E8F0', fontSize: 36, fontWeight: '700' },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  buttonSpacer: { height: 52 },
});
