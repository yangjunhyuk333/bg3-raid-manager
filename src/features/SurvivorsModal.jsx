import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Bell, Meh } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const SurvivorsModal = ({ user, onClose }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.campId) return;

        const q = query(
            collection(db, "users_v2"),
            where("campId", "==", user.campId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                const lastSeenMillis = d.lastSeen?.toMillis ? d.lastSeen.toMillis() : 0;
                // Online if lastSeen < 2 mins ago
                const isOnline = (now - lastSeenMillis) < 2 * 60 * 1000;
                return {
                    id: doc.id,
                    ...d,
                    isOnline,
                    lastSeenAgo: Math.floor((now - lastSeenMillis) / 60000) // minutes
                };
            });
            // Sort: Online first, then Name
            data.sort((a, b) => {
                if (a.isOnline === b.isOnline) return a.nickname.localeCompare(b.nickname);
                return b.isOnline ? 1 : -1;
            });

            setMembers(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    const handleWakeUp = async (targetUser) => {
        if (!window.confirm(`${targetUser.nickname}님을 정말 깨우시겠습니까? (알림 발송)`)) return;

        try {
            await addDoc(collection(db, "camps", user.campId, "notifications"), {
                type: 'WAKE_UP',
                targetUid: targetUser.id,
                sender: user.nickname,
                read: false,
                timestamp: serverTimestamp()
            });
            alert("⏰ 기상 나팔을 불었습니다!");
        } catch (e) {
            console.error(e);
            alert("알림 발송 실패");
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users className="text-accent" /> 생존자 목록 ({members.filter(m => m.isOnline).length}명 접속)
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.5, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {loading ? <p style={{ textAlign: 'center', opacity: 0.5 }}>명단 확인 중...</p> :
                        members.map(member => (
                            <div key={member.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px', borderRadius: '12px',
                                background: member.isOnline ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                border: member.isOnline ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: member.isOnline ? '#4ade80' : '#94a3b8',
                                        boxShadow: member.isOnline ? '0 0 10px #4ade80' : 'none'
                                    }} />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{member.nickname} {member.id === user.id && <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(나)</span>}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                            {member.className} • {member.isOnline ? '온라인' : `${member.lastSeenAgo}분 전 접속`}
                                        </div>
                                    </div>
                                </div>

                                {!member.isOnline && member.id !== user.id && (
                                    <button
                                        onClick={() => handleWakeUp(member)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '20px', border: 'none',
                                            background: 'rgba(255,255,255,0.1)', color: 'white',
                                            fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                        }}
                                    >
                                        <Bell size={12} /> 깨우기
                                    </button>
                                )}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SurvivorsModal;
