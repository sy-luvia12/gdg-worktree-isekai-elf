import { Image, type ImageSource } from 'expo-image';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';

type Props = { title: string; source: ImageSource | number };

export function ImageScreen({ title, source }: Props) {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <Image source={source} style={styles.image} contentFit="contain" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1 },
});
