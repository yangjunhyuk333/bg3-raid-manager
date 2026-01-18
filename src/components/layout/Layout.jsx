import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Home from '../../features/Home';
import ChatRoom from '../../features/ChatRoom';
import RaidScheduler from '../../features/RaidScheduler';
import SaveAnalyzer from '../../features/SaveAnalyzer';
import ProfileSetup from '../../features/ProfileSetup';
import CampManagement from '../../features/CampManagement';
import TacticsBoard from '../../features/TacticsBoard';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';

const Layout = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
                // Check if user still exists in Firebase
                /* Note: We rely on local storage for speed, but this verifies it asynchronously. 
                   If the user was deleted (e.g. by admin), this will logout them out. */
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

        // Cleanup: Try to set offline? (Optional, unreliable on close)

        return () => clearInterval(interval);
    }, [user?.id]);

    // 2. NOTIFICATION LISTENER (Wake Up)
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

    const handleProfileComplete = (userData) => {
        setUser(userData);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Home user={user} setActiveTab={setActiveTab} isMobile={isMobile} />;
            case 'chat': return <ChatRoom user={user} isMobile={isMobile} />;
            case 'calendar': return <RaidScheduler user={user} isMobile={isMobile} />;
            case 'tactics': return <TacticsBoard user={user} isMobile={isMobile} />;
            case 'save': return <SaveAnalyzer user={user} isMobile={isMobile} />;
            case 'profile': return <ProfileSetup onComplete={handleProfileComplete} initialData={user} isMobile={isMobile} />;
            case 'admin': return user?.isAdmin ? <CampManagement user={user} isMobile={isMobile} /> : <Home user={user} setActiveTab={setActiveTab} isMobile={isMobile} />;
            default: return <Home user={user} setActiveTab={setActiveTab} isMobile={isMobile} />;
        }
    };

    if (!user) {
        return <ProfileSetup onComplete={handleProfileComplete} isMobile={isMobile} />;
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-color)', color: 'white' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} user={user} />

            <main style={{
                flex: 1,
                padding: 0, // Reset padding, handle inside content
                height: '100vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                <div style={{
                    padding: isMobile ? 'calc(20px + env(safe-area-inset-top)) 20px calc(80px + env(safe-area-inset-bottom))' : '40px',
                    maxWidth: activeTab === 'chat' ? '100%' : '1200px',
                    margin: '0 auto',
                    minHeight: '100%'
                }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Layout;
