import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { IDENTIFIER_PLACEHOLDERS } from '@nexora/shared';
import { colors } from '../theme';

export function FadingPlaceholder({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;

    const cycle = () => {
      Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => {
        if (cancelled) return;
        setIndex((current) => (current + 1) % IDENTIFIER_PLACEHOLDERS.length);
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    };

    const timer = setInterval(cycle, 2200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [opacity, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.Text style={[styles.text, { opacity }]}>
        {IDENTIFIER_PLACEHOLDERS[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  text: {
    color: colors.muted,
    fontSize: 16,
  },
});
