'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
    value: number;
    suffix: string;
    label: string;
    color: string;
}

const stats: StatItem[] = [
    { value: 2500, suffix: '+', label: 'Active Geo-Fences', color: 'var(--accent-cyan)' },
    { value: 15, suffix: 'M+', label: 'Citizens Reached', color: 'var(--accent-blue)' },
    { value: 850, suffix: '+', label: 'Infrastructure Projects', color: 'var(--accent-purple)' },
    { value: 99.9, suffix: '%', label: 'Uptime Guarantee', color: 'var(--accent-green)' },
];

function AnimatedNumber({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCurrent(value);
                clearInterval(timer);
            } else {
                setCurrent(Math.floor(start * 10) / 10);
            }
        }, 16);
        return () => clearInterval(timer);
    }, [inView, value]);

    return (
        <span>
            {value % 1 === 0 ? Math.floor(current).toLocaleString() : current.toFixed(1)}
            {suffix}
        </span>
    );
}

export default function StatsCounter() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });

    return (
        <section id="stats" ref={ref} style={{
            padding: '80px 24px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.02) 50%, transparent 100%)',
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '32px',
            }}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: i * 0.15, duration: 0.5 }}
                        style={{
                            textAlign: 'center',
                            padding: '32px 20px',
                        }}
                    >
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 800,
                            color: stat.color,
                            marginBottom: '8px',
                            lineHeight: 1,
                        }}>
                            <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={inView} />
                        </div>
                        <div style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                        }}>
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
