import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Shield, UserWithEvent, Trash2, Ban, Crown } from 'lucide-react';

const CampManagement = ({ user }) => {
    const [users, setUsers] = useState([]);

    // Mock data for now if real users aren't in key-value store yet, 
    // but assuming we might have a 'users' collection or just using the mock list for UI structure as per "Fast Restoration"
    // Since the previous chat implies we "lost" the firebase backend structure for users, 
    // I will implement a UI that *would* connect to a 'users' collection.
    // For immediate satisfaction, I will mock a list if empty, but wire up the listeners.

    useEffect(() => {
        // This would be the real connection. 
        // For safely rendering something immediately even if collection is empty:
        const q = query(collection(db, "users"), orderBy("joinedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(data);
        }, (error) => {
            console.log("No users collection yet, using mock for UI demo");
            setUsers([
                { id: '1', nickname: 'Astarion', class: 'Rogue', role: 'user', joinedAt: new Date() },
                { id: '2', nickname: 'Gale', class: 'Wizard', role: 'user', joinedAt: new Date() },
                { id: '3', nickname: 'Shadowheart', class: 'Cleric', role: 'admin', joinedAt: new Date() },
                { id: '4', nickname: 'Lae\'zel', class: 'Fighter', role: 'user', joinedAt: new Date() },
            ]);
        });
        return () => unsubscribe();
    }, []);

    const handleKick = async (id, name) => {
        if (confirm(`${name}님을 야영지에서 추방하시겠습니까?`)) {
            try {
                await deleteDoc(doc(db, "users", id));
                alert("추방 완료");
            } catch (e) {
                alert("시스템 오류: " + e.message);
            }
        }
    };

    const handlePromote = async (id) => {
        if (confirm("이 유저를 관리자로 승격하시겠습니까?")) {
            try {
                await updateDoc(doc(db, "users", id), { role: 'admin' });
            } catch (e) {
                alert("승격 실패 (DB 권한 확인 필요)");
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--accent-color)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Shield color="var(--accent-color)" /> 야영지 관리 (Admin)
                </h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                    야영지에 머무는 대원들을 관리하고 역할을 배정합니다.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                {users.map((u, i) => (
                    <div key={u.id || i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '15px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: u.role === 'admin' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {u.role === 'admin' ? <Crown size={20} color="white" /> : <UserWithEvent size={20} />}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {u.nickname}
                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', opacity: 0.7 }}>
                                        {u.class || 'Unknown'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                                    {u.role === 'admin' ? '관리자 (GM)' : '일반 대원'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {u.role !== 'admin' && (
                                <>
                                    <button onClick={() => handlePromote(u.id)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: 'none', cursor: 'pointer' }} title="관리자 승격">
                                        <Shield size={16} />
                                    </button>
                                    <button onClick={() => handleKick(u.id, u.nickname)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: 'none', cursor: 'pointer' }} title="추방">
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        데이터 로딩 중...
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampManagement;
