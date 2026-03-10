'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import FeatureCards from '@/components/landing/FeatureCards';
import StatsCounter from '@/components/landing/StatsCounter';
import HowItWorks from '@/components/landing/HowItWorks';
import ArchitectureSection from '@/components/landing/ArchitectureSection';
import Footer from '@/components/landing/Footer';

// Dynamic import for Three.js (client-only, no SSR)
const Globe = dynamic(() => import('@/components/landing/Globe'), { ssr: false });

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '700px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Three.js Globe */}
        <Globe />

        {/* Hero Content Overlay */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '800px',
          padding: '0 24px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="section-label"
            style={{ margin: '0 auto 20px' }}
          >
            <Sparkles size={14} /> Hyper-Local Targeting Engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '24px',
            }}
          >
            Governance That{' '}
            <span className="gradient-text">Finds You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            AI-powered geo-fencing delivers personalized civic updates
            when citizens are near government infrastructure. Real-time.
            Transparent. Location-aware.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/dashboard" className="btn-primary">
              Launch Dashboard <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary">
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(transparent, var(--bg-primary))',
          pointerEvents: 'none',
        }} />
      </section>

      {/* Glow divider */}
      <div className="glow-line" />

      {/* ==================== FEATURE CARDS ==================== */}
      <FeatureCards />

      {/* ==================== STATS ==================== */}
      <StatsCounter />

      {/* Glow divider */}
      <div className="glow-line" />

      {/* ==================== HOW IT WORKS ==================== */}
      <HowItWorks />

      {/* ==================== ARCHITECTURE ==================== */}
      <ArchitectureSection />

      {/* ==================== CTA SECTION ==================== */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(0, 212, 255, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            marginBottom: '20px',
          }}>
            Ready to Transform <span className="gradient-text">Civic Governance</span>?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            maxWidth: '500px',
            margin: '0 auto 36px',
          }}>
            Deploy the engine that brings government transparency to every citizen&apos;s doorstep.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 36px' }}>
            Get Started Now <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </>
  );
}
