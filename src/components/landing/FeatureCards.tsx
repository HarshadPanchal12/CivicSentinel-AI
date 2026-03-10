'use client';

import { motion } from 'framer-motion';
import { MapPin, Brain, Shield, Bell, BarChart3, Globe2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface Feature {
    icon: ReactNode;
    title: string;
    description: string;
    gradient: string;
    glowColor: string;
}

const features: Feature[] = [
    {
        icon: <MapPin size={28} />,
        title: 'Hyper-Local Geo-Fencing',
        description: 'Create precise polygon boundaries around government sites — hospitals, bridges, schools — and trigger context-aware actions when citizens enter.',
        gradient: 'linear-gradient(135deg, #00d4ff, #0099cc)',
        glowColor: 'rgba(0, 212, 255, 0.15)',
    },
    {
        icon: <Brain size={28} />,
        title: 'AI-Powered Notifications',
        description: 'Gemini AI generates personalized, multilingual governance updates based on voter knowledge graph and real-time location context.',
        gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
        glowColor: 'rgba(168, 85, 247, 0.15)',
    },
    {
        icon: <Globe2 size={28} />,
        title: 'Knowledge Graph Engine',
        description: 'Neo4j-powered knowledge graph maps relationships between voters, households, booths, and infrastructure projects for deep civic intelligence.',
        gradient: 'linear-gradient(135deg, #4f7dff, #3b5fe0)',
        glowColor: 'rgba(79, 125, 255, 0.15)',
    },
    {
        icon: <Shield size={28} />,
        title: 'Blockchain Audit Trail',
        description: 'Every notification and governance update is immutably logged on Polygon blockchain for complete transparency and accountability.',
        gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        glowColor: 'rgba(34, 197, 94, 0.15)',
    },
    {
        icon: <Bell size={28} />,
        title: 'Real-Time Engagement',
        description: 'Convex-powered real-time backend delivers sub-second push notifications and live dashboard updates across all connected devices.',
        gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
        glowColor: 'rgba(249, 115, 22, 0.15)',
    },
    {
        icon: <BarChart3 size={28} />,
        title: '3D Command Center',
        description: 'Three.js-powered 3D visualization for decision-makers with terrain mapping, voter density heatmaps, and live geo-fence activity overlays.',
        gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
        glowColor: 'rgba(236, 72, 153, 0.15)',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
    },
};

export default function FeatureCards() {
    return (
        <section id="features" className="section">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-label"
                    style={{ margin: '0 auto 16px' }}
                >
                    ⚡ Core Capabilities
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="section-title"
                >
                    Powered by <span className="gradient-text">Cutting-Edge Tech</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="section-description"
                    style={{ margin: '0 auto' }}
                >
                    Six interconnected engines working together to deliver transparent,
                    location-aware civic governance at scale.
                </motion.p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '24px',
                }}
            >
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        variants={cardVariants}
                        className="glass-card"
                        style={{
                            padding: '32px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                        }}
                    >
                        {/* Top glow accent */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '20%',
                            right: '20%',
                            height: '1px',
                            background: feature.gradient,
                            opacity: 0.6,
                        }} />

                        {/* Icon */}
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: feature.glowColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: feature.gradient.includes('#00d4ff') ? '#00d4ff' :
                                feature.gradient.includes('#a855f7') ? '#a855f7' :
                                    feature.gradient.includes('#4f7dff') ? '#4f7dff' :
                                        feature.gradient.includes('#22c55e') ? '#22c55e' :
                                            feature.gradient.includes('#f97316') ? '#f97316' : '#ec4899',
                        }}>
                            {feature.icon}
                        </div>

                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--text-primary)',
                        }}>
                            {feature.title}
                        </h3>

                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            lineHeight: '1.7',
                        }}>
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
