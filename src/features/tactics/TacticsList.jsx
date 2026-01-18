import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Map, Calendar, MoreVertical, Trash2, RefreshCw, Maximize2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import TacticsEditor from './TacticsEditor';

const TacticsList = ({ user, initialTacticId, clearInitialTactic }) => {
    const [tactics, setTactics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTactic, setSelectedTactic] = useState(null);

    // Create Form
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        if (!user?.campId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "tactics"),
            where("campId", "==", user.campId)
            // orderBy("createdAt", "desc") // Removed to avoid index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tacticsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sorting
            tacticsData.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

            setTactics(tacticsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tactics:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    // Handle deep link
    useEffect(() => {
        if (initialTacticId && tactics.length > 0) {
            const target = tactics.find(t => t.id === initialTacticId);
            if (target) {
                setSelectedTactic(target);
                if (clearInitialTactic) clearInitialTactic();
            }
        }
    }, [initialTacticId, tactics, clearInitialTactic]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        if (!user.campId) {
            alert("소속된 영지 정보가 없습니다.");
            return;
        }

        try {
            const docData = {
                campId: user.campId,
                authorId: user.id || user.nickname,
                authorName: user.nickname,
                title: newTitle,
                description: newDesc,
                createdAt: serverTimestamp(),
                elements: []
            };
            const docRef = await addDoc(collection(db, "tactics"), docData);

            setShowCreateModal(false);
            setNewTitle('');
            setNewDesc('');
            // Open modal immediately
            setSelectedTactic({ id: docRef.id, ...docData });
        } catch (error) {
            console.error("Error creating tactic:", error);
            alert("전술판 생성 실패: " + error.message);
        }
    };

    const handleDelete = async (e, tacticId) => {
        e.stopPropagation();
        if (!confirm("정말로 이 전술판을 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "tactics", tacticId));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <Map className="text-accent" style={{ stroke: 'var(--accent-color)' }} />
                        전술 작전실
                    </h2>
                    <p style={{ opacity: 0.6, fontSize: '0.95rem', marginTop: '5px' }}>
                        팀원들과 실시간으로 전술을 공유하세요.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-button"
                    style={{
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
                        transition: 'all 0.2s', fontSize: '1rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Plus size={20} />
                    새 작전
                </button>
            </div>

            {/* List Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                    <RefreshCw className="spin" size={30} style={{ marginBottom: '10px' }} />
                    <p>전술 데이터를 불러오는 중...</p>
                </div>
            ) : tactics.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 20px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: '24px',
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                    <Map size={60} style={{ opacity: 0.2, marginBottom: '20px' }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>아직 수립된 작전이 없습니다.</p>
                    <button onClick={() => setShowCreateModal(true)} style={{ color: 'var(--accent-color)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', textDecoration: 'underline' }}>
                        새 작전 수립하기
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', padding: '10px' }}>
                    {tactics.map(tactic => (
                        <div
                            key={tactic.id}
                            onClick={() => setSelectedTactic(tactic)}
                            className="glass"
                            style={{
                                cursor: 'pointer', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', height: '200px',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', position: 'relative',
                                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.3)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }}
                        >
                            {/* Card Content */}
                            <div style={{
                                padding: '25px', flex: 1, display: 'flex', flexDirection: 'column',
                                background: 'radial-gradient(circle at top right, rgba(212, 160, 23, 0.05), transparent 70%)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <h3 style={{
                                        margin: 0, fontSize: '1.2rem', fontWeight: 'bold',
                                        color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        lineHeight: 1.3
                                    }}>
                                        {tactic.title}
                                    </h3>
                                    {(user.isAdmin || user.id === tactic.authorId) && (
                                        <button
                                            onClick={(e) => handleDelete(e, tactic.id)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444',
                                                borderRadius: '8px', padding: '6px', cursor: 'pointer', marginLeft: '10px'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <p style={{
                                    margin: 0, fontSize: '0.9rem', opacity: 0.6,
                                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                                    flex: 1
                                }}>
                                    {tactic.description || '추가 설명이 없습니다.'}
                                </p>
                                <div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)' }} />
                                        {tactic.authorName}
                                    </span>
                                    <span>{tactic.createdAt?.toDate?.() ? tactic.createdAt.toDate().toLocaleDateString() : '..'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)} style={{ alignItems: 'flex-start', paddingTop: '100px' }}>
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
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', fontSize: '1rem' }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', opacity: 0.7 }}>설명</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="작전에 대한 간단한 설명을 입력하세요."
                                    style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', minHeight: '100px', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}>취소</button>
                                <button type="submit" style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--accent-color)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>생성하기</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Editor Modal Popup (Not Full Screen initially) */}
            {selectedTactic && createPortal(
                <div className="modal-overlay" onClick={() => {
                    // Optional: Click outside to close? dangerous for editor.
                    // Better to require explicitly clicking close.
                }} style={{ alignItems: 'center', background: 'rgba(0,0,0,0.85)' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                        width: '95%', height: '85vh', maxWidth: '1400px', maxHeight: '1000px',
                        padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        background: '#111116', border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)'
                    }}>
                        {/* Editor Container */}
                        <TacticsEditor
                            user={user}
                            tacticId={selectedTactic.id}
                            initialData={selectedTactic}
                            onBack={() => setSelectedTactic(null)} // This will be X button inside
                            isMobile={false} // Force desktop layout inside modal usually, or check window width
                            isModal={true}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TacticsList;
