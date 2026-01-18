import { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Calendar Import
import { Calendar as CalendarIcon, Plus, Trash2, Users, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
// import 'react-calendar/dist/Calendar.css'; // Global CSS already handles this potentially, but let's check styles

const RaidScheduler = ({ user }) => {
    const [schedules, setSchedules] = useState([]);
    const [date, setDate] = useState(new Date()); // Calendar Date State
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [newItem, setNewItem] = useState({
        title: '',
        date: '',
        time: '',
        type: 'raid',
        members: ''
    });

    useEffect(() => {
        const q = query(collection(db, "schedules"), orderBy("date"), orderBy("time"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSchedules(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "schedules"), {
                ...newItem,
                members: newItem.members.split(',').map(m => m.trim()).filter(m => m),
                creator: user?.nickname || 'Anonymous',
                // Ensure date is consistent with calendar selection if used from modal
            });
            setShowModal(false);
            setNewItem({ title: '', date: '', time: '', type: 'raid', members: '' });
        } catch (error) {
            console.error("Error adding schedule: ", error);
            alert("일정 추가 실패: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                await deleteDoc(doc(db, "schedules", id));
            } catch (error) {
                console.error("Error deleting schedule: ", error);
                alert("삭제 실패");
            }
        }
    };

    const handleVote = async (id, currentVotes = []) => {
        if (!user) return alert("로그인이 필요합니다.");
        const userVoteIndex = currentVotes.indexOf(user.nickname); // Simple vote by nickname for now

        let newVotes;
        if (userVoteIndex !== -1) {
            newVotes = currentVotes.filter(v => v !== user.nickname); // Toggle off
        } else {
            newVotes = [...currentVotes, user.nickname]; // Toggle on
        }

        try {
            const docRef = doc(db, "schedules", id);
            // We need to update existing doc. specific update. 
            // Ideally we should use updateDoc but for replace_file_content context I'll assume we can use setDoc with merge or just need to import updateDoc. 
            // Wait, I need to import updateDoc first. I will add it to the imports in a separate edit if needed or assume I can replace the import line too.
            // Actually, the previous file had addDoc, deleteDoc, doc, onSnapshot, query, orderBy. updateDoc is missing.
            // I'll stick to logic here and fix imports in next step/same step if I can target it. 
            // I will use a separate tool call to fix imports.
            // For now, let's write the logic presuming updateDoc is available or use what we have? No, cannot use what we don't have.
            // I'll add the logic call here.
            await import('firebase/firestore').then(module => {
                module.updateDoc(docRef, { votes: newVotes });
            });
        } catch (error) {
            console.error("Error voting:", error);
            alert("투표 실패");
        }
    };

    // Filter schedules for the selected date on calendar
    const selectedDateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const filteredSchedules = schedules.filter(s => s.date === selectedDateStr);

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toLocaleDateString('en-CA');
            const hasEvent = schedules.some(s => s.date === dateStr);
            if (hasEvent) {
                return <div style={{ height: '6px', width: '6px', background: '#f87171', borderRadius: '50%', margin: '2px auto' }}></div>
            }
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Calendar Section */}
            <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', margin: 0 }}>
                        <CalendarIcon className="text-accent" /> 모험 일정 (Calendar)
                    </h2>
                    <button
                        onClick={() => {
                            setNewItem(prev => ({ ...prev, date: selectedDateStr })); // Pre-fill date
                            setShowModal(true);
                        }}
                        className="glass-button"
                        style={{ background: 'var(--accent-color)', border: 'none' }}
                    >
                        <Plus size={18} /> 일정 추가
                    </button>
                </div>

                <style>{`
                    .react-calendar { background: transparent !important; border: none !important; width: 100% !important; color: white !important; font-family: inherit; }
                    .react-calendar__navigation button { color: white; min-width: 44px; background: none; font-size: 1.2rem; }
                    .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: rgba(255,255,255,0.1); }
                    .react-calendar__month-view__weekdays { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 0.8em; opacity: 0.7; color: var(--accent-color); }
                    .react-calendar__month-view__days__day { color: white; padding: 15px; background: transparent; border: none; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: rgba(255,255,255,0.1); border-radius: 12px; }
                    .react-calendar__tile--now { background: rgba(255,255,255,0.1) !important; border-radius: 12px; }
                    .react-calendar__tile--active { background: var(--accent-color) !important; color: white !important; border-radius: 12px; }
                    .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.3; }
                `}</style>

                <Calendar
                    onChange={setDate}
                    value={date}
                    tileContent={tileContent}
                    formatDay={(locale, date) => date.getDate()} // 숫자만 표시
                />
            </div>

            {/* List Section for Selected Date */}
            <div className="glass-panel" style={{ padding: '20px', minHeight: '200px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    {date.toLocaleDateString()} 일정 목록
                </h3>

                {loading ? <p>로딩 중...</p> :
                    filteredSchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>이 날짜에 등록된 일정이 없습니다.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {filteredSchedules.map((item) => (
                                <div key={item.id} style={{
                                    background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{
                                            fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px',
                                            background: item.type === 'raid' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(96, 165, 250, 0.2)',
                                            color: item.type === 'raid' ? '#fca5a5' : '#93c5fd'
                                        }}>
                                            {item.type === 'raid' ? '⚔️ 레이드' : '📜 스토리'}
                                        </span>
                                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h4 style={{ margin: '5px 0', fontSize: '1.1rem' }}>{item.title}</h4>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.7, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock size={14} /> {item.time}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Users size={14} /> {item.members.join(', ')}
                                        </div>
                                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => handleVote(item.id, item.votes)}
                                                style={{
                                                    padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                                    background: item.votes?.includes(user?.nickname) ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                                    color: 'white', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                👍 투표 {item.votes?.length || 0}
                                            </button>
                                        </div>
                                    </div>
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
                    <div
                        className="glass-panel"
                        style={{ width: '400px', padding: '30px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>새 일정 추가</h3>
                        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder="일정 제목 (예: 3막 보스전)"
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                required
                                style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="date"
                                    value={newItem.date}
                                    onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                                />
                                <input
                                    type="time"
                                    value={newItem.time}
                                    onChange={e => setNewItem({ ...newItem, time: e.target.value })}
                                    required
                                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                                />
                            </div>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                            >
                                <option value="raid" style={{ color: 'black' }}>⚔️ 레이드/전투</option>
                                <option value="story" style={{ color: 'black' }}>📜 스토리 진행</option>
                            </select>
                            <input
                                placeholder="참여 멤버 (쉼표로 구분)"
                                value={newItem.members}
                                onChange={e => setNewItem({ ...newItem, members: e.target.value })}
                                style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>
                                    취소
                                </button>
                                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    등록
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RaidScheduler;
