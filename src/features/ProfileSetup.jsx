import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { Sword, Shield, Zap, Music, Heart, TreeDeciduous, Hand, Cross, Target, Skull, Wand2, BookOpen, Crown, Users, RefreshCw } from 'lucide-react';
import logo from '../assets/logo.png';

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

const ProfileSetup = ({ onComplete }) => {
    // mode: 'landing' | 'login' | 'create_admin' | 'join_party'
    const [mode, setMode] = useState('landing');

    // Form States
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [leaderName, setLeaderName] = useState(''); // Selected Party Leader
    const [partyPassword, setPartyPassword] = useState('');

    // Party List for Join Mode
    const [parties, setParties] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setNickname('');
        setPassword('');
        setSelectedClass(null);
        setLeaderName('');
        setPartyPassword('');
        setError('');
        setParties([]);
    };

    // Fetch Parties when entering Join Mode
    useEffect(() => {
        if (mode === 'join_party') {
            fetchParties();
        }
    }, [mode]);

    const fetchParties = async () => {
        setLoading(true);
        try {
            // isAdmin=true 인 유저들 검색
            // Note: client-side filter due to small scale
            const snapshot = await getDocs(collection(db, "users_v2"));
            const admins = snapshot.docs
                .map(d => d.data())
                .filter(u => u.isAdmin === true);
            setParties(admins);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 1. Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userDoc = await getDoc(doc(db, "users_v2", nickname));
            if (!userDoc.exists()) {
                setError("존재하지 않는 닉네임입니다.");
            } else {
                const data = userDoc.data();
                if (data.password === password) {
                    localStorage.setItem('bg3_user_profile', JSON.stringify(data));
                    onComplete(data);
                } else {
                    setError("비밀번호 불일치.");
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Create Party (Admin) - NO KEY REQUIRED
    const handleCreateParty = async () => {
        if (!nickname || !password || !selectedClass || !partyPassword) {
            setError("모든 정보를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "users_v2", nickname));
            if (userDoc.exists()) throw new Error("이미 존재하는 닉네임입니다.");

            const newUser = {
                id: nickname,
                nickname,
                password,
                partyPassword, // Save shared password
                className: selectedClass.name,
                classId: selectedClass.id,
                isAdmin: true,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users_v2", nickname), newUser);
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));
            onComplete(newUser);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Join Party (User)
    const handleJoinParty = async () => {
        if (!nickname || !password || !selectedClass || !leaderName || !partyPassword) {
            setError("모든 정보를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const myDoc = await getDoc(doc(db, "users_v2", nickname));
            if (myDoc.exists()) throw new Error("이미 존재하는 닉네임입니다. (로그인 하세요)");

            const leaderDoc = await getDoc(doc(db, "users_v2", leaderName));
            if (!leaderDoc.exists()) throw new Error("선택한 영주가 존재하지 않습니다.");

            // Verify Party Password
            if (leaderDoc.data().partyPassword !== partyPassword) {
                throw new Error("영지 입장 코드가 올바르지 않습니다.");
            }

            // Cap check logic (Optional: check count logic again here or rely on list)

            const newUser = {
                id: nickname,
                nickname,
                password,
                className: selectedClass.name,
                classId: selectedClass.id,
                isAdmin: false,
                leader: leaderName,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users_v2", nickname), newUser);
            localStorage.setItem('bg3_user_profile', JSON.stringify(newUser));
            onComplete(newUser);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const ClassSelector = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '200px', overflowY: 'auto', margin: '10px 0' }}>
            {CLASSES.map(cls => (
                <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                        padding: '8px', borderRadius: '8px',
                        border: selectedClass?.id === cls.id ? `2px solid ${cls.color}` : '1px solid rgba(255,255,255,0.1)',
                        background: selectedClass?.id === cls.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'
                    }}
                >
                    <cls.icon size={18} color={cls.color} />
                    <span style={{ fontSize: '0.6rem' }}>{cls.name}</span>
                </button>
            ))}
        </div>
    );

    const containerStyle = { maxWidth: '400px', margin: '40px auto', padding: '30px', textAlign: 'center' };
    const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', marginBottom: '10px' };
    const btnStyle = { width: '100%', padding: '12px', background: 'var(--accent-color)', color: 'white', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' };

    // Landing
    if (mode === 'landing') {
        return (
            <div className="glass-panel" style={containerStyle}>
                <img src={logo} alt="발더스 게이트 원정대" style={{ width: '100%', maxWidth: '350px', height: 'auto', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))', mixBlendMode: 'screen' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={() => { resetForm(); setMode('login'); }} style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }}>
                        기존 모험가 로그인
                    </button>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 0' }} />
                    <button onClick={() => { resetForm(); setMode('join_party'); }} style={btnStyle}>
                        <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        영지 가입하기 (일반)
                    </button>
                    <button onClick={() => { resetForm(); setMode('create_admin'); }} style={{ ...btnStyle, background: '#f87171' }}>
                        <Crown size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        새 영지 건설 (관리자)
                    </button>
                </div>
            </div>
        );
    }

    // Login
    if (mode === 'login') {
        return (
            <div className="glass-panel" style={containerStyle}>
                <h2>로그인</h2>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="닉네임" style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)} />
                    <input type="password" placeholder="비밀번호" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="submit" style={btnStyle}>{loading ? '...' : '입장'}</button>
                    {error && <p style={{ color: '#f87171', marginTop: '10px' }}>{error}</p>}
                    <button type="button" onClick={() => setMode('landing')} style={{ marginTop: '10px', background: 'none', color: 'rgba(255,255,255,0.5)' }}>취소</button>
                </form>
            </div>
        );
    }

    // Create Admin
    if (mode === 'create_admin') {
        return (
            <div className="glass-panel" style={containerStyle}>
                <h2 style={{ color: '#fca5a5' }}>새 영지 건설</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '20px' }}>관리자(영주) 설정</p>

                <input type="text" placeholder="영주 닉네임" style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)} />
                <input type="password" placeholder="비밀번호" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} />
                {/* Admin Key Removed */}
                <input type="text" placeholder="영지 입장 코드 설정 (팀원 공유용)" style={{ ...inputStyle, borderColor: '#818cf8' }} value={partyPassword} onChange={e => setPartyPassword(e.target.value)} />

                <p style={{ textAlign: 'left', opacity: 0.7, margin: '10px 0 5px' }}>직업 선택:</p>
                <ClassSelector />

                <button onClick={handleCreateParty} style={btnStyle}>{loading ? '건설 중...' : '영지 생성 완료'}</button>
                {error && <p style={{ color: '#f87171', marginTop: '10px' }}>{error}</p>}
                <button onClick={() => setMode('landing')} style={{ marginTop: '10px', background: 'none', color: 'rgba(255,255,255,0.5)' }}>취소</button>
            </div>
        );
    }

    // Join Party
    if (mode === 'join_party') {
        return (
            <div className="glass-panel" style={containerStyle}>
                <h2>영지 가입</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '20px' }}>합류할 영지를 선택하세요.</p>

                {/* Party List Selection */}
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                    {loading && parties.length === 0 ? <p>로딩 중...</p> :
                        parties.length === 0 ? <p>생성된 영지가 없습니다.</p> :
                            parties.map(p => (
                                <div
                                    key={p.nickname}
                                    onClick={() => setLeaderName(p.nickname)}
                                    style={{
                                        padding: '10px', marginBottom: '5px', borderRadius: '6px', cursor: 'pointer',
                                        background: leaderName === p.nickname ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}
                                >
                                    <span style={{ fontWeight: 'bold' }}>🏰 {p.nickname}의 영지</span>
                                    {leaderName === p.nickname && <Crown size={14} />}
                                </div>
                            ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <button onClick={fetchParties} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <RefreshCw size={12} /> 목록 새로고침
                    </button>
                </div>

                {leaderName && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <p style={{ textAlign: 'left', fontSize: '0.8rem', color: 'var(--accent-color)', marginBottom: '5px' }}>{leaderName} 영주님의 코드를 입력하세요.</p>
                        <input type="text" placeholder="영지 입장 코드 (Password)" style={{ ...inputStyle, borderColor: '#818cf8' }} value={partyPassword} onChange={e => setPartyPassword(e.target.value)} />

                        <div style={{ height: '10px' }}></div>
                        <input type="text" placeholder="내 닉네임" style={inputStyle} value={nickname} onChange={e => setNickname(e.target.value)} />
                        <input type="password" placeholder="비밀번호" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} />

                        <p style={{ textAlign: 'left', opacity: 0.7, margin: '10px 0 5px' }}>직업 선택:</p>
                        <ClassSelector />
                    </div>
                )}

                <button onClick={handleJoinParty} style={{ ...btnStyle, opacity: leaderName ? 1 : 0.5 }} disabled={!leaderName}>
                    {loading ? '가입 중...' : '합류하기'}
                </button>

                {error && <p style={{ color: '#f87171', marginTop: '10px' }}>{error}</p>}
                <button onClick={() => setMode('landing')} style={{ marginTop: '10px', background: 'none', color: 'rgba(255,255,255,0.5)' }}>취소</button>
            </div>
        );
    }

    return null;
};

export default ProfileSetup;
