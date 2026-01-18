
// 로컬 스토리지를 사용하여 데이터베이스처럼 동작하는 가짜(Mock) 서비스입니다.
// Firebase 키가 없을 때 자동으로 이 녀석이 작동합니다.

const STORAGE_KEYS = {
    CHATS: 'bg3_raid_chats',
    SCHEDULES: 'bg3_raid_schedules',
    SAVES: 'bg3_raid_saves'
};

// --- Delay Helper (네트워크 지연 시뮬레이션) ---
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDB = {
    // --- Chat ---
    getChats: async () => {
        await delay(300);
        const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
        return chats ? JSON.parse(chats) : [];
    },

    addChat: async (message) => {
        await delay(200);
        const chats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
        const newChat = {
            id: Date.now().toString(),
            text: message.text,
            sender: message.sender || 'Anonymous',
            timestamp: new Date().toISOString(),
            isMe: true // 내 메시지 표시용
        };
        chats.push(newChat);
        // 채팅은 최대 50개까지만 저장 (용량 관리)
        if (chats.length > 50) chats.shift();

        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
        return newChat;
    },

    // --- Scheduler ---
    getSchedules: async () => {
        await delay(400);
        const schedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        return schedules ? JSON.parse(schedules) : [
            // 기본 예시 데이터
            { id: 1, title: '명예 모드 3막 보스전', date: '2026-01-20', time: '20:00', type: 'raid', members: ['Tav', 'Shadowheart', 'Gale'] },
            { id: 2, title: '스토리 정주행 (1막)', date: '2026-01-21', time: '14:00', type: 'story', members: ['DarkUrge', 'Astarion'] }
        ];
    },

    addSchedule: async (schedule) => {
        await delay(500);
        const schedules = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES) || '[]');
        const newSchedule = { ...schedule, id: Date.now() };
        schedules.push(newSchedule);
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
        return newSchedule;
    },

    deleteSchedule: async (id) => {
        await delay(300);
        let schedules = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULES) || '[]');
        schedules = schedules.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    }
};
