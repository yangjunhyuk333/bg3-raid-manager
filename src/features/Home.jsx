import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, Activity, ArrowRight, CheckCircle2, LogOut, Sword, Music, Heart, Leaf, Shield, Target, Zap, Flame, Eye, Wand2, Skull, Ghost, Axe, Map } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

import logo from '../assets/logo.svg';

const Home = ({ user, setActiveTab, isMobile, onlineUsersCount, setShowSurvivors, openTactic, openProfile }) => {
    const [recentRaids, setRecentRaids] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dailyGoals, setDailyGoals] = useState(() => {
        const saved = localStorage.getItem('bg3_daily_goals');
        if (saved) return JSON.parse(saved);
        return [
            { id: 1, text: '긴 휴식 취하기 (주문 슬롯 복구)', checked: false },
            { id: 2, text: '야영지 물자 확인', checked: false },
            { id: 3, text: '상인에게 잡동사니 판매', checked: false },
            { id: 4, text: '동료 호감도 대화', checked: false }
        ];
    });

    useEffect(() => {
        localStorage.setItem('bg3_daily_goals', JSON.stringify(dailyGoals));
    }, [dailyGoals]);

    const toggleGoal = (id) => {
        setDailyGoals(prev => prev.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
    };

    const [recentTactics, setRecentTactics] = useState([]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                // Fetch Schedules
                const qSchedule = query(collection(db, "schedules"), orderBy("date"), limit(3));
                const snapshotSchedule = await getDocs(qSchedule);
                setRecentRaids(snapshotSchedule.docs.map(d => ({ id: d.id, ...d.data() })));

                // Fetch Tactics
                if (user?.campId) {
                    const qTactics = query(collection(db, "tactics"), where("campId", "==", user.campId), orderBy("createdAt", "desc"), limit(3));
                    const snapshotTactics = await getDocs(qTactics);
                    setRecentTactics(snapshotTactics.docs.map(d => ({ id: d.id, ...d.data() })));
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, [user?.campId]);

    const QuickCard = ({ icon: Icon, title, desc, onClick, color }) => (
        <div
            onClick={onClick}
            className="glass-panel"
            style={{
                padding: '20px', cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex', flexDirection: 'column', gap: '10px'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: `rgba(${color}, 0.2)` }}>
                    <Icon color={`rgb(${color})`} size={24} />
                </div>
                <ArrowRight size={16} style={{ opacity: 0.5 }} />
            </div>
            <div>
                <h3 style={{ margin: '5px 0', fontSize: '1.1rem' }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>{desc}</p>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '30px' }}>
            {/* Mobile Logo (Above Card) */}
            {isMobile && (
                <div className="logo-wrapper" style={{ position: 'relative', width: '180px', margin: '0 auto 10px' }}>
                    <img src={logo} alt="BG3" style={{ width: '100%' }} onClick={() => window.location.reload()} />
                    <div className="logo-shine" style={{ WebkitMaskImage: `url(${logo})`, maskImage: `url(${logo})` }} />
                </div>
            )}

            {/* Hero Section: Glass Pill Card (Text Left, Icon Right) */}
            <div
                onClick={openProfile}
                style={{
                    width: '100%',
                    minHeight: '90px',
                    borderRadius: '50px', // Pill Shape
                    background: 'rgba(20, 20, 35, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', // Space Between
                    padding: isMobile ? '20px 25px' : '0 40px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => isMobile ? null : e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseOut={(e) => isMobile ? null : e.currentTarget.style.transform = 'scale(1)'}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 'bold' }}>
                        어서오세요, <span style={{ color: user?.color || '#ffd700' }}>{user.nickname}</span>님
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
                        발더스 게이트 원정대에 오신 것을 환영합니다.
                    </p>
                </div>

                {/* Class Icon with User Color */}
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: user?.color || '#ffd700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${(user?.color || '#ffd700')}66`, // Glow
                    flexShrink: 0, marginLeft: '15px'
                }}>
                    {(() => {
                        const cls = user?.className || '';
                        let Icon = Users;
                        if (cls.includes('바바리안')) Icon = Axe;
                        else if (cls.includes('바드')) Icon = Music;
                        else if (cls.includes('클레릭')) Icon = Heart;
                        else if (cls.includes('드루이드')) Icon = Leaf;
                        else if (cls.includes('파이터')) Icon = Sword;
                        else if (cls.includes('몽크')) Icon = Zap;
                        else if (cls.includes('팔라딘')) Icon = Shield;
                        else if (cls.includes('레인저')) Icon = Target;
                        else if (cls.includes('로그')) Icon = Ghost;
                        else if (cls.includes('소서러')) Icon = Flame;
                        else if (cls.includes('워락')) Icon = Skull;
                        else if (cls.includes('위자드')) Icon = Wand2;

                        return <Icon size={28} color="white" strokeWidth={2.5} />;
                    })()}
                </div>
            </div>

            {/* Mobile: Online Users Pill (Moved here from Floating Top Left as desired) */}
            {isMobile && (
                <div
                    onClick={() => setShowSurvivors && setShowSurvivors(true)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(20, 20, 30, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px', padding: '8px 16px',
                        marginBottom: '20px', cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        position: 'relative', zIndex: 10, userSelect: 'none'
                    }}
                >
                    <Users size={14} color="#4ade80" />
                    <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {onlineUsersCount || 0}/4명 접속 중
                    </span>
                </div>
            )}



            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '10px' : '20px' }}>
                <QuickCard
                    icon={Calendar}
                    title="레이드 일정"
                    desc="다가오는 모험 확인하기"
                    onClick={() => setActiveTab('calendar')}
                    color="248, 113, 113"
                />
                <QuickCard
                    icon={Activity}
                    title="세이브 분석"
                    desc="내 캐릭터 스펙 확인"
                    onClick={() => setActiveTab('save')}
                    color="167, 139, 250"
                />
                <QuickCard
                    icon={MessageSquare}
                    title="작전 회의실"
                    desc="파티원들과 대화하기"
                    onClick={() => setActiveTab('chat')}
                    color="52, 211, 153"
                />
            </div>

            {/* Recent Schedule & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '10px' : '20px' }}>
                {/* Upcoming Raids */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px', fontSize: '1.2rem' }}>
                        <Calendar size={20} className="text-accent" /> 다가오는 일정
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {loading ? <p style={{ opacity: 0.5 }}>로딩 중...</p> :
                            recentRaids.length === 0 ?
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    예정된 일정이 없습니다.
                                </div> :
                                recentRaids.map(raid => (
                                    <div key={raid.id} onClick={() => setActiveTab('calendar')} style={{
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                                        transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', minWidth: '50px'
                                        }}>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{raid.date?.split('-')[1]}월</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{raid.date?.split('-')[2]}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{raid.title}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>{raid.time} • {raid.type === 'raid' ? '⚔️ 레이드' : '📜 스토리'}</div>
                                        </div>
                                    </div>
                                ))}
                    </div>
                    <button onClick={() => setActiveTab('calendar')} style={{ marginTop: '15px', padding: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', cursor: 'pointer' }}>전체 일정 보기</button>
                </div>

                {/* Recent Tactics Widget */}
                <div className="glass-panel" style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px', fontSize: '1.2rem' }}>
                        <Map size={20} className="text-secondary" style={{ color: '#60a5fa' }} /> 최근 전술
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {loading ? <p style={{ opacity: 0.5 }}>로딩 중...</p> :
                            recentTactics.length === 0 ?
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    수립된 작전이 없습니다.
                                </div> :
                                recentTactics.map(tactic => (
                                    <div key={tactic.id} onClick={() => openTactic ? openTactic(tactic.id) : setActiveTab('tactics')} style={{
                                        padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
                                        transition: 'background 0.2s', border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '10px', background: 'rgba(96, 165, 250, 0.2)', borderRadius: '10px'
                                        }}>
                                            <Map size={20} color="#60a5fa" />
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tactic.title}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>작성자: {tactic.authorName}</div>
                                        </div>
                                    </div>
                                ))}
                    </div>
                    <button onClick={() => setActiveTab('tactics')} style={{ marginTop: '15px', padding: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', cursor: 'pointer' }}>전술 작전실 이동</button>
                </div>
            </div>
        </div >
    );
};

export default Home;
