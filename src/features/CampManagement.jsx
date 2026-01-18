import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, arrayRemove, getDocs, writeBatch } from 'firebase/firestore';
import { Shield, User, Trash2, Crown, Ban, AlertTriangle } from 'lucide-react';

const CampManagement = ({ user }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.campId) return;

        // Fetch users belonging to this camp
        const q = query(
            collection(db, "users_v2"),
            where("campId", "==", user.campId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMembers(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    const handleKick = async (targetUser) => {
        if (!window.confirm(`정말 '${targetUser.nickname}' 님을 영지에서 추방하시겠습니까?`)) return;

        try {
            // 1. Delete User Doc
            await deleteDoc(doc(db, "users_v2", targetUser.id));

            // 2. Remove from Camp Members Array
            const campRef = doc(db, "camps", user.campId);
            await updateDoc(campRef, {
                members: arrayRemove(targetUser.nickname)
            });

            alert("추방되었습니다.");
        } catch (e) {
            console.error("Kick failed:", e);
            alert("추방 실패: " + e.message);
        }
    };

    const handleDestroyCamp = async () => {
        const confirmMsg = "⚠️ 경고: 영지를 폭파하면 모든 데이터와 멤버가 삭제됩니다.\n정말 이 야영지를 해체하시겠습니까?";
        if (!window.confirm(confirmMsg)) return;

        const doubleCheck = prompt("영지를 삭제하려면 '영지 폭파'라고 입력하세요.");
        if (doubleCheck !== "영지 폭파") return alert("취소되었습니다.");

        try {
            setLoading(true);
            const batch = writeBatch(db);

            // 1. Delete Camp Doc
            const campRef = doc(db, "camps", user.campId);
            batch.delete(campRef);

            // 2. Delete All Members
            // (Client-side loop for batch - limits at 500, but we have max 4)
            members.forEach(m => {
                const userRef = doc(db, "users_v2", m.id);
                batch.delete(userRef);
            });

            // 3. Delete Camp Chats (Optional but good for cleanup)
            const chatsQ = query(collection(db, "chats"), where("campId", "==", user.campId));
            const chatSnap = await getDocs(chatsQ);
            chatSnap.forEach(c => {
                batch.delete(c.ref);
            });

            await batch.commit();

            alert("야영지가 역사 속으로 사라졌습니다.");
            window.location.reload(); // Force reload to clear state and go to landing

        } catch (e) {
            console.error("Destroy failed:", e);
            alert("삭제 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px', border: '1px solid var(--accent-color)', background: 'rgba(50, 0, 0, 0.3)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px', color: '#fca5a5' }}>
                    <Shield /> 영주 관리실 (Admin)
                </h2>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                    현재 야영지: <b>{user.campId}</b> <br />
                    권한: <span style={{ color: 'var(--accent-color)' }}>Master</span>
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>대원 목록 ({members.length}/4)</h3>
                </div>

                {members.map((u) => (
                    <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{
                                width: '45px', height: '45px', borderRadius: '50%',
                                background: u.isAdmin ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {u.isAdmin ? <Crown size={22} color="white" /> : <User size={22} />}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                    {u.nickname}
                                    <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', opacity: 0.8 }}>
                                        {u.className || '모험가'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '4px' }}>
                                    {u.isAdmin ? '영주 (Leader)' : '대원 (Member)'}
                                </div>
                            </div>
                        </div>

                        {!u.isAdmin && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm(`'${u.nickname}' 님을 관리자로 임명하시겠습니까?`)) return;
                                        try {
                                            const { updateDoc, doc } = await import('firebase/firestore');
                                            await updateDoc(doc(db, "users_v2", u.id), { isAdmin: true, role: 'Admin' });
                                            alert(`${u.nickname} 님이 관리자가 되었습니다.`);
                                        } catch (e) {
                                            console.error(e);
                                            alert("권한 부여 실패: " + e.message);
                                        }
                                    }}
                                    style={{
                                        padding: '10px 15px', borderRadius: '8px',
                                        background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)',
                                        color: '#4ade80', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <Crown size={16} /> 임명
                                </button>
                                <button
                                    onClick={() => handleKick(u)}
                                    style={{
                                        padding: '10px 15px', borderRadius: '8px',
                                        background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)',
                                        color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <Ban size={16} /> 추방
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {members.length === 0 && !loading && (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>멤버가 없습니다.</div>
                )}
            </div>

            <div style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle /> 위험 구역
                </h3>
                <div className="glass-panel" style={{ borderColor: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                    <div>
                        <h4 style={{ margin: '0 0 5px' }}>영지 폭파</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>이 야영지의 모든 데이터를 영구적으로 삭제합니다.</p>
                    </div>
                    <button
                        onClick={handleDestroyCamp}
                        style={{
                            background: '#ef4444', color: 'white', border: 'none',
                            padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        폭파 실행
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampManagement;
