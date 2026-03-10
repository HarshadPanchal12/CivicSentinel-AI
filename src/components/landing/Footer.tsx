'use client';

import { MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--glass-border)',
            padding: '60px 24px 32px',
            background: 'var(--bg-secondary)',
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '40px',
                marginBottom: '48px',
            }}>
                {/* Brand */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MapPin size={18} color="white" />
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700,
                        }}>
                            GeoFence<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.7', maxWidth: '280px' }}>
                        AI-Driven Hyper-Local Targeting Engine for transparent, context-aware civic governance.
                    </p>
                </div>

                {/* Product */}
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Product</h4>
                    {['Geo-Fencing Engine', 'AI Notifications', 'Knowledge Graph', 'Command Center'].map((item) => (
                        <a key={item} href="#" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {item}
                        </a>
                    ))}
                </div>

                {/* Tech */}
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Technology</h4>
                    {['Next.js 15', 'Convex Backend', 'Neo4j Graph DB', 'Polygon Blockchain'].map((item) => (
                        <a key={item} href="#" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            {item}
                        </a>
                    ))}
                </div>

                {/* Connect */}
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Connect</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {[Github, Twitter, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.2s',
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                                <Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="glow-line" style={{ marginBottom: '24px' }} />
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '12px',
            }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    © 2026 GeoFenceAI. Built for transparent governance.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Powered by Next.js · Convex · Gemini · Neo4j · Polygon
                </p>
            </div>
        </footer>
    );
}
