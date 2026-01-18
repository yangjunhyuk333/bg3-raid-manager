import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon, Plus, Trash2, Users, Clock, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, where } from 'firebase/firestore';

const RaidScheduler = ({ user, isMobile }) => {
    const [schedules, setSchedules] = useState([]);
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        title: '',
        date: '',
        type: 'vote', // 'vote' | 'fixed'
        timeSlots: [], // Array of { time: '20:00', votes: [] }
        fixedTime: '',
    });
    const [tempTimeSlot, setTempTimeSlot] = useState('');

    useEffect(() => {
        if (!user?.campId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "schedules"),
            where("campId", "==", user.campId),
            orderBy("date")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSchedules(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.campId]);

    const handleAddTimeSlot = () => {
        if (tempTimeSlot && !newItem.timeSlots.some(s => s.time === tempTimeSlot)) {
            setNewItem(prev => ({
                ...prev,
                timeSlots: [...prev.timeSlots, { time: tempTimeSlot, votes: [] }].sort((a, b) => a.time.localeCompare(b.time))
            }));
            setTempTimeSlot('');
        }
    };

    const handleRemoveTimeSlot = (time) => {
        setNewItem(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(t => t.time !== time)
        }));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "schedules"), {
                ...newItem,
                campId: user.campId,
                creator: user.nickname,
                createdAt: new Date().toISOString()
            });
            setShowModal(false);
            setNewItem({ title: '', date: '', type: 'vote', timeSlots: [], fixedTime: '' });
        } catch (error) {
            console.error("Error adding schedule: ", error);
            alert("일정 추가 실패: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            await deleteDoc(doc(db, "schedules", id));
        }
    };

    const handleVote = async (scheduleId, slotIndex, currentVotes) => {
        const schedule = schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const userNickname = user.nickname;
        const newSlots = [...schedule.timeSlots];
        const targetSlot = { ...newSlots[slotIndex] };

        if (targetSlot.votes.includes(userNickname)) {
            targetSlot.votes = targetSlot.votes.filter(v => v !== userNickname);
        } else {
            targetSlot.votes = [...targetSlot.votes, userNickname];
        }

        newSlots[slotIndex] = targetSlot;

        await updateDoc(doc(db, "schedules", scheduleId), {
            timeSlots: newSlots
        });
    };

    // Filter schedules for the selected date on calendar
    const selectedDateStr = date.toLocaleDateString('en-CA');
    const filteredSchedules = schedules.filter(s => s.date === selectedDateStr);

    const tileContent = ({ date: tileDate, view }) => {
        if (view === 'month') {
            const dateStr = tileDate.toLocaleDateString('en-CA');
            const hasEvent = schedules.some(s => s.date === dateStr);
            if (hasEvent) {
                return <div style={{ height: '6px', width: '6px', background: '#f87171', borderRadius: '50%', margin: '2px auto' }}></div>
            }
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Calendar Section */}
            <div className="glass-panel" style={{ padding: isMobile ? '15px' : '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
                        <CalendarIcon className="text-accent" /> 모험 일정 (Calendar)
                    </h2>
                    <button
                        onClick={() => {
                            setNewItem(prev => ({ ...prev, date: selectedDateStr }));
                            setShowModal(true);
                        }}
                        className="glass-button"
                        style={{ background: 'var(--accent-color)', border: 'none', padding: isMobile ? '8px 12px' : '10px 20px', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', fontSize: isMobile ? '0.8rem' : '1rem' }}
                    >
                        <Plus size={isMobile ? 14 : 18} /> 일정 추가
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
                    .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.3; }
                `}</style>

                <Calendar
                    onChange={setDate}
                    value={date}
                    tileContent={tileContent}
                    formatDay={(locale, date) => date.getDate()}
                />
            </div>

            {/* List Section */}
            <div className="glass-panel" style={{ padding: isMobile ? '15px' : '20px', minHeight: '200px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    {date.toLocaleDateString()} 일정 목록
                </h3>

                {loading ? <p style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>일정을 불러오는 중입니다...</p> :
                    filteredSchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <p style={{ opacity: 0.5, marginBottom: '15px' }}>이 날짜에는 예정된 모험이 없습니다.</p>
                            <button
                                onClick={() => {
                                    setNewItem(prev => ({ ...prev, date: selectedDateStr }));
                                    setShowModal(true);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
                                }}
                            >
                                + 새 일정 만들기
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                            {filteredSchedules.map((item) => (
                                <div key={item.id} style={{
                                    background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <span style={{
                                                fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                                background: item.type === 'vote' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                                                color: item.type === 'vote' ? '#a78bfa' : '#fca5a5'
                                            }}>
                                                {item.type === 'vote' ? '🗳️ 시간 조율' : '⚔️ 확정 일정'}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>by {item.creator}</span>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <h4 style={{ margin: '0 0 15px', fontSize: '1.2rem' }}>{item.title}</h4>

                                    {item.type === 'fixed' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--accent-color)' }}>
                                            <Clock size={16} /> {item.fixedTime}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {item.timeSlots?.map((slot, idx) => {
                                                const maxVotes = Math.max(...item.timeSlots.map(s => s.votes.length));
                                                const isTop = maxVotes > 0 && slot.votes.length === maxVotes;
                                                const iVoted = slot.votes.includes(user.nickname);

                                                return (
                                                    <div key={idx}
                                                        onClick={() => handleVote(item.id, idx, slot.votes)}
                                                        style={{
                                                            padding: '10px', borderRadius: '8px',
                                                            background: iVoted ? 'rgba(78, 209, 197, 0.1)' : 'rgba(0,0,0,0.2)',
                                                            border: iVoted ? '1px solid var(--accent-color)' : '1px solid transparent',
                                                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {isTop && <TrendingUp size={14} color="#fbbf24" />}
                                                            <span style={{ fontWeight: isTop ? 'bold' : 'normal', color: isTop ? '#fbbf24' : 'white' }}>{slot.time}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <div style={{ display: 'flex', marginRight: '5px' }}>
                                                                {slot.votes.map((v, i) => (
                                                                    <div key={i} title={v} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', opacity: 0.5, marginLeft: '2px' }} />
                                                                ))}
                                                            </div>
                                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{slot.votes.length}표</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="glass-panel" style={{ width: '450px', padding: '30px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px' }}>새 일정 추가</h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder="일정 제목 (예: 3막 보스전)"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                                style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} required style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }} />
                                <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}>
                                    <option value="vote" style={{ color: 'black' }}>🗳️ 시간 조율</option>
                                    <option value="fixed" style={{ color: 'black' }}>⚔️ 확정 일정</option>
                                </select>
                            </div>

                            {newItem.type === 'vote' ? (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px', display: 'block' }}>후보 시간 추가</label>
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                        <input type="time" value={tempTimeSlot} onChange={e => setTempTimeSlot(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none' }} />
                                        <button type="button" onClick={handleAddTimeSlot} style={{ padding: '8px 15px', borderRadius: '6px', background: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer' }}>추가</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {newItem.timeSlots.map(slot => (
                                            <span key={slot.time} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {slot.time}
                                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTimeSlot(slot.time)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <input type="time" required value={newItem.fixedTime} onChange={e => setNewItem({ ...newItem, fixedTime: e.target.value })} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }} />
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>취소</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: 'pointer' }}>등록</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RaidScheduler;
