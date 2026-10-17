import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PEOPLE } from './src/people';
import { MAP, placePeople } from './src/rooms';

const COLORS = ['#447C70', '#9E6E55', '#677AA1', '#966A8C', '#8B814D'];
const FACES = ['🧑🏽', '👩🏻', '👨🏾', '👩🏽', '🧑🏻'];

// Pass updated [{ name, roomNumber }] records to update the map and list together.
export function Floorplan({ people = PEOPLE }) {
  const placedPeople = placePeople(people);
  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.companyName}>See/Through</Text>
      <View style={styles.map} accessibilityLabel="Floorplan showing people in rooms 1 to 5">
        <Image source={require('./assets/floorplan.png')} style={styles.floorplan} resizeMode="contain" />
        {placedPeople.map((person, index) => person.position && <View
          key={`${person.name}-${index}`}
          accessibilityLabel={`${person.name}, Room ${person.roomNumber}`}
          style={[styles.marker, { left: `${person.position.x * 100}%`, top: `${person.position.y * 100}%` }]}
        >
          <View style={[styles.head, { borderColor: COLORS[index % COLORS.length] }]}>
            <Text style={styles.face}>{FACES[index % FACES.length]}</Text>
          </View>
          <Text numberOfLines={1} style={styles.markerName}>{person.name.split(' ')[0]}</Text>
        </View>)}
      </View>
      <View style={styles.list}>
        <View style={styles.listHeader}><Text style={styles.columnHeading}>Name</Text><Text style={styles.columnHeading}>Room</Text></View>
        {placedPeople.map((person, index) => <View key={`${person.name}-${index}`} style={styles.row}>
          <View style={[styles.personDot, { backgroundColor: COLORS[index % COLORS.length] }]} />
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.room}>{person.position ? `Room ${person.roomNumber}` : 'Unknown'}</Text>
        </View>)}
        {placedPeople.length === 0 && <Text style={styles.empty}>No people to show.</Text>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export default function App() {
  return <SafeAreaProvider><Floorplan /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 12, paddingBottom: 24, flexGrow: 1 },
  companyName: { fontSize: 26, fontWeight: '600', color: '#28372E', paddingVertical: 16, letterSpacing: -0.7 },
  map: { width: '100%', aspectRatio: MAP.width / MAP.height, position: 'relative' },
  floorplan: { width: '100%', height: '100%' },
  marker: { position: 'absolute', width: 72, marginLeft: -36, marginTop: -22, alignItems: 'center' },
  head: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  face: { fontSize: 24 },
  markerName: { maxWidth: 72, marginTop: 2, fontSize: 9, fontWeight: '600', color: '#26352E', backgroundColor: '#FFFFFFEB', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  list: { marginTop: 'auto', paddingTop: 20, width: '100%' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#E4E7E4' },
  columnHeading: { fontSize: 11, color: '#758078', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 47, borderBottomWidth: 1, borderColor: '#F0F1EF', gap: 10 },
  personDot: { width: 7, height: 7, borderRadius: 4 },
  personName: { flex: 1, fontSize: 13, color: '#28372E' },
  room: { fontSize: 12, color: '#67736B' },
  empty: { paddingVertical: 20, color: '#758078', fontSize: 13 },
});
