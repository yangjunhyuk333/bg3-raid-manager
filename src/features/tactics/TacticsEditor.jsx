import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, MousePointer, Type, Square, Image as ImageIcon, Move, Plus, Sparkles, User, Skull } from 'lucide-react';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const TacticsEditor = ({ user, tacticId, initialData, onBack, isMobile }) => {
    // 1. Canvas State
    const [elements, setElements] = useState(initialData?.elements || []);
    const [viewport, setViewport] = useState(initialData?.viewState || { x: 0, y: 0, scale: 1 });
    const [selectedId, setSelectedId] = useState(null);
    const [mode, setMode] = useState('select'); // select, text, npc, mob, skill

    // Interaction State
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const saveTimeout = useRef(null);

    // 2. Auto Save Logic
    const saveToFirestore = useCallback((newElements, newViewport) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                const tacticRef = doc(db, "tactics", tacticId);
                await updateDoc(tacticRef, {
                    elements: newElements,
                    viewState: newViewport,
                    lastModified: serverTimestamp(),
                    lastModifiedBy: user.nickname
                });
                console.log("Auto-saved tactics");
            } catch (e) {
                console.error("Save failed", e);
            }
        }, 1000); // Debounce 1s
    }, [tacticId, user.nickname]);

    useEffect(() => {
        saveToFirestore(elements, viewport);
    }, [elements, viewport, saveToFirestore]);

    // 3. Canvas Interaction Handlers
    const handlePointerDown = (e) => {
        if (mode === 'select' && e.target === canvasRef.current) {
            setIsDraggingCanvas(true);
            setLastPointer({ x: e.clientX, y: e.clientY });
            setSelectedId(null); // Deselect element when clicking canvas
        }
    };

    const handleElementPointerDown = (e, el) => {
        e.stopPropagation(); // Prevent canvas drag
        if (mode !== 'select') return;

        setSelectedId(el.id);
        setIsDraggingElement(true);

        // Calculate offset from pointer to element's top-left corner
        // e.clientX, e.clientY are screen coordinates
        // el.x, el.y are canvas coordinates (unscaled)
        // viewport.x, viewport.y are canvas offset (scaled)
        // viewport.scale is canvas scale

        // Convert clientX/Y to canvas coordinates (unscaled)
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const clientXInCanvas = e.clientX - canvasRect.left;
        const clientYInCanvas = e.clientY - canvasRect.top;

        const unscaledCanvasX = (clientXInCanvas - viewport.x) / viewport.scale;
        const unscaledCanvasY = (clientYInCanvas - viewport.y) / viewport.scale;

        // Calculate offset from element's top-left to pointer in unscaled canvas coordinates
        setDragOffset({
            x: unscaledCanvasX - el.x,
            y: unscaledCanvasY - el.y
        });
        setLastPointer({ x: e.clientX, y: e.clientY });
    };

    const handlePointerMove = (e) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - lastPointer.x;
            const dy = e.clientY - lastPointer.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastPointer({ x: e.clientX, y: e.clientY });
        }

        if (isDraggingElement && selectedId) {
            // Calculate new position based on current pointer, dragOffset, and viewport
            const canvasRect = canvasRef.current.getBoundingClientRect();
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

    const handlePointerUp = () => {
        setIsDraggingCanvas(false);
        setIsDraggingElement(false);
    };

    const handleDeleteElement = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(viewport.scale + delta, 0.1), 5);
            setViewport(prev => ({ ...prev, scale: newScale }));
        } else {
            // Pan with wheel
            setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // 4. Add Element Logic
    const addElement = (type) => {
        const id = Date.now().toString();
        // Center of viewport
        const centerX = (-viewport.x + window.innerWidth / 2) / viewport.scale;
        const centerY = (-viewport.y + window.innerHeight / 2) / viewport.scale;

        const newEl = {
            id, type,
            x: centerX - 50, y: centerY - 50,
            content: type === 'text' ? '새 텍스트' : '',
            width: 100, height: 100,
            color: '#ffffff'
        };
        setElements(prev => [...prev, newEl]);
        setMode('select');
    };

    // 5. Render
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1a1a1a', position: 'relative' }}>

            {/* Header / Toolbar overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
                padding: '15px 20px', background: 'rgba(20,20,30,0.8)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1rem', opacity: 0.8 }}>{initialData.title}</h2>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedId && (
                        <button onClick={handleDeleteElement} style={{ background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>
                            삭제
                        </button>
                    )}
                    <span>{isDraggingCanvas ? '이동 중...' : '자동 저장 됨'}</span>
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
                    {/* Grid Background */}
                    <div style={{
                        position: 'absolute', top: -5000, left: -5000, width: 10000, height: 10000,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px', pointerEvents: 'none'
                    }} />

                    {/* Elements */}
                    {elements.map(el => (
                        <div
                            key={el.id}
                            onPointerDown={(e) => handleElementPointerDown(e, el)}
                            style={{
                                position: 'absolute', left: el.x, top: el.y,
                                width: el.width || 'auto', height: el.height || 'auto',
                                padding: '10px', background: el.type === 'text' ? 'transparent' : 'rgba(255,255,255,0.1)',
                                border: selectedId === el.id ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', color: 'white',
                                userSelect: 'none', cursor: 'move',
                                transform: selectedId === el.id ? 'scale(1.05)' : 'scale(1)',
                                transition: isDraggingElement && selectedId === el.id ? 'none' : 'transform 0.1s'
                            }}>
                            {el.type === 'text' && (
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{el.content}</span>
                            )}
                            {el.type === 'npc' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={30} color="#1a1a1a" />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', marginTop: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>NPC</span>
                                </div>
                            )}
                            {el.type === 'mob' && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Skull size={30} color="white" />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', marginTop: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>ENEMY</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(30,30,40,0.9)', backdropFilter: 'blur(15px)',
                padding: '10px 20px', borderRadius: '50px',
                display: 'flex', gap: '15px', border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <ToolButton icon={MousePointer} active={mode === 'select'} onClick={() => setMode('select')} label="선택" />
                <ToolButton icon={Type} active={mode === 'text'} onClick={() => addElement('text')} label="텍스트" />
                <ToolButton icon={User} active={mode === 'npc'} onClick={() => addElement('npc')} label="NPC" />
                <ToolButton icon={Skull} active={mode === 'mob'} onClick={() => addElement('mob')} label="적" />
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
            transition: 'all 0.2s'
        }}
    >
        <Icon size={24} />
    </button>
);

export default TacticsEditor;
