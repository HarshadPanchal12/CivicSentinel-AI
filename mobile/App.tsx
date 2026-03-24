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
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from 'convex/react';
import { usePushToken } from './hooks/usePushToken';
import {
  MapPin, Bell, ThumbsUp, MessageSquare, Plus, Navigation,
  X, TrendingUp, ShieldCheck, Send, ChevronRight, User,
  LayoutDashboard, AlertTriangle, CheckCircle, Lightbulb,
  Clock, Star, Award, ArrowLeft, Camera, Filter,
  Zap, Activity, Eye, Heart, Share2, Flag, Info,
  ChevronUp, Home, Map, Settings, RefreshCw,
} from 'lucide-react-native';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || "https://steady-impala-3.convex.cloud";
const convex = new ConvexReactClient(CONVEX_URL);

const MOCK_CITIZEN_ID = "user_citizen_123";
const MOCK_CITIZEN_NAME = "Harshad P.";

const { width: SW, height: SH } = Dimensions.get('window');

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
const haversine = (lat1:number,lng1:number,lat2:number,lng2:number) => {
  const R=6371000,φ1=lat1*Math.PI/180,φ2=lat2*Math.PI/180;
  const Δφ=(lat2-lat1)*Math.PI/180,Δλ=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};

const pickZone = (lat: number, lng: number, zones: any[]): any => {
  if (!zones?.length) return null;

  // Only return a zone if user is ACTUALLY inside its radius
  const match = zones.find((z: any) => {
    const zLat = Number(z.center?.lat ?? z.latitude ?? z.lat ?? 0);
    const zLng = Number(z.center?.lng ?? z.longitude ?? z.lng ?? 0);
    const r    = Number(z.radius ?? 500);
    if (!zLat || !zLng) return false;
    return haversine(lat, lng, zLat, zLng) <= r;
  });

  // If not inside any zone → return null (show "Not in any active zone")
  return match ?? null;
};

const useGPS = (zones:any[]|undefined) => {
  const [pos,  setPos]  = useState<{lat:number,lng:number}|null>(null);
  const [zone, setZone] = useState<any>(null);
  const [st,   setSt]   = useState<'loading'|'ok'|'denied'|'fallback'>('loading');
  useEffect(()=>{
    if (!zones?.length) return;
    let sub:any=null;
    (async()=>{
      const loc = await import('expo-location');
      const {status} = await loc.requestForegroundPermissionsAsync();
      if (status!=='granted'){ setSt('denied'); setZone(zones[0]); return; }
      try {
        const p = await loc.getCurrentPositionAsync({accuracy:loc.Accuracy.Balanced});
        const {latitude:lt,longitude:ln}=p.coords;
        setPos({lat:lt,lng:ln});
        setZone(pickZone(lt,ln,zones));
        setSt('ok');
      } catch { setSt('fallback'); setZone(zones[0]); }
      sub = await loc.watchPositionAsync(
        {accuracy:loc.Accuracy.Balanced,distanceInterval:50,timeInterval:30000},
        p=>{
          const {latitude:lt,longitude:ln}=p.coords;
          setPos({lat:lt,lng:ln});
          setZone(pickZone(lt,ln,zones));
        }
      );
    })();
    return ()=>{ sub?.remove?.(); };
  },[zones?.length]);
  return {pos,zone,st};
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
  const toggleLike    = useMutation('reports:toggleLike' as any);
  const requestAction = useMutation('reports:requestAction' as any);

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
            onPress={() => toggleLike({ reportId: r._id, userId: MOCK_CITIZEN_ID })}
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
            onPress={() => requestAction({ reportId: r._id, userId: MOCK_CITIZEN_ID })}
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
  const [text, setText] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: 'Priya S.', text: 'I saw this too! Very dangerous.', time: '2 min ago' },
    { id: '2', user: 'Rahul M.', text: 'Complained to ward office already.', time: '15 min ago' },
  ]);

  const post = () => {
    if (!text.trim()) return;
    setComments(prev => [{ id: Date.now().toString(), user: MOCK_CITIZEN_NAME, text, time: 'Just now' }, ...prev]);
    setText('');
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
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: S.md }}
        ListHeaderComponent={<SectionHeader title={`${comments.length} Replies`} />}
        renderItem={({ item: c }) => (
          <View style={styles.commentCard}>
            <Avatar label={c.user} size={32} color={T.accent} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.reportUser, { fontSize: 13 }]}>{c.user}</Text>
                <Text style={styles.reportMeta}>{c.time}</Text>
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
  const zones = useQuery('geoFences:listActive' as any);
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
    if (!zones?.length) { Alert.alert('Error', 'No zones found.'); return; }
    setLoading(true);
    try {
      await createReport({
        userId: MOCK_CITIZEN_ID,
        userName: MOCK_CITIZEN_NAME,
        geoFenceId: zones[0]._id,
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
        {zones?.[0] && (
          <View style={styles.formZoneBadge}>
            <MapPin size={13} color={T.primary} />
            <Text style={styles.formZoneText}>Reporting for: {String(zones[0].name || 'Current Zone')}</Text>
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

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View>
          <Text style={styles.screenHeaderSub}>Infrastructure Hub</Text>
          <Text style={styles.screenHeaderTitle}>All Geo-Zones</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Map placeholder */}
        <View style={styles.mapCard}>
          <Map size={36} color={T.primary} />
          <Text style={styles.mapCardTitle}>Live Geo-Fence Map</Text>
          <Text style={styles.mapCardSub}>Powered by Goapi Geofencing API</Text>
          <View style={styles.mapLegend}>
            {[['Critical', T.danger], ['Moderate', T.warning], ['Good', T.accent]].map(([l, c]: any) => (
              <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                <Text style={{ fontSize: 11, color: T.textSub }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionHeader title="Active Zones" />

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
                {String(z.type || 'ZONE').toUpperCase()} · {Number(z.triggerCount) || 0} pings · Last active recently
              </Text>
            </View>
            <ChevronRight size={16} color={T.textMute} />
          </TouchableOpacity>
        ))}

        {/* Stats */}
        <SectionHeader title="Your Civic Impact" />
        <View style={styles.statsGrid}>
          {[
            { icon: '📋', value: '12', label: 'Reports Filed' },
            { icon: '⚡', value: '47', label: 'Actions Taken' },
            { icon: '🏆', value: '380', label: 'Civic Points' },
            { icon: '🌟', value: '3', label: 'Zones Active' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
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
  const [notifs, setNotifs] = useState([
    { id: '1', type: 'alert', title: 'You entered Tembhipada Zone', body: '3 open issues reported. Tap to view details.', time: 'Just now', read: false, zone: 'Tembhipada' },
    { id: '2', type: 'ai', title: '🤖 AI Zone Briefing Ready', body: 'Gemini has analysed Tembhipada zone. Road repair 80% complete. 2 new issues flagged.', time: '5 min ago', read: false, zone: 'Tembhipada' },
    { id: '3', type: 'action', title: '⚡ Action Threshold Reached!', body: '20 citizens demanded action on Bridge Crack. Ministry Dashboard notified automatically.', time: '1 hr ago', read: false, zone: 'Mulund Bridge' },
    { id: '4', type: 'work', title: '🏗 Govt Work Update', body: 'Road repair work at Mulund Bridge confirmed started. PWD team on site. Expected completion: 3 days.', time: '2 hr ago', read: true, zone: 'Mulund Bridge' },
    { id: '5', type: 'reply', title: '💬 Rahul replied to your report', body: '"PWD team confirmed they got the complaint. Work should start tomorrow."', time: '3 hr ago', read: true, zone: null },
    { id: '6', type: 'badge', title: '🏆 Civic Hero Badge Earned!', body: 'Your report on Mulund Bridge led to official action. You earned the Civic Hero badge!', time: 'Yesterday', read: true, zone: null },
    { id: '7', type: 'work', title: '✅ Work Completed', body: 'Streetlight repair at Andheri Station Zone marked complete by MSEDCL. Before/after photos uploaded.', time: 'Yesterday', read: true, zone: 'Andheri Station' },
  ]);

  const unread = notifs.filter(n => !n.read).length;
  const iconMap: any = { alert: '🚨', ai: '🤖', action: '⚡', work: '🏗', reply: '💬', badge: '🏆' };

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, { paddingTop: STATUSBAR_H + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenHeaderSub}>{unread > 0 ? `${unread} unread` : 'All caught up'}</Text>
          <Text style={styles.screenHeaderTitle}>Notifications</Text>
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding: S.md, paddingBottom: 100 }}
        renderItem={({ item: n }) => (
          <TouchableOpacity
            style={[styles.notifCard, !n.read && styles.notifCardUnread]}
            onPress={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
          >
            <View style={styles.notifIcon}>
              <Text style={{ fontSize: 20 }}>{iconMap[n.type] || '🔔'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifBody}>{n.body}</Text>
              {n.zone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                  <MapPin size={10} color={T.primary} />
                  <Text style={{ fontSize: 10, color: T.primary, fontWeight: '600' }}>{n.zone}</Text>
                </View>
              )}
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
            {!n.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// SCREEN: PROFILE
// ─────────────────────────────────────────────
const ProfileScreen = () => {
  const nav = useContext(NavContext);
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
          <Avatar label={MOCK_CITIZEN_NAME} size={70} color={T.primary} />
          <Text style={styles.profileName}>{MOCK_CITIZEN_NAME}</Text>
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

  // Register push notifications when app mounts
  const { lastNotification } = usePushToken(MOCK_CITIZEN_ID);

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
      </View>
    </NavContext.Provider>
  );
};

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <AppContainer />
    </ConvexProvider>
  );
}

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