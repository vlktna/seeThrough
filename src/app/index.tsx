import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const commit = process.env.EXPO_PUBLIC_COMMIT_SHA?.slice(0, 7);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.badge}>STARTER BUILD</Text>
          <Text accessibilityRole="header" style={styles.title}>
            SeeThrough
          </Text>
          <Text style={styles.subtitle}>Indoor wayfinding prototype.</Text>
          <Text style={styles.description}>
            A shared starting point for the team. App features will be added here.
          </Text>
          <Text selectable style={styles.version}>
            {commit ? `Build ${commit}` : 'Local development build'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7f3' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 16 },
  badge: { color: '#46654b', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#15291c', fontSize: 42, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: '#243d2c', fontSize: 21, lineHeight: 29 },
  description: { color: '#526257', fontSize: 16, lineHeight: 25 },
  version: { color: '#526257', fontSize: 13, marginTop: 32 },
});
