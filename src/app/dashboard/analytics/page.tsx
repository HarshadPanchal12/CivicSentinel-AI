'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, MapPin, Bell, Users, Activity } from 'lucide-react';

// Simulated chart data
const weeklyData = [
    { day: 'Mon', triggers: 320, notifications: 180 },
    { day: 'Tue', triggers: 450, notifications: 290 },
    { day: 'Wed', triggers: 280, notifications: 150 },
    { day: 'Thu', triggers: 590, notifications: 420 },
    { day: 'Fri', triggers: 680, notifications: 510 },
    { day: 'Sat', triggers: 420, notifications: 300 },
    { day: 'Sun', triggers: 350, notifications: 210 },
];

const maxTrigger = Math.max(...weeklyData.map(d => d.triggers));

const zoneActivity = [
    { name: 'Western Express Highway', triggers: 8912, percentage: 45 },
    { name: 'Andheri Metro Extension', triggers: 5621, percentage: 29 },
    { name: 'Mahim-Dadar Bridge', triggers: 3892, percentage: 20 },
    { name: 'Tembhipada Health Center', triggers: 1247, percentage: 6 },
];

export default function AnalyticsPage() {
    return (
        <div>
            {/* Top stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px', marginBottom: '28px',
            }}>
                {[
                    { label: 'Total Triggers', value: '19,672', change: '+12%', icon: Activity, color: 'var(--accent-cyan)' },
                    { label: 'Notifications', value: '5', change: '+3 today', icon: Bell, color: 'var(--accent-purple)' },
                    { label: 'Active Zones', value: '4', change: '1 pending', icon: MapPin, color: 'var(--accent-blue)' },
                    { label: 'Unique Citizens', value: '15.3K', change: '+8%', icon: Users, color: 'var(--accent-green)' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }} className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: `${stat.color}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: stat.color,
                            }}>
                                <stat.icon size={18} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600 }}>{stat.change}</span>
                        </div>
                        <div className="stat-value" style={{ color: stat.color, fontSize: '1.5rem' }}>{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Bar chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>
                            Weekly Geo-Fence Triggers
                        </h3>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-cyan)' }} /> Triggers
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-purple)' }} /> Notifications
                            </span>
                        </div>
                    </div>

                    {/* CSS bar chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingBottom: '30px', position: 'relative' }}>
                        {/* Y-axis labels */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: '30px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            fontSize: '0.7rem', color: 'var(--text-muted)', width: '35px',
                        }}>
                            <span>{maxTrigger}</span>
                            <span>{Math.round(maxTrigger / 2)}</span>
                            <span>0</span>
                        </div>

                        {/* Bars */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flex: 1, marginLeft: '40px', height: '100%' }}>
                            {weeklyData.map((d, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100%' }}>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(d.triggers / maxTrigger) * 100}%` }}
                                            transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                                            style={{
                                                width: '16px', borderRadius: '4px 4px 0 0',
                                                background: 'var(--gradient-primary)', minHeight: '4px',
                                            }}
                                        />
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(d.notifications / maxTrigger) * 100}%` }}
                                            transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                                            style={{
                                                width: '16px', borderRadius: '4px 4px 0 0',
                                                background: 'var(--accent-purple)', minHeight: '4px', opacity: 0.7,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Zone activity breakdown */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>
                        Zone Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {zoneActivity.map((zone, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{zone.name}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                                        {zone.triggers.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%', height: '6px', borderRadius: '3px',
                                    background: 'var(--glass-border)', overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${zone.percentage}%` }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                                        style={{
                                            height: '100%', borderRadius: '3px',
                                            background: 'var(--gradient-primary)',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Engagement metrics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }} className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>
                    Engagement Metrics
                </h3>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                }}>
                    {[
                        { label: 'Avg. Dwell Time', value: '4.2 min', desc: 'Time spent in geo-fence zones' },
                        { label: 'Read Rate', value: '67%', desc: 'Notifications opened by citizens' },
                        { label: 'Return Visits', value: '23%', desc: 'Citizens re-entering zones' },
                        { label: 'Coverage', value: '37.3K', desc: 'Total citizens in booth areas' },
                    ].map((metric, i) => (
                        <div key={i} style={{
                            padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--glass)',
                            border: '1px solid var(--glass-border)',
                        }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                                {metric.value}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px' }}>{metric.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metric.desc}</div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
