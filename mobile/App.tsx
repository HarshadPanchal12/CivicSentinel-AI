/**
 * CivicSentinel AI — Production Mobile App v2.0
 * Complete rewrite with all features, responsive UI, proper navigation
 *
 * SETUP:
 * npm install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
 * npx expo install expo-location expo-notifications expo-image-picker
 * All existing deps (convex, lucide-react-native) stay the same
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import Svg, { Circle, Path, G, Rect, Text as TextSvg } from 'react-native-svg';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConvexProvider, ConvexReactClient, useQuery, useMutation, useAction } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { ClerkProvider, useAuth, useUser, SignedIn, SignedOut, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { usePushToken } from './hooks/usePushToken';
import {
  MapPin, Bell, ThumbsUp, MessageSquare, Plus, Navigation,
  X, TrendingUp, ShieldCheck, Send, ChevronRight, User,
  LayoutDashboard, AlertTriangle, CheckCircle, Lightbulb,
  Clock, Star, Award, ArrowLeft, Camera, Filter,
  Zap, Activity, Eye, Heart, Share2, Flag, Info,
  ChevronUp, Home, Map, Settings, RefreshCw, LogIn, Mail, Lock,
} from 'lucide-react-native';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || "https://steady-impala-3.convex.cloud";
const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const convex = new ConvexReactClient(CONVEX_URL);

// Clerk Token Cache using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try { return SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch { }
  },
};

// Auth context to pass user info down
const AuthInfoContext = createContext<{ userId: string; userName: string }>({
  userId: 'anonymous', userName: 'Guest',
});
const useAuthInfo = () => useContext(AuthInfoContext);

const { width: SW, height: SH } = Dimensions.get('window');

const GEOFENCE_TASK = 'GEOFENCE_ZONE_ENTRY';
const convexHttpClient = new ConvexHttpClient(CONVEX_URL);

// ─────────────────────────────────────────────
// BACKGROUND TASK DEFINITION
// ─────────────────────────────────────────────
TaskManager.defineTask(GEOFENCE_TASK, async ({ data: { eventType, region }, error }: any) => {
  if (error) {
    console.error('[CivicSentinel] Geofencing task error:', error);
    return;
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    console.log('[CivicSentinel] Entered zone in background:', region.identifier);
    try {
      // Read the stored userId (set by the main app via AsyncStorage)
      const storedUserId = await AsyncStorage.getItem('civicsentinel_userId') || 'anonymous';
      await convexHttpClient.mutation('notifications:logZoneEntry' as any, {
        userId: storedUserId,
        geoFenceId: region.identifier,
      });
    } catch (e) {
      console.error('[CivicSentinel] Failed to log background entry:', e);
    }
  }
});

// ─────────────────────────────────────────────
// THEME — Responsive & Premium
// ─────────────────────────────────────────────
const T = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F2F8",
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryDark: "#3730A3",
  accent: "#059669",
  accentLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  text: "#0F172A",
  textSub: "#475569",
  textMute: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  shadow: "rgba(15,23,42,0.08)",
};

// Responsive spacing
const S = {
  xs: SW * 0.02,
  sm: SW * 0.03,
  md: SW * 0.04,
  lg: SW * 0.05,
  xl: SW * 0.06,
  xxl: SW * 0.08,
};

// ─────────────────────────────────────────────
// NAV CONTEXT
// ─────────────────────────────────────────────
const NavContext = createContext<any>(null);

// ─────────────────────────────────────────────
// SAFE HEADER — fixes status bar overlap on all phones
// ─────────────────────────────────────────────
const STATUSBAR_H = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

// ─────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────
const Avatar = ({ label, size = 40, color = T.primary }: any) => {
  const initial = String(label || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '22',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color, fontSize: size * 0.38, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
};

const CategoryBadge = ({ type }: { type: string }) => {
  const t = String(type || 'observation').toLowerCase();
  const map: any = {
    issue: { bg: T.dangerLight, color: T.danger, icon: '⚠', label: 'Issue' },
    verification: { bg: T.accentLight, color: T.accent, icon: '✓', label: 'Verified' },
    suggestion: { bg: T.purpleLight, color: T.purple, icon: '💡', label: 'Idea' },
    observation: { bg: T.primaryLight, color: T.primary, icon: '👁', label: 'Observation' },
    praise: { bg: '#FEF9C3', color: '#B45309', icon: '⭐', label: 'Praise' },
  };
  const s = map[t] || map.observation;
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color: s.color, fontSize: 10, fontWeight: '700' }}>{s.icon} {s.label.toUpperCase()}</Text>
    </View>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  const color = s === 'critical' ? T.danger : s === 'moderate' ? T.warning : T.accent;
  const bg = s === 'critical' ? T.dangerLight : s === 'moderate' ? T.warningLight : T.accentLight;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 4 }} />
      <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{status || 'Active'}</Text>
    </View>
  );
};

const Divider = () => <View style={{ height: 1, backgroundColor: T.border, marginVertical: 12 }} />;

const SectionHeader = ({ title, action, onAction }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: T.textSub, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Text>
    {action && <TouchableOpacity onPress={onAction}><Text style={{ fontSize: 12, color: T.primary, fontWeight: '600' }}>{action}</Text></TouchableOpacity>}
  </View>
);
// ─────────────────────────────────────────────
// GPS ZONE DETECTION
// ─────────────────────────────────────────────
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000, φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pickZone = (lat: number, lng: number, zones: any[]): any => {
  if (!zones?.length) return null;

  // Only return a zone if user is ACTUALLY inside its radius
  const match = zones.find((z: any) => {
    const zLat = Number(z.center?.lat ?? z.latitude ?? z.lat ?? 0);
    const zLng = Number(z.center?.lng ?? z.longitude ?? z.lng ?? 0);
    const r = Number(z.radius ?? 500);
    if (!zLat || !zLng) return false;
    return haversine(lat, lng, zLat, zLng) <= r;
  });

  // If not inside any zone → return null (show "Not in any active zone")
  return match ?? null;
};

const useGPS = (zones: any[] | undefined) => {
  const [pos, setPos] = useState<{ lat: number, lng: number } | null>(null);
  const [zone, setZone] = useState<any>(null);
  const [st, setSt] = useState<'loading' | 'ok' | 'denied' | 'fallback'>('loading');

  useEffect(() => {
    if (!zones?.length) return;
    let sub: any = null;

    (async () => {
      // 1. Request Foreground Permissions
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setSt('denied');
        setZone(zones[0]);
        return;
      }

      // 2. Request Background Permissions (REQUIRED for app closed)
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === 'granted') {
        console.log('[CivicSentinel] Background location granted. Registering geofences...');

        // Register native geofences for EACH active zone
        const regions = zones.map(z => ({
          identifier: String(z._id),
          latitude: Number(z.center?.lat ?? z.lat ?? 0),
          longitude: Number(z.center?.lng ?? z.lng ?? 0),
          radius: Number(z.radius ?? 400),
          notifyOnEnter: true,
          notifyOnExit: false,
        })).filter(r => r.latitude !== 0);

        if (regions.length > 0) {
          try {
            await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
            console.log(`[CivicSentinel] Registered ${regions.length} background geofences.`);
          } catch (e) {
            console.error('[CivicSentinel] Failed to start geofencing:', e);
          }
        }
      } else {
        console.warn('[CivicSentinel] Background location denied. Notifications only work in foreground.');
      }

      // 3. Start Foreground Watching
      try {
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude: lt, longitude: ln } = p.coords;
        setPos({ lat: lt, lng: ln });
        setZone(pickZone(lt, ln, zones));
        setSt('ok');
      } catch {
        setSt('fallback');
        setZone(zones[0]);
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 30000 },
        p => {
          const { latitude: lt, longitude: ln } = p.coords;
          setPos({ lat: lt, lng: ln });
          setZone(pickZone(lt, ln, zones));
        }
      );
    })();

    return () => {
      sub?.remove?.();
    };
  }, [zones?.length]);

  return { pos, zone, st };
};

// ─────────────────────────────────────────────
// SCREEN: FEED
// ─────────────────────────────────────────────
const FeedScreen = () => {
  const nav = useContext(NavContext);
  const zones = useQuery('geoFences:listActive' as any);
  const { pos, zone: activeZone, st: locationSt } = useGPS(zones);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const reports = useQuery(
    'reports:listByGeoFence' as any,
    activeZone?._id ? { geoFenceId: activeZone._id } : 'skip'
  );
  const toggleLike = useMutation('reports:toggleLike' as any);
  const requestAction = useMutation('reports:requestAction' as any);
  const logZoneEntry = useMutation('notifications:logZoneEntry' as any);
  const { userId: currentUserId, userName: currentUserName } = useAuthInfo();

  // ── Auto-trigger notification on zone entry ──
  const lastLoggedZone = useRef<string | null>(null);
  useEffect(() => {
    if (activeZone?._id && activeZone._id !== lastLoggedZone.current) {
      console.log(`[CivicSentinel] Entering zone: ${activeZone.name}`);
      lastLoggedZone.current = activeZone._id;
      logZoneEntry({
        userId: currentUserId,
        geoFenceId: activeZone._id
      }).catch(e => console.error("[CivicSentinel] Entry log failed:", e));
    } else if (!activeZone) {
      lastLoggedZone.current = null;
    }
  }, [activeZone?._id]);

  const zoneName = String(
    activeZone?.name ||
    (locationSt === 'loading' ? 'Getting location...' :
      locationSt === 'ok' ? 'No active zone nearby' : 'Scanning...')
  );

  const FILTERS = ['all', 'issue', 'verification', 'suggestion', 'praise'];
  const filtered = filter === 'all'
    ? (reports || [])
    : (reports || []).filter((r: any) => String(r.type || '').toLowerCase() === filter);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const renderReport = ({ item: r }: any) => {
    const safeName = String(r.userName || 'Anonymous');
    const safeContent = String(r.content || '');
    const safeType = String(r.type || 'observation');
    const safeLikes = Number(r.likes) || 0;
    const safeActions = Number(r.actionRequests) || 0;
    const progressPct = Math.min(Math.floor((safeActions / 20) * 100), 100);

    return (
      <View style={styles.reportCard}>
        {/* Header */}
        <View style={styles.reportCardHeader}>
          <Avatar label={safeName} size={40} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.reportUser}>{safeName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <MapPin size={10} color={T.textMute} />
              <Text style={styles.reportMeta}>{zoneName}</Text>
              <Text style={styles.reportMeta}>· Just now</Text>
            </View>
          </View>
          <CategoryBadge type={safeType} />
        </View>

        {/* Content */}
        <Text style={styles.reportContent}>{safeContent}</Text>

        {/* Action demand bar */}
        {safeActions > 0 && (
          <View style={styles.demandBar}>
            <View style={[styles.demandFill, { width: `${progressPct}%` as any }]} />
            <View style={styles.demandOverlay}>
              <Zap size={11} color={T.danger} />
              <Text style={styles.demandText}>
                {safeActions} citizens demanding action
                {progressPct >= 100 ? ' 🔥 Ministry Alerted!' : ` · Goal: 20`}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleLike({ reportId: r._id, userId: currentUserId })}
          >
            <ThumbsUp size={15} color={T.textSub} />
            <Text style={styles.actionBtnText}>{safeLikes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => nav.push('Comments', { report: r, zoneName })}
          >
            <MessageSquare size={15} color={T.textSub} />
            <Text style={styles.actionBtnText}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Share2 size={15} color={T.textSub} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={styles.takeActionBtn}
            onPress={() => requestAction({ reportId: r._id, userId: currentUserId })}
          >
            <Zap size={13} color={T.primary} />
            <Text style={styles.takeActionText}>Take Action</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenHeaderSub}>Neighbourhood Pulse</Text>
          <Text style={styles.screenHeaderTitle} numberOfLines={1}>{zoneName}</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => nav.push('NewReport', {})}>
          <Plus size={16} color="#fff" />
          <Text style={styles.headerBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Zone Banner */}
      {activeZone ? (
        <View style={styles.zoneBanner}>
          <View style={styles.zoneBannerIcon}>
            <Navigation size={16} color={T.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.zoneBannerTitle}>You are in {zoneName}</Text>
            <Text style={styles.zoneBannerSub}>
              {locationSt === 'ok'
                ? `GPS Verified · ${pos?.lat.toFixed(4)}, ${pos?.lng.toFixed(4)}`
                : 'Active Monitoring • Geo-Verified'}
            </Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      ) : locationSt === 'ok' ? (
        <View style={[styles.zoneBanner, { backgroundColor: T.surfaceAlt }]}>
          <View style={styles.zoneBannerIcon}>
            <MapPin size={16} color={T.textMute} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.zoneBannerTitle, { color: T.textSub }]}>
              Not in any active zone
            </Text>
            <Text style={styles.zoneBannerSub}>
              {pos?.lat.toFixed(4)}, {pos?.lng.toFixed(4)} · Move near a monitored area
            </Text>
          </View>
        </View>
      ) : null}

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44 }} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}>
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item._id)}
        contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {reports === undefined && activeZone !== null
              ? <ActivityIndicator color={T.primary} size="large" />
              : <>
                <Activity size={40} color={T.textMute} />
                <Text style={styles.emptyTitle}>No reports yet</Text>
                <Text style={styles.emptySub}>Be the first to report in this zone</Text>
              </>
            }
          </View>
        )}
        renderItem={renderReport}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: COMMENTS / REPLIES
// ─────────────────────────────────────────────
const CommentsScreen = ({ report, zoneName }: any) => {
  const nav = useContext(NavContext);
  const { userName: currentUserName, userId: currentUserId } = useAuthInfo();
  const [text, setText] = useState('');

  const comments = useQuery('comments:listByReport' as any, { reportId: report?._id }) || [];
  const createComment = useMutation('comments:create' as any);

  const post = async () => {
    if (!text.trim() || !report?._id) return;
    const currentText = text;
    setText(''); // optimistic clear
    try {
      await createComment({
        reportId: report._id,
        userId: currentUserId,
        userName: currentUserName,
        text: currentText,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to post reply.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <TouchableOpacity onPress={() => nav.pop()} style={styles.backBtn}>
          <ArrowLeft size={20} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { fontSize: 17 }]}>Discussion</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Original report */}
      <View style={[styles.reportCard, { margin: S.md, marginBottom: 4 }]}>
        <View style={styles.reportCardHeader}>
          <Avatar label={String(report?.userName || 'A')} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.reportUser}>{String(report?.userName || 'Anonymous')}</Text>
            <Text style={styles.reportMeta}>{zoneName}</Text>
          </View>
          <CategoryBadge type={String(report?.type || 'observation')} />
        </View>
        <Text style={styles.reportContent}>{String(report?.content || '')}</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={c => c._id}
        contentContainerStyle={{ padding: S.md }}
        ListHeaderComponent={<SectionHeader title={`${comments.length} Replies`} />}
        renderItem={({ item: c }) => (
          <View style={styles.commentCard}>
            <Avatar label={c.userName} size={32} color={T.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.reportUser, { fontSize: 13 }]}>{c.userName}</Text>
                <Text style={styles.reportMeta}>Recent</Text>
              </View>
              <Text style={[styles.reportContent, { marginBottom: 0 }]}>{c.text}</Text>
            </View>
          </View>
        )}
      />

      {/* Reply input */}
      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Add your reply..."
          placeholderTextColor={T.textMute}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.replyBtn} onPress={post}>
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────
// SCREEN: NEW REPORT
// ─────────────────────────────────────────────
const NewReportScreen = () => {
  const nav = useContext(NavContext);
  const { userId: currentUserId, userName: currentUserName } = useAuthInfo();
  const zones = useQuery('geoFences:listActive' as any);
  const { zone: activeZone } = useGPS(zones);
  const createReport = useMutation('reports:create' as any);

  const [type, setType] = useState('issue');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const TYPES = [
    { id: 'issue', label: 'Issue', icon: '⚠', color: T.danger, bg: T.dangerLight },
    { id: 'verification', label: 'Verify', icon: '✓', color: T.accent, bg: T.accentLight },
    { id: 'suggestion', label: 'Idea', icon: '💡', color: T.purple, bg: T.purpleLight },
    { id: 'praise', label: 'Praise', icon: '⭐', color: '#B45309', bg: '#FEF9C3' },
    { id: 'observation', label: 'Observe', icon: '👁', color: T.primary, bg: T.primaryLight },
  ];

  const submit = async () => {
    if (!content.trim()) { Alert.alert('Missing Info', 'Please describe the issue.'); return; }
    if (!activeZone?._id) { Alert.alert('Error', 'No active zone found nearby.'); return; }
    setLoading(true);
    try {
      await createReport({
        userId: currentUserId,
        userName: currentUserName,
        geoFenceId: activeZone._id,
        content,
        type,
      });
      Alert.alert('✅ Submitted!', 'Your report is now live in the feed.', [
        { text: 'OK', onPress: () => nav.pop() },
      ]);
    } catch {
      Alert.alert('Error', 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <TouchableOpacity onPress={() => nav.pop()} style={styles.backBtn}>
          <ArrowLeft size={20} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { fontSize: 17 }]}>New Report</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md }} showsVerticalScrollIndicator={false}>
        {/* Zone info */}
        {activeZone && (
          <View style={styles.formZoneBadge}>
            <MapPin size={13} color={T.primary} />
            <Text style={styles.formZoneText}>Reporting for: {String(activeZone.name || 'Current Zone')}</Text>
          </View>
        )}

        <SectionHeader title="Report Type" />
        <View style={styles.typeGrid}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeCard, type === t.id && { borderColor: t.color, borderWidth: 2, backgroundColor: t.bg }]}
              onPress={() => setType(t.id)}
            >
              <Text style={{ fontSize: 22 }}>{t.icon}</Text>
              <Text style={[styles.typeLabel, type === t.id && { color: t.color }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Description" />
        <TextInput
          style={styles.descInput}
          placeholder="Describe what you observed — include location details, severity, and any other context that will help officials respond..."
          placeholderTextColor={T.textMute}
          multiline
          numberOfLines={6}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />

        {/* Photo placeholder */}
        <TouchableOpacity style={styles.photoBtn}>
          <Camera size={20} color={T.textSub} />
          <Text style={styles.photoBtnText}>Attach Photo (optional)</Text>
        </TouchableOpacity>

        {/* AI hint */}
        <View style={styles.aiHint}>
          <Zap size={16} color={T.warning} />
          <Text style={styles.aiHintText}>
            Gemini AI will analyse your report and auto-notify the responsible government officials via the ministry dashboard.
          </Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publish to Feed →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────
// SCREEN: ZONES
// ─────────────────────────────────────────────
const ZonesScreen = () => {
  const nav = useContext(NavContext);
  const zones = useQuery('geoFences:listActive' as any);
  const records = useQuery('blockchain:listRecords' as any);

  // Derive stats
  const totalReports = 24 + (zones?.length || 0); // Mock + real
  const blockchainVerified = (records || []).filter((r: any) => r.txHash).length;
  const activeOfficials = Array.from(new Set((records || []).map((r: any) => r.officialName))).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View>
          <Text style={styles.screenHeaderSub}>Civic Intelligence Dashboard</Text>
          <Text style={styles.screenHeaderTitle}>Transparency Hub</Text>
        </View>
        <TrendingUp size={24} color={T.primary} />
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* ENHANCED: SVG Interactive Map Mockup */}
        <View style={styles.mapCard}>
          <View style={{ height: 180, width: '100%', marginBottom: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surfaceAlt, borderRadius: 12, overflow: 'hidden' }}>
            <Svg height="100%" width="100%" viewBox="0 0 200 100">
              {/* Abstract Map Lines */}
              <Path d="M0,50 Q50,40 100,50 T200,50" stroke={T.border} strokeWidth="1" fill="none" />
              <Path d="M50,0 Q60,50 50,100" stroke={T.border} strokeWidth="1" fill="none" />
              <Path d="M150,0 Q140,50 150,100" stroke={T.border} strokeWidth="1" fill="none" />
              {/* Zone Pins */}
              {(zones || []).map((z: any, i: number) => (
                <G key={String(z._id)} x={40 + (i * 40)} y={30 + (i * 15)}>
                  <Circle cx="0" cy="0" r="12" fill={T.primary} fillOpacity="0.1" />
                  <Circle cx="0" cy="0" r="4" fill={T.primary} />
                  <Rect x="-20" y="8" width="40" height="12" rx="6" fill={T.surface} stroke={T.border} strokeWidth="0.5" />
                  <TextSvg x="0" y="17" fontSize="6" fontWeight="bold" fill={T.text} textAnchor="middle">{String(z.name || '').substring(0, 8)}</TextSvg>
                </G>
              ))}
            </Svg>
            <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: T.textMute }}>GoAPI Geofencing Overlay</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.mapCardTitle}>Real-time Geo-Monitors</Text>
              <Text style={styles.mapCardSub}>Monitoring {(zones || []).length} active infrastructure zones</Text>
            </View>
            <View style={{ padding: 8, backgroundColor: T.primaryLight, borderRadius: 8 }}>
              <Map size={20} color={T.primary} />
            </View>
          </View>
        </View>

        {/* ENHANCED: Analytics Stats Grid */}
        <SectionHeader title="System Analytics" />
        <View style={styles.statsGrid}>
          {[
            { icon: '🏛️', value: String(activeOfficials), label: 'Officials tracked', color: '#4F46E5' },
            { icon: '🔗', value: String(blockchainVerified), label: 'On-chain records', color: '#059669' },
            { icon: '📢', value: String(totalReports), label: 'Citizen pings', color: '#DC2626' },
            { icon: '🛰️', value: String(zones?.length || 0), label: 'Active zones', color: '#9333EA' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { borderLeftWidth: 3, borderLeftColor: s.color }]}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Accountability Leaderboard */}
        <SectionHeader title="Official Accountability" />
        <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: T.border }}>
          {(records || []).slice(0, 3).map((r: any, i: number) => (
            <View key={String(r._id)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i === 2 ? 0 : 12, paddingBottom: i === 2 ? 0 : 12, borderBottomWidth: i === 2 ? 0 : 1, borderBottomColor: T.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: T.primary }}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: T.text }}>{r.officialName}</Text>
                <Text style={{ fontSize: 11, color: T.textMute }}>{r.officialPost} · {r.partyName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: r.txHash ? T.accent : T.warning }}>
                  {r.txHash ? '98%' : '65%'}
                </Text>
                <Text style={{ fontSize: 9, color: T.textMute }}>Integrity Score</Text>
              </View>
            </View>
          ))}
        </View>

        <SectionHeader title="Geo-Fenced Active List" />
        {(zones || []).length === 0 && <ActivityIndicator color={T.primary} style={{ marginTop: 20 }} />}
        {(zones || []).map((z: any) => (
          <TouchableOpacity
            key={String(z._id)}
            style={styles.zoneCard}
            onPress={() => nav.push('ZoneDetail', { zone: z })}
          >
            <View style={[styles.zoneStatusDot, { backgroundColor: T.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneCardName}>{String(z.name || 'Unknown Zone')}</Text>
              <Text style={styles.zoneCardMeta}>
                {String(z.type || 'ZONE').toUpperCase()} · {Number(z.triggerCount) || 0} pings · SHA-256 Anchored
              </Text>
            </View>
            <ChevronRight size={16} color={T.textMute} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: ZONE DETAIL
// ─────────────────────────────────────────────
const ZoneDetailScreen = ({ zone }: any) => {
  const nav = useContext(NavContext);
  const reports = useQuery('reports:listByGeoFence' as any, zone?._id ? { geoFenceId: zone._id } : 'skip');

  const name = String(zone?.name || 'Zone');
  const issueCount = (reports || []).filter((r: any) => r.type === 'issue').length;
  const verifiedCount = (reports || []).filter((r: any) => r.type === 'verification').length;

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <TouchableOpacity onPress={() => nav.pop()} style={styles.backBtn}>
          <ArrowLeft size={20} color={T.text} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { fontSize: 17 }]} numberOfLines={1}>{name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}>
        {/* Zone header card */}
        <View style={styles.zoneDetailHero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.zoneDetailName}>{name}</Text>
              <Text style={styles.zoneDetailType}>{String(zone?.type || 'ZONE').toUpperCase()}</Text>
            </View>
            <StatusPill status="active" />
          </View>
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { label: 'Issues', value: issueCount, color: T.danger },
              { label: 'Verified', value: verifiedCount, color: T.accent },
              { label: 'Pings', value: Number(zone?.triggerCount) || 0, color: T.primary },
            ].map(s => (
              <View key={s.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: T.textSub, fontWeight: '500' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Govt work tracker — key feature */}
        <SectionHeader title="Government Work Tracker" />
        <View style={styles.workTracker}>
          {[
            { status: 'completed', label: 'Road Repair - East Entrance', dept: 'PWD', duration: '3 days', since: 'Jan 12' },
            { status: 'ongoing', label: 'Streetlight Replacement', dept: 'MSEDCL', duration: '—', since: 'Jan 18' },
            { status: 'pending', label: 'Drainage Cleaning', dept: 'BMC', duration: '—', since: 'Pending' },
          ].map((w, i) => (
            <View key={i} style={styles.workItem}>
              <View style={[styles.workDot, {
                backgroundColor: w.status === 'completed' ? T.accent : w.status === 'ongoing' ? T.warning : T.textMute
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.workLabel}>{w.label}</Text>
                <Text style={styles.workMeta}>{w.dept} · Started {w.since}
                  {w.duration !== '—' ? ` · Completed in ${w.duration}` : ' · In progress'}
                </Text>
              </View>
              <View style={{ backgroundColor: w.status === 'completed' ? T.accentLight : w.status === 'ongoing' ? T.warningLight : T.surfaceAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: w.status === 'completed' ? T.accent : w.status === 'ongoing' ? T.warning : T.textMute, textTransform: 'uppercase' }}>
                  {w.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* AI Notification preview */}
        <SectionHeader title="AI Zone Briefing" />
        <View style={styles.aiBriefCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={16} color={T.warning} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: T.warning }}>Gemini AI Analysis</Text>
          </View>
          <Text style={styles.aiBriefText}>
            This zone has {issueCount} active issues. The most critical concern is infrastructure damage
            near the main road. Government officials have been notified. Estimated resolution time based
            on historical data: 3–5 working days.
          </Text>
          <Text style={[styles.aiBriefText, { marginTop: 6, color: T.textMute }]}>
            ℹ This analysis is generated from Open Government Data API + Neo4j knowledge graph.
          </Text>
        </View>

        {/* Recent reports in this zone */}
        <SectionHeader title="Recent Reports" action="See All" onAction={() => { }} />
        {(reports || []).slice(0, 3).map((r: any) => (
          <View key={String(r._id)} style={[styles.reportCard, { marginBottom: 8 }]}>
            <View style={styles.reportCardHeader}>
              <Avatar label={String(r.userName || 'A')} size={32} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.reportUser, { fontSize: 13 }]}>{String(r.userName || 'Anonymous')}</Text>
              </View>
              <CategoryBadge type={String(r.type || 'observation')} />
            </View>
            <Text style={styles.reportContent} numberOfLines={2}>{String(r.content || '')}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: NOTIFICATIONS
// ─────────────────────────────────────────────
const NotificationsScreen = () => {
  const nav = useContext(NavContext);
  const { userId: currentUserId } = useAuthInfo();
  const logResults = useQuery('notifications:listLogs' as any, { userId: currentUserId });
  const markRead = useMutation('notifications:markRead' as any);
  const markAllRead = useMutation('notifications:markAllRead' as any);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Load saved notifications from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('saved_notifs').then(data => {
      if (data) setSavedIds(JSON.parse(data));
    });
  }, []);

  const notifications = (logResults || []).map((n: any) => ({
    ...n,
    read: n.status === 'read',
    saved: savedIds.includes(n._id),
    time: new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const iconMap: any = { zone_entry: '📍', alert: '🚨', ai: '🤖', action: '⚡', work: '🏗', reply: '💬' };

  const onMarkAll = async () => {
    try {
      await markAllRead({ userId: currentUserId });
    } catch (e) {
      console.error('[CivicSentinel] Mark all read failed:', e);
    }
  };

  const onMarkOne = async (id: string) => {
    try {
      await markRead({ id });
    } catch (e) {
      console.error('[CivicSentinel] Mark read failed:', e);
    }
  };

  const onSave = async (id: string) => {
    const updated = savedIds.includes(id)
      ? savedIds.filter(x => x !== id)
      : [...savedIds, id];
    setSavedIds(updated);
    await AsyncStorage.setItem('saved_notifs', JSON.stringify(updated));
    Alert.alert(
      savedIds.includes(id) ? 'Removed' : '📌 Saved!',
      savedIds.includes(id) ? 'Notification removed from saved.' : 'This notification has been saved for later.'
    );
  };

  const renderNotif = ({ item: n }: any) => (
    <TouchableOpacity
      style={[styles.notifCard, !n.read && styles.notifCardUnread]}
      onPress={() => !n.read && onMarkOne(n._id)}
    >
      <View style={styles.notifIcon}>
        <Text style={{ fontSize: 20 }}>{iconMap[n.type] || '🔔'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {/* Save Button — top right of content */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[styles.notifTitle, { flex: 1 }]}>{n.title}</Text>
          <TouchableOpacity onPress={() => onSave(n._id)} style={{ padding: 4, marginLeft: 8 }}>
            <Text style={{ fontSize: 16 }}>{n.saved ? '📌' : '🔖'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.notifBody}>{n.body}</Text>

        {/* Before / After Images */}
        {(n.beforeImage || n.afterImage) && (
          <View style={styles.beforeAfterRow}>
            {n.beforeImage && (
              <View style={styles.beforeAfterItem}>
                <Text style={styles.beforeAfterLabel}>BEFORE</Text>
                <Image source={{ uri: n.beforeImage }} style={styles.beforeAfterImg} />
              </View>
            )}
            {n.afterImage && (
              <View style={styles.beforeAfterItem}>
                <Text style={[styles.beforeAfterLabel, { color: T.accent }]}>AFTER</Text>
                <Image source={{ uri: n.afterImage }} style={styles.beforeAfterImg} />
              </View>
            )}
          </View>
        )}

        {/* Accountability Details */}
        {(n.officialName || n.projectClaim) && (
          <View style={styles.notifDetailBox}>
            <View style={styles.notifDetailHeader}>
              <ShieldCheck size={14} color={T.accent} />
              <Text style={styles.notifDetailHeaderText}>PROMISE TRACKER</Text>
            </View>
            <Text style={styles.notifDetailSub}>Official: <Text style={{ fontWeight: '700', color: T.text }}>{n.officialName}</Text></Text>
            <Text style={styles.notifDetailSub}>Project: <Text style={{ fontWeight: '600' }}>{n.projectClaim}</Text></Text>
            {n.advantages && (
              <View style={styles.advantagePill}>
                <Zap size={10} color={T.warning} />
                <Text style={styles.advantageText}>{n.advantages}</Text>
              </View>
            )}
            {n.txHash && (
              <View style={styles.chainBadge}>
                <CheckCircle size={10} color={T.accent} />
                <Text style={styles.chainText}>VERIFIED ON POLYGON</Text>
              </View>
            )}
          </View>
        )}

        {n.zoneName && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 }}>
            <MapPin size={10} color={T.primary} />
            <Text style={{ fontSize: 10, color: T.primary, fontWeight: '600' }}>{n.zoneName}</Text>
          </View>
        )}
        <Text style={styles.notifTime}>{n.time} · {new Date(n.sentAt).toLocaleDateString()}</Text>
      </View>
      {!n.read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenHeaderSub}>{unreadCount > 0 ? `${unreadCount} new alerts` : 'No new alerts'}</Text>
          <Text style={styles.screenHeaderTitle}>Alerts & Insights</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={onMarkAll}>
            <Text style={styles.markReadText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n._creationTime.toString()}
        contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Bell size={40} color={T.textMute} />
            <Text style={styles.emptyTitle}>Your feed is quiet</Text>
            <Text style={styles.emptySub}>Notifications about your zones will appear here.</Text>
          </View>
        )}
        renderItem={renderNotif}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: PROFILE
// ─────────────────────────────────────────────
const ProfileScreen = () => {
  const nav = useContext(NavContext);
  const { userName: currentUserName } = useAuthInfo();
  const zones = useQuery('geoFences:listActive' as any);

  const badges = [
    { icon: '🗣️', label: 'First Report', earned: true },
    { icon: '⚡', label: 'Action Hero', earned: true },
    { icon: '🔥', label: 'Trending Voice', earned: false },
    { icon: '🏆', label: 'Civic Hero', earned: true },
    { icon: '📍', label: 'Zone Guardian', earned: false },
    { icon: '🌟', label: 'Top Contributor', earned: false },
    { icon: '📸', label: 'Photo Reporter', earned: false },
    { icon: '🤝', label: 'Team Player', earned: true },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenHeaderSub}>Citizen Profile</Text>
          <Text style={styles.screenHeaderTitle}>My Archive</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.push('Settings', {})}>
          <Settings size={20} color={T.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar label={currentUserName} size={70} color={T.primary} />
          <Text style={styles.profileName}>{currentUserName}</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>🎖️ Civic Reporter</Text>
          </View>
          <View style={styles.profileStats}>
            {[['12', 'Reports'], ['47', 'Actions'], ['380', 'Points']].map(([v, l]) => (
              <View key={l} style={styles.profileStat}>
                <Text style={styles.profileStatVal}>{v}</Text>
                <Text style={styles.profileStatLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Zones */}
        <SectionHeader title="My Zones" />
        {(zones || []).slice(0, 2).map((z: any) => (
          <TouchableOpacity key={String(z._id)} style={styles.zoneCard}
            onPress={() => nav.push('ZoneDetail', { zone: z })}>
            <View style={[styles.zoneStatusDot, { backgroundColor: T.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.zoneCardName}>{String(z.name || 'Zone')}</Text>
              <Text style={styles.zoneCardMeta}>Monitoring active</Text>
            </View>
            <ChevronRight size={16} color={T.textMute} />
          </TouchableOpacity>
        ))}

        {/* Badges */}
        <SectionHeader title="Achievements" />
        <View style={styles.badgeGrid}>
          {badges.map(b => (
            <View key={b.label} style={[styles.badgeCard, !b.earned && { opacity: 0.4 }]}>
              <Text style={{ fontSize: 26 }}>{b.icon}</Text>
              <Text style={styles.badgeLabel}>{b.label}</Text>
              {!b.earned && <Text style={{ fontSize: 9, color: T.textMute }}>🔒 Locked</Text>}
            </View>
          ))}
        </View>

        {/* Settings rows */}
        <SectionHeader title="Settings" />
        {[
          { icon: '🔔', label: 'Push Notifications', value: 'On' },
          { icon: '📍', label: 'Location Tracking', value: 'Always' },
          { icon: '🤖', label: 'AI Briefings', value: 'On' },
          { icon: '🌐', label: 'Language', value: 'English' },
          { icon: '🔒', label: 'Privacy', value: '›' },
          { icon: 'ℹ️', label: 'About CivicSentinel', value: 'v2.0' },
        ].map(s => (
          <TouchableOpacity key={s.label} style={styles.settingRow}>
            <Text style={styles.settingIcon}>{s.icon}</Text>
            <Text style={styles.settingLabel}>{s.label}</Text>
            <Text style={styles.settingValue}>{s.value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: SETTINGS
// ─────────────────────────────────────────────
const SettingsScreen = () => {
  const nav = useContext(NavContext);
  const { signOut } = useAuth();

  const settingGroups = [
    {
      title: 'Notifications',
      items: [
        { icon: '🔔', label: 'Push Notifications', value: 'On', desc: 'Get alerted when entering civic zones' },
        { icon: '🤖', label: 'AI Briefings', value: 'On', desc: 'Gemini-powered zone analysis' },
        { icon: '📊', label: 'Weekly Digest', value: 'Off', desc: 'Summary of civic activity near you' },
      ],
    },
    {
      title: 'Location',
      items: [
        { icon: '📍', label: 'Location Access', value: 'Always', desc: 'Required for background zone detection' },
        { icon: '🗺️', label: 'Zone Auto-detect', value: 'On', desc: 'Automatic entry/exit detection' },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: '🔒', label: 'Anonymous Reports', value: 'Off', desc: 'Hide your name on public reports' },
        { icon: '🛡️', label: 'Data on Blockchain', value: 'On', desc: 'Tamper-proof record of accountability' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: '🌐', label: 'Language', value: 'English' },
        { icon: 'ℹ️', label: 'App Version', value: 'v2.1.0' },
        { icon: '📄', label: 'Terms of Service', value: '›' },
        { icon: '💬', label: 'Support', value: '›' },
      ],
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.pop()}>
          <ArrowLeft size={20} color={T.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.screenHeaderSub}>App Configuration</Text>
          <Text style={styles.screenHeaderTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}>
        {settingGroups.map(group => (
          <View key={group.title} style={{ marginBottom: 20 }}>
            <SectionHeader title={group.title} />
            <View style={{ backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, overflow: 'hidden' }}>
              {group.items.map((s, i) => (
                <TouchableOpacity key={s.label} style={[
                  styles.settingRow,
                  i < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.borderLight },
                  { paddingHorizontal: 14 },
                ]}>
                  <Text style={styles.settingIcon}>{s.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{s.label}</Text>
                    {(s as any).desc && <Text style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>{(s as any).desc}</Text>}
                  </View>
                  <Text style={styles.settingValue}>{s.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={{
          backgroundColor: T.dangerLight, borderRadius: 14, paddingVertical: 16,
          alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FECACA',
        }} onPress={async () => {
          try {
            await signOut();
          } catch (err) {
            Alert.alert('Error', 'Failed to sign out. Try again.');
          }
        }}>
          <Text style={{ color: T.danger, fontSize: 16, fontWeight: '800' }}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: T.textMute, fontSize: 11, marginTop: 16 }}>CivicSentinel AI v2.1 • Made in India 🇮🇳</Text>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────
const TABS = [
  { id: 'Feed', label: 'Feed', IconComp: Home },
  { id: 'Zones', label: 'Zones', IconComp: Map },
  { id: 'Notifications', label: 'Alerts', IconComp: Bell },
  { id: 'Profile', label: 'Profile', IconComp: User },
];

const TabBar = ({ currentTab, onTab, unread }: any) => (
  <View style={styles.tabBar}>
    {TABS.map(t => {
      const active = currentTab === t.id;
      const Icon = t.IconComp;
      return (
        <TouchableOpacity key={t.id} style={styles.tabItem} onPress={() => onTab(t.id)}>
          <View style={{ position: 'relative' }}>
            <Icon size={22} color={active ? T.primary : T.textMute} />
            {t.id === 'Notifications' && unread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unread}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, active && { color: T.primary }]}>{t.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────
// ROOT NAV
// ─────────────────────────────────────────────
type NavScreen = { name: string; props: any };

const AppContainer = () => {
  const [tab, setTab] = useState('Feed');
  const [stack, setStack] = useState<NavScreen[]>([]);
  const { userId, userName } = useAuthInfo();

  // Register push notifications when app mounts
  const { lastNotification } = usePushToken(userId);

  const nav = {
    push: (name: string, props: any) => setStack(s => [...s, { name, props }]),
    pop: () => setStack(s => s.slice(0, -1)),
    replace: (name: string, props: any) => setStack(s => [...s.slice(0, -1), { name, props }]),
  };

  const currentScreen = stack.length > 0 ? stack[stack.length - 1] : null;

  const renderScreen = () => {
    if (currentScreen) {
      switch (currentScreen.name) {
        case 'Comments': return <CommentsScreen   {...currentScreen.props} />;
        case 'NewReport': return <NewReportScreen />;
        case 'ZoneDetail': return <ZoneDetailScreen {...currentScreen.props} />;
        case 'Settings': return <SettingsScreen />;
        default: return null;
      }
    }
    switch (tab) {
      case 'Feed': return <FeedScreen />;
      case 'Zones': return <ZonesScreen />;
      case 'Notifications': return <NotificationsScreen />;
      case 'Profile': return <ProfileScreen />;
      default: return <FeedScreen />;
    }
  };

  const showTabs = currentScreen === null;

  return (
    <NavContext.Provider value={nav}>
      <StatusBar barStyle="dark-content" backgroundColor={T.surface} translucent />
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ flex: 1 }}>{renderScreen()}</View>
        {showTabs && (
          <TabBar
            currentTab={tab}
            onTab={(t: string) => { setStack([]); setTab(t); }}
            unread={2}
          />
        )}
        {/* RAG Agent FAB + Modal */}
        <RAGChatModal />
      </View>
    </NavContext.Provider>
  );
};

// ─────────────────────────────────────────────
// RAG CHAT MODAL (Floating AI Agent)
// ─────────────────────────────────────────────
type ChatMsg = { role: 'user' | 'ai'; text: string };

const RAGChatModal = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'ai', text: 'Hi! I\'m your CivicSentinel AI assistant 🏙️\n\nAsk me about zones, officials, project status, or anything civic!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const performChat = useAction('ragAgent:chat' as any);
  const flatRef = useRef<FlatList>(null);

  const onSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const userMsg: ChatMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history for context
      const history = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'User' : 'Assistant',
        content: m.text,
      }));

      const answer = await performChat({
        question: q,
        history,
      });
      setMessages(prev => [...prev, { role: 'ai', text: answer || 'No response.' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Something went wrong. Try again.' }]);
      console.error('[RAG Agent] Error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const renderMsg = ({ item }: { item: ChatMsg }) => (
    <View style={[ragStyles.msgRow, item.role === 'user' && ragStyles.msgRowUser]}>
      {item.role === 'ai' && (
        <View style={ragStyles.avatarBubble}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
      )}
      <View style={[ragStyles.bubble, item.role === 'user' ? ragStyles.bubbleUser : ragStyles.bubbleAi]}>
        <Text style={[ragStyles.bubbleText, item.role === 'user' && { color: '#fff' }]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <>
      {/* Floating Action Button */}
      {!visible && (
        <TouchableOpacity
          style={ragStyles.fab}
          onPress={() => setVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 24 }}>🤖</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={ragStyles.modal}>
          {/* Header */}
          <View style={ragStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={ragStyles.headerTitle}>CivicSentinel AI</Text>
              <Text style={ragStyles.headerSub}>Ask anything about your zones & civic data</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} style={ragStyles.closeBtn}>
              <X size={20} color={T.text} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderMsg}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Typing indicator */}
          {loading && (
            <View style={ragStyles.typingRow}>
              <View style={ragStyles.avatarBubble}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              <View style={[ragStyles.bubble, ragStyles.bubbleAi, { paddingHorizontal: 20 }]}>
                <ActivityIndicator size="small" color={T.primary} />
              </View>
            </View>
          )}

          {/* Input Bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={ragStyles.inputBar}>
              <TextInput
                style={ragStyles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about zones, officials, projects..."
                placeholderTextColor={T.textMute}
                onSubmitEditing={onSend}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[ragStyles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                onPress={onSend}
                disabled={!input.trim() || loading}
              >
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ragStyles.suggestRow}>
              {['Zone status?', 'Who is the MLA?', 'Open reports?', 'Blockchain verified?'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={ragStyles.suggestChip}
                  onPress={() => { setInput(s); }}
                >
                  <Text style={ragStyles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const ragStyles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: T.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8,
    zIndex: 100,
  },
  modal: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
    paddingTop: Platform.OS === 'android' ? 44 : 14,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: T.text },
  headerSub: { fontSize: 11, color: T.textMute, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatarBubble: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: T.primary, borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: T.surface, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: T.border,
  },
  bubbleText: { fontSize: 14, color: T.text, lineHeight: 20 },
  typingRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border,
  },
  textInput: {
    flex: 1, backgroundColor: T.surfaceAlt, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12, fontSize: 14, color: T.text,
    borderWidth: 1, borderColor: T.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  suggestRow: {
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: T.surface,
  },
  suggestChip: {
    backgroundColor: T.primaryLight, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
  },
  suggestText: { fontSize: 12, color: T.primary, fontWeight: '600' },
});

// ─────────────────────────────────────────────
// LOGIN SCREEN (Clerk)
// ─────────────────────────────────────────────
const LoginScreen = () => {
  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!email || !password) { setError('Please fill both fields.'); return; }
    setLoading(true); setError('');
    try {
      if (isSignUp) {
        if (!signUpLoaded) return;
        // Split email prefix for a default name
        const displayName = email.split('@')[0];
        await signUp.create({
          emailAddress: email,
          password,
          firstName: displayName,
          lastName: 'User'
        });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setIsVerifying(true);
      } else {
        if (!signInLoaded) return;
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId });
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!code.trim()) { setError('Please enter the verification code.'); return; }
    if (!signUpLoaded) return;
    setLoading(true); setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      // ✅ Handle complete — the happy path
      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });
        return;
      }

      // ✅ Handle missing_requirements
      if (result.status === 'missing_requirements') {
        if (result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          return;
        }
        try {
          const updated = await signUp.update({ lastName: 'User' });
          if (updated.status === 'complete') {
            await setSignUpActive({ session: updated.createdSessionId });
            return;
          }
        } catch {
          // fallback below
        }
        setError('Sign-up incomplete. Please try again.');
        return;
      }

      setError(`Verification status: ${result.status}. Please try again.`);

    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Verification failed.';

      // ✅ "already_verified" means Clerk verified it but we never set the session
      if (msg.includes('already_verified') || msg.includes('has already been verified')) {
        try {
          if (!signInLoaded) return;
          const signInResult = await signIn.create({ identifier: email, password });
          if (signInResult.status === 'complete') {
            await setSignInActive({ session: signInResult.createdSessionId });
            return;
          }
        } catch {
          setError('Email verified! Please use the Sign In button below.');
          setIsVerifying(false);
          setIsSignUp(false);
          return;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { justifyContent: 'center', padding: S.xl }]}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontSize: 42 }}>🏙️</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: T.text, marginTop: 12 }}>CivicSentinel</Text>
        <Text style={{ fontSize: 14, color: T.textMute, marginTop: 4 }}>AI-Powered Civic Accountability</Text>
      </View>

      <View style={{ backgroundColor: T.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: T.border }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 20 }}>
          {isVerifying ? 'Verify Email' : (isSignUp ? 'Create Account' : 'Sign In')}
        </Text>

        {!isVerifying ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
              <Mail size={18} color={T.textMute} />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 10, fontSize: 15, color: T.text }}
                placeholder="Email" placeholderTextColor={T.textMute}
                value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: T.border }}>
              <Lock size={18} color={T.textMute} />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 10, fontSize: 15, color: T.text }}
                placeholder="Password" placeholderTextColor={T.textMute}
                value={password} onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </>
        ) : (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, color: T.textSub, marginBottom: 12 }}>Enter the 6-digit code sent to {email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border }}>
              <ShieldCheck size={18} color={T.textMute} />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, paddingLeft: 10, fontSize: 18, fontWeight: 'bold', letterSpacing: 4, color: T.primary }}
                placeholder="000000" placeholderTextColor={T.textMute}
                value={code} onChangeText={setCode}
                keyboardType="number-pad" maxLength={6}
              />
            </View>
          </View>
        )}

        {error ? <Text style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={isVerifying ? onVerify : onSubmit} disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>{isVerifying ? 'Verify Now' : (isSignUp ? 'Create Account' : 'Sign In')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (isVerifying) { setIsVerifying(false); }
            else { setIsSignUp(!isSignUp); }
            setError('');
          }}
          style={{ marginTop: 16, alignItems: 'center' }}
        >
          <Text style={{ color: T.primary, fontWeight: '600', fontSize: 14 }}>
            {isVerifying ? 'Back to Sign Up' : (isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ConvexProvider client={convex}>
        <SignedIn>
          <AuthenticatedApp />
        </SignedIn>
        <SignedOut>
          <LoginScreen />
        </SignedOut>
      </ConvexProvider>
    </ClerkProvider>
  );
}

const AuthenticatedApp = () => {
  const { user } = useUser();
  const userId = user?.id || 'anonymous';
  const userName = user?.firstName ? `${user.firstName} ${user.lastName?.[0] || ''}.` : (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Citizen');

  // Persist userId for the background geofence task
  useEffect(() => {
    AsyncStorage.setItem('civicsentinel_userId', userId);
  }, [userId]);

  return (
    <AuthInfoContext.Provider value={{ userId, userName }}>
      <AppContainer />
    </AuthInfoContext.Provider>
  );
};

// ─────────────────────────────────────────────
// STYLES — Fully responsive
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  // Header
  screenHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.md, paddingBottom: 12,
    backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  screenHeaderSub: { fontSize: 11, color: T.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  screenHeaderTitle: { fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: -0.5, marginTop: 1 },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  headerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },

  // Zone banner
  zoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: S.md, marginTop: S.sm,
    padding: 12, borderRadius: 14,
    backgroundColor: T.primaryLight,
  },
  zoneBannerIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center',
  },
  zoneBannerTitle: { fontSize: 13, fontWeight: '700', color: T.text },
  zoneBannerSub: { fontSize: 11, color: T.primary, fontWeight: '600', marginTop: 1 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.danger },
  liveText: { fontSize: 9, fontWeight: '800', color: T.text },

  // Filter
  filterRow: { paddingHorizontal: S.md, paddingVertical: 8, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
  },
  filterTabActive: { backgroundColor: T.primary, borderColor: T.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: T.textSub },
  filterTabTextActive: { color: '#fff' },

  // Report Card
  reportCard: {
    backgroundColor: T.surface, borderRadius: 16, padding: S.md,
    marginBottom: 10, borderWidth: 1, borderColor: T.border,
  },
  reportCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  reportUser: { fontSize: 14, fontWeight: '700', color: T.text },
  reportMeta: { fontSize: 11, color: T.textMute },
  reportContent: { fontSize: 14, color: T.textSub, lineHeight: 21, marginBottom: 10 },

  // Demand bar
  demandBar: {
    height: 28, borderRadius: 8, backgroundColor: T.dangerLight,
    overflow: 'hidden', marginBottom: 10, position: 'relative',
  },
  demandFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(220,38,38,0.15)' },
  demandOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  demandText: { fontSize: 10, color: T.danger, fontWeight: '700' },

  // Report Actions
  reportActions: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: T.borderLight, paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, color: T.textSub, fontWeight: '600' },
  takeActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  takeActionText: { fontSize: 12, color: T.primary, fontWeight: '700' },

  // Empty
  emptyState: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: T.text },
  emptySub: { fontSize: 13, color: T.textMute },

  // Comments
  commentCard: {
    flexDirection: 'row', backgroundColor: T.surface,
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
  },
  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: S.md, backgroundColor: T.surface,
    borderTopWidth: 1, borderTopColor: T.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : S.md,
  },
  replyInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: T.surfaceAlt, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: T.text,
  },
  replyBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
  },

  // New Report
  formZoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.primaryLight, padding: 10, borderRadius: 10, marginBottom: 18,
  },
  formZoneText: { fontSize: 13, color: T.primary, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeCard: {
    width: (SW - S.md * 2 - 32) / 3,
    padding: 12, borderRadius: 12, alignItems: 'center', gap: 4,
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border,
  },
  typeLabel: { fontSize: 11, fontWeight: '600', color: T.textSub },
  descInput: {
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    borderRadius: 12, padding: 14, fontSize: 14, color: T.text,
    minHeight: 120, marginBottom: 14,
  },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.surfaceAlt, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', marginBottom: 14,
  },
  photoBtnText: { fontSize: 14, color: T.textSub, fontWeight: '500' },
  aiHint: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: T.warningLight, borderRadius: 12, padding: 12, marginBottom: 20,
  },
  aiHintText: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 17 },
  submitBtn: {
    backgroundColor: T.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Zones
  mapCard: {
    backgroundColor: T.surface, borderRadius: 16, height: 160,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: T.border, borderStyle: 'dashed', marginBottom: 18,
  },
  mapCardTitle: { fontSize: 15, fontWeight: '700', color: T.text },
  mapCardSub: { fontSize: 11, color: T.textMute },
  mapLegend: { flexDirection: 'row', gap: 14, marginTop: 4 },
  zoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
  },
  zoneStatusDot: { width: 10, height: 10, borderRadius: 5 },
  zoneCardName: { fontSize: 15, fontWeight: '700', color: T.text },
  zoneCardMeta: { fontSize: 11, color: T.textMute, marginTop: 2 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: (SW - S.md * 2 - 10) / 2,
    backgroundColor: T.surface, borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: T.primary },
  statLabel: { fontSize: 11, color: T.textSub, fontWeight: '500', textAlign: 'center' },

  // Zone Detail
  zoneDetailHero: {
    backgroundColor: T.surface, borderRadius: 16, padding: S.md, marginBottom: 18,
    borderWidth: 1, borderColor: T.border,
  },
  zoneDetailName: { fontSize: 20, fontWeight: '800', color: T.text },
  zoneDetailType: { fontSize: 11, color: T.textMute, marginTop: 2 },
  workTracker: {
    backgroundColor: T.surface, borderRadius: 16, padding: S.md, marginBottom: 18,
    borderWidth: 1, borderColor: T.border,
  },
  workItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.borderLight,
  },
  workDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  workLabel: { fontSize: 13, fontWeight: '600', color: T.text },
  workMeta: { fontSize: 11, color: T.textMute, marginTop: 2 },
  aiBriefCard: {
    backgroundColor: T.warningLight, borderRadius: 16, padding: S.md,
    marginBottom: 18, borderWidth: 1, borderColor: '#FDE68A',
  },
  aiBriefText: { fontSize: 13, color: '#78350F', lineHeight: 19 },

  // Notifications
  markReadBtn: {
    backgroundColor: T.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  markReadText: { fontSize: 12, color: T.primary, fontWeight: '600' },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
  },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: T.primary },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 2 },
  notifBody: { fontSize: 12, color: T.textSub, lineHeight: 17 },
  notifTime: { fontSize: 10, color: T.textMute, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.primary, marginTop: 4, flexShrink: 0 },

  // Notif Details (New)
  notifDetailBox: {
    backgroundColor: T.surfaceAlt, borderRadius: 10, padding: 10, marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: T.accent,
  },
  notifDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  notifDetailHeaderText: { fontSize: 10, fontWeight: '800', color: T.accent, letterSpacing: 0.5 },
  notifDetailSub: { fontSize: 11, color: T.textSub, marginBottom: 2 },
  advantagePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, marginTop: 6, alignSelf: 'flex-start',
  },
  advantageText: { fontSize: 10, color: '#92400E', fontWeight: '700' },
  chainBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
  },
  chainText: { fontSize: 9, fontWeight: '800', color: T.accent },
  beforeAfterRow: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  beforeAfterItem: { flex: 1 },
  beforeAfterLabel: {
    fontSize: 9, fontWeight: '800', color: T.danger,
    letterSpacing: 0.5, marginBottom: 4,
  },
  beforeAfterImg: {
    width: '100%', height: 80, borderRadius: 8,
    backgroundColor: T.surfaceAlt,
  },

  // Profile
  profileCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: T.border,
  },
  profileName: { fontSize: 20, fontWeight: '800', color: T.text, marginTop: 12 },
  profileBadge: { backgroundColor: T.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  profileBadgeText: { fontSize: 12, color: T.primary, fontWeight: '700' },
  profileStats: { flexDirection: 'row', gap: 28, marginTop: 18 },
  profileStat: { alignItems: 'center' },
  profileStatVal: { fontSize: 22, fontWeight: '800', color: T.primary },
  profileStatLbl: { fontSize: 11, color: T.textSub, marginTop: 2 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  badgeCard: {
    width: (SW - S.md * 2 - 20) / 3,
    backgroundColor: T.surface, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.border,
  },
  badgeLabel: { fontSize: 10, fontWeight: '600', color: T.text, textAlign: 'center' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.borderLight,
  },
  settingIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 15, color: T.text, fontWeight: '500' },
  settingValue: { fontSize: 13, color: T.textMute },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderTopWidth: 1, borderTopColor: T.border,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: T.textMute },
  tabBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: T.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});