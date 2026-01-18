import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, Activity, ArrowRight, CheckCircle2, LogOut } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

import logo from '../assets/logo.svg';

const Home = ({ user, setActiveTab, isMobile, onlineUsersCount, setShowSurvivors }) => {
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

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const q = query(collection(db, "schedules"), orderBy("date"), limit(2));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setRecentRaids(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

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
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '30px' }}>
            {/* Mobile Logo (Above Card) */}
            {isMobile && (
                <div className="logo-wrapper" style={{ position: 'relative', width: '180px', margin: '0 auto 10px' }}>
                    <img src={logo} alt="BG3" style={{ width: '100%' }} onClick={() => window.location.reload()} />
                    <div className="logo-shine" style={{ WebkitMaskImage: `url(${logo})`, maskImage: `url(${logo})` }} />
                </div>
            )}

            {/* Hero Section: Glass Pill Card */}
            <div style={{
                width: '100%',
                minHeight: '90px',
                borderRadius: '50px', // Pill Shape
                background: 'rgba(20, 20, 35, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '20px 25px' : '0 40px',
                textAlign: 'left'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: isMobile ? '50px' : '60px', height: isMobile ? '50px' : '60px',
                        borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #ffb700)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                        color: '#1a1a2e'
                    }}>
                        <Users size={isMobile ? 24 : 32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: 'bold' }}>
                            어서오세요, <span style={{ color: '#ffd700' }}>{user.nickname}</span>님
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
                            발더스 게이트 원정대에 오신 것을 환영합니다.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (confirm('로그아웃 하시겠습니까?')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(255, 50, 50, 0.1)',
                        border: '1px solid rgba(255, 50, 50, 0.2)',
                        color: '#fca5a5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                        marginLeft: '15px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <LogOut size={20} />
                </button>
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

            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                어서오세요, <span style={{ color: 'var(--accent-color)' }}>{user?.nickname || '모험가'}</span>님
            </h1>
            <p style={{ opacity: 0.8, maxWidth: '600px', margin: '0 auto', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                발더스 게이트 원정대에 오신 것을 환영합니다. <br />
                오늘의 모험을 시작하기 전에 일정을 확인하고 파티원들과 소통해보세요.
            </p>
        </div>

            {/* Quick Actions Grid */ }
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

    {/* Recent Schedule & Status */ }
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '10px' : '20px' }}>
        {/* Upcoming Raids */}
        <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px' }}>
                <Calendar size={18} /> 다가오는 일정
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loading ? <p style={{ opacity: 0.5 }}>로딩 중...</p> :
                    recentRaids.length === 0 ? <p style={{ opacity: 0.5 }}>예정된 일정이 없습니다.</p> :
                        recentRaids.map(raid => (
                            <div key={raid.id} style={{
                                padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', gap: '15px'
                            }}>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '5px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px'
                                }}>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{raid.date?.split('-')[1]}월</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{raid.date?.split('-')[2]}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{raid.title}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{raid.time} • {raid.type === 'raid' ? '⚔️ 레이드' : '📜 스토리'}</div>
                                </div>
                            </div>
                        ))}
            </div>
        </div>


    </div>
        </div >
    );
};

export default Home;
