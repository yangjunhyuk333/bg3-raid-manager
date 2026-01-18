import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, serverTimestamp } from 'firebase/firestore';

const ChatRoom = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Firestore 실시간 리스너 연결
        const q = query(
            collection(db, "chats"),
            orderBy("timestamp", "asc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // 타임스탬프 처리 (서버 시간은 null일 수 있음)
                timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
            }));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const text = input;
        setInput(''); // UI 즉시 초기화

        try {
            await addDoc(collection(db, "chats"), {
                text: text,
                sender: user?.nickname || 'Anonymous',
                uid: user?.id || 'guest',
                userClass: user?.className || 'Unknown',
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("메시지 전송 실패!");
        }
    };

    return (
        <div className="glass-panel" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot color="#4fd1c5" /> 파티 작전 회의실
                </h2>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>레이드 일정과 전략을 논의하세요. (실시간)</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loading && <div style={{ textAlign: 'center', opacity: 0.5 }}>채팅방 연결 중...</div>}
                {messages.map((msg) => {
                    const isMe = user ? (msg.uid === user.id) : false;
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

            <form onSubmit={handleSend} style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex', gap: '10px',
                borderRadius: '0 0 16px 16px'
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="작전을 전달하세요..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                }}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatRoom;
