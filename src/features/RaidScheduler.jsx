import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon, Clock, CheckCircle2, TrendingUp, Users, AlertCircle, Crown, RefreshCw } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, setDoc, where, getDocs, writeBatch } from 'firebase/firestore';

const RaidScheduler = ({ user, isMobile }) => {
    const [date, setDate] = useState(new Date());
    const [availabilities, setAvailabilities] = useState([]);
    const [confirmedRaids, setConfirmedRaids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const selectedDateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // 1. Fetch Data
    useEffect(() => {
        if (!user?.campId) {
            setLoading(false);
            return;
        }

        console.log("Fetching raid data...");
        // Listen to Availabilities
        const qAvail = query(
            collection(db, "availabilities"),
            where("campId", "==", user.campId)
        );

        // Listen to Confirmed Raids
        const qRaids = query(
            collection(db, "schedules"),
            where("campId", "==", user.campId),
            where("type", "==", "fixed")
        );

        const unsubAvail = onSnapshot(qAvail, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvailabilities(data);
        });

        const unsubRaids = onSnapshot(qRaids, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConfirmedRaids(data);
            setLoading(false);
        });

        return () => {
            unsubAvail();
            unsubRaids();
        };
    }, [user?.campId, refreshKey]);

    // 2. Derive State
    // My availability for selected date
    const myAvailabilityDoc = availabilities.find(a => a.userId === user.id && a.date === selectedDateStr);
    const myTimeSlots = myAvailabilityDoc?.possibleTimes || [];

    // Team availability map for selected date: { "20:00": [user1, user2], ... }
    const teamAvailabilityMap = useMemo(() => {
        const map = {};
        const dailyAvails = availabilities.filter(a => a.date === selectedDateStr);

        dailyAvails.forEach(a => {
            a.possibleTimes?.forEach(time => {
                if (!map[time]) map[time] = [];
                map[time].push(a.nickname);
            });
        });
        return map;
    }, [availabilities, selectedDateStr]);

    // Confirmed raid for this date?
    const confirmedRaid = confirmedRaids.find(r => r.date === selectedDateStr);

    // 3. Actions
    const toggleMyTime = async (time) => {
        if (!user.campId) return;

        const newSlots = myTimeSlots.includes(time)
            ? myTimeSlots.filter(t => t !== time)
            : [...myTimeSlots, time].sort();

        // Doc ID based on user + date to prevent duplicates easily
        const docId = `${user.campId}_${user.id}_${selectedDateStr}`;
        const docRef = doc(db, "availabilities", docId);

        await setDoc(docRef, {
            campId: user.campId,
            userId: user.id,
            nickname: user.nickname,
            date: selectedDateStr,
            possibleTimes: newSlots
        });
    };

    const confirmRaid = async (time) => {
        if (!window.confirm(`${date.toLocaleDateString()} ${time}에 레이드를 확정하시겠습니까?`)) return;

        try {
            // 1. Create Confirmed Schedule
            await addDoc(collection(db, "schedules"), {
                campId: user.campId,
                title: "정기 레이드", // Default title, or ask user?
                date: selectedDateStr,
                fixedTime: time,
                type: 'fixed',
                creator: user.nickname,
                createdAt: new Date().toISOString()
            });

            // 2. Optional: Clean up availabilities? Or keep them for record? Keeping them is safer.
            alert("레이드가 확정되었습니다! 파티원들에게 알립니다.");
            setLoading(true);
            setRefreshKey(prev => prev + 1); // Force refresh
        } catch (e) {
            console.error(e);
            alert("오류 발생: " + e.message);
        }
    };

    const cancelRaid = async (raidId) => {
        if (!window.confirm("정말 이 레이드 일정을 취소하시겠습니까?")) return;
        await deleteDoc(doc(db, "schedules", raidId));
    };

    // Helper: Time slots to interact with (e.g., 18:00 - 02:00) + Weekends maybe entire day?
    // For simplicity, let's offer standard raid hours + expand option
    const PRIMARY_HOURS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];

    // Calendar Tile Content
    const tileContent = ({ date: tileDate, view }) => {
        if (view === 'month') {
            const dStr = tileDate.toLocaleDateString('en-CA');
            // Check for confirmed raid
            const hasRaid = confirmedRaids.some(r => r.date === dStr);
            if (hasRaid) return <div style={{ height: '6px', width: '6px', background: '#f87171', borderRadius: '50%', margin: '2px auto' }}></div>;

            // Check for any availability logged
            const hasAvail = availabilities.some(a => a.date === dStr);
            if (hasAvail) return <div style={{ height: '4px', width: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', margin: '2px auto' }}></div>;
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 1. Calendar View */}
            <div className="glass-panel" style={{ padding: isMobile ? '15px' : '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
                        <CalendarIcon className="text-accent" /> 레이드 일정 (Raid Scheduler)
                    </h2>
                    <button
                        onClick={() => { setLoading(true); setRefreshKey(prev => prev + 1); }}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                            padding: '8px', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="새로고침"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                <style>{`
                    .react-calendar { background: transparent !important; border: none !important; width: 100% !important; color: white !important; font-family: inherit; }
                    .react-calendar__navigation button { color: white; min-width: 44px; background: none; font-size: ${isMobile ? '1rem' : '1.2rem'}; }
                    .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: rgba(255,255,255,0.1); }
                    .react-calendar__month-view__weekdays { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 0.8em; opacity: 0.7; color: var(--accent-color); }
                    .react-calendar__month-view__days__day { color: white; padding: ${isMobile ? '10px' : '15px'}; background: transparent; border: none; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: rgba(255,255,255,0.1); border-radius: 12px; }
                    .react-calendar__tile--now { background: rgba(255,255,255,0.1) !important; border-radius: 12px; }
                    .react-calendar__tile--active { background: var(--accent-color) !important; color: white !important; border-radius: 12px; }
                `}</style>

                <Calendar onChange={setDate} value={date} tileContent={tileContent} formatDay={(l, d) => d.getDate()} />
            </div>

            {/* 2. Confirmed Raid Status (If exists for selected date) */}
            {confirmedRaid ? (
                <div className="glass-panel" style={{
                    padding: '25px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#fca5a5', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <CheckCircle2 /> 레이드 확정됨
                    </h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '10px 0' }}>{confirmedRaid.fixedTime}</p>
                    <p style={{ opacity: 0.8 }}>모든 대원은 해당 시간에 야영지로 집결하십시오.</p>

                    {(user.isAdmin || user.role === 'Admin') && (
                        <button
                            onClick={() => cancelRaid(confirmedRaid.id)}
                            style={{
                                marginTop: '20px', padding: '10px 20px', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.3)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.5)',
                                cursor: 'pointer'
                            }}
                        >
                            일정 취소하기
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* 3. My Availability Input */}
                    <div className="glass-panel" style={{ padding: isMobile ? '15px' : '20px' }}>
                        <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                            <Clock size={18} color="var(--accent-color)" />
                            나의 가능 시간 ({date.toLocaleDateString()})
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {PRIMARY_HOURS.map(time => {
                                const isSelected = myTimeSlots.includes(time);
                                return (
                                    <button
                                        key={time}
                                        onClick={() => toggleMyTime(time)}
                                        style={{
                                            padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                            background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                                            color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            transition: 'all 0.2s', flexGrow: isMobile ? 1 : 0
                                        }}
                                    >
                                        {time}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. Team Status & Confirmation */}
                    <div className="glass-panel" style={{ padding: isMobile ? '15px' : '20px' }}>
                        <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                            <Users size={18} color="#a78bfa" />
                            파티 현황 (Team Status)
                        </h3>

                        {Object.keys(teamAvailabilityMap).length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>아직 등록된 가능 시간이 없습니다.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {Object.entries(teamAvailabilityMap)
                                    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])) // Sort by Count DESC, then Time ASC
                                    .map(([time, members]) => {
                                        const count = members.length;
                                        // Highlight if count is high (e.g. >= 3 or 4)
                                        const isHigh = count >= 3;

                                        return (
                                            <div key={time} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px 16px', borderRadius: '12px',
                                                background: isHigh ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.03)',
                                                border: isHigh ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isHigh ? '#a78bfa' : 'white' }}>{time}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Users size={14} style={{ opacity: 0.7 }} />
                                                        <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{count}명 가능</span>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>({members.join(', ')})</span>
                                                    </div>
                                                </div>

                                                {/* Admin Confirm Button */}
                                                {(user.isAdmin || user.role === 'Admin') && (
                                                    <button
                                                        onClick={() => confirmRaid(time)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                            background: 'linear-gradient(45deg, #f87171, #ef4444)',
                                                            color: 'white', fontWeight: 'bold', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <Crown size={12} fill="white" /> 확정
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default RaidScheduler;
