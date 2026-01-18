import React from 'react';
import { Home, MessageSquare, Calendar, FolderOpen, Users, Settings, Flag, LogOut } from 'lucide-react';
import logo from '../../assets/logo.svg';

import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Sidebar = ({ activeTab, setActiveTab, isMobile, user }) => {
    // Real-time Camp Users Count
    const [onlineUsersCount, setOnlineUsersCount] = React.useState(0);
    const [maxMembers, setMaxMembers] = React.useState(4);
    const isAdmin = user?.isAdmin === true;

    React.useEffect(() => {
        if (!user?.campId) return;

        const unsubscribe = onSnapshot(doc(db, "camps", user.campId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setOnlineUsersCount(data.members?.length || 0);
            }
        });

        return () => unsubscribe();
    }, [user?.campId]);

    const menuItems = [
        { id: 'home', label: '홈', icon: Home },
        { id: 'chat', label: '채팅', icon: MessageSquare },
        { id: 'calendar', label: '일정', icon: Calendar },
        { id: 'tactics', label: '전술판', icon: Flag },
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

    return (
        <aside className="glass" style={{
            width: '250px', height: 'calc(100vh - 40px)',
            margin: '20px', padding: '20px',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ padding: '0 0 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Temporary DB Reset Button */}
                <button
                    id="db-reset-btn"
                    onClick={async () => {
                        if (confirm("경고: 모든 사용자와 야영지를 초기화하시겠습니까?")) {
                            const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
                            // 1. Delete users_v2
                            const users = await getDocs(collection(db, 'users_v2'));
                            users.forEach(d => deleteDoc(d.ref));
                            // 2. Delete camps
                            const camps = await getDocs(collection(db, 'camps'));
                            camps.forEach(d => deleteDoc(d.ref));

                            alert('초기화 완료. 로컬 스토리지도 삭제합니다.');
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    style={{ background: 'red', color: 'white', border: 'none', padding: '5px', marginBottom: '10px', fontSize: '0.7rem', cursor: 'pointer' }}
                >
                    [ADMIN] DB 초기화
                </button>

                {/* Final User Logo - rendering as-is without blend modes */}
                <img src={logo} alt="BG3" style={{ width: '100%', height: 'auto', marginBottom: '10px' }} onError={(e) => e.target.style.display = 'none'} />

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px',
                    fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Users size={12} color="#4ade80" />
                    <span style={{ color: '#4ade80' }}>{onlineUsersCount}/{maxMembers}명 접속 중</span>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', flex: 1 }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                                color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.7)',
                                borderRadius: '12px', transition: 'all 0.2s',
                                border: 'none', cursor: 'pointer', fontSize: '0.95rem',
                                fontWeight: activeTab === item.id ? 'bold' : 'normal'
                            }}
                        >
                            <Icon size={20} color={activeTab === item.id ? 'var(--accent-color)' : 'currentColor'} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Sidebar Footer: User Profile & Logout */}
            <div style={{
                marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Users size={20} color="white" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.nickname}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{user.className}</div>
                </div>
                <button
                    onClick={() => {
                        // Immediate Logout for UX testing
                        localStorage.removeItem('bg3_user_profile');
                        setUser(null); // Update state directly
                        window.location.reload();
                    }}
                    style={{
                        background: 'rgba(248, 113, 113, 0.15)',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        borderRadius: '8px',
                        padding: '10px 15px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: 'pointer', color: '#f87171', fontWeight: 'bold', fontSize: '0.85rem'
                    }}
                    title="로그아웃"
                >
                    <LogOut size={16} /> 로그아웃
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
