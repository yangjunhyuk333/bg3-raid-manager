import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Image as ImageIcon, X, Loader2, ArrowLeft, Sword, Music, Heart, Leaf, Zap, Shield, Target, Ghost, Flame, Skull, Wand2, Axe } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, limit, serverTimestamp, where, doc, setDoc } from 'firebase/firestore';

const ChatRoom = ({ user, isMobile, setActiveTab }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState(null); // Base64 string
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastTypingRef = useRef(0);

    // Helper: Get Icon
    const getClassIcon = (cls) => {
        if (!cls) return User;
        if (cls.includes('바바리안')) return Axe;
        if (cls.includes('바드')) return Music;
        if (cls.includes('클레릭')) return Heart;
        if (cls.includes('드루이드')) return Leaf;
        if (cls.includes('파이터')) return Sword;
        if (cls.includes('몽크')) return Zap;
        if (cls.includes('팔라딘')) return Shield;
        if (cls.includes('레인저')) return Target;
        if (cls.includes('로그')) return Ghost;
        if (cls.includes('소서러')) return Flame;
        if (cls.includes('워락')) return Skull;
        if (cls.includes('위자드')) return Wand2;
        return User;
    };

    // 1. Message Listener
    useEffect(() => {
        if (!user?.campId) return;

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
            msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    // 2. Typing Listener
    useEffect(() => {
        if (!user?.campId) return;

        // Listen to all typing statuses in this camp
        const q = query(collection(db, "camps", user.campId, "typing"));

        const unsub = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const users = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(d => d.id !== user.id && d.timestamp && (now - d.timestamp.toMillis() < 4000)); // 4s threshold

            setTypingUsers(users);
        });

        // Prune stale typing users locally every second
        const pruneInterval = setInterval(() => {
            setTypingUsers(prev => {
                const now = Date.now();
                return prev.filter(u => u.timestamp?.toMillis && (now - u.timestamp.toMillis() < 4000));
            });
        }, 1000);

        return () => {
            unsub();
            clearInterval(pruneInterval);
        };
    }, [user?.campId, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]); // Scroll when typing appears too

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) {
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

    const handleInputChange = async (e) => {
        const val = e.target.value;
        setInput(val);

        // Throttle typing updates to Firestore (every 2s)
        const now = Date.now();
        if (val.trim() && now - lastTypingRef.current > 2000 && user?.campId) {
            lastTypingRef.current = now;
            try {
                // Defines user as typing
                await setDoc(doc(db, "camps", user.campId, "typing", user.id), {
                    nickname: user.nickname,
                    timestamp: serverTimestamp() // Server time is best for syncing
                });
            } catch (err) {
                console.error("Typing status error", err);
            }
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
                image: imageToSend,
                sender: user.nickname,
                uid: user.id,
                userClass: user.className || 'Unknown',
                userColor: user.color || '#a78bfa',
                campId: user.campId,
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
            position: isMobile ? 'fixed' : 'relative', // Fixed on mobile
            top: 0, left: 0, right: 0, bottom: 0,
            height: isMobile ? '100dvh' : '100%', // Full height
            background: isMobile ? '#0f0f13' : 'rgba(0,0,0,0.2)', // Solid dark on mobile
            zIndex: 2000, // Top layer
        }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: isMobile ? 'rgba(20,20,30,0.95)' : 'transparent', display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isMobile && (
                    <button
                        onClick={() => setActiveTab('home')}
                        style={{ background: 'none', border: 'none', color: 'white', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bot color="#4fd1c5" size={20} /> 파티 작전 회의실
                    </h2>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginTop: '2px' }}>🔒 {user.campId} 야영지</span>
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
                    const Icon = getClassIcon(msg.userClass);
                    const color = msg.userColor || '#a78bfa';

                    return (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            marginBottom: '10px'
                        }}>
                            {!isMe && (
                                <div style={{ fontSize: '0.8rem', marginLeft: '46px', marginBottom: '4px', opacity: 0.7 }}>
                                    {msg.sender}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '85%' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 2px 8px ${color}66`,
                                    flexShrink: 0
                                }}>
                                    <Icon size={20} color="white" />
                                </div>

                                {/* Bubble */}
                                <div style={{
                                    background: isMe ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)',
                                    padding: '12px 16px',
                                    borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', // Point towards avatar
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    wordBreak: 'break-word',
                                    color: 'white'
                                }}>
                                    {msg.image && (
                                        <img src={msg.image} alt="attached" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', marginBottom: msg.text ? '10px' : '0' }} />
                                    )}
                                    {msg.text}
                                </div>
                            </div>

                            <span style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '4px', marginRight: isMe ? '46px' : '0', marginLeft: isMe ? '0' : '46px' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}

                {/* Visual Typing Indicator (Messenger Style) */}
                {typingUsers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', paddingLeft: '4px' }}>
                        {typingUsers.slice(0, 3).map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', opacity: 0.9 }}>
                                {/* Avatar Placeholder */}
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 'bold', color: 'white',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    {u.nickname ? u.nickname.charAt(0) : <User size={14} />}
                                </div>
                                {/* Typing Bubble */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '16px 16px 16px 2px',
                                    padding: '8px 12px',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    height: '32px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                                {/* Optional Name Label */}
                                <span style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>{u.nickname} 입력 중...</span>
                            </div>
                        ))}
                    </div>
                )}

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
                        onChange={handleInputChange}
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
