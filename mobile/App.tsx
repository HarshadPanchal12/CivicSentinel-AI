import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { ConvexProvider, ConvexReactClient, useQuery, useAction } from 'convex/react';
import * as Location from 'expo-location';

// HARDCODED — this is the same Convex cloud the web dashboard connects to
const CONVEX_URL = 'https://steady-impala-3.convex.cloud';
const convex = new ConvexReactClient(CONVEX_URL);

const MOCK_CITIZEN_ID = `mobile_user_${Math.floor(Math.random() * 1000)}`;

// Error Boundary to catch any rendering crash and show a fallback screen instead of closing
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1e', padding: 20 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function CitizenDashboard() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const notifications = useQuery('notifications:listForUser' as any, { userId: MOCK_CITIZEN_ID });
  const calculateProximity = useAction('geospatial:calculateProximity' as any);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (e) {
        setErrorMsg('Could not get location');
      }
    })();
  }, []);

  const triggerSimulation = async () => {
    if (!location) {
      Alert.alert("Waiting for GPS", "Please wait for your GPS coordinates to load.");
      return;
    }
    setIsSimulating(true);
    try {
      const result = await calculateProximity({
        citizenId: MOCK_CITIZEN_ID,
        citizenLat: location.coords.latitude,
        citizenLng: location.coords.longitude,
      });
      if (result.triggered) {
        Alert.alert("Geo-Fence Triggered!", "An AI notification has been sent to your inbox below.");
      } else {
        Alert.alert("Safe Distance", "You are not within range of any active government project zones.");
      }
    } catch (e) {
      Alert.alert("Network Error", "Could not reach the Geoapify routing engine. Check your internet.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />

      <View style={styles.header}>
        <Text style={styles.logo}>GeoFence<Text style={{ color: '#00d4ff' }}>AI</Text></Text>
        <Text style={styles.subtitle}>Citizen Companion App</Text>
        <Text style={styles.citizenId}>ID: {MOCK_CITIZEN_ID}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDot}>📍</Text>
          <Text style={styles.cardTitle}>Live GPS Tracker</Text>
        </View>
        {location ? (
          <View style={styles.gpsRow}>
            <View style={styles.gpsBox}>
              <Text style={styles.gpsLabel}>Latitude</Text>
              <Text style={styles.gpsValue}>{location.coords.latitude.toFixed(5)}</Text>
            </View>
            <View style={styles.gpsBox}>
              <Text style={styles.gpsLabel}>Longitude</Text>
              <Text style={styles.gpsValue}>{location.coords.longitude.toFixed(5)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.loadingText}>{errorMsg || 'Acquiring satellite fix...'}</Text>
        )}
        <TouchableOpacity
          style={[styles.button, isSimulating && styles.buttonDisabled]}
          onPress={triggerSimulation}
          disabled={isSimulating}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isSimulating ? "Calculating Route..." : "Ping Geo-Fence Engine"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        AI Updates ({notifications?.length || 0})
      </Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications === undefined ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>Connecting to Convex...</Text></View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>No notifications yet. Tap the button above near a project zone!</Text></View>
        ) : (
          notifications.map((notif: any) => (
            <View key={notif._id} style={styles.notifCard}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              <Text style={styles.notifContent}>{notif.content}</Text>
              <View style={styles.notifFooter}>
                <Text style={styles.notifBadge}>{notif.language || 'EN'}</Text>
                <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleTimeString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <CitizenDashboard />
      </ConvexProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e', paddingTop: 50, paddingHorizontal: 16 },
  header: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  logo: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  citizenId: { fontSize: 11, color: '#374151', marginTop: 4, fontFamily: 'monospace' },

  card: { backgroundColor: '#111827', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardDot: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#e5e7eb' },
  gpsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  gpsBox: { flex: 1, backgroundColor: '#1f2937', borderRadius: 10, padding: 12, marginHorizontal: 4 },
  gpsLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  gpsValue: { fontSize: 16, color: '#00d4ff', fontFamily: 'monospace', fontWeight: 'bold' },
  loadingText: { color: '#6b7280', textAlign: 'center', marginBottom: 16 },

  button: { backgroundColor: '#00d4ff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#374151' },
  buttonText: { color: '#080d18', fontWeight: 'bold', fontSize: 15 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#e5e7eb', marginBottom: 12 },
  scroll: { flex: 1 },

  emptyCard: { backgroundColor: '#111827', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#6b7280', textAlign: 'center', fontSize: 14 },

  notifCard: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#f97316' },
  notifTitle: { fontWeight: 'bold', fontSize: 15, color: '#f3f4f6', marginBottom: 6 },
  notifContent: { color: '#9ca3af', fontSize: 13, lineHeight: 20 },
  notifFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  notifBadge: { fontSize: 10, color: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', fontWeight: '600' },
  notifTime: { color: '#4b5563', fontSize: 11 },
});
