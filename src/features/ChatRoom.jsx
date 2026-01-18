import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Image as ImageIcon, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp, where } from 'firebase/firestore';

const ChatRoom = ({ user, isMobile }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState(null); // Base64 string
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user?.campId) return;

        // Firestore 실시간 리스너 (CampId 필터링)
        // Firestore 실시간 리스너 (CampId 필터링)
        // orderBy를 제거하여 복합 색인(Composite Index) 없이도 동작하도록 수정 (클라이언트 정렬)
        const q = query(
            collection(db, "chats"),
            where("campId", "==", user.campId),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
            }));

            // Client-side Sort
            msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB Limit
                alert("이미지 크기는 500KB 이하여야 합니다.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !imagePreview) || !user?.campId) return;

        const textToSend = input;
        const imageToSend = imagePreview;

        setInput('');
        setImagePreview(null);

        try {
            await addDoc(collection(db, "chats"), {
                text: textToSend,
                image: imageToSend, // Base64
                sender: user.nickname,
                uid: user.id,
                userClass: user.className || 'Unknown',
                campId: user.campId, // Scope to Camp
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("전송 실패!");
        }
    };

    if (!user?.campId) {
        return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>야영지에 소속되어 있지 않습니다.</div>;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? 'env(safe-area-inset-top)' : 0,
            left: isMobile ? 0 : 0,
            right: isMobile ? 0 : 0,
            bottom: isMobile ? 'calc(75px + env(safe-area-inset-bottom))' : 0,  // Increased base to 75px
            background: isMobile ? 'rgba(20, 20, 30, 0.95)' : 'transparent',
            zIndex: 50
        }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot color="#4fd1c5" /> 파티 작전 회의실
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>🔒 {user.campId} 야영지 (보안 연결됨)</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loading && <div style={{ textAlign: 'center', opacity: 0.5 }}>채팅방 연결 중...</div>}

                {messages.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '20px' }}>
                        <p>아직 대화가 없습니다.</p>
                        <p>작전을 시작해보세요!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.uid === user.id;
                    return (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{
                                fontSize: '0.8rem', marginBottom: '4px', opacity: 0.7,
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                {!isMe && (
                                    <>
                                        <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[{msg.userClass}]</span>
                                        {msg.sender}
                                    </>
                                )}
                            </div>
                            <div style={{
                                background: isMe ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                                padding: '12px 16px',
                                borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                maxWidth: '70%',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                backdropFilter: 'blur(5px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                wordBreak: 'break-word'
                            }}>
                                {msg.image && (
                                    <img src={msg.image} alt="attached" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '10px' : '0' }} />
                                )}
                                {msg.text}
                            </div>
                            <span style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '4px' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', gap: '10px',
                borderRadius: '0 0 16px 16px'
            }}>
                {imagePreview && (
                    <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img src={imagePreview} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} />
                        <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            style={{ position: 'absolute', top: -5, right: -5, background: 'red', borderRadius: '50%', border: 'none', color: 'white', padding: '2px', cursor: 'pointer' }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <ImageIcon size={20} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="작전을 전달하세요..."
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none'
                        }}
                    />
                    <button type="submit" style={{
                        padding: '12px', borderRadius: '12px',
                        background: 'var(--accent-color)', color: 'white',
                        border: 'none', cursor: 'pointer'
                    }}>
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatRoom;
