import React from 'react';
import { createPortal } from 'react-dom';
import { Home, MessageSquare, Calendar, FolderOpen, Users, Settings, Flag, LogOut } from 'lucide-react';
import logo from '../../assets/logo.svg';

import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Sidebar = ({ activeTab, setActiveTab, isMobile, user }) => {
    // 1. STATE DECLARATIONS
    const [onlineUsersCount, setOnlineUsersCount] = React.useState(0);
    const [maxMembers, setMaxMembers] = React.useState(4);

    // Profile & Admin UI State
    const [showProfileView, setShowProfileView] = React.useState(false);
    const [showProfileEdit, setShowProfileEdit] = React.useState(false);
    const [showAdminReset, setShowAdminReset] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    // Profile Edit Form State
    const [editName, setEditName] = React.useState(user?.nickname || '');
    const [editClass, setEditClass] = React.useState(user?.className || 'Warrior');
    const [editRole, setEditRole] = React.useState(user?.role || (user?.isAdmin ? 'Admin' : 'User'));

    const isAdmin = user?.isAdmin === true;

    // 2. EFFECTS
    // Real-time Camp Member Count
    React.useEffect(() => {
        if (!user?.campId) return;

        const { query, where, onSnapshot, collection } = require('firebase/firestore');
        const q = query(
            collection(db, "users_v2"),
            where("campId", "==", user.campId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOnlineUsersCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    // Sync profile form data when user prop updates
    React.useEffect(() => {
        if (user) {
            setEditName(user.nickname || '');
            setEditClass(user.className || 'Warrior');
            setEditRole(user.role || (user.isAdmin ? 'Admin' : 'User'));
        }
    }, [user, showProfileEdit]);

    // Admin Toggle Shortcut (Shift + Alt + R)
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.altKey && (e.key === 'R' || e.key === 'r')) {
                setShowAdminReset(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 3. HANDLERS
    const handleLogout = () => {
        // Clear all local data to ensure fresh login
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    const handleProfileUpdate = async () => {
        if (!editName.trim()) return alert("Nickname is required");
        try {
            const { updateDoc, doc } = await import('firebase/firestore');
            const userRef = doc(db, "users_v2", user.id);
            const updates = { nickname: editName, className: editClass, role: editRole };

            await updateDoc(userRef, updates); // Update DB

            // Update Local Storage
            const newUser = { ...user, ...updates };
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));

            alert("프로필이 수정되었습니다. 적용을 위해 새로고침합니다.");
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("수정 실패: " + e.message);
        }
    };

    // 4. MENU ITEMS & ASSETS
    // Using Korean class names to match DB data from ProfileSetup.jsx
    const bg3Classes = [
        "바바리안", "바드", "클레릭", "드루이드", "파이터", "몽크",
        "팔라딘", "레인저", "로그", "소서러", "워락", "위자드"
    ];

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

    // Filter Profile tab from Desktop Menu
    const desktopMenuItems = menuItems.filter(item => item.id !== 'profile');

    // 5. RENDER - MOBILE NAV
    if (isMobile) {
        // Limited items for Mobile Bottom Nav (Max 5)
        const mobileItems = menuItems.slice(0, 4); // Home, Chat, Calendar, Tactics

        return (
            <>
                <nav className="glass" style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '75px', zIndex: 1000,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '16px 16px 0 0', // Rounded top corners
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(25px)', background: 'rgba(10, 10, 20, 0.95)',
                    padding: '0 10px',
                    paddingBottom: 'safe-area-inset-bottom'
                }}>
                    {mobileItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    borderRadius: '12px',
                                    border: 'none',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: '4px',
                                    color: isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                                    height: '55px', flex: 1, margin: '0 2px'
                                }}
                            >
                                <Icon size={isActive ? 26 : 24} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && <span style={{ fontSize: '10px' }}>{item.label}</span>}
                            </button>
                        );
                    })}
                    {/* Profile/More Tab */}
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            borderRadius: '12px',
                            border: 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '4px',
                            color: activeTab === 'profile' ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                            height: '55px', flex: 1, margin: '0 2px'
                        }}
                    >
                        <Users size={activeTab === 'profile' ? 26 : 24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        {activeTab === 'profile' && <span style={{ fontSize: '10px' }}>프로필</span>}
                    </button>
                </nav>
            </>
        );
    }

    // 6. RENDER - DESKTOP SIDEBAR
    return (
        <aside className="glass" style={{
            width: '280px', height: '100vh',
            margin: 0, padding: '25px',
            display: 'flex', flexDirection: 'column',
            borderRadius: 0,
            borderRight: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(20, 20, 30, 0.4)', // Darker reliable background
            position: 'sticky', top: 0
        }}>
            <div style={{ padding: '0 0 25px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Hidden DB Reset Button */}
                {showAdminReset && (
                    <button
                        id="db-reset-btn"
                        onClick={async () => {
                            if (confirm("⚠️ 경고: 정말로 DB를 초기화하시겠습니까? 돌이킬 수 없습니다.")) {
                                const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
                                const users = await getDocs(collection(db, 'users_v2'));
                                users.forEach(d => deleteDoc(d.ref));
                                const camps = await getDocs(collection(db, 'camps'));
                                camps.forEach(d => deleteDoc(d.ref));
                                alert('초기화 완료. 재접속합니다.');
                                handleLogout();
                            }
                        }}
                        style={{ background: 'red', color: 'white', border: 'none', padding: '5px', marginBottom: '10px', fontSize: '0.7rem', cursor: 'pointer', width: '100%' }}
                    >
                        [ADMIN] DB 초기화
                    </button>
                )}

                {/* Final User Logo with Shine Effect */}
                <div className="logo-wrapper" style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
                    <img
                        src={logo}
                        alt="BG3"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    <div
                        className="logo-shine"
                        style={{
                            WebkitMaskImage: `url(${logo})`,
                            maskImage: `url(${logo})`
                        }}
                    />
                </div>

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
                {desktopMenuItems.map((item) => {
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
            <div
                onClick={() => setShowProfileView(true)}
                style={{
                    marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', transition: 'background 0.2s',
                    padding: '10px', borderRadius: '12px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title="프로필 보기"
            >
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
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowLogoutConfirm(true); }}
                    style={{
                        background: 'rgba(248, 113, 113, 0.15)',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#f87171', fontWeight: 'bold'
                    }}
                    title="로그아웃"
                >
                    <LogOut size={16} />
                </button>
            </div>

            {/* 1. Logout Confirmation Modal - Portal to Body */}
            {showLogoutConfirm && createPortal(
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', padding: '30px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '10px', marginTop: '10px' }}>로그아웃</h3>
                        <p style={{ opacity: 0.8, marginBottom: '30px', lineHeight: '1.5' }}>
                            정말 로그아웃 하시겠습니까?<br />
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(모든 로그인 데이터가 삭제됩니다)</span>
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(45deg, #ef4444, #dc2626)', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 2. Profile View Modal - Portal to Body */}
            {showProfileView && createPortal(
                <div className="modal-overlay" onClick={() => setShowProfileView(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px rgba(212, 160, 23, 0.4)' }}>
                            <Users size={40} color="white" />
                        </div>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '5px', fontWeight: 'bold' }}>{user?.nickname || '모험가'}</h3>
                        <p style={{ color: 'var(--accent-color)', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {user?.className || 'Classless'} <span style={{ opacity: 0.5 }}>|</span> {(user?.role === 'Admin' || user?.isAdmin) ? '대장 (관리자)' : '대원'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', textAlign: 'left' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '4px' }}>직업</p>
                                <p style={{ fontWeight: 'bold' }}>{user?.className || '-'}</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '4px' }}>신분</p>
                                <p style={{ fontWeight: 'bold' }}>{(user?.role === 'Admin' || user?.isAdmin) ? '관리자' : '일반 대원'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowProfileView(false);
                                setShowProfileEdit(true);
                            }}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <Settings size={18} />
                            프로필 수정하기
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* 3. Profile Edit Modal - Portal to Body */}
            {showProfileEdit && createPortal(
                <div className="modal-overlay" onClick={() => setShowProfileEdit(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={24} color="var(--accent-color)" />
                                프로필 수정
                            </h3>
                            <button onClick={() => setShowProfileEdit(false)} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>x</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '6px' }}>닉네임</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '6px' }}>직업 (Class)</label>
                                <select
                                    value={editClass}
                                    onChange={e => setEditClass(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                >
                                    {bg3Classes.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', opacity: 0.7, marginBottom: '6px' }}>역할 (Role)</label>
                                {isAdmin ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {[
                                                { id: 'User', label: '대원' },
                                                { id: 'Admin', label: '대장 (관리자)' }
                                            ].map(role => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => setEditRole(role.id)}
                                                    style={{
                                                        flex: 1, padding: '10px', borderRadius: '8px',
                                                        border: editRole === role.id ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                                                        background: editRole === role.id ? 'rgba(212, 160, 23, 0.2)' : 'transparent',
                                                        color: editRole === role.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.6)'
                                                    }}
                                                >
                                                    {role.label}
                                                </button>
                                            ))}
                                        </div>
                                        {editRole === 'Admin' && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '6px' }}>* 관리자 권한은 모든 설정을 변경할 수 있습니다.</p>}
                                    </>
                                ) : (
                                    <div style={{
                                        padding: '12px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center'
                                    }}>
                                        🔒 관리자 권한은 대장만이 부여할 수 있습니다.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleProfileUpdate}
                                style={{
                                    marginTop: '10px', padding: '14px', borderRadius: '10px',
                                    background: 'var(--accent-color)', color: 'white', border: 'none',
                                    fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
                                }}
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </aside>
    );
};

export default Sidebar;
