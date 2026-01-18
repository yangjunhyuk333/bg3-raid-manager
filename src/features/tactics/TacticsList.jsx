import React, { useState, useEffect } from 'react';
import { Plus, Search, Map, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const TacticsList = ({ user, onSelectTactic }) => {
    const [tactics, setTactics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (!user?.campId) return;

        const q = query(
            collection(db, "tactics"),
            where("campId", "==", user.campId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTactics(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tactics:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        if (!user.campId) {
            alert("소속된 영지 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }

        try {
            console.log("Creating tactic...", { campId: user.campId, author: user.nickname, title: newTitle });
            await addDoc(collection(db, "tactics"), {
                campId: user.campId,
                authorId: user.id || user.nickname, // Fallback
                authorName: user.nickname,
                title: newTitle,
                description: newDesc,
                createdAt: serverTimestamp(),
                elements: [] // Empty canvas initially
            });
            console.log("Tactic created successfully");
            setShowCreateModal(false);
            setNewTitle('');
            setNewDesc('');
        } catch (error) {
            console.error("Error creating tactic:", error);
            alert("전술판 생성 실패: " + error.code + " - " + error.message);
        }
    };

    const handleDelete = async (e, tacticId) => {
        e.stopPropagation();
        if (!confirm("정말로 이 전술판을 삭제하시겠습니까?")) return;

        try {
            await deleteDoc(doc(db, "tactics", tacticId));
        } catch (error) {
            console.error("Error deleting tactic:", error);
            alert("삭제 실패");
        }
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Map className="text-accent" />
                        전술 작전실
                    </h2>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '5px' }}>
                        파티원들과 함께 작전을 수립하고 공유하세요.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-button"
                    style={{
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                    }}
                >
                    <Plus size={20} />
                    새 작전 수립
                </button>
            </div>

            {/* List Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>로딩 중...</div>
            ) : tactics.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                    <Map size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>아직 수립된 작전이 없습니다.</p>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>새 작전 수립 버튼을 눌러 첫 번째 전술판을 만들어보세요.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {tactics.map(tactic => (
                        <div
                            key={tactic.id}
                            onClick={() => onSelectTactic(tactic)}
                            className="glass-panel"
                            style={{
                                padding: '0', cursor: 'pointer', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', height: '220px',
                                transition: 'all 0.2s', position: 'relative'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {/* Preview Area (Placeholder for now) */}
                            <div style={{
                                flex: 2, background: 'rgba(0,0,0,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Map size={32} style={{ opacity: 0.1 }} />
                            </div>

                            {/* Info Area */}
                            <div style={{ flex: 1, padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                        {tactic.title}
                                    </h3>
                                    {(user.isAdmin || user.id === tactic.authorId) && (
                                        <button
                                            onClick={(e) => handleDelete(e, tactic.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {tactic.description || '설명 없음'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', opacity: 0.4 }}>
                                    <span>{tactic.authorName}</span>
                                    <span>{tactic.createdAt?.toDate().toLocaleDateString() || '방금 전'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>새 작전 수립</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>작전명</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="예: 3막 보스 공략"
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>설명 (선택)</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="작전에 대한 간단한 설명을 입력하세요."
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', minHeight: '80px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>취소</button>
                                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>생성하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TacticsList;
