import { useState } from 'react';
import { Home, MessageSquare, Calendar, FolderOpen, Menu, X } from 'lucide-react';


const Sidebar = ({ activeTab, setActiveTab, isMobile }) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'home', label: '홈', icon: Home },
        { id: 'chat', label: '채팅', icon: MessageSquare },
        { id: 'calendar', label: '일정', icon: Calendar },
        { id: 'save', label: '세이브 분석', icon: FolderOpen },
    ];

    const handleTabClick = (id) => {
        setActiveTab(id);
        if (isMobile) setIsOpen(false);
    };

    if (isMobile) {
        return (
            <>
                {/* Mobile Header */}
                <div className="glass" style={{
                    position: 'fixed', top: 0, left: 0, right: 0,
                    padding: '1rem', zIndex: 1000,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: 0
                }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>BG3 Manager</h2>
                    <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'transparent', color: 'white' }}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <nav className="glass" style={{
                        position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0,
                        zIndex: 999, borderRadius: 0, backdropFilter: 'blur(20px)',
                        display: 'flex', flexDirection: 'column', padding: '2rem'
                    }}>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabClick(item.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1.5rem', margin: '0.5rem 0',
                                        background: activeTab === item.id ? 'var(--glass-border)' : 'transparent',
                                        color: 'white', borderRadius: '12px', fontSize: '1.2rem'
                                    }}
                                >
                                    <Icon /> {item.label}
                                </button>
                            );
                        })}
                    </nav>
                )}
            </>
        );
    }

    // Desktop Sidebar
    return (
        <aside className="glass" style={{
            width: '250px', height: 'calc(100vh - 40px)',
            margin: '20px', padding: '20px',
            display: 'flex', flexDirection: 'column'
        }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--accent-color)' }}>
                BG3 Raid
            </h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px',
                                background: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: 'white', borderRadius: '8px', transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.target.style.background = activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent'}
                        >
                            <Icon size={20} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
