import React from 'react';
import { createPortal } from 'react-dom';
import { Home, MessageSquare, Calendar, FolderOpen, Users, Settings, Flag, LogOut } from 'lucide-react';
import logo from '../../assets/logo.svg';

import { collection, onSnapshot, doc, query, where } from 'firebase/firestore';
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
        // Mobile Layout: Floating Pill + Top Actions

        // 1. Bottom Nav Items (Max 4-5)
        // Order: Home, Calendar, Tactics, (Admin), Profile
        const mobileItems = [
            { id: 'home', icon: Home, label: '홈' },
            { id: 'calendar', icon: Calendar, label: '일정' },
            { id: 'tactics', icon: Flag, label: '전술' },
            ...(isAdmin ? [{ id: 'admin', icon: Settings, label: '관리' }] : []),
            { id: 'profile', icon: Users, label: '프로필' }
        ];

        return (
            <>
                {/* 1. Top Right Floating Actions (Chat & Save) */}
                <div style={{
                    position: 'fixed',
                    top: 'env(safe-area-inset-top)',
                    right: '20px',
                    zIndex: 1001,
                    marginTop: '15px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    {/* Save Button */}
                    <button
                        onClick={() => setActiveTab('save')}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: activeTab === 'save' ? 'var(--accent-color)' : 'rgba(20, 20, 30, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FolderOpen size={18} />
                    </button>

                    {/* Chat Button */}
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: activeTab === 'chat' ? 'var(--accent-color)' : 'rgba(20, 20, 30, 0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <MessageSquare size={18} />
                    </button>
                </div>

                {/* 2. Top Left Floating Online Count */}
                <div
                    onClick={() => setShowSurvivors(true)}
                    style={{
                        position: 'fixed',
                        top: 'env(safe-area-inset-top)',
                        left: '20px',
                        zIndex: 1001,
                        marginTop: '15px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 14px',
                        background: 'rgba(20, 20, 30, 0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px', // Pill
                        fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80' }}></div>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{onlineUsersCount}명</span>
                </div>

                {/* 3. Bottom Floating Pill Navigation */}
                <nav className="glass" style={{
                    position: 'fixed',
                    bottom: 'calc(20px + env(safe-area-inset-bottom))',
                    left: '20px',
                    right: '20px',
                    height: '65px',
                    zIndex: 1000,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '35px', // Pill Shape
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)', background: 'rgba(15, 15, 25, 0.85)',
                    padding: '0 15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    {mobileItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    background: isActive ? 'var(--accent-color)' : 'transparent',
                                    borderRadius: '50%', // Circle highlight
                                    width: '45px', height: '45px',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <Icon size={22} strokeWidth={2.5} />
                            </button>
                        );
                    })}
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
                <div className="logo-wrapper" style={{ position: 'relative', width: '100%', marginBottom: '10px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
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

            <div
                onClick={() => setShowProfileView(true)}
                style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    padding: '12px', borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.border = '1px solid var(--accent-color)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }}
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

                            {/* Role edit removed as per user request */}

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
