'use client';

import { motion } from 'framer-motion';

const layers = [
    {
        name: 'The Pulse',
        subtitle: 'Frontend Layer',
        tech: ['Next.js 15', 'Three.js', 'React', 'Framer Motion'],
        color: 'var(--accent-cyan)',
        bg: 'var(--accent-cyan-glow)',
    },
    {
        name: 'The Synapse',
        subtitle: 'Backend Layer',
        tech: ['Convex', 'Clerk Auth', 'Gemini AI', 'Serverless Functions'],
        color: 'var(--accent-blue)',
        bg: 'var(--accent-blue-glow)',
    },
    {
        name: 'The Memory',
        subtitle: 'Data Layer',
        tech: ['Neo4j Graph DB', 'Convex Tables', 'Knowledge Graph', 'Voter Profiling'],
        color: 'var(--accent-purple)',
        bg: 'var(--accent-purple-glow)',
    },
    {
        name: 'The Lock',
        subtitle: 'Integrity Layer',
        tech: ['Polygon Blockchain', 'Smart Contracts', 'Audit Trail', 'ZK Proofs'],
        color: 'var(--accent-green)',
        bg: 'var(--accent-green-glow)',
    },
];

export default function ArchitectureSection() {
    return (
        <section id="architecture" className="section">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-label"
                    style={{ margin: '0 auto 16px' }}
                >
                    🏗️ System Design
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="section-title"
                >
                    Four-Layer <span className="gradient-text">Architecture</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="section-description"
                    style={{ margin: '0 auto' }}
                >
                    A reactive real-time architecture where each layer has a clear responsibility
                    and communicates through well-defined interfaces.
                </motion.p>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxWidth: '900px',
                margin: '0 auto',
            }}>
                {layers.map((layer, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.5 }}
                        className="glass-card"
                        style={{
                            padding: '28px 32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px',
                            borderLeft: `3px solid ${layer.color}`,
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: layer.color,
                                }}>
                                    {layer.name}
                                </h3>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontWeight: 500,
                                }}>
                                    — {layer.subtitle}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {layer.tech.map((tech) => (
                                <span key={tech} style={{
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    background: layer.bg,
                                    color: layer.color,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    border: `1px solid ${layer.color}22`,
                                }}>
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
