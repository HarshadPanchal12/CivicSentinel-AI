'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, ExternalLink, Hash, FileText } from 'lucide-react';

const auditEntries = [
    {
        id: 1,
        action: 'NOTIFICATION_SENT',
        entityType: 'Notification',
        details: 'Governance update delivered to 1,247 citizens near Tembhipada Health Center',
        txHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
        verified: true,
        timestamp: '2026-03-04 14:30:22',
    },
    {
        id: 2,
        action: 'GEOFENCE_CREATED',
        entityType: 'GeoFence',
        details: 'New geo-fence created: Western Express Highway Upgrade (2km radius)',
        txHash: null,
        verified: false,
        timestamp: '2026-03-03 09:15:45',
    },
    {
        id: 3,
        action: 'PROJECT_UPDATE',
        entityType: 'Project',
        details: 'Mahim-Dadar Flyover progress updated to 65% completion',
        txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        verified: true,
        timestamp: '2026-03-02 18:42:10',
    },
    {
        id: 4,
        action: 'NOTIFICATION_SENT',
        entityType: 'Notification',
        details: 'Proximity alert sent to 3,892 citizens near Mahim-Dadar Bridge construction zone',
        txHash: '0xaabb11223344556677889900aabbccddeeff0011',
        verified: true,
        timestamp: '2026-03-01 11:20:35',
    },
    {
        id: 5,
        action: 'BOOTH_UPDATE',
        entityType: 'Booth',
        details: 'Andheri Public School booth voter data refreshed — 4,300 active voters',
        txHash: null,
        verified: false,
        timestamp: '2026-02-28 16:55:18',
    },
];

export default function TransparencyPage() {
    const verified = auditEntries.filter(e => e.verified).length;

    return (
        <div>
            {/* Header stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px', marginBottom: '28px',
            }}>
                {[
                    { label: 'Total Entries', value: auditEntries.length, icon: FileText, color: 'var(--accent-cyan)' },
                    { label: 'Blockchain Verified', value: verified, icon: CheckCircle, color: 'var(--accent-green)' },
                    { label: 'Pending Verification', value: auditEntries.length - verified, icon: Clock, color: 'var(--accent-orange)' },
                    { label: 'Network', value: 'Polygon', icon: Shield, color: 'var(--accent-purple)' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }} className="stat-card"
                        style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: `${stat.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: stat.color,
                        }}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: stat.color }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Blockchain info banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }} className="glass-card"
                style={{
                    padding: '20px 24px', marginBottom: '24px',
                    borderLeft: '3px solid var(--accent-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '12px',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={20} style={{ color: 'var(--accent-green)' }} />
                    <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Polygon Blockchain Integration</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            All verified entries are immutably recorded on Polygon PoS for complete transparency
                        </p>
                    </div>
                </div>
                <span className="badge badge-active">
                    <Hash size={12} /> Polygon Mainnet
                </span>
            </motion.div>

            {/* Audit log */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }} className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600 }}>
                        Immutable Audit Trail
                    </h3>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Details</th>
                            <th>Tx Hash</th>
                            <th>Status</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditEntries.map((entry) => (
                            <tr key={entry.id}>
                                <td>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px',
                                        borderRadius: '100px', background: 'var(--accent-cyan-glow)',
                                        color: 'var(--accent-cyan)', border: '1px solid rgba(0,212,255,0.2)',
                                    }}>
                                        {entry.action}
                                    </span>
                                </td>
                                <td>{entry.entityType}</td>
                                <td style={{ maxWidth: '300px', fontSize: '0.8rem' }}>{entry.details}</td>
                                <td>
                                    {entry.txHash ? (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            fontSize: '0.75rem', color: 'var(--accent-blue)', fontFamily: 'monospace',
                                            cursor: 'pointer',
                                        }}>
                                            {entry.txHash.slice(0, 12)}... <ExternalLink size={12} />
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`badge ${entry.verified ? 'badge-active' : 'badge-pending'}`}>
                                        {entry.verified ? '✓ Verified' : 'Pending'}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{entry.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}
