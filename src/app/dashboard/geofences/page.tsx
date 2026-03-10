'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin, Plus, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// Dynamically import InteractiveMap to avoid SSR issues with window/leaflet
const InteractiveMap = dynamic(() => import('@/components/dashboard/InteractiveMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pulse-dot" style={{ width: 24, height: 24, background: 'var(--accent-cyan)' }} />
        </div>
    )
});

export default function GeoFencesPage() {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch live geofences from Convex
    const liveGeoFences = useQuery(api.geoFences.list) || [];

    const filtered = liveGeoFences.filter((gf) => {
        const matchesSearch = gf.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === 'all' || gf.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div>
            {/* Toolbar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)', border: '1px solid var(--glass-border)',
                    }}>
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search geo-fences..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                background: 'none', border: 'none', outline: 'none',
                                color: 'var(--text-primary)', fontSize: '0.85rem', width: '200px',
                            }}
                        />
                    </div>

                    {/* Filter */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: 'var(--radius-md)',
                        background: 'var(--surface)', border: '1px solid var(--glass-border)',
                    }}>
                        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                background: 'none', border: 'none', outline: 'none',
                                color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
                    <Plus size={16} /> Create Geo-Fence
                </button>
            </div>

            {/* Live Interactive Map */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{
                    height: '350px',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <InteractiveMap geoFences={filtered} />
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card"
                style={{ overflow: 'hidden' }}
            >
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Radius</th>
                            <th>Triggers</th>
                            <th>Linked Project ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                    No live geo-fences found. Please seed the mock data on the Overview page.
                                </td>
                            </tr>
                        )}
                        {filtered.map((gf) => (
                            <tr key={gf._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={14} style={{ color: gf.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{gf.name}</span>
                                    </div>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{gf.type}</td>
                                <td>
                                    <span className={`badge ${gf.status === 'active' ? 'badge-active' : gf.status === 'pending' ? 'badge-pending' : 'badge-inactive'}`}>
                                        {gf.status}
                                    </span>
                                </td>
                                <td>{gf.radius >= 1000 ? `${gf.radius / 1000}km` : `${gf.radius}m`}</td>
                                <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{(gf.triggerCount || 0).toLocaleString()}</td>
                                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{gf.linkedProjectId?.slice(-6) || 'N/A'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                                            <Eye size={16} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </div>
    );
}
