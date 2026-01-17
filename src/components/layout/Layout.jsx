import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Home from '../../features/Home';
import ChatRoom from '../../features/ChatRoom';
import RaidScheduler from '../../features/RaidScheduler';
import SaveAnalyzer from '../../features/SaveAnalyzer';

const Layout = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Home />;
            case 'chat': return <ChatRoom />;
            case 'calendar': return <RaidScheduler />;
            case 'save': return <SaveAnalyzer />;
            default: return <Home />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />

            <main style={{
                flex: 1,
                padding: isMobile ? '80px 20px 20px' : '20px',
                overflowY: 'auto'
            }}>
                {renderContent()}
            </main>
        </div>
    );
};

export default Layout;
