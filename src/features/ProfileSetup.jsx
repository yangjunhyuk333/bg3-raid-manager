import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { Sword, Shield, Zap, Music, Heart, TreeDeciduous, Hand, Cross, Target, Skull, Wand2, BookOpen, Crown, Users, RefreshCw, LogIn, LogOut, X } from 'lucide-react';
import logo from '../assets/logo.svg';

const CLASSES = [
    { id: 'barbarian', name: '바바리안', icon: Sword, color: '#fca5a5' },
    { id: 'bard', name: '바드', icon: Music, color: '#f9a8d4' },
    { id: 'cleric', name: '클레릭', icon: Cross, color: '#d1d5db' },
    { id: 'druid', name: '드루이드', icon: TreeDeciduous, color: '#bef264' },
    { id: 'fighter', name: '파이터', icon: Shield, color: '#93c5fd' },
    { id: 'monk', name: '몽크', icon: Hand, color: '#7dd3fc' },
    { id: 'paladin', name: '팔라딘', icon: Shield, color: '#fbbf24' },
    { id: 'ranger', name: '레인저', icon: Target, color: '#86efac' },
    { id: 'rogue', name: '로그', icon: Skull, color: '#cbd5e1' },
    { id: 'sorcerer', name: '소서러', icon: Zap, color: '#c084fc' },
    { id: 'warlock', name: '워락', icon: Wand2, color: '#e879f9' },
    { id: 'wizard', name: '위자드', icon: BookOpen, color: '#818cf8' },
];

const PROFILE_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
];

// Styles defined outside component
const inputStyle = {
    width: '100%', padding: '16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)',
    color: 'white', marginBottom: '12px', fontSize: '1rem',
    transition: 'border-color 0.2s, background 0.2s'
};

const btnStyle = {
    width: '100%', padding: '16px', borderRadius: '12px',
    border: 'none', fontWeight: 'bold', fontSize: '1.05rem',
    marginTop: '0', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
};

// Sub-components defined outside
const ClassSelector = ({ selected, onSelect }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto', margin: '20px 0', padding: '5px' }}>
        {CLASSES.map(cls => (
            <button
                key={cls.id}
                onClick={() => onSelect(cls)}
                type="button"
                style={{
                    padding: '12px 8px', borderRadius: '12px',
                    border: selected?.id === cls.id ? `2px solid ${cls.color}` : '1px solid rgba(255,255,255,0.05)',
                    background: selected?.id === cls.id ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                    color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s', cursor: 'pointer',
                    transform: selected?.id === cls.id ? 'scale(1.05)' : 'scale(1)'
                }}
            >
                <cls.icon size={24} color={cls.color} />
                <span style={{ fontSize: '0.75rem', fontWeight: selected?.id === cls.id ? 'bold' : 'normal' }}>{cls.name}</span>
            </button>
        ))}
    </div>
);

const ColorSelector = ({ selected, onSelect }) => (
    <div style={{ margin: '15px 0' }}>
        <label style={{ fontSize: '0.85rem', color: 'white', opacity: 0.8, display: 'block', marginBottom: '8px' }}>대표 색상</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PROFILE_COLORS.map(color => (
                <div
                    key={color}
                    onClick={() => onSelect(color)}
                    style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: selected === color ? '3px solid white' : '1px solid transparent',
                        boxShadow: selected === color ? '0 0 10px ' + color : 'none',
                        transform: selected === color ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s'
                    }}
                />
            ))}
        </div>
    </div>
);

// Modal Component
const Modal = ({ children, title, sub, onClose, error }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', cursor: 'pointer', zIndex: 10
                }}
            >
                <X size={18} />
            </button>

            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                {title && <h2 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: '800', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h2>}
                {sub && <p style={{ opacity: 0.7, fontSize: '0.95rem', marginBottom: '30px' }}>{sub}</p>}
                {children}
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px', borderRadius: '10px', marginTop: '20px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>⚠️ {error}</div>}
            </div>
        </div>
    </div>
);

const ProfileSetup = ({ onComplete, initialData, user, isMobile }) => {
    // Combine initialData and user props (user prop is passed from Layout)
    const data = initialData || user;

    // mode: 'landing' (default) | 'login' | 'create_camp' | 'join_camp' | 'profile_view'
    // If data exists, defaults to 'profile_view' (Edit Mode)
    const [mode, setMode] = useState(data ? 'profile_view' : 'landing');

    // Form States
    const [nickname, setNickname] = useState(data?.nickname || '');
    const [password, setPassword] = useState('');
    const [selectedClass, setSelectedClass] = useState(
        data ? CLASSES.find(c => c.name === data.className) : null
    );
    const [selectedColor, setSelectedColor] = useState(data?.color || PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]);
    const [campName, setCampName] = useState('');     // For Admin: Create Camp Name / For User: Search
    const [campPassword, setCampPassword] = useState(''); // Shared Password

    // For Join Mode
    const [availableCamps, setAvailableCamps] = useState([]);
    const [selectedCampId, setSelectedCampId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (data) {
            setMode('profile_view');
        }
    }, [data]);

    const resetForm = () => {
        setNickname('');
        setPassword('');
        setSelectedClass(null);
        setCampName('');
        setCampPassword('');
        setSelectedCampId(null);
        setError('');
        setAvailableCamps([]);
        setSelectedColor(PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]);
    };

    // Helper to close modal
    const closeModal = () => {
        setError('');
        setMode('landing');
        // Do not reset form immediately if user wants to correct input? 
        // Or maybe yes for security? Let's reset for fresh start.
        // resetForm(); 
    };

    // Fetch Camps for Join Mode
    useEffect(() => {
        if (mode === 'join_camp') {
            fetchCamps();
        }
    }, [mode]);

    const fetchCamps = async () => {
        setLoading(true);
        try {
            console.log("[Profile] Fetching active camps...");
            const snapshot = await getDocs(collection(db, "camps"));
            const camps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setAvailableCamps(camps);
            console.log("[Profile] Camps found:", camps.length);
        } catch (err) {
            console.error("[Profile] Error fetching camps:", err);
            setError("영지 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 1. Login Logic
    // --- Handlers ---

    const handleUpdate = async () => {
        if (!nickname.trim()) return setError("닉네임을 입력해주세요.");
        setLoading(true);
        try {
            const userRef = doc(db, "users_v2", user.id);
            const updates = {
                nickname,
                className: selectedClass?.name || 'Warrior',
                role: selectedClass?.id === 'cleric' || selectedClass?.id === 'bard' ? 'Healer' : 'Dealer' // Simple logic
            };

            await updateDoc(userRef, updates);

            // Update Local Storage
            const newUser = { ...user, ...updates };
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));

            alert("프로필이 업데이트되었습니다."); // Or just silent success
            window.location.reload();
        } catch (e) {
            console.error(e);
            setError("업데이트 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log("[Auth] Attempting login for:", nickname);
            const userDoc = await getDoc(doc(db, "users_v2", nickname));

            if (!userDoc.exists()) {
                throw new Error("존재하지 않는 모험가입니다.");
            }

            const userData = userDoc.data();
            if (userData.password !== password) {
                throw new Error("비밀번호가 일치하지 않습니다.");
            }

            // Update local storage and state
            console.log("[Auth] Login successful:", userData);

            // Self-Repair: Ensure user is in the camp's member list
            if (userData.campId) {
                try {
                    await updateDoc(doc(db, "camps", userData.campId), {
                        members: arrayUnion(nickname)
                    });
                } catch (repairErr) {
                    console.error("[Auth] Failed to update camp member list:", repairErr);
                }
            }

            localStorage.setItem('bg3_user_profile', JSON.stringify(userData));
            onComplete(userData);

        } catch (err) {
            console.error("[Auth] Login failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Create Camp (Admin)
    const handleCreateCamp = async () => {
        if (!nickname || !password || !selectedClass || !campName || !campPassword) {
            setError("모든 정보를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            console.log("[Camp] Creating new camp:", campName);

            // 1. Check if user already exists
            const userDocRef = doc(db, "users_v2", nickname);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) throw new Error("이미 존재하는 닉네임입니다.");

            // 2. Check if camp name already exists (using ID)
            const campId = campName.trim();
            const campDocRef = doc(db, "camps", campId);
            const campDoc = await getDoc(campDocRef);
            if (campDoc.exists()) throw new Error("이미 존재하는 영지 이름입니다.");

            {/* 3. Create User Data (Admin) */ }
            const newUser = {
                id: nickname,
                nickname,
                password,
                className: selectedClass.name,
                classId: selectedClass.id,
                color: selectedColor, // Save Color
                isAdmin: true,
                campId: campId, // Link to Camp
                createdAt: new Date().toISOString()
            };

            // 4. Create Camp Data
            const newCamp = {
                id: campId,
                name: campName,
                password: campPassword,
                leaderId: nickname,
                members: [nickname], // Initial member
                createdAt: new Date().toISOString()
            };

            // 5. Write to DB (Batch or Sequential)
            await setDoc(userDocRef, newUser);
            await setDoc(campDocRef, newCamp);

            console.log("[Camp] Camp and Admin created successfully");
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));
            onComplete(newUser);

        } catch (err) {
            console.error("[Camp] Creation failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Join Camp (User)
    const handleJoinCamp = async () => {
        if (!nickname || !password || !selectedClass || !selectedCampId || !campPassword) {
            setError("모든 정보를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            console.log("[Camp] Joining camp:", selectedCampId);

            // 1. Check User Duplication
            const userDocRef = doc(db, "users_v2", nickname);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) throw new Error("이미 존재하는 닉네임입니다. (로그인 하세요)");

            // 2. Verify Camp Password
            const campDocRef = doc(db, "camps", selectedCampId);
            const campDoc = await getDoc(campDocRef);

            if (!campDoc.exists()) throw new Error("영지가 존재하지 않습니다.");
            const campData = campDoc.data();

            if (campData.password !== campPassword) {
                throw new Error("영지 입장 암호가 틀렸습니다.");
            }

            // 3. Check Member Limit (Optional: Max 4)
            if (campData.members && campData.members.length >= 4) {
                throw new Error("영지 정원이 꽉 찼습니다. (최대 4명)");
            }

            // 4. Create User
            const newUser = {
                id: nickname,
                nickname,
                password,
                className: selectedClass.name,
                classId: selectedClass.id,
                color: selectedColor, // Save Color
                isAdmin: false,
                campId: selectedCampId,
                createdAt: new Date().toISOString()
            };

            // 5. Update DB
            await setDoc(userDocRef, newUser);
            await updateDoc(campDocRef, {
                members: arrayUnion(nickname)
            });

            console.log("[Camp] Joined successfully");
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));
            onComplete(newUser);

        } catch (err) {
            console.error("[Camp] Join failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Logout Handler
    const handleLogout = () => {
        if (confirm("정말 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('bg3_user_profile');
            onComplete(null);
            setMode('landing');
            resetForm();
        }
    };

    // If Profile View, we just render it (no modaling needed for this simple view usually, but could be modal too)
    // For now keeping Profile View as a "page" because it replaces the main content usually.
    if (mode === 'profile_view' && data) {
        return (
            <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: selectedClass?.color || 'gray',
                        margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 30px ${selectedClass?.color || 'gray'}`
                    }}>
                        {selectedClass && <selectedClass.icon size={50} color="white" />}
                    </div>
                    <h3 style={{ fontSize: '1.8rem', margin: '0 0 8px', fontWeight: 'bold' }}>{data.nickname}</h3>
                    <span style={{ fontSize: '0.95rem', opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
                        {data.className}
                    </span>
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '16px' }}>
                    <p style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '15px' }}>
                        <span style={{ opacity: 0.6 }}>소속 야영지</span>
                        <b style={{ fontSize: '1.1rem' }}>{data.campId}</b>
                    </p>
                    <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.6 }}>직책</span>
                        <b style={{ color: data.isAdmin ? '#f87171' : '#4ade80' }}>
                            {data.isAdmin ? '영주 (Leader)' : '대원 (Member)'}
                        </b>
                    </p>
                </div>

                <button onClick={handleLogout} style={{ ...btnStyle, background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: '#f87171', marginTop: '40px' }}>
                    <LogOut size={20} />
                    로그아웃
                </button>
            </div>
        );
    }

    // MAIN LANDING RENDER
    return (
        <>
            {/* 1. Background Layer (Always Visible) */}
            <div style={{
                position: 'fixed', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px' // Prevent edge touching on small screens
            }}>
                <div className="glass-panel" style={{
                    maxWidth: '1000px', width: '100%',
                    padding: isMobile ? '30px 20px' : '60px 60px', textAlign: 'center',
                    minHeight: isMobile ? 'auto' : '550px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: 0
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? '20px' : '60px', // Reduced gap on mobile
                        width: '100%'
                    }}>
                        {/* Logo & Welcome Section */}
                        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="logo-wrapper" style={{ position: 'relative', maxWidth: isMobile ? '240px' : '420px', width: '100%' }}>
                                {/* The Base Image */}
                                <img
                                    src={logo}
                                    alt="Logo"
                                    onClick={() => window.location.reload()}
                                    title="새로고침"
                                    style={{ width: '100%', cursor: 'pointer', transition: 'transform 0.3s ease', display: 'block' }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                {/* The Shine Overlay - Masked to the image */}
                                <div
                                    className="logo-shine"
                                    style={{
                                        WebkitMaskImage: `url(${logo})`,
                                        maskImage: `url(${logo})`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Buttons Section */}
                        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '350px', width: '100%' }}>
                            <button onClick={() => { resetForm(); setMode('login'); }} style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <LogIn size={20} />
                                기존 모험가 로그인
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.3, fontSize: '0.8rem' }}>
                                <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                                <span>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                            </div>

                            <button onClick={() => { resetForm(); setMode('join_camp'); }} style={{ ...btnStyle, background: 'linear-gradient(45deg, #7c3aed, #db2777)', color: 'white', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}>
                                <Users size={20} />
                                야영지 합류하기 (일반)
                            </button>
                            <button onClick={() => { resetForm(); setMode('create_camp'); }} style={{ ...btnStyle, background: 'linear-gradient(45deg, #ef4444, #f97316)', color: 'white', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>
                                <Crown size={20} />
                                새 야영지 건설 (관리자)
                            </button>

                            {/* Intro Text - Moved below buttons */}
                            <p style={{
                                marginTop: '10px',
                                opacity: 0.8,
                                fontSize: isMobile ? '0.75rem' : '0.9rem',
                                lineHeight: '1.5',
                                fontWeight: '400',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.7)'
                            }}>
                                동료들과 함께 나만의 이야기를 만들어보세요.<br />
                                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>발더스 게이트 3 원정대</span>를 위한<br />
                                필수 컴패니언 앱
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Modals Layer */}
            {mode === 'login' && (
                <Modal title="로그인" sub="다시 오셨군요, 모험가님." onClose={closeModal} error={error}>
                    <form onSubmit={handleLogin}>
                        <input type="text" placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                        <button type="submit" style={{ ...btnStyle, background: 'white', color: 'black', marginTop: '20px' }} disabled={loading}>
                            {loading ? '인증 확인 중...' : '야영지 입장'}
                        </button>
                    </form>
                </Modal>
            )}

            {mode === 'create_camp' && (
                <Modal title="야영지 건설" sub="당신만의 파티를 이끌어보세요." onClose={closeModal} error={error}>
                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>관리자(영주) 정보</label>
                            <input type="text" placeholder="영주 닉네임" value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} />
                            <input type="password" placeholder="개인 비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>영지(Room) 설정</label>
                            <input type="text" placeholder="야영지 이름 (ID로 사용됨)" value={campName} onChange={e => setCampName(e.target.value)} style={inputStyle} />
                            <input type="text" placeholder="영지 입장 암호 (팀원 공유용)" value={campPassword} onChange={e => setCampPassword(e.target.value)} style={{ ...inputStyle, borderColor: '#818cf8', color: '#818cf8', marginBottom: 0 }} />
                        </div>

                        <ColorSelector selected={selectedColor} onSelect={setSelectedColor} />
                        <label style={{ fontSize: '0.9rem', color: 'white', opacity: 0.8, marginTop: '5px', display: 'block' }}>나의 직업 선택</label>
                        <ClassSelector selected={selectedClass} onSelect={setSelectedClass} />
                    </div>
                    <button onClick={handleCreateCamp} style={{ ...btnStyle, background: '#ef4444', color: 'white' }} disabled={loading}>
                        {loading ? '영토 선포 중...' : '건설 완료 및 입장'}
                    </button>
                </Modal>
            )}

            {mode === 'join_camp' && (
                <Modal title="야영지 합류" sub="동료들이 기다리고 있습니다." onClose={closeModal} error={error}>
                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        {/* Camp List */}
                        {!selectedCampId && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>참여 가능한 영지</span>
                                    <button onClick={fetchCamps} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <RefreshCw size={12} /> 목록 갱신
                                    </button>
                                </div>
                                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                                    {loading && availableCamps.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>탐색 중...</p> :
                                        availableCamps.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>활성화된 영지가 없습니다.</p> :
                                            availableCamps.map(camp => (
                                                <div
                                                    key={camp.id}
                                                    onClick={() => setSelectedCampId(camp.id)}
                                                    style={{
                                                        padding: '16px', marginBottom: '8px', borderRadius: '10px', cursor: 'pointer',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid transparent',
                                                        transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                >
                                                    <span style={{ fontWeight: 'bold' }}>🏰 {camp.name}</span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.7, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>{camp.members?.length || 0}/4명</span>
                                                </div>
                                            ))}
                                </div>
                            </div>
                        )}

                        {selectedCampId && (
                            <div style={{ animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button onClick={() => setSelectedCampId(null)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.5, cursor: 'pointer' }}>←</button>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{availableCamps.find(c => c.id === selectedCampId)?.name}</h3>
                                </div>

                                <input type="text" placeholder="영지 입장 암호" value={campPassword} onChange={e => setCampPassword(e.target.value)} style={{ ...inputStyle, borderColor: '#818cf8', color: '#818cf8' }} />
                                <div style={{ height: '10px' }} />
                                <input type="text" placeholder="내 닉네임" value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} />
                                <input type="password" placeholder="내 비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                                <ColorSelector selected={selectedColor} onSelect={setSelectedColor} />
                                <label style={{ fontSize: '0.9rem', color: 'white', opacity: 0.8, marginTop: '15px', display: 'block' }}>나의 직업 선택</label>
                                <ClassSelector selected={selectedClass} onSelect={setSelectedClass} />
                            </div>
                        )}
                    </div>
                    {selectedCampId && (
                        <button onClick={handleJoinCamp} style={{ ...btnStyle, background: 'var(--accent-color)', color: 'white' }} disabled={loading}>
                            {loading ? '입장 중...' : '합류하기'}
                        </button>
                    )}
                </Modal>
            )}
        </>
    );
};

export default ProfileSetup;
