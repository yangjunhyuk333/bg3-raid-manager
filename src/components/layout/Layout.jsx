import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Home from '../../features/Home';
import ChatRoom from '../../features/ChatRoom';
import RaidScheduler from '../../features/RaidScheduler';
import SaveAnalyzer from '../../features/SaveAnalyzer';
import ProfileSetup from '../../features/ProfileSetup';
import CampManagement from '../../features/CampManagement';

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

    const handleProfileComplete = (userData) => {
        setUser(userData);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Home user={user} setActiveTab={setActiveTab} />;
            case 'chat': return <ChatRoom user={user} />;
            case 'calendar': return <RaidScheduler user={user} />;
            case 'save': return <SaveAnalyzer user={user} />;
            case 'profile': return <ProfileSetup onComplete={handleProfileComplete} initialData={user} />;
            case 'admin': return <CampManagement user={user} />;
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
