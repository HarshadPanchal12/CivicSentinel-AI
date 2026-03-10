'use client';

import { motion } from 'framer-motion';
import { Building2, Users, MapPin, TrendingUp } from 'lucide-react';

const booths = [
    {
        id: 1, boothNumber: 'BT-0012', name: 'Tembhipada Ward Office',
        constituency: 'Mumbai South', totalVoters: 8450, activeVoters: 3200,
        projects: 1, lat: 19.0176, lng: 72.8562,
    },
    {
        id: 2, boothNumber: 'BT-0045', name: 'Dadar Community Hall',
        constituency: 'Mumbai Central', totalVoters: 12300, activeVoters: 5100,
        projects: 1, lat: 19.0178, lng: 72.8478,
    },
    {
        id: 3, boothNumber: 'BT-0089', name: 'Andheri Public School',
        constituency: 'Mumbai North', totalVoters: 9800, activeVoters: 4300,
        projects: 1, lat: 19.1197, lng: 72.8464,
    },
    {
        id: 4, boothNumber: 'BT-0123', name: 'Bandra Library Hall',
        constituency: 'Mumbai West', totalVoters: 6750, activeVoters: 2800,
        projects: 1, lat: 19.0596, lng: 72.8295,
    },
];

export default function BoothsPage() {
    const totalVoters = booths.reduce((s, b) => s + b.totalVoters, 0);
    const activeVoters = booths.reduce((s, b) => s + b.activeVoters, 0);

    return (
        <div>
            {/* Summary stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px', marginBottom: '28px',
            }}>
                {[
                    { label: 'Total Booths', value: booths.length, icon: Building2, color: 'var(--accent-cyan)' },
                    { label: 'Total Voters', value: totalVoters.toLocaleString(), icon: Users, color: 'var(--accent-blue)' },
                    { label: 'Active Voters', value: activeVoters.toLocaleString(), icon: TrendingUp, color: 'var(--accent-green)' },
                    { label: 'Constituencies', value: '4', icon: MapPin, color: 'var(--accent-purple)' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: `${stat.color}15`, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: stat.color,
                            }}>
                                <stat.icon size={20} />
                            </div>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                        <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Booth cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {booths.map((booth, i) => (
                    <motion.div
                        key={booth.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="glass-card"
                        style={{ padding: '24px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)',
                                    background: 'var(--accent-cyan-glow)', padding: '2px 10px',
                                    borderRadius: '100px', border: '1px solid rgba(0,212,255,0.2)',
                                }}>
                                    {booth.boothNumber}
                                </span>
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, marginTop: '8px' }}>
                                    {booth.name}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{booth.constituency}</p>
                            </div>
                            <div className="badge badge-active">Active</div>
                        </div>

                        {/* Voter bar */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voter Engagement</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-green)' }}>
                                    {Math.round((booth.activeVoters / booth.totalVoters) * 100)}%
                                </span>
                            </div>
                            <div style={{
                                width: '100%', height: '6px', borderRadius: '3px',
                                background: 'var(--glass-border)', overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${(booth.activeVoters / booth.totalVoters) * 100}%`,
                                    height: '100%', borderRadius: '3px',
                                    background: 'var(--gradient-primary)',
                                    transition: 'width 0.8s ease',
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--glass)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total Voters</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{booth.totalVoters.toLocaleString()}</div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--glass)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Active</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)' }}>{booth.activeVoters.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--glass)', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.8rem', color: 'var(--text-secondary)',
                        }}>
                            <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} />
                            {booth.lat.toFixed(4)}, {booth.lng.toFixed(4)} · {booth.projects} linked project(s)
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
