'use client';

import { motion } from 'framer-motion';
import { MapPin, Cpu, Bell, CheckCircle } from 'lucide-react';

const steps = [
    {
        icon: <MapPin size={24} />,
        title: 'Citizen Enters Geo-Fence',
        description: 'Mobile device GPS detects entry into a virtual boundary around a government infrastructure site.',
        color: 'var(--accent-cyan)',
        glow: 'var(--accent-cyan-glow)',
    },
    {
        icon: <Cpu size={24} />,
        title: 'AI Generates Context',
        description: 'Convex triggers a Gemini AI action that queries the Neo4j knowledge graph for voter-specific project data.',
        color: 'var(--accent-purple)',
        glow: 'var(--accent-purple-glow)',
    },
    {
        icon: <Bell size={24} />,
        title: 'Personalized Delivery',
        description: 'A multilingual governance update is pushed in real-time, explaining the project impact for that citizen.',
        color: 'var(--accent-blue)',
        glow: 'var(--accent-blue-glow)',
    },
    {
        icon: <CheckCircle size={24} />,
        title: 'Blockchain Logged',
        description: 'The delivery event is immutably recorded on Polygon blockchain for transparency and audit compliance.',
        color: 'var(--accent-green)',
        glow: 'var(--accent-green-glow)',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="section">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-label"
                    style={{ margin: '0 auto 16px' }}
                >
                    🔄 Workflow
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="section-title"
                >
                    How <span className="gradient-text">GeoFenceAI</span> Works
                </motion.h2>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                maxWidth: '700px',
                margin: '0 auto',
                position: 'relative',
            }}>
                {/* Connecting line */}
                <div style={{
                    position: 'absolute',
                    left: '32px',
                    top: '40px',
                    bottom: '40px',
                    width: '2px',
                    background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-purple), var(--accent-blue), var(--accent-green))',
                    opacity: 0.3,
                }} />

                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2, duration: 0.5 }}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '24px',
                            padding: '28px 0',
                            position: 'relative',
                        }}
                    >
                        {/* Step circle */}
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: step.glow,
                            border: `1px solid ${step.color}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: step.color,
                            flexShrink: 0,
                            position: 'relative',
                            zIndex: 2,
                        }}>
                            {step.icon}
                        </div>

                        <div>
                            <div style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: step.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '6px',
                            }}>
                                Step {index + 1}
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.15rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '8px',
                            }}>
                                {step.title}
                            </h3>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                lineHeight: '1.7',
                            }}>
                                {step.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
