'use client';

import { motion } from 'framer-motion';
import {
    MapPin, Bell, Building2, TrendingUp, Activity,
    CheckCircle, Clock, AlertTriangle, ArrowUpRight, Database, CloudDownload
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardOverview() {
    // Fetch live data from Convex
    const overviewData = useQuery(api.analytics.getOverview);
    const recentEvents = useQuery(api.analytics.getRecentEvents);
    const projects = useQuery(api.projects.list);
    const seedDatabase = useMutation(api.seed.seedDatabase);

    // @ts-ignore
    const syncToGraph = useAction(api.neo4j?.syncToGraph || (() => { }));
    // @ts-ignore
    const syncOgd = useAction(api.ogd?.syncProjects || (() => { }));

    const [isSeeding, setIsSeeding] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSyncingOgd, setIsSyncingOgd] = useState(false);

    const handleSyncOgd = async () => {
        setIsSyncingOgd(true);
        try {
            const message = await syncOgd();
            alert(message);
        } catch (error) {
            console.error(error);
            alert("Failed to fetch OGD data. See console logs.");
        } finally {
            setIsSyncingOgd(false);
        }
    };

    const handleSyncNeo4j = async () => {
        setIsSyncing(true);
        try {
            await syncToGraph();
            alert("Database successfully synced to Neo4j AuraDB!");
        } catch (error) {
            console.error(error);
            alert("Failed to sync to Neo4j. Check the console and your API keys.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedDatabase();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSeeding(false);
        }
    };

    // If data is loading
    if (overviewData === undefined || projects === undefined) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <div className="pulse-dot" style={{ width: 16, height: 16, background: 'var(--accent-cyan)' }} />
                <span style={{ marginLeft: 12 }}>Loading Live Data...</span>
            </div>
        );
    }

    const overviewStats = [
        {
            label: 'Active Geo-Fences',
            value: overviewData.activeGeoFences.toString(),
            change: '+2 this week',
            icon: MapPin,
            color: 'var(--accent-cyan)',
            glow: 'var(--accent-cyan-glow)',
        },
        {
            label: 'Notifications Sent',
            value: overviewData.notificationsSent.toString(),
            change: '+3 today',
            icon: Bell,
            color: 'var(--accent-purple)',
            glow: 'var(--accent-purple-glow)',
        },
        {
            label: 'Active Booths',
            value: overviewData.totalBooths.toString(),
            change: `${overviewData.totalVoters.toLocaleString()} voters`,
            icon: Building2,
            color: 'var(--accent-blue)',
            glow: 'var(--accent-blue-glow)',
        },
        {
            label: 'Total Triggers',
            value: overviewData.geofenceEnters.toString(),
            change: '+12% growth',
            icon: TrendingUp,
            color: 'var(--accent-green)',
            glow: 'var(--accent-green-glow)',
        },
    ];

    const activeProjects = projects.slice(0, 4);

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Header / Seed Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleSyncOgd}
                    disabled={isSyncingOgd}
                    style={{
                        padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600,
                        background: isSyncingOgd ? 'var(--glass)' : 'var(--accent-green-glow)',
                        color: isSyncingOgd ? 'var(--text-muted)' : 'var(--accent-green)',
                        border: '1px solid var(--glass-border)',
                        cursor: isSyncingOgd ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <CloudDownload size={16} />
                    {isSyncingOgd ? "Fetching OGD..." : "Sync OGD Projects"}
                </button>

                <button
                    onClick={handleSyncNeo4j}
                    disabled={isSyncing || overviewData.totalProjects === 0}
                    style={{
                        padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600,
                        background: isSyncing || overviewData.totalProjects === 0 ? 'var(--glass)' : 'var(--accent-cyan-glow)',
                        color: isSyncing || overviewData.totalProjects === 0 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                        border: '1px solid var(--glass-border)',
                        cursor: isSyncing || overviewData.totalProjects === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Database size={16} />
                    {isSyncing ? "Syncing..." : "Sync Space to Neo4j"}
                </button>

                <button
                    onClick={handleSeed}
                    disabled={isSeeding || overviewData.totalProjects > 0}
                    style={{
                        padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600,
                        background: (isSeeding || overviewData.totalProjects > 0) ? 'var(--glass)' : 'var(--accent-purple-glow)',
                        color: (isSeeding || overviewData.totalProjects > 0) ? 'var(--text-muted)' : 'var(--accent-purple)',
                        border: '1px solid var(--glass-border)',
                        cursor: (isSeeding || overviewData.totalProjects > 0) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Database size={16} />
                    {overviewData.totalProjects > 0 ? "Database Seeded" : (isSeeding ? "Seeding..." : "Seed Mock Data")}
                </button>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
            }}>
                {overviewStats.map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: stat.glow,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color,
                            }}>
                                <stat.icon size={22} />
                            </div>
                            <ArrowUpRight size={16} style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: '4px' }}>
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Recent Activity */}
                <motion.div variants={itemVariants} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600 }}>
                            Recent Analytical Events
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest from Convex</span>
                    </div>

                    {recentEvents === undefined ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading events...</div>
                    ) : recentEvents.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent events found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentEvents.slice(0, 5).map((item, i) => {
                                let Icon = Activity;
                                let color = 'var(--text-secondary)';

                                if (item.eventType === 'geofence_enter') { Icon = MapPin; color = 'var(--accent-cyan)'; }
                                else if (item.eventType === 'notification_sent') { Icon = Bell; color = 'var(--accent-purple)'; }
                                else if (item.eventType === 'notification_read') { Icon = CheckCircle; color = 'var(--accent-green)'; }

                                return (
                                    <div key={i} style={{
                                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                                        paddingBottom: i < 4 ? '16px' : 0,
                                        borderBottom: i < 4 ? '1px solid var(--glass-border)' : 'none',
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: `${color}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: color, flexShrink: 0,
                                        }}>
                                            <Icon size={16} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, textTransform: 'capitalize' }}>
                                                {item.eventType.replace('_', ' ')}
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Infrastructure Projects */}
                <motion.div variants={itemVariants} className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600 }}>
                            Infrastructure Projects
                        </h3>
                        <Link href="/dashboard/geofences" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                            View All →
                        </Link>
                    </div>

                    {activeProjects.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No projects found. Seed the database first.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {activeProjects.map((project, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    paddingBottom: i < activeProjects.length - 1 ? '16px' : 0,
                                    borderBottom: i < activeProjects.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px' }}>{project.name}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{project.type}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={`badge ${project.status === 'completed' ? 'badge-active' :
                                            project.status === 'in_progress' ? 'badge-pending' : 'badge-inactive'
                                            }`}>
                                            {project.status === 'completed' ? '✓ Done' :
                                                project.status === 'in_progress' ? 'In Progress' : 'Planned'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
