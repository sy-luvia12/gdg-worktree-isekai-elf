import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const pages = ['mimir', 'odins-eye', 'tombstone', 'tree', 'trunk'] as const;

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '페이지 목록' }} />
      {pages.map((name) => (
        <Link key={name} href={`/${name}`}>
          <ThemedText type="link">{name}</ThemedText>
        </Link>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
