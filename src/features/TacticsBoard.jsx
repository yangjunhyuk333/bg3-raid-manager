import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Flag, Plus, X, Image as ImageIcon, MessageSquare, Trash2 } from 'lucide-react';

const TacticsBoard = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', image: null });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user?.campId) return;

        const q = query(
            collection(db, "tactics"),
            where("campId", "==", user.campId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(data);
        });
        return () => unsubscribe();
    }, [user?.campId]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) return alert("이미지는 1MB 이하여야 합니다."); // 1MB limit for safety
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPost(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.title || !user.campId) return;

        try {
            await addDoc(collection(db, "tactics"), {
                ...newPost,
                campId: user.campId,
                author: user.nickname,
                createdAt: serverTimestamp(),
            });
            setShowModal(false);
            setNewPost({ title: '', content: '', image: null });
        } catch (error) {
            console.error(error);
            alert("게시 실패");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("삭제하시겠습니까?")) {
            await deleteDoc(doc(db, "tactics", id));
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '80px' }}>
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Flag className="text-accent" /> 전술 게시판 (Tactics Board)
                    </h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>공략과 팁을 공유하세요.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        background: 'var(--accent-color)', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                >
                    <Plus size={18} /> 전술 공유
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {posts.map(post => (
                    <div key={post.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {post.image && (
                            <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#000' }}>
                                <img src={post.image} alt="tactic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ padding: '20px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{post.title}</h3>
                                {(user.isAdmin || user.nickname === post.author) && (
                                    <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{post.content}</p>
                        </div>
                        <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
                            <span>by {post.author}</span>
                            {post.createdAt && <span>{new Date(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt).toLocaleDateString()}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div className="glass-panel" style={{ width: '500px', padding: '30px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px' }}>새 전술 공유</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder="제목 (예: 라파엘 전투 포지셔닝)"
                                value={newPost.title}
                                onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                required
                                style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px' }}
                            />

                            <textarea
                                placeholder="내용을 입력하세요..."
                                value={newPost.content}
                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                rows={5}
                                style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', resize: 'vertical' }}
                            />

                            <div style={{ border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                                {newPost.image ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img src={newPost.image} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px' }} />
                                        <button type="button" onClick={() => setNewPost({ ...newPost, image: null })} style={{ position: 'absolute', top: -10, right: -10, background: 'red', borderRadius: '50%', width: '24px', height: '24px', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <ImageIcon size={32} />
                                        <span>이미지 추가 (스크린샷 등)</span>
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>취소</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: 'white', cursor: 'pointer' }}>게시</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TacticsBoard;
