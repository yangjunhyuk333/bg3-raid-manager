import React from 'react';
import { Home, MessageSquare, Calendar, FolderOpen, Users, Settings } from 'lucide-react';
import logo from '../../assets/logo.png';

const Sidebar = ({ activeTab, setActiveTab, isMobile, user }) => {
    // Mock Online Users (Camp Users)
    const onlineUsersCount = 42;
    const isAdmin = user?.role === 'admin' || user?.nickname === 'GM'; // Simple generic check for now

    const menuItems = [
        { id: 'home', label: '홈', icon: Home },
        { id: 'chat', label: '채팅', icon: MessageSquare },
        { id: 'calendar', label: '일정', icon: Calendar },
        { id: 'save', label: '세이브', icon: FolderOpen },
        { id: 'profile', label: '프로필', icon: Users },
    ];

    if (isAdmin) {
        menuItems.push({ id: 'admin', label: '야영지 관리', icon: Settings });
    }

    if (isMobile) {
        return (
            <>
                {/* Mobile Top Header */}
                <div className="glass" style={{
                    position: 'fixed', top: 0, left: 0, right: 0,
                    height: '60px', padding: '0 20px', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'white' }}>Baldur's Gate 3</h2>
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="glass" style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '70px', zIndex: 1000,
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                    borderRadius: 0, borderTop: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.8)'
                }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    color: isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                                    padding: '5px', flex: 1
                                }}
                            >
                                <Icon size={20} />
                                <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </>
        );
    }

    // Desktop Sidebar
    return (
        <aside className="glass" style={{
            width: '250px', height: 'calc(100vh - 40px)',
            margin: '20px', padding: '20px',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Logo Area */}
            <div style={{ padding: '0 0 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Assuming logo exists, if not just text */}
                <img src={logo} alt="BG3" style={{ width: '80%', height: 'auto', marginBottom: '10px', mixBlendMode: 'screen' }} onError={(e) => e.target.style.display = 'none'} />
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px' }}>원정대 관리자</h2>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
                    fontSize: '0.7rem'
                }}>
                    <Users size={12} />
                    <span>{onlineUsersCount}명 야영지 대기 중</span>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: 'white', borderRadius: '8px', transition: 'all 0.3s',
                                border: 'none', cursor: 'pointer', fontSize: '0.95rem'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.target.style.background = activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent'}
                        >
                            <Icon size={20} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
