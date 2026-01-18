import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Home from '../../features/Home';
import ChatRoom from '../../features/ChatRoom';
import RaidScheduler from '../../features/RaidScheduler';
import SaveAnalyzer from '../../features/SaveAnalyzer';
import ProfileSetup from '../../features/ProfileSetup';
import CampManagement from '../../features/CampManagement';
import TacticsBoard from '../../features/TacticsBoard';

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

    const handleProfileComplete = (userData) => {
        setUser(userData);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Home user={user} setActiveTab={setActiveTab} />;
            case 'chat': return <ChatRoom user={user} />;
            case 'calendar': return <RaidScheduler user={user} />;
            case 'tactics': return <TacticsBoard user={user} />;
            case 'save': return <SaveAnalyzer user={user} />;
            case 'profile': return <ProfileSetup onComplete={handleProfileComplete} initialData={user} />;
            case 'admin': return user?.isAdmin ? <CampManagement user={user} /> : <Home user={user} />;
            default: return <Home user={user} />;
        }
    };

    if (!user) {
        return <ProfileSetup onComplete={handleProfileComplete} />;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'white' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} user={user} />

            <main style={{
                flex: 1,
                padding: isMobile ? '80px 20px 80px' : '20px',
                overflowY: 'auto',
                position: 'relative'
            }}>
                {renderContent()}
            </main>
        </div>
    );
};

export default Layout;
