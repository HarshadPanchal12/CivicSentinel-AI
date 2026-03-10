'use client';

import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

export default function InteractiveMap({ geoFences }: { geoFences: any[] }) {
    const [mounted, setMounted] = useState(false);
    const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

    useEffect(() => {
        setMounted(true);
        // Fix leaflet marker icon issues in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
    }, []);

    if (!mounted) return <div style={{ height: '300px', background: 'var(--surface)' }} />;

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}>
            <MapContainer
                center={[19.0760, 72.8777]} // Mumbai Center
                zoom={11}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
            >
                <TileLayer
                    url={`https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`}
                    attribution='&copy; Geoapify & OSM'
                />

                {geoFences.filter(gf => gf.status === 'active' || gf.status === 'pending').map((gf) => (
                    <Circle
                        key={gf._id || gf.id}
                        center={[gf.center.lat, gf.center.lng]}
                        radius={gf.radius}
                        pathOptions={{
                            color: gf.status === 'active' ? '#00d4ff' : '#f97316',
                            fillColor: gf.status === 'active' ? '#00d4ff' : '#f97316',
                            fillOpacity: 0.2,
                            weight: 2
                        }}
                    >
                        <Popup>
                            <div style={{ color: '#333' }}>
                                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>{gf.name}</strong>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{gf.type} • {gf.radius}m radius</span>
                                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>Triggers: <strong>{gf.triggerCount || gf.triggers || 0}</strong></p>
                            </div>
                        </Popup>
                    </Circle>
                ))}
            </MapContainer>
        </div>
    );
}
