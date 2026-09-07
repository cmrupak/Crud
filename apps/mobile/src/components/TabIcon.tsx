import { View, type StyleProp, type ViewStyle } from 'react-native';

type IconName = 'dashboard' | 'records' | 'profile' | 'admin';

type Props = {
  name: IconName;
  color: string;
  size?: number;
};

export function TabIcon({ name, color, size = 24 }: Props) {
  const s = size;
  const stroke = Math.max(2, Math.round(s * 0.1));

  if (name === 'dashboard') {
    return (
      <View style={{ width: s, height: s, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Box color={color} size={s * 0.42} />
          <Box color={color} size={s * 0.42} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Box color={color} size={s * 0.42} />
          <Box color={color} size={s * 0.42} />
        </View>
      </View>
    );
  }

  if (name === 'records') {
    return (
      <View style={{ width: s, height: s, justifyContent: 'space-evenly', paddingVertical: 2 }}>
        <Line color={color} height={stroke} />
        <Line color={color} height={stroke} />
        <Line color={color} height={stroke} />
      </View>
    );
  }

  if (name === 'profile') {
    return (
      <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View
          style={{
            width: s * 0.36,
            height: s * 0.36,
            borderRadius: s,
            backgroundColor: color,
            marginBottom: s * 0.06,
          }}
        />
        <View
          style={{
            width: s * 0.72,
            height: s * 0.36,
            borderTopLeftRadius: s,
            borderTopRightRadius: s,
            backgroundColor: color,
          }}
        />
      </View>
    );
  }

  // admin — shield / people mark
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: s * 0.7,
          height: s * 0.82,
          borderWidth: stroke,
          borderColor: color,
          borderRadius: s * 0.12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: s * 0.22, height: s * 0.22, borderRadius: s, backgroundColor: color }} />
        <View
          style={{
            width: s * 0.4,
            height: s * 0.18,
            borderTopLeftRadius: s,
            borderTopRightRadius: s,
            backgroundColor: color,
            marginTop: 2,
          }}
        />
      </View>
    </View>
  );
}

function Box({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={
        {
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: color,
        } as StyleProp<ViewStyle>
      }
    />
  );
}

function Line({ color, height }: { color: string; height: number }) {
  return <View style={{ height, borderRadius: 2, backgroundColor: color, width: '100%' }} />;
}
