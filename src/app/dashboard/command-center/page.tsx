'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Box, MapPin, Zap, Eye } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

const CommandCenterScene = dynamic(() => import('@/components/dashboard/CommandCenterScene'), { ssr: false });

export default function CommandCenterPage() {
    const geoFences = useQuery(api.geoFences.list) || [];

    // Sort by newest addition to highlight live syncing
    const activeZones = [...geoFences].sort((a, b) => b._creationTime - a._creationTime);

    // Calculate global stats for the overlay
    const totalTriggers = geoFences.reduce((acc, f) => acc + (f.triggerCount || 0), 0);
    const activeCount = geoFences.filter(f => f.status === 'active').length;

    return (
        <div>
            {/* Header info */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '20px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'var(--accent-purple-glow)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)',
                    }}>
                        <Box size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>3D Geo-Fence Visualization</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Real-time Three.js terrain with active zones and voter density
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['Terrain', 'Heatmap', 'Zones'].map((btn) => (
                        <button key={btn} style={{
                            padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                            background: btn === 'Zones' ? 'var(--accent-cyan-glow)' : 'var(--glass)',
                            color: btn === 'Zones' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            border: `1px solid ${btn === 'Zones' ? 'rgba(0,212,255,0.3)' : 'var(--glass-border)'}`,
                            cursor: 'pointer', fontWeight: 600,
                        }}>
                            {btn}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3D Scene */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{
                    height: '500px',
                    marginBottom: '20px',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <CommandCenterScene />

                {/* Overlay stats */}
                <div style={{
                    position: 'absolute', top: '16px', left: '16px',
                    display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10,
                }}>
                    {[
                        { icon: MapPin, label: `${activeCount} Active Zones`, color: 'var(--accent-cyan)' },
                        { icon: Zap, label: `${(totalTriggers / 1000).toFixed(1)}K Triggers`, color: 'var(--accent-orange)' },
                        { icon: Eye, label: 'Live Monitoring', color: 'var(--accent-green)' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(8, 11, 20, 0.8)', backdropFilter: 'blur(10px)',
                            border: '1px solid var(--glass-border)', fontSize: '0.75rem',
                        }}>
                            <item.icon size={14} style={{ color: item.color }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Zone details */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
            }}>
                {activeZones.map((zone, i) => {
                    const statusColor = zone.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)';
                    return (
                        <motion.div key={zone._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }} className="glass-card"
                            style={{ padding: '20px', borderLeft: `3px solid ${statusColor}` }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.name}</h4>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>Radius: {zone.radius >= 1000 ? `${zone.radius / 1000}km` : `${zone.radius}m`}</span>
                                <span>·</span>
                                <span style={{ color: statusColor, fontWeight: 600 }}>{(zone.triggerCount || 0).toLocaleString()} triggers</span>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <span style={{
                                    fontSize: '0.7rem', padding: '2px 10px', borderRadius: '100px',
                                    background: `${statusColor}15`, color: statusColor, fontWeight: 600, textTransform: 'capitalize'
                                }}>
                                    {zone.status}
                                </span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
