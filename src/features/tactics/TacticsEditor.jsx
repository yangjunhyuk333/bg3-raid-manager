import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, MousePointer, Type, Square, Image as ImageIcon, Move, Plus, Sparkles, User, Skull, Youtube, ExternalLink, PlayCircle, Users, Edit } from 'lucide-react';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const TacticsEditor = ({ user, tacticId, initialData, onBack, isMobile, isStandalone }) => {
    // 1. Canvas State
    const [elements, setElements] = useState(initialData?.elements || []);
    const [viewport, setViewport] = useState(initialData?.viewState || { x: 0, y: 0, scale: 1 });
    const [selectedId, setSelectedId] = useState(null);
    const [mode, setMode] = useState('select'); // select, text, npc, mob, member, video

    // Text Editing
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // Interaction State
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Persistence State
    const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error

    const canvasRef = useRef(null);
    const saveTimeout = useRef(null);
    const isRemoteUpdate = useRef(false);

    // 2. Real-time Sync (Listen)
    // State Refs for Subscription Check
    const isDraggingElementRef = useRef(isDraggingElement);
    const isDraggingCanvasRef = useRef(isDraggingCanvas);
    const editingIdRef = useRef(editingId);

    useEffect(() => { isDraggingElementRef.current = isDraggingElement; }, [isDraggingElement]);
    useEffect(() => { isDraggingCanvasRef.current = isDraggingCanvas; }, [isDraggingCanvas]);
    useEffect(() => { editingIdRef.current = editingId; }, [editingId]);

    // 2. Real-time Sync (Listen)
    useEffect(() => {
        if (!tacticId) return;

        const unsub = onSnapshot(doc(db, "tactics", tacticId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                // Check Refs to ensure we don't interrupt active user interaction
                if (!isDraggingElementRef.current && !isDraggingCanvasRef.current && !editingIdRef.current) {
                    isRemoteUpdate.current = true;
                    // Only update if data is different? React handles diffing, but setElements triggers save loop.
                    // isRemoteUpdate flag prevents loop.
                    setElements(data.elements || []);
                }
            }
        });

        return () => unsub();
    }, [tacticId]);

    // 2. Auto Save Logic (Write)
    const saveToFirestore = useCallback((newElements) => {
        setSaveStatus('saving');
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            if (!tacticId || !user?.nickname) return;

            // Simple empty guard - allow empty if it was explicit, but prevent init overwrite?
            // If initialized with empty [], we shouldn't save unless user did something.
            // But here, elements HAS changed (dependency). So we should save.

            try {
                const tacticRef = doc(db, "tactics", tacticId);
                await updateDoc(tacticRef, {
                    elements: newElements,
                    lastModified: serverTimestamp(),
                    lastModifiedBy: user.nickname
                });
                setSaveStatus('saved');
            } catch (e) {
                console.error("Save failed", e);
                setSaveStatus('error');
            }
        }, 1000); // 1s Debounce
    }, [tacticId, user.nickname]);

    useEffect(() => {
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }
        // Only save if we have initial data loaded or user interaction
        saveToFirestore(elements);
    }, [elements, saveToFirestore]);


    // 3. Canvas Interaction Handlers
    const handlePointerDown = (e) => {
        if (mode === 'select' && e.target === canvasRef.current) {
            e.target.setPointerCapture(e.pointerId);
            setIsDraggingCanvas(true);
            setLastPointer({ x: e.clientX, y: e.clientY });
            setSelectedId(null);
            setEditingId(null); // Stop editing
        }
    };

    const handleElementPointerDown = (e, el) => {
        e.stopPropagation();
        if (mode !== 'select') return;

        e.currentTarget.setPointerCapture(e.pointerId);

        setSelectedId(el.id);
        setIsDraggingElement(true);

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const clientXInCanvas = e.clientX - canvasRect.left;
        const clientYInCanvas = e.clientY - canvasRect.top;

        const unscaledCanvasX = (clientXInCanvas - viewport.x) / viewport.scale;
        const unscaledCanvasY = (clientYInCanvas - viewport.y) / viewport.scale;

        setDragOffset({
            x: unscaledCanvasX - el.x,
            y: unscaledCanvasY - el.y
        });
        setLastPointer({ x: e.clientX, y: e.clientY });
    };

    const startEditing = (el) => {
        if (el.type === 'text') {
            setEditingId(el.id);
            setEditText(el.content);
        } else if (el.type === 'video') {
            const currentUrl = el.content.startsWith('http') ? el.content : '';
            const url = prompt("유튜브 영상 URL을 입력하세요:", currentUrl);
            if (url) {
                updateElement(el.id, { content: url });
            }
        }
    };

    const handleElementDoubleClick = (e, el) => {
        e.stopPropagation();
        startEditing(el);
    };

    const handleEditSelected = () => {
        const el = elements.find(e => e.id === selectedId);
        if (el) startEditing(el);
    };

    const handlePointerMove = (e) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - lastPointer.x;
            const dy = e.clientY - lastPointer.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastPointer({ x: e.clientX, y: e.clientY });
        }

        if (isDraggingElement && selectedId) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            // Calculate delta instead of absolute position re-calc to avoid drift?
            // Existing logic: Re-calculate absolute position based on mouse pos - offset.

            const clientXInCanvas = e.clientX - canvasRect.left;
            const clientYInCanvas = e.clientY - canvasRect.top;
            const unscaledCanvasX = (clientXInCanvas - viewport.x) / viewport.scale;
            const unscaledCanvasY = (clientYInCanvas - viewport.y) / viewport.scale;

            setElements(prev => prev.map(el =>
                el.id === selectedId
                    ? { ...el, x: unscaledCanvasX - dragOffset.x, y: unscaledCanvasY - dragOffset.y }
                    : el
            ));
            setLastPointer({ x: e.clientX, y: e.clientY });
        }
    };

    const handlePointerUp = (e) => {
        // Release capture if held
        // if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
        // React synthetic events might behave slightly differently but usually this is fine.

        setIsDraggingCanvas(false);
        setIsDraggingElement(false);
    };

    const handleDeleteElement = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        setEditingId(null);
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 5);
            setViewport(prev => ({ ...prev, scale: newScale }));
        } else {
            setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const updateElement = (id, updates) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    // 4. Add Element Logic
    const addElement = (type) => {
        const id = Date.now().toString();
        const centerX = (-viewport.x + window.innerWidth / 2) / viewport.scale;
        const centerY = (-viewport.y + window.innerHeight / 2) / viewport.scale;

        let content = '';
        let width = 100;
        let height = 100;

        if (type === 'text') { content = '더블클릭 편집'; width = 200; height: 50; }
        if (type === 'video') { width = 300; height = 200; }
        if (type === 'member') { content = '파티원'; width = 60; height = 80; }

        const newEl = {
            id, type,
            x: centerX - width / 2, y: centerY - height / 2,
            content, width, height,
            color: '#ffffff' // Default
        };
        setElements(prev => [...prev, newEl]);
        setMode('select');
    };

    const handleTextEditFinish = () => {
        if (editingId) {
            updateElement(editingId, { content: editText });
            setEditingId(null);
        }
    };

    // Helper: Extract Youtube ID
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2]?.length === 11) ? match[2] : null;
    };

    // 5. Render
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#111116', position: 'relative' }}>

            {/* Header / Toolbar overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
                padding: '15px 25px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                pointerEvents: 'none' // Allow click through to canvas
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', pointerEvents: 'auto' }}>
                    {!isStandalone && (
                        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', backdropFilter: 'blur(5px)' }}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{initialData.title || '전술 편집'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: saveStatus === 'saved' ? '#4ade80' : (saveStatus === 'saving' ? '#facc15' : '#ef4444'),
                                boxShadow: saveStatus === 'saving' ? '0 0 10px #facc15' : 'none'
                            }} />
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                {saveStatus === 'saved' ? '저장됨' : (saveStatus === 'saving' ? '저장 중...' : '저장 실패')}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', gap: '10px', alignItems: 'center', pointerEvents: 'auto' }}>
                    <button
                        onClick={() => window.open(`?tacticId=${tacticId}`, '_blank')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(5px)' }}
                        title="새 탭에서 꽉 찬 화면으로 열기"
                    >
                        <ExternalLink size={14} /> {isMobile ? '' : '새 창'}
                    </button>

                    {selectedId && (
                        <>
                            {(elements.find(e => e.id === selectedId)?.type === 'text' || elements.find(e => e.id === selectedId)?.type === 'video') && (
                                <button
                                    onClick={handleEditSelected}
                                    style={{ background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}
                                >
                                    <Edit size={14} /> 편집
                                </button>
                            )}
                            <button onClick={handleDeleteElement} style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
                                삭제
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={canvasRef}
                style={{ flex: 1, cursor: isDraggingCanvas ? 'grabbing' : 'grab', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
            >
                <div style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    width: '100%', height: '100%', position: 'relative'
                }}>
                    {/* Darker Grid Background */}
                    <div style={{
                        position: 'absolute', top: -5000, left: -5000, width: 10000, height: 10000,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '40px 40px', pointerEvents: 'none'
                    }} />

                    {elements.map(el => (
                        <div
                            key={el.id}
                            onPointerDown={(e) => handleElementPointerDown(e, el)}
                            onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                            style={{
                                position: 'absolute', left: el.x, top: el.y,
                                width: el.width || 'auto', height: el.height || 'auto',
                                padding: '10px',
                                border: selectedId === el.id ? '2px solid var(--accent-color)' : '1px solid transparent',
                                borderRadius: '12px',
                                userSelect: 'none', cursor: 'move',
                                transform: selectedId === el.id ? 'scale(1.02)' : 'scale(1)',
                                transition: isDraggingElement && selectedId === el.id ? 'none' : 'transform 0.1s',
                                background: el.type === 'text' ? 'transparent' : 'rgba(30, 30, 40, 0.6)',
                                backdropFilter: el.type !== 'text' ? 'blur(8px)' : 'none',
                                boxShadow: el.type !== 'text' ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
                            }}>

                            {/* TEXT ELEMENT */}
                            {el.type === 'text' && (
                                editingId === el.id ? (
                                    <input
                                        autoFocus
                                        value={editText}
                                        onChange={e => setEditText(e.target.value)}
                                        onBlur={handleTextEditFinish}
                                        onKeyDown={e => e.key === 'Enter' && handleTextEditFinish()}
                                        onPointerDown={e => e.stopPropagation()} // Stop drag
                                        style={{
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-color)', color: 'white',
                                            fontSize: '1.2rem', padding: '8px', width: '200px', borderRadius: '8px', outline: 'none'
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', padding: '5px' }}>{el.content}</span>
                                )
                            )}

                            {/* NPC / MOB ELEMENT */}
                            {(el.type === 'npc' || el.type === 'mob') && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: el.type === 'npc' ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                                        border: '2px solid rgba(255,255,255,0.2)'
                                    }}>
                                        {el.type === 'npc' ? <User size={28} color="white" /> : <Skull size={28} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', marginTop: '6px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                        {el.type === 'npc' ? '전우' : '적군'}
                                    </span>
                                </div>
                            )}

                            {/* MEMBER ELEMENT */}
                            {el.type === 'member' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                                    }}>
                                        <Users size={26} color="white" />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', marginTop: '6px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                                        파티원
                                    </span>
                                </div>
                            )}

                            {/* VIDEO ELEMENT */}
                            {el.type === 'video' && (
                                <div style={{ width: '300px', height: '180px', background: 'black', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    {getYoutubeId(el.content) ? (
                                        <iframe
                                            width="100%" height="100%"
                                            src={`https://www.youtube.com/embed/${getYoutubeId(el.content)}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            style={{ pointerEvents: mode === 'select' ? 'none' : 'auto' }} // Disable pointer events when selecting to allow dragging? Actually we want to drag wrapper.
                                        // Issue: iframe captures mouse events, can't drag overlay.
                                        // Solution: Overlay div when NOT playing/interacting? 
                                        // Simple: User drags the border padding.
                                        ></iframe>
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>
                                            <Youtube size={40} style={{ marginBottom: '10px' }} />
                                            <p style={{ fontSize: '0.9rem' }}>더블 클릭하여<br />유튜브 링크 입력</p>
                                        </div>
                                    )}
                                    {/* Drag Handle Overlay (only visible when selecting to enable drag over iframe) */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px', background: 'rgba(255,255,255,0.1)', cursor: 'move' }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div style={{
                position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(20,20,30,0.7)', backdropFilter: 'blur(20px) saturate(180%)',
                padding: '8px 12px', borderRadius: '24px',
                display: 'flex', gap: '8px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 101,
                overflowX: 'auto', maxWidth: '90vw'
            }}>
                <ToolButton icon={MousePointer} active={mode === 'select'} onClick={() => setMode('select')} label="선택" />
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />
                <ToolButton icon={Type} active={mode === 'text'} onClick={() => addElement('text')} label="텍스트" />
                <ToolButton icon={Users} active={mode === 'member'} onClick={() => addElement('member')} label="파티원" />
                <ToolButton icon={User} active={mode === 'npc'} onClick={() => addElement('npc')} label="NPC" />
                <ToolButton icon={Skull} active={mode === 'mob'} onClick={() => addElement('mob')} label="적" />
                <ToolButton icon={Youtube} active={mode === 'video'} onClick={() => addElement('video')} label="영상" />
            </div>
        </div>
    );
};

const ToolButton = ({ icon: Icon, active, onClick, label }) => (
    <button
        onClick={onClick}
        style={{
            background: active ? 'var(--accent-color)' : 'transparent',
            border: 'none', color: active ? 'white' : 'rgba(255,255,255,0.6)',
            padding: '10px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
            minWidth: '50px', transition: 'all 0.2s'
        }}
        title={label}
    >
        <Icon size={24} />
    </button>
);

export default TacticsEditor;
