'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, MapPin, Bell, Building2, BarChart3,
    Box, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Geo-Fences', href: '/dashboard/geofences', icon: MapPin },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { label: 'Booths', href: '/dashboard/booths', icon: Building2 },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Command Center', href: '/dashboard/command-center', icon: Box },
    { label: 'Transparency', href: '/dashboard/transparency', icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside style={{
                width: collapsed ? '72px' : '260px',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--glass-border)',
                padding: collapsed ? '24px 10px' : '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                transition: 'width 0.3s ease, padding 0.3s ease',
                overflow: 'hidden',
            }}>
                {/* Logo */}
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    marginBottom: '32px',
                    whiteSpace: 'nowrap',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <MapPin size={20} color="white" />
                    </div>
                    {!collapsed && (
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}>
                            GeoFence<span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                        </span>
                    )}
                </Link>

                {/* Navigation */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: collapsed ? '10px' : '10px 14px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 600 : 500,
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    background: isActive ? 'var(--accent-cyan-glow)' : 'transparent',
                                    borderLeft: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <item.icon size={20} style={{ flexShrink: 0 }} />
                                {!collapsed && item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px',
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginTop: '8px',
                        transition: 'all 0.2s',
                    }}
                >
                    {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
                </button>

            </aside>

            {/* Main content */}
            <main style={{
                marginLeft: collapsed ? '72px' : '260px',
                flex: 1,
                padding: '28px',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--glass-border)',
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                        }}>
                            {navItems.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                            Hyper-Local Targeting Engine — Control Panel
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Live indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '100px',
                            background: 'var(--accent-green-glow)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}>
                            <div className="pulse-dot" />
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                                Live
                            </span>
                        </div>

                        {/* Clerk User Button */}
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 38, height: 38 } } }} />
                        </div>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
