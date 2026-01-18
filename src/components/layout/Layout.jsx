import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Home from '../../features/Home';
import ChatRoom from '../../features/ChatRoom';
import RaidScheduler from '../../features/RaidScheduler';
import SaveAnalyzer from '../../features/SaveAnalyzer';
import ProfileSetup from '../../features/ProfileSetup';
import CampManagement from '../../features/CampManagement';
import TacticsBoard from '../../features/TacticsBoard';
import SurvivorsModal from '../../features/SurvivorsModal';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';

const Layout = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Lifted State for Presence/Survivors
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
    const [showSurvivors, setShowSurvivors] = useState(false);

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bg3_user_profile'));
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Session Validation: Check if user actually exists in DB on load
    useEffect(() => {
        const validateSession = async () => {
            if (!user) return;
            try {
                // Check if user still exists in Firebase or validate session
            } catch (e) {
                console.error("Session check failed");
            }
        };
        validateSession();
    }, [user]);

    // 1. HEARTBEAT SYSTEM (Presence)
    useEffect(() => {
        if (!user?.id) return;

        const updateHeartbeat = async () => {
            try {
                await updateDoc(doc(db, "users_v2", user.id), {
                    lastSeen: serverTimestamp()
                });
            } catch (e) {
                console.error("Heartbeat fail", e);
            }
        };

        // Initial hit
        updateHeartbeat();

        // Interval
        const interval = setInterval(updateHeartbeat, 60000); // 1 min

        return () => clearInterval(interval);
    }, [user?.id]);

    // 2. PRESENCE LISTENER (Lifted from Sidebar)
    useEffect(() => {
        if (!user?.campId) return;

        const q = query(
            collection(db, "users_v2"),
            where("campId", "==", user.campId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOnlineUsersCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user?.campId]);

    // 3. NOTIFICATION LISTENER (Wake Up)
    useEffect(() => {
        if (!user?.campId || !user?.id) return;

        const q = query(
            collection(db, "camps", user.campId, "notifications"),
            where("targetUid", "==", user.id),
            where("read", "==", false)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    if (data.type === 'WAKE_UP') {
                        // Play Sound
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple bell
                        audio.play().catch(e => console.log("Audio play failed", e));

                        // Show Alert (Native or Toast)
                        alert(`⏰ ${data.sender}님이 당신을 깨우고 있습니다! 얼른 일어나세요!`);

                        // Mark as Read
                        updateDoc(change.doc.ref, { read: true });
                    }
                }
            });
        });

        return () => unsub();
    }, [user?.campId, user?.id]);

    if (!user) {
        return <ProfileSetup onComplete={() => window.location.reload()} isMobile={isMobile} />;
    }

    const renderContent = () => {
        // Pass common props including presence state
        const commonProps = { user, isMobile, onlineUsersCount, setShowSurvivors };

        switch (activeTab) {
            case 'home': return <Home {...commonProps} setActiveTab={setActiveTab} />;
            case 'chat': return <ChatRoom {...commonProps} />;
            case 'calendar': return <RaidScheduler {...commonProps} />;
            case 'save': return <SaveAnalyzer {...commonProps} />;
            case 'admin': return <CampManagement {...commonProps} />;
            case 'tactics': return <TacticsBoard {...commonProps} />;
            case 'profile': return <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>프로필 설정은 사이드바 메뉴를 이용해주세요.</div>; // Fallback
            default: return <Home {...commonProps} setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: '#0a0a10', color: '#e2e8f0', fontFamily: 'Pretendard, sans-serif' }}>
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobile={isMobile}
                user={user}
                // Pass props to Sidebar
                onlineUsersCount={onlineUsersCount}
                setShowSurvivors={setShowSurvivors}
            />

            <main style={{ flex: 1, padding: isMobile ? '20px 20px 90px' : '40px', overflowY: 'auto', position: 'relative' }}>
                {renderContent()}
            </main>

            {/* Global Survivors Modal */}
            {showSurvivors && (
                <SurvivorsModal user={user} onClose={() => setShowSurvivors(false)} />
            )}
        </div>
    );
};

export default Layout;
